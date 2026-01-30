<?php
// receipt.php
// Saves receipt data to database with user_id

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

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
$rawInput = file_get_contents('php://input');
error_log('receipt.php - Raw input received: ' . substr($rawInput, 0, 500));

$input = json_decode($rawInput, true);
if (!$input) {
    error_log('receipt.php - Failed to decode JSON. Raw input: ' . $rawInput);
    jsonError('Invalid input - could not parse JSON', 400);
}

// Validate required fields
if (empty($input['orderId'])) {
    error_log('receipt.php - Missing orderId in input: ' . json_encode($input));
    jsonError('Missing order ID', 400);
}

error_log('receipt.php - Valid input received for order: ' . $input['orderId']);

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
    error_log('receipt.php - DB connect error: ' . $e->getMessage());
    jsonError('Database unavailable', 500);
}

try {
    // Check if receipts table exists
    $tableExists = false;
    try {
        $checkTable = $pdo->query("SHOW TABLES LIKE 'receipts'");
        $tableExists = ($checkTable->rowCount() > 0);
    } catch (PDOException $e) {
        error_log('receipt.php - Could not check receipts table: ' . $e->getMessage());
    }
    
    if (!$tableExists) {
        jsonError('Receipts table does not exist. Please run the SQL setup script.', 500);
    }

    // Prepare shipping address data
    $shippingAddressJson = null;
    if (!empty($input['shippingAddress'])) {
        $shippingAddressJson = json_encode($input['shippingAddress']);
    }

    // Insert receipt
    $stmt = $pdo->prepare('
        INSERT INTO receipts (
            user_id, order_id, order_number, receipt_data, shipping_address,
            subtotal, shipping, total, payment_method, courier_service,
            customer_email, customer_phone, created_at
        ) VALUES (
            :user_id, :order_id, :order_number, :receipt_data, :shipping_address,
            :subtotal, :shipping, :total, :payment_method, :courier_service,
            :customer_email, :customer_phone, NOW()
        )
    ');

    // Get order_id from orders table if exists
    $orderId = null;
    if (!empty($input['orderId'])) {
        $orderStmt = $pdo->prepare('SELECT id FROM orders WHERE order_number = :order_number AND user_id = :user_id LIMIT 1');
        $orderStmt->execute([
            ':order_number' => $input['orderId'],
            ':user_id' => $userId
        ]);
        $order = $orderStmt->fetch();
        if ($order) {
            $orderId = (int)$order['id'];
        }
    }

    // Calculate totals if not provided
    $subtotal = (float)($input['subtotal'] ?? 0);
    $shipping = (float)($input['shipping'] ?? 0);
    $total = (float)($input['total'] ?? ($subtotal + $shipping));
    
    error_log('receipt.php - Saving receipt for order: ' . $input['orderId'] . ', user_id: ' . $userId);
    
    $stmt->execute([
        ':user_id' => $userId,
        ':order_id' => $orderId,
        ':order_number' => $input['orderId'],
        ':receipt_data' => json_encode($input),
        ':shipping_address' => $shippingAddressJson,
        ':subtotal' => $subtotal,
        ':shipping' => $shipping,
        ':total' => $total,
        ':payment_method' => $input['payment'] ?? null,
        ':courier_service' => $input['courier'] ?? null,
        ':customer_email' => $input['customerEmail'] ?? null,
        ':customer_phone' => $input['customerPhone'] ?? null,
    ]);

    $receiptId = (int)$pdo->lastInsertId();

    jsonResponse([
        'success' => true,
        'receipt_id' => $receiptId,
        'order_number' => $input['orderId'],
        'message' => 'Receipt saved successfully'
    ]);

} catch (PDOException $e) {
    $errorMsg = $e->getMessage();
    $errorCode = $e->getCode();
    error_log('receipt.php - PDO error: ' . $errorMsg . ' (Code: ' . $errorCode . ')');
    error_log('receipt.php - SQL State: ' . $e->getCode());
    
    // Provide more specific error message
    if (strpos($errorMsg, 'Table') !== false && strpos($errorMsg, "doesn't exist") !== false) {
        jsonError('Receipts table does not exist. Please run the SQL setup script.', 500);
    } elseif (strpos($errorMsg, 'Column') !== false && strpos($errorMsg, "doesn't exist") !== false) {
        jsonError('Database column missing: ' . $errorMsg, 500);
    } else {
        jsonError('Failed to save receipt: ' . $errorMsg, 500);
    }
} catch (Throwable $e) {
    error_log('receipt.php - unexpected error: ' . $e->getMessage());
    jsonError('Server error: ' . $e->getMessage(), 500);
}
