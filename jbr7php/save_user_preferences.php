<?php
// save_user_preferences.php
// Saves user payment and courier preferences to database

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

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

$defaultPayment = isset($input['default_payment']) ? trim($input['default_payment']) : null;
$defaultCourier = isset($input['default_courier']) ? trim($input['default_courier']) : null;

try {
    $pdo = new PDO("mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4", $DB_USER, $DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    
    // Check if preferences exist and get current values
    $checkStmt = $pdo->prepare('SELECT default_payment, default_courier FROM user_preferences WHERE user_id = :user_id LIMIT 1');
    $checkStmt->execute([':user_id' => $userId]);
    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        // Update existing preferences - only update fields that were provided
        $updateFields = [];
        $updateParams = [':user_id' => $userId];
        
        if (isset($input['default_payment'])) {
            $updateFields[] = 'default_payment = :payment';
            $updateParams[':payment'] = $defaultPayment;
        }
        
        if (isset($input['default_courier'])) {
            $updateFields[] = 'default_courier = :courier';
            $updateParams[':courier'] = $defaultCourier;
        }
        
        if (!empty($updateFields)) {
            $updateStmt = $pdo->prepare('
                UPDATE user_preferences 
                SET ' . implode(', ', $updateFields) . '
                WHERE user_id = :user_id
            ');
            $updateStmt->execute($updateParams);
        }
    } else {
        // Insert new preferences - use provided values or null
        $insertStmt = $pdo->prepare('
            INSERT INTO user_preferences (user_id, default_payment, default_courier)
            VALUES (:user_id, :payment, :courier)
        ');
        $insertStmt->execute([
            ':user_id' => $userId,
            ':payment' => $defaultPayment,
            ':courier' => $defaultCourier
        ]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Preferences saved successfully'
    ]);
    
} catch (Exception $e) {
    error_log('save_user_preferences.php - Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to save preferences']);
}
