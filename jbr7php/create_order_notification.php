<?php
// create_order_notification.php - With inline config loading
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

// Load config directly - check multiple locations
$config_loaded = false;
$possible_paths = [
    __DIR__ . '/config.php',
    __DIR__ . '/../config.php',
    __DIR__ . '/../../config.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config.php',
    $_SERVER['DOCUMENT_ROOT'] . '/jbr7php/config.php'
];

foreach ($possible_paths as $path) {
    if (file_exists($path)) {
        require_once $path;
        error_log("Config loaded from: " . $path);
        $config_loaded = true;
        break;
    }
}

if (!$config_loaded) {
    error_log("Config.php not found. Searched: " . implode(', ', $possible_paths));
    echo json_encode(['success' => false, 'error' => 'Configuration file not found']);
    exit;
}

// Check if PDO connection exists
if (!isset($pdo)) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['order_id']) || !isset($input['order_number'])) {
    echo json_encode(['success' => false, 'error' => 'Missing order information']);
    exit;
}

$order_id = $input['order_id'];
$order_number = $input['order_number'];

try {
    // Check if user has order status notifications enabled
    $pref_stmt = $pdo->prepare("SELECT order_status FROM notification_preferences WHERE user_id = ?");
    $pref_stmt->execute([$user_id]);
    $pref = $pref_stmt->fetch(PDO::FETCH_ASSOC);
    
    // If notifications are enabled (or no preference set, default to enabled)
    if (!$pref || $pref['order_status'] == 1) {
        // Create notification
        $title = 'Order Placed Successfully';
        $message = "Your order {$order_number} has been placed and is being processed.";
        
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, notification_type, title, message, related_id, is_read)
            VALUES (?, 'order_status', ?, ?, ?, 0)
        ");
        $stmt->execute([$user_id, $title, $message, $order_id]);
        
        $notification_id = $pdo->lastInsertId();
        
        // Get the created notification
        $get_stmt = $pdo->prepare("
            SELECT id, notification_type as type, title, message, is_read as `read`, created_at
            FROM notifications
            WHERE id = ?
        ");
        $get_stmt->execute([$notification_id]);
        $notification = $get_stmt->fetch(PDO::FETCH_ASSOC);
        
        // Format time
        $time_ago = timeAgo($notification['created_at']);
        $notification['time'] = $time_ago;
        $notification['icon'] = 'fa-box';
        unset($notification['created_at']);
        
        echo json_encode([
            'success' => true,
            'notification' => $notification,
            'message' => 'Order notification created'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'notification' => null,
            'message' => 'Notifications disabled for this user'
        ]);
    }
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error'
    ]);
}

function timeAgo($datetime) {
    $timestamp = strtotime($datetime);
    $diff = time() - $timestamp;
    
    if ($diff < 60) {
        return 'Just now';
    } elseif ($diff < 3600) {
        $mins = floor($diff / 60);
        return $mins . ' minute' . ($mins > 1 ? 's' : '') . ' ago';
    } elseif ($diff < 86400) {
        $hours = floor($diff / 3600);
        return $hours . ' hour' . ($hours > 1 ? 's' : '') . ' ago';
    } elseif ($diff < 604800) {
        $days = floor($diff / 86400);
        return $days . ' day' . ($days > 1 ? 's' : '') . ' ago';
    } else {
        return date('M j, Y', $timestamp);
    }
}