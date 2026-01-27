<?php
// get_shipping_addresses.php
// Gets all shipping addresses for the authenticated user

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
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'shipping_addresses'");
    if ($tableCheck->rowCount() === 0) {
        echo json_encode([
            'success' => true,
            'addresses' => []
        ]);
        exit;
    }
    
    // Get all addresses for user, ordered by default first, then by creation date
    $stmt = $pdo->prepare('
        SELECT * FROM shipping_addresses 
        WHERE user_id = :user_id 
        ORDER BY is_default DESC, created_at DESC
    ');
    $stmt->execute([':user_id' => $userId]);
    $addresses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'addresses' => $addresses
    ]);
    
} catch (Exception $e) {
    error_log('get_shipping_addresses.php - Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to load addresses']);
}
