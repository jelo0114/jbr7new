<?php
// set_default_address.php
// Sets a shipping address as default for the authenticated user

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

if (!isset($input['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Address ID required']);
    exit;
}

$addressId = (int)$input['id'];

// $pdo is now available from config/database.php

try {
    
    // Verify ownership
    $checkStmt = $pdo->prepare('SELECT id FROM shipping_addresses WHERE id = :id AND user_id = :user_id LIMIT 1');
    $checkStmt->execute([':id' => $addressId, ':user_id' => $userId]);
    
    if (!$checkStmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Address not found or access denied']);
        exit;
    }
    
    // Unset all other defaults for this user (PostgreSQL uses TRUE/FALSE)
    $unsetStmt = $pdo->prepare('UPDATE shipping_addresses SET is_default = FALSE WHERE user_id = :user_id');
    $unsetStmt->execute([':user_id' => $userId]);
    
    // Set this address as default (PostgreSQL uses TRUE/FALSE)
    $setStmt = $pdo->prepare('UPDATE shipping_addresses SET is_default = TRUE WHERE id = :id AND user_id = :user_id');
    $setStmt->execute([':id' => $addressId, ':user_id' => $userId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Default address updated successfully'
    ]);
    
} catch (Exception $e) {
    error_log('set_default_address.php - Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to set default address']);
}
