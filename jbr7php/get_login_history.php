<?php
// get_login_history.php
// Returns login history for the authenticated user

session_start();
header('Content-Type: application/json; charset=utf-8');

$DB_HOST = '127.0.0.1';
$DB_NAME = 'jbr7_db';
$DB_USER = 'root';
$DB_PASS = '';

// Check authentication
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

$userId = (int)$_SESSION['user_id'];

try {
    $pdo = new PDO("mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4", $DB_USER, $DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    
    // Check if login_history table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'login_history'");
    if ($tableCheck->rowCount() === 0) {
        // Table doesn't exist, return empty history with a message
        echo json_encode([
            'success' => true,
            'history' => [],
            'count' => 0,
            'message' => 'Login history table not set up yet. Please run SQL/login_history.sql'
        ]);
        exit;
    }
    
    // Get login history, most recent first
    $stmt = $pdo->prepare('
        SELECT 
            id,
            ip_address,
            user_agent,
            login_time,
            logout_time,
            session_duration
        FROM login_history
        WHERE user_id = :user_id
        ORDER BY login_time DESC
        LIMIT 50
    ');
    
    $stmt->execute([':user_id' => $userId]);
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the data for frontend
    $formattedHistory = array_map(function($entry) {
        return [
            'id' => (int)$entry['id'],
            'ip_address' => $entry['ip_address'] ?? 'Unknown',
            'user_agent' => $entry['user_agent'] ?? 'Unknown',
            'login_time' => $entry['login_time'],
            'logout_time' => $entry['logout_time'],
            'session_duration' => $entry['session_duration'] ? (int)$entry['session_duration'] : null,
            'device_info' => parseUserAgent($entry['user_agent'] ?? '')
        ];
    }, $history);
    
    echo json_encode([
        'success' => true,
        'history' => $formattedHistory,
        'count' => count($formattedHistory)
    ]);
    
} catch (PDOException $e) {
    // Check if error is about table not existing
    if (strpos($e->getMessage(), "doesn't exist") !== false || strpos($e->getMessage(), "Unknown table") !== false) {
        echo json_encode([
            'success' => true,
            'history' => [],
            'count' => 0,
            'message' => 'Login history table not set up yet. Please run SQL/login_history.sql'
        ]);
    } else {
        error_log('get_login_history.php - Database error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error occurred']);
    }
} catch (Exception $e) {
    error_log('get_login_history.php - Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error occurred']);
}

// Helper function to parse user agent for device info
function parseUserAgent($userAgent) {
    if (empty($userAgent) || $userAgent === 'Unknown') {
        return 'Unknown Device';
    }
    
    $device = 'Desktop';
    $browser = 'Unknown Browser';
    $os = 'Unknown OS';
    
    // Detect OS
    if (preg_match('/windows/i', $userAgent)) {
        $os = 'Windows';
    } elseif (preg_match('/macintosh|mac os x/i', $userAgent)) {
        $os = 'macOS';
    } elseif (preg_match('/linux/i', $userAgent)) {
        $os = 'Linux';
    } elseif (preg_match('/android/i', $userAgent)) {
        $os = 'Android';
        $device = 'Mobile';
    } elseif (preg_match('/iphone|ipad|ipod/i', $userAgent)) {
        $os = 'iOS';
        $device = preg_match('/ipad/i', $userAgent) ? 'Tablet' : 'Mobile';
    }
    
    // Detect Browser
    if (preg_match('/chrome/i', $userAgent) && !preg_match('/edg/i', $userAgent)) {
        $browser = 'Chrome';
    } elseif (preg_match('/firefox/i', $userAgent)) {
        $browser = 'Firefox';
    } elseif (preg_match('/safari/i', $userAgent) && !preg_match('/chrome/i', $userAgent)) {
        $browser = 'Safari';
    } elseif (preg_match('/edg/i', $userAgent)) {
        $browser = 'Edge';
    } elseif (preg_match('/opera|opr/i', $userAgent)) {
        $browser = 'Opera';
    }
    
    return "$device - $browser on $os";
}
