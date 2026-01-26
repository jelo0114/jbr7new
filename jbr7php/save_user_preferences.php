<?php
// save_user_preferences.php
// Saves user payment and courier preferences to database

session_start();
header('Content-Type: application/json; charset=utf-8');

// Use centralized database connection
require_once __DIR__ . '/../config/database.php';

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

// $pdo is now available from config/database.php

try {
    // Check if preferences exist and get current values (PostgreSQL uses payment_method and courier_service)
    $checkStmt = $pdo->prepare('SELECT payment_method, courier_service FROM user_preferences WHERE user_id = :user_id LIMIT 1');
    $checkStmt->execute([':user_id' => $userId]);
    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        // Update existing preferences - only update fields that were provided
        $updateFields = [];
        $updateParams = [':user_id' => $userId];
        
        if (isset($input['default_payment'])) {
            $updateFields[] = 'payment_method = :payment';
            $updateParams[':payment'] = $defaultPayment;
        }
        
        if (isset($input['default_courier'])) {
            $updateFields[] = 'courier_service = :courier';
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
        // Insert new preferences - use provided values or null (PostgreSQL uses payment_method and courier_service)
        $insertStmt = $pdo->prepare('
            INSERT INTO user_preferences (user_id, payment_method, courier_service)
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
