<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');
session_start();

$DB_HOST = '127.0.0.1';
$DB_NAME = 'jbr7_db';
$DB_USER = 'root';
$DB_PASS = '';

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

// Connect to database
try {
    $pdo = new PDO(
        "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    error_log('change_password.php - DB connect error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Database unavailable'], 500);
}

try {
    // Validate input
    $currentPassword = $input['currentPassword'] ?? '';
    $newPassword = $input['newPassword'] ?? '';
    $confirmPassword = $input['confirmPassword'] ?? '';

    if (empty($currentPassword) || empty($newPassword) || empty($confirmPassword)) {
        jsonResponse(['success' => false, 'error' => 'All password fields are required'], 400);
    }

    if ($newPassword !== $confirmPassword) {
        jsonResponse(['success' => false, 'error' => 'New passwords do not match'], 400);
    }

    if (strlen($newPassword) < 6) {
        jsonResponse(['success' => false, 'error' => 'New password must be at least 6 characters'], 400);
    }

    // Get current user password (column is password_hash in your database)
    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = :userId LIMIT 1');
    $stmt->execute([':userId' => $userId]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse(['success' => false, 'error' => 'User not found'], 404);
    }

    // Verify current password
    if (!password_verify($currentPassword, $user['password_hash'])) {
        jsonResponse(['success' => false, 'error' => 'Current password is incorrect'], 400);
    }

    // Hash new password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    // Update password (column is password_hash in your database)
    $stmt = $pdo->prepare('UPDATE users SET password_hash = :password WHERE id = :userId');
    $stmt->execute([
        ':password' => $hashedPassword,
        ':userId' => $userId
    ]);

    jsonResponse([
        'success' => true,
        'message' => 'Password updated successfully'
    ]);

} catch (PDOException $e) {
    error_log('change_password.php - error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Throwable $e) {
    error_log('change_password.php - unexpected error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Server error: ' . $e->getMessage()], 500);
}