<?php
// Simple sign-in handler that checks credentials from SQLite DB and redirects to home.html on success
declare(strict_types=1);
session_start();

// MySQL connection settings (must match signup.php)
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
    return $pdo;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: signin.html');
    exit;
}

$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if ($email === '' || $password === '') {
    echo 'Please provide email and password. <a href="signin.html">Back</a>';
    exit;
}

try {
    $pdo = getDb();
    $stmt = $pdo->prepare('SELECT id, username, password_hash FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        echo 'Invalid credentials. <a href="signin.html">Try again</a>';
        exit;
    }

    if (!password_verify($password, $row['password_hash'])) {
        echo 'Invalid credentials. <a href="signin.html">Try again</a>';
        exit;
    }

    // Optionally set a session value (not used by static home.html but left for extension)
    $_SESSION['user_id'] = $row['id'];
    $_SESSION['username'] = $row['username'];

    // Redirect to home page
    header('Location: home.html');
    exit;

} catch (Exception $e) {
    error_log('Signin error: ' . $e->getMessage());
    echo 'An error occurred. Check server logs.';
    exit;
}

?>
