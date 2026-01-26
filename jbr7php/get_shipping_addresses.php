<?php
// get_shipping_addresses.php
// Gets all shipping addresses for the authenticated user

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

// $pdo is now available from config/database.php

try {
    // Check if table exists (PostgreSQL compatible)
    $tableCheck = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shipping_addresses')");
    if (!$tableCheck->fetchColumn()) {
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
