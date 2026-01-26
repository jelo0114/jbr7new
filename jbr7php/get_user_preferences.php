<?php
// get_user_preferences.php
// Gets user payment and courier preferences from database

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
    $tableCheck = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_preferences')");
    if (!$tableCheck->fetchColumn()) {
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
                'default_payment' => $preferences['payment_method'] ?? null,
                'default_courier' => $preferences['courier_service'] ?? null
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
