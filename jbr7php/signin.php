<?php
// Support both form-post (browser) and XHR (JSON) clients
session_start();
// determine if client expects JSON (AJAX) by header
$isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') || (strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false);
if ($isAjax) header('Content-Type: application/json; charset=utf-8');

// Use centralized database connection
require_once __DIR__ . '/../config/database.php';
// $pdo is now available from config/database.php

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    if ($isAjax) {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed. Use POST to sign in.']);
        exit;
    }
    // For GET requests, redirect to signin page
    // Use 307 Temporary Redirect to preserve method (though we're redirecting anyway)
    header('Location: /signin.html', true, 307);
    exit;
}

$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if ($email === '' || $password === '') {
    if ($isAjax) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing credentials']);
        exit;
    }
    header('Location: /signin.html?error=missing');
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, username, password_hash FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user || !password_verify($password, $user['password_hash'])) {
        if ($isAjax) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
            exit;
        }
        header('Location: /signin.html?error=invalid');
        exit;
    }

    // set session
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['username'] = $user['username'];

    // Log login history
    try {
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
        
        // Handle proxy/load balancer forwarded IP
        if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $forwardedIps = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            $ipAddress = trim($forwardedIps[0]);
        } elseif (isset($_SERVER['HTTP_X_REAL_IP'])) {
            $ipAddress = $_SERVER['HTTP_X_REAL_IP'];
        }
        
        $loginStmt = $pdo->prepare('
            INSERT INTO login_history (user_id, ip_address, user_agent, login_time)
            VALUES (:user_id, :ip_address, :user_agent, NOW())
        ');
        $loginStmt->execute([
            ':user_id' => (int)$user['id'],
            ':ip_address' => $ipAddress,
            ':user_agent' => $userAgent ? substr($userAgent, 0, 512) : null
        ]);
    } catch (Exception $e) {
        // Log error but don't fail login if history logging fails
        error_log('signin.php - Failed to log login history: ' . $e->getMessage());
    }

    if ($isAjax) {
        echo json_encode(['success' => true, 'username' => $user['username'], 'user_id' => (int)$user['id']]);
        exit;
    }
    // browser form: redirect to home
    header('Location: /home.html');
    exit;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
    exit;
}
