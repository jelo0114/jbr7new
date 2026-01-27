<?php
declare(strict_types=1);
// cancel_order.php
// Cancels an order (only if at least 30 seconds have passed and status is processing)

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');
session_start();

$DB_HOST = '127.0.0.1';
$DB_NAME = 'jbr7_db';
$DB_USER = 'root';
$DB_PASS = '';

function jsonResponse(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

function jsonError(string $message, int $code = 500): void {
    jsonResponse(['success' => false, 'error' => $message], $code);
}

// Require authentication
if (empty($_SESSION['user_id'])) {
    jsonError('Not authenticated', 401);
}

$userId = (int)$_SESSION['user_id'];

// Get order ID
$input = json_decode(file_get_contents('php://input'), true);
if (empty($input['order_id'])) {
    jsonError('Order ID required', 400);
}

$orderId = (int)$input['order_id'];

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
    error_log('cancel_order.php - DB connect error: ' . $e->getMessage());
    jsonError('Database unavailable', 500);
}

try {
    // Check if order exists and belongs to user
    $stmt = $pdo->prepare('
        SELECT id, status, can_cancel_after, created_at
        FROM orders
        WHERE id = :order_id AND user_id = :user_id
    ');
    $stmt->execute([':order_id' => $orderId, ':user_id' => $userId]);
    $order = $stmt->fetch();

    if (!$order) {
        jsonError('Order not found', 404);
    }

    // Check if order can be cancelled (only if status is processing, no time restriction)
    if ($order['status'] !== 'processing') {
        jsonError('Only processing orders can be cancelled', 400);
    }

    // Cancel the order
    $pdo->beginTransaction();

    $updateStmt = $pdo->prepare('
        UPDATE orders
        SET status = "cancelled",
            status_updated_at = NOW()
        WHERE id = :order_id
    ');
    $updateStmt->execute([':order_id' => $orderId]);

    // Update order items
    $pdo->exec("
        UPDATE order_items
        SET status = 'cancelled',
            status_updated_at = NOW()
        WHERE order_id = {$orderId}
    ");

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => 'Order cancelled successfully'
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('cancel_order.php - error: ' . $e->getMessage());
    jsonError('Failed to cancel order', 500);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('cancel_order.php - unexpected error: ' . $e->getMessage());
    jsonError('Server error', 500);
}
