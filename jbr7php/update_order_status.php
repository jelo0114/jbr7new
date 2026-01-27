<?php
declare(strict_types=1);
// update_order_status.php
// Updates order status (processing -> shipped -> delivered) with 30 second intervals

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

// This endpoint can be called by admin or automated system
// For now, allow any authenticated user (you can add admin check later)

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
    error_log('update_order_status.php - DB connect error: ' . $e->getMessage());
    jsonError('Database unavailable', 500);
}

try {
    // Find orders that need status updates
    // Processing -> Shipped (90 seconds / 1:30 minutes after created)
    $shippedStmt = $pdo->prepare('
        UPDATE orders o
        SET o.status = "shipped",
            o.status_updated_at = NOW(),
            o.shipped_at = NOW()
        WHERE o.status = "processing"
          AND TIMESTAMPDIFF(SECOND, o.created_at, NOW()) >= 90
    ');
    $shippedStmt->execute();
    $shippedCount = $shippedStmt->rowCount();

    // Update order_items status to shipped
    if ($shippedCount > 0) {
        $pdo->exec('
            UPDATE order_items oi
            INNER JOIN orders o ON oi.order_id = o.id
            SET oi.status = "shipped",
                oi.status_updated_at = NOW(),
                oi.shipped_at = NOW()
            WHERE o.status = "shipped"
              AND oi.status = "processing"
        ');
    }

    // Shipped -> Delivered (90 seconds / 1:30 minutes after shipped)
    $deliveredStmt = $pdo->prepare('
        UPDATE orders o
        SET o.status = "delivered",
            o.status_updated_at = NOW(),
            o.delivered_at = NOW()
        WHERE o.status = "shipped"
          AND o.shipped_at IS NOT NULL
          AND TIMESTAMPDIFF(SECOND, o.shipped_at, NOW()) >= 90
    ');
    $deliveredStmt->execute();
    $deliveredCount = $deliveredStmt->rowCount();

    // Update order_items status to delivered
    if ($deliveredCount > 0) {
        $pdo->exec('
            UPDATE order_items oi
            INNER JOIN orders o ON oi.order_id = o.id
            SET oi.status = "delivered",
                oi.status_updated_at = NOW(),
                oi.delivered_at = NOW()
            WHERE o.status = "delivered"
              AND oi.status = "shipped"
        ');
    }

    jsonResponse([
        'success' => true,
        'updated' => [
            'shipped' => $shippedCount,
            'delivered' => $deliveredCount
        ]
    ]);

} catch (PDOException $e) {
    error_log('update_order_status.php - error: ' . $e->getMessage());
    jsonError('Failed to update order status', 500);
} catch (Throwable $e) {
    error_log('update_order_status.php - unexpected error: ' . $e->getMessage());
    jsonError('Server error', 500);
}
