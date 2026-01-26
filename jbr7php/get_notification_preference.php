<?php
// get_notification_preferences.php - With inline config loading
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

// Use centralized database connection
require_once __DIR__ . '/../config/database.php';

// $pdo is now available from config/database.php

$user_id = $_SESSION['user_id'];

try {
    // Get user's notification preferences
    $stmt = $pdo->prepare("
        SELECT order_status, cart_reminder
        FROM notification_preferences
        WHERE user_id = ?
    ");
    $stmt->execute([$user_id]);
    $preferences = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // If no preferences exist, create default ones
    if (!$preferences) {
        $insert_stmt = $pdo->prepare("
            INSERT INTO notification_preferences (user_id, order_status, cart_reminder)
            VALUES (?, 1, 1)
        ");
        $insert_stmt->execute([$user_id]);
        
        $preferences = [
            'order_status' => 1,
            'cart_reminder' => 1
        ];
    }
    
    echo json_encode([
        'success' => true,
        'preferences' => $preferences
    ]);
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error'
    ]);
}
?>