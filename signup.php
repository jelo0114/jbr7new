<?php
// Simple signup handler using SQLite (no external DB required)
// File: signup.php
// Requirements: PHP with PDO_SQLITE (default in XAMPP)

declare(strict_types=1);
session_start();

// MySQL connection settings (adjust if your environment differs)
$DB_HOST = '127.0.0.1';
$DB_NAME = 'jbr7_db';
$DB_USER = 'root';
$DB_PASS = '';

function getDb(): PDO {
    global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS;
    $dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4";
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    // ensure users table exists (safe even if DB already initialized)
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    return $pdo;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: signup.html');
    exit;
}

$username = trim($_POST['username'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if ($username === '' || $email === '' || $password === '') {
    echo 'Please provide username, email and password. <a href="signup.html">Back</a>';
    exit;
}

try {
    $pdo = getDb();
    // check if email exists
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        echo 'An account with that email already exists. <a href="signin.html">Sign in</a>';
        exit;
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO users (username, email, password_hash, created_at) VALUES (:username, :email, :ph, :created)');
    $stmt->execute([
        ':username' => $username,
        ':email' => $email,
        ':ph' => $passwordHash,
        ':created' => date('c')
    ]);

    // redirect to signin page after successful signup
    header('Location: signin.html');
    exit;
} catch (Exception $e) {
    error_log('Signup error: ' . $e->getMessage());
    echo 'An error occurred. Check server logs.';
    exit;
}

?>
