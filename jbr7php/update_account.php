<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');
session_start();

// Use centralized database connection
require_once __DIR__ . '/../config/database.php';

function jsonResponse(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

// Require authentication
if (empty($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    jsonResponse(['success' => false, 'error' => 'Invalid input'], 400);
}

// $pdo is now available from config/database.php

try {
    // Validate input
    $fullName = trim($input['fullName'] ?? '');
    $email = trim($input['email'] ?? '');
    $phone = trim($input['phone'] ?? '');

    if (empty($fullName)) {
        jsonResponse(['success' => false, 'error' => 'Full name is required'], 400);
    }

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['success' => false, 'error' => 'Valid email is required'], 400);
    }

    // Check if email is already taken by another user
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email AND id != :userId LIMIT 1');
    $stmt->execute([':email' => $email, ':userId' => $userId]);
    if ($stmt->fetch()) {
        jsonResponse(['success' => false, 'error' => 'Email already in use'], 400);
    }

    // Check if phone column exists in users table (PostgreSQL compatible)
    $stmt = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone')");
    $phoneColumnExists = $stmt->fetchColumn();

    // Update user information
    if ($phoneColumnExists) {
        $stmt = $pdo->prepare('
            UPDATE users 
            SET username = :username, 
                email = :email, 
                phone = :phone 
            WHERE id = :userId
        ');
        
        $stmt->execute([
            ':username' => $fullName,
            ':email' => $email,
            ':phone' => $phone,
            ':userId' => $userId
        ]);
    } else {
        // Update without phone if column doesn't exist
        $stmt = $pdo->prepare('
            UPDATE users 
            SET username = :username, 
                email = :email 
            WHERE id = :userId
        ');
        
        $stmt->execute([
            ':username' => $fullName,
            ':email' => $email,
            ':userId' => $userId
        ]);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Account information updated successfully'
    ]);

} catch (PDOException $e) {
    error_log('update_account.php - error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Throwable $e) {
    error_log('update_account.php - unexpected error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Server error: ' . $e->getMessage()], 500);
}