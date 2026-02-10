<?php
declare(strict_types=1);
// admin_update_item.php
// Updates a single product in the items table (title, price, category, quantity, image).
// Called by admin panel so changes persist to SQL and are fetched correctly.

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

if (isset($GLOBALS['_admin_update_item_input']) && is_array($GLOBALS['_admin_update_item_input'])) {
    $input = $GLOBALS['_admin_update_item_input'];
} else {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
}
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit;
}

$adminId = $input['adminId'] ?? '';
$itemId = $input['itemId'] ?? '';
if (!$adminId || $itemId === '' || $itemId === null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'adminId and itemId are required']);
    exit;
}

// Optional: validate admin (e.g. check admin_users table). For now allow if adminId is set.
// You can add: SELECT 1 FROM admin_users WHERE id = ? and then require row.

require_once __DIR__ . '/config.php';

try {
    $id = (int) $itemId;
    if ($id <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid itemId']);
        exit;
    }

    // Build UPDATE only for provided fields
    $updates = [];
    $params = [':id' => $id];

    if (array_key_exists('title', $input)) {
        $updates[] = 'title = :title';
        $params[':title'] = $input['title'];
    }
    if (array_key_exists('description', $input)) {
        $updates[] = 'description = :description';
        $params[':description'] = $input['description'];
    }
    if (array_key_exists('price', $input)) {
        $updates[] = 'price = :price';
        $params[':price'] = (float) $input['price'];
    }
    if (array_key_exists('category', $input)) {
        $updates[] = 'category = :category';
        $params[':category'] = $input['category'];
    }
    if (array_key_exists('image', $input)) {
        $updates[] = 'image = :image';
        $params[':image'] = $input['image'];
    }
    if (array_key_exists('quantity', $input)) {
        $updates[] = 'quantity = :quantity';
        $params[':quantity'] = (int) $input['quantity'];
    }

    if (count($updates) === 0) {
        echo json_encode(['success' => true, 'message' => 'Nothing to update']);
        exit;
    }

    $sql = 'UPDATE items SET ' . implode(', ', $updates) . ' WHERE id = :id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $affected = $stmt->rowCount();
    echo json_encode([
        'success' => true,
        'message' => 'Product updated',
        'rows_affected' => $affected
    ]);
} catch (PDOException $e) {
    error_log('admin_update_item.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error. Ensure items table has columns: title, price, category, image, quantity, updated_at.']);
} catch (Throwable $e) {
    error_log('admin_update_item.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}
