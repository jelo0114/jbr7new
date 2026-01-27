<?php
// update_notification_preference.php - With inline config loading
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    error_log("User not authenticated");
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
    error_log("PDO connection not available after loading config");
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

$user_id = $_SESSION['user_id'];
error_log("User ID: " . $user_id);

// Get JSON input
$raw_input = file_get_contents('php://input');
error_log("Raw input: " . $raw_input);

$input = json_decode($raw_input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("JSON decode error: " . json_last_error_msg());
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit;
}

if (!isset($input['notification_type']) || !isset($input['enabled'])) {
    error_log("Missing required fields");
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

$notification_type = $input['notification_type'];
$enabled = $input['enabled'] ? 1 : 0;

error_log("Notification type: " . $notification_type . ", Enabled: " . $enabled);

// Validate notification type
$valid_types = ['order_status', 'cart_reminder'];
if (!in_array($notification_type, $valid_types)) {
    error_log("Invalid notification type: " . $notification_type);
    echo json_encode(['success' => false, 'error' => 'Invalid notification type']);
    exit;
}

try {
    // Check if preferences exist
    $check_stmt = $pdo->prepare("SELECT id FROM notification_preferences WHERE user_id = ?");
    $check_stmt->execute([$user_id]);
    $exists = $check_stmt->fetch();
    
    error_log("Preferences exist: " . ($exists ? 'YES' : 'NO'));
    
    if ($exists) {
        // Update existing preference
        $column = $notification_type === 'order_status' ? 'order_status' : 'cart_reminder';
        $stmt = $pdo->prepare("UPDATE notification_preferences SET $column = ? WHERE user_id = ?");
        $stmt->execute([$enabled, $user_id]);
        error_log("Updated $column to $enabled for user $user_id");
    } else {
        // Insert new preference
        if ($notification_type === 'order_status') {
            $stmt = $pdo->prepare("INSERT INTO notification_preferences (user_id, order_status, cart_reminder) VALUES (?, ?, 1)");
            $stmt->execute([$user_id, $enabled]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO notification_preferences (user_id, order_status, cart_reminder) VALUES (?, 1, ?)");
            $stmt->execute([$user_id, $enabled]);
        }
        error_log("Inserted new preferences for user $user_id");
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Notification preference updated successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>