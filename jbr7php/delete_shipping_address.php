<?php
// delete_shipping_address.php
// Deletes a shipping address for the authenticated user

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
    
    // Verify ownership and delete
    $deleteStmt = $pdo->prepare('DELETE FROM shipping_addresses WHERE id = :id AND user_id = :user_id');
    $deleteStmt->execute([':id' => $addressId, ':user_id' => $userId]);
    
    if ($deleteStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Address not found or access denied']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Address deleted successfully'
    ]);
    
} catch (Exception $e) {
    error_log('delete_shipping_address.php - Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to delete address']);
}
