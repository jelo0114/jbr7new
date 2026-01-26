<?php
declare(strict_types=1);
// update_order_status.php
// Updates order status (processing -> shipped -> delivered) with 30 second intervals

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');
session_start();

// Use centralized database connection
require_once __DIR__ . '/../config/database.php';

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

// $pdo is now available from config/database.php

try {
    // Find orders that need status updates
    // Processing -> Shipped (90 seconds / 1:30 minutes after created)
    // PostgreSQL uses EXTRACT(EPOCH FROM ...) instead of TIMESTAMPDIFF
    $shippedStmt = $pdo->prepare('
        UPDATE orders o
        SET status = \'shipped\',
            status_updated_at = NOW(),
            shipped_at = NOW()
        WHERE status = \'processing\'
          AND EXTRACT(EPOCH FROM (NOW() - o.created_at)) >= 90
    ');
    $shippedStmt->execute();
    $shippedCount = $shippedStmt->rowCount();

    // Update order_items status to shipped (PostgreSQL JOIN syntax)
    if ($shippedCount > 0) {
        $pdo->exec('
            UPDATE order_items oi
            SET status = \'shipped\',
                status_updated_at = NOW()
            FROM orders o
            WHERE oi.order_id = o.id
              AND o.status = \'shipped\'
              AND oi.status = \'processing\'
        ');
    }

    // Shipped -> Delivered (90 seconds / 1:30 minutes after shipped)
    // PostgreSQL uses EXTRACT(EPOCH FROM ...) instead of TIMESTAMPDIFF
    $deliveredStmt = $pdo->prepare('
        UPDATE orders
        SET status = \'delivered\',
            status_updated_at = NOW(),
            delivered_at = NOW()
        WHERE status = \'shipped\'
          AND shipped_at IS NOT NULL
          AND EXTRACT(EPOCH FROM (NOW() - shipped_at)) >= 90
    ');
    $deliveredStmt->execute();
    $deliveredCount = $deliveredStmt->rowCount();

    // Update order_items status to delivered (PostgreSQL JOIN syntax)
    if ($deliveredCount > 0) {
        $pdo->exec('
            UPDATE order_items oi
            SET status = \'delivered\',
                status_updated_at = NOW()
            FROM orders o
            WHERE oi.order_id = o.id
              AND o.status = \'delivered\'
              AND oi.status = \'shipped\'
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
