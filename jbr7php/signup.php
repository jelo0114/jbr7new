<?php
// Support browser form-posts and AJAX clients
session_start();
// detect AJAX/JSON client
$isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') || (strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false);
if ($isAjax) header('Content-Type: application/json; charset=utf-8');

// Use centralized database connection
require_once __DIR__ . '/../config/database.php';
// $pdo is now available from config/database.php

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    if ($isAjax) {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed. Use POST to sign up.']);
        exit;
    }
    // For GET requests, redirect to signup page
    // Use 307 Temporary Redirect to preserve method (though we're redirecting anyway)
    header('Location: /signup.html', true, 307);
    exit;
}

$username = trim($_POST['username'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if ($username === '' || $email === '' || $password === '') {
    if ($isAjax) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing fields']);
        exit;
    }
    header('Location: /signup.html?error=missing');
    exit;
}

try {
    // check if email exists
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        if ($isAjax) {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'Email already registered']);
            exit;
        }
        header('Location: /signup.html?error=exists');
        exit;
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO users (username, email, password_hash, created_at) VALUES (:username, :email, :ph, NOW())');
    $stmt->execute([':username' => $username, ':email' => $email, ':ph' => $passwordHash]);

    if ($isAjax) {
        echo json_encode(['success' => true, 'message' => 'Account created']);
        exit;
    }
    // browser form: redirect to signin page
    header('Location: /signin.html');
    exit;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
    exit;
}
