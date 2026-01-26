<?php
declare(strict_types=1);
// get_orders.php
// Fetches orders for the authenticated user with optional status filtering

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

// Require authentication
if (empty($_SESSION['user_id'])) {
    jsonError('Not authenticated', 401);
}

$userId = (int)$_SESSION['user_id'];
$statusFilter = $_GET['status'] ?? null; // 'processing', 'shipped', 'delivered', or null for all

// $pdo is now available from config/database.php

try {
    // Build query with optional status filter
    $sql = '
        SELECT o.id, o.order_number, o.status, o.total, o.payment_method, o.courier_service,
               o.created_at, o.status_updated_at, o.shipped_at, o.delivered_at, o.can_cancel_after
        FROM orders o
        WHERE o.user_id = :user_id
    ';

    $params = [':user_id' => $userId];

    if ($statusFilter && in_array($statusFilter, ['processing', 'shipped', 'delivered', 'cancelled'])) {
        $sql .= ' AND o.status = :status';
        $params[':status'] = $statusFilter;
    }

    $sql .= ' ORDER BY o.created_at DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();

    // Fetch order items for each order
    $result = [];
    foreach ($orders as $order) {
        $itemStmt = $pdo->prepare('
            SELECT id, item_name, item_image, item_price, quantity, size, color,
                   line_total, status, delivered_at
            FROM order_items
            WHERE order_id = :order_id
            ORDER BY id ASC
        ');
        $itemStmt->execute([':order_id' => $order['id']]);
        $items = $itemStmt->fetchAll();

        // Check if order can be cancelled (only if status is processing, no time restriction)
        $canCancel = ($order['status'] === 'processing');

        $result[] = [
            'id' => (int)$order['id'],
            'order_number' => $order['order_number'],
            'status' => $order['status'],
            'total' => (string)$order['total'],
            'payment_method' => $order['payment_method'],
            'courier_service' => $order['courier_service'],
            'created_at' => $order['created_at'],
            'status_updated_at' => $order['status_updated_at'],
            'shipped_at' => $order['shipped_at'],
            'delivered_at' => $order['delivered_at'],
            'can_cancel' => $canCancel,
            'items' => array_map(function($item) {
                return [
                    'id' => (int)$item['id'],
                    'item_name' => $item['item_name'],
                    'item_image' => $item['item_image'],
                    'item_price' => (string)$item['item_price'],
                    'quantity' => (int)$item['quantity'],
                    'size' => $item['size'],
                    'color' => $item['color'],
                    'line_total' => (string)$item['line_total'],
                    'status' => $item['status'],
                    'delivered_at' => $item['delivered_at'],
                ];
            }, $items),
        ];
    }

    jsonResponse([
        'success' => true,
        'orders' => $result,
        'count' => count($result)
    ]);

} catch (PDOException $e) {
    error_log('get_orders.php - error: ' . $e->getMessage());
    jsonError('Failed to fetch orders', 500);
} catch (Throwable $e) {
    error_log('get_orders.php - unexpected error: ' . $e->getMessage());
    jsonError('Server error', 500);
}
