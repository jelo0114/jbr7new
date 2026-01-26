<?php
// delete_account.php
// Deletes user account and all associated data

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

// Get request data (password confirmation if needed)
$input = json_decode(file_get_contents('php://input'), true);
$password = $input['password'] ?? '';

// $pdo is now available from config/database.php

try {
    
    // Verify password if provided
    if (!empty($password)) {
        $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = :user_id LIMIT 1');
        $stmt->execute([':user_id' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || !password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid password']);
            exit;
        }
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        // Delete all user-related data
        // Note: Tables with FOREIGN KEY CASCADE will be deleted automatically
        // But we'll explicitly delete to be safe and handle tables without CASCADE
        
        // Delete from tables that might not have CASCADE
        $tablesToClean = [
            'login_history' => 'user_id',
            'saved_items' => 'user_id',
            'user_activities' => 'user_id',
            'reviews' => 'user_id',
            'orders' => 'user_id' // order_items will be deleted via CASCADE if set
        ];
        
        foreach ($tablesToClean as $table => $column) {
            try {
                $deleteStmt = $pdo->prepare("DELETE FROM `{$table}` WHERE `{$column}` = :user_id");
                $deleteStmt->execute([':user_id' => $userId]);
            } catch (PDOException $e) {
                // Table might not exist or column name might differ, log and continue
                error_log("delete_account.php - Could not delete from {$table}: " . $e->getMessage());
            }
        }
        
        // Delete notification preferences and notifications
        try {
            $pdo->prepare("DELETE FROM notification_preferences WHERE user_id = :user_id")->execute([':user_id' => $userId]);
            $pdo->prepare("DELETE FROM notifications WHERE user_id = :user_id")->execute([':user_id' => $userId]);
        } catch (PDOException $e) {
            error_log("delete_account.php - Could not delete notifications: " . $e->getMessage());
        }
        
        // Finally, delete the user (this will cascade to any remaining foreign keys with CASCADE)
        $deleteUserStmt = $pdo->prepare('DELETE FROM users WHERE id = :user_id');
        $deleteUserStmt->execute([':user_id' => $userId]);
        
        if ($deleteUserStmt->rowCount() === 0) {
            throw new Exception('User not found');
        }
        
        // Commit transaction
        $pdo->commit();
        
        // Destroy session
        session_destroy();
        
        echo json_encode([
            'success' => true,
            'message' => 'Account and all associated data deleted successfully'
        ]);
        
    } catch (Exception $e) {
        // Rollback on error
        $pdo->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to delete account: ' . $e->getMessage()]);
}
