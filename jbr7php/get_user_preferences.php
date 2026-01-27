<?php
// get_user_preferences.php
// Gets user payment and courier preferences from database

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
    
    // Check if table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'user_preferences'");
    if ($tableCheck->rowCount() === 0) {
        // Table doesn't exist, return null values
        echo json_encode([
            'success' => true,
            'preferences' => [
                'default_payment' => null,
                'default_courier' => null
            ]
        ]);
        exit;
    }
    
    // Get user preferences
    $stmt = $pdo->prepare('SELECT default_payment, default_courier FROM user_preferences WHERE user_id = :user_id LIMIT 1');
    $stmt->execute([':user_id' => $userId]);
    $preferences = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($preferences) {
        echo json_encode([
            'success' => true,
            'preferences' => [
                'default_payment' => $preferences['default_payment'],
                'default_courier' => $preferences['default_courier']
            ]
        ]);
    } else {
        // No preferences found, return null
        echo json_encode([
            'success' => true,
            'preferences' => [
                'default_payment' => null,
                'default_courier' => null
            ]
        ]);
    }
    
} catch (Exception $e) {
    error_log('get_user_preferences.php - Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to load preferences']);
}
