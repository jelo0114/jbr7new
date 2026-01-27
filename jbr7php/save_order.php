<?php
declare(strict_types=1);
// save_order.php
// Saves order from checkout to database

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

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    jsonError('Invalid input', 400);
}

// Validate required fields
if (empty($input['orderId']) || empty($input['items']) || !is_array($input['items'])) {
    jsonError('Missing required fields', 400);
}

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
    error_log('save_order.php - DB connect error: ' . $e->getMessage());
    jsonError('Database unavailable', 500);
}

try {
    $pdo->beginTransaction();

    // Calculate totals
    $subtotal = (float)($input['subtotal'] ?? 0);
    $shipping = (float)($input['shipping'] ?? 0);
    $total = (float)($input['total'] ?? ($subtotal + $shipping));

    // Set can_cancel_after (not used for restriction anymore, but kept for tracking)
    $canCancelAfter = date('Y-m-d H:i:s', time());

    // Prepare shipping address JSON
    $shippingAddressJson = null;
    if (!empty($input['shippingAddress'])) {
        $shippingAddressJson = json_encode($input['shippingAddress']);
    }

    // Check if shipping_address column exists, if not, create order without it
    $hasShippingAddress = false;
    try {
        $checkCol = $pdo->query("SHOW COLUMNS FROM orders LIKE 'shipping_address'");
        $hasShippingAddress = ($checkCol->rowCount() > 0);
    } catch (PDOException $e) {
        error_log('save_order.php - Could not check shipping_address column: ' . $e->getMessage());
    }

    // Insert order (with or without shipping_address column)
    if ($hasShippingAddress) {
        $stmt = $pdo->prepare('
            INSERT INTO orders (
                user_id, order_number, status, subtotal, shipping, total,
                items_json, payment_method, courier_service, customer_email, customer_phone,
                shipping_address, can_cancel_after, status_updated_at, created_at
            ) VALUES (
                :user_id, :order_number, :status, :subtotal, :shipping, :total,
                :items_json, :payment_method, :courier_service, :customer_email, :customer_phone,
                :shipping_address, :can_cancel_after, NOW(), NOW()
            )
        ');
    } else {
        // Fallback: insert without shipping_address column
        $stmt = $pdo->prepare('
            INSERT INTO orders (
                user_id, order_number, status, subtotal, shipping, total,
                items_json, payment_method, courier_service, customer_email, customer_phone,
                can_cancel_after, status_updated_at, created_at
            ) VALUES (
                :user_id, :order_number, :status, :subtotal, :shipping, :total,
                :items_json, :payment_method, :courier_service, :customer_email, :customer_phone,
                :can_cancel_after, NOW(), NOW()
            )
        ');
    }

    $executeParams = [
        ':user_id' => $userId,
        ':order_number' => $input['orderId'],
        ':status' => 'processing',
        ':subtotal' => $subtotal,
        ':shipping' => $shipping,
        ':total' => $total,
        ':items_json' => json_encode($input['items']),
        ':payment_method' => $input['payment'] ?? null,
        ':courier_service' => $input['courier'] ?? null,
        ':customer_email' => $input['customerEmail'] ?? null,
        ':customer_phone' => $input['customerPhone'] ?? null,
        ':can_cancel_after' => $canCancelAfter,
    ];
    
    // Only add shipping_address if column exists
    if ($hasShippingAddress) {
        $executeParams[':shipping_address'] = $shippingAddressJson;
    }
    
    $stmt->execute($executeParams);

    $orderId = (int)$pdo->lastInsertId();

    // Award 100 points for order activity
    try {
        // Check if points column exists
        $checkPoints = $pdo->query("SHOW COLUMNS FROM users LIKE 'points'");
        if ($checkPoints->rowCount() > 0) {
            $pointsStmt = $pdo->prepare('
                UPDATE users 
                SET points = COALESCE(points, 0) + 100 
                WHERE id = :user_id
            ');
            $pointsStmt->execute([':user_id' => $userId]);
        }
        
        // Log activity (check if table exists)
        try {
            $activityStmt = $pdo->prepare('
                INSERT INTO user_activities (user_id, activity_type, description, points_awarded, created_at)
                VALUES (:user_id, "order", :description, 100, NOW())
            ');
            $activityStmt->execute([
                ':user_id' => $userId,
                ':description' => 'Order placed: ' . $input['orderId']
            ]);
        } catch (PDOException $e) {
            // Table might not exist, that's okay
            error_log('save_order.php - activities table might not exist: ' . $e->getMessage());
        }
    } catch (PDOException $e) {
        error_log('save_order.php - points award error: ' . $e->getMessage());
        // Don't fail the order if points fail
    }

    // Insert order items
    $itemStmt = $pdo->prepare('
        INSERT INTO order_items (
            order_id, item_name, item_image, item_price, quantity, size, color,
            line_total, status, status_updated_at, created_at
        ) VALUES (
            :order_id, :item_name, :item_image, :item_price, :quantity, :size, :color,
            :line_total, :status, NOW(), NOW()
        )
    ');

    foreach ($input['items'] as $item) {
        $itemStmt->execute([
            ':order_id' => $orderId,
            ':item_name' => $item['name'] ?? '',
            ':item_image' => $item['image'] ?? '',
            ':item_price' => (float)($item['unitPrice'] ?? $item['price'] ?? 0),
            ':quantity' => (int)($item['quantity'] ?? 1),
            ':size' => $item['size'] ?? null,
            ':color' => $item['color'] ?? null,
            ':line_total' => (float)($item['lineTotal'] ?? ($item['unitPrice'] ?? $item['price'] ?? 0) * ($item['quantity'] ?? 1)),
            ':status' => 'processing',
        ]);
    }

    $pdo->commit();

    // Schedule status updates (in real app, use cron jobs or queue)
    // For now, we'll handle this via update_order_status.php endpoint

    jsonResponse([
        'success' => true,
        'order_id' => $orderId,
        'order_number' => $input['orderId'],
        'message' => 'Order saved successfully'
    ]);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $errorMsg = $e->getMessage();
    $errorCode = $e->getCode();
    error_log('save_order.php - PDO error: ' . $errorMsg . ' (Code: ' . $errorCode . ')');
    error_log('save_order.php - SQL State: ' . $e->getCode());
    
    // Provide more specific error message
    if (strpos($errorMsg, 'Table') !== false && strpos($errorMsg, "doesn't exist") !== false) {
        jsonError('Database table missing. Please contact administrator.', 500);
    } elseif (strpos($errorMsg, 'Column') !== false && strpos($errorMsg, "doesn't exist") !== false) {
        jsonError('Database column missing. Please contact administrator.', 500);
    } else {
        jsonError('Failed to save order: ' . $errorMsg, 500);
    }
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('save_order.php - unexpected error: ' . $e->getMessage());
    jsonError('Server error: ' . $e->getMessage(), 500);
}
