<?php
header('Content-Type: application/json; charset=utf-8');
session_start();

// Simple session endpoint used by the client header and profile page.
if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

$DB_HOST = '127.0.0.1';
$DB_NAME = 'jbr7_db';
$DB_USER = 'root';
$DB_PASS = '';

try {
    $pdo = new PDO("mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4", $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $userId = (int)$_SESSION['user_id'];
    $stmt = $pdo->prepare('SELECT id, username, email, created_at, COALESCE(points,0) AS points FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }

    // stats
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM orders WHERE user_id = :id'); $stmt->execute([':id'=>$userId]); $orders = (int)$stmt->fetchColumn();
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM saved_items WHERE user_id = :id'); $stmt->execute([':id'=>$userId]); $saved = (int)$stmt->fetchColumn();
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM reviews WHERE user_id = :id'); $stmt->execute([':id'=>$userId]); $reviews = (int)$stmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'user' => [ 'id' => (int)$user['id'], 'username' => $user['username'], 'email' => $user['email'], 'created_at' => $user['created_at'], 'points' => (int)$user['points'] ],
        'stats' => ['orders' => $orders, 'saved' => $saved, 'reviews' => $reviews]
    ]);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}

?>
