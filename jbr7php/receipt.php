<?php
// receipt.php
// Saves receipt data to database with user_id
// POST: Save a new receipt
// GET: Not supported - use get_receipts.php instead

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
    error_log('receipt.php - No user_id in session. Session data: ' . json_encode($_SESSION));
    jsonError('Not authenticated. Please log in again.', 401);
}

$userId = (int)$_SESSION['user_id'];
error_log('receipt.php - Processing receipt save for user_id: ' . $userId);

// Only allow POST method for saving receipts
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST to save receipts or get_receipts.php to fetch them.', 405);
}

// Get JSON input
$rawInput = file_get_contents('php://input');
error_log('receipt.php - Raw input length: ' . strlen($rawInput));
error_log('receipt.php - Raw input preview: ' . substr($rawInput, 0, 500));

if (empty($rawInput)) {
    error_log('receipt.php - ❌ Empty input received!');
    jsonError('No data received', 400);
}

$input = json_decode($rawInput, true);
if (!$input) {
    $jsonError = json_last_error_msg();
    error_log('receipt.php - ❌ Failed to decode JSON. Error: ' . $jsonError);
    error_log('receipt.php - Raw input: ' . $rawInput);
    jsonError('Invalid input - could not parse JSON: ' . $jsonError, 400);
}

error_log('receipt.php - ✅ JSON decoded successfully');
error_log('receipt.php - Input keys: ' . implode(', ', array_keys($input)));

// Validate required fields
if (empty($input['orderId'])) {
    error_log('receipt.php - ❌ Missing orderId in input');
    error_log('receipt.php - Input data: ' . json_encode($input));
    jsonError('Missing order ID', 400);
}

error_log('receipt.php - ✅ Valid input received for order: ' . $input['orderId']);

// $pdo is now available from config/database.php

try {

try {
    // Check if receipts table exists (PostgreSQL compatible)
    $tableExists = false;
    try {
        $checkTable = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'receipts')");
        $tableExists = $checkTable->fetchColumn();
    } catch (PDOException $e) {
        error_log('receipt.php - Could not check receipts table: ' . $e->getMessage());
    }
    
    if (!$tableExists) {
        jsonError('Receipts table does not exist. Please run the SQL setup script.', 500);
    }

    // Check if receipt already exists for this order_number and user_id
    $checkStmt = $pdo->prepare('SELECT id FROM receipts WHERE order_number = :order_number AND user_id = :user_id LIMIT 1');
    $checkStmt->execute([
        ':order_number' => $input['orderId'],
        ':user_id' => $userId
    ]);
    $existingReceipt = $checkStmt->fetch();
    
    if ($existingReceipt) {
        error_log('receipt.php - Receipt already exists for order: ' . $input['orderId'] . ', returning existing receipt ID: ' . $existingReceipt['id']);
        jsonResponse([
            'success' => true,
            'receipt_id' => (int)$existingReceipt['id'],
            'order_number' => $input['orderId'],
            'message' => 'Receipt already exists',
            'already_exists' => true
        ]);
    }

    // Prepare shipping address data
    // Try to get from input, or from orders table if available
    $shippingAddressJson = null;
    if (!empty($input['shippingAddress'])) {
        $shippingAddressJson = json_encode($input['shippingAddress']);
    } else {
        // Try to get shipping address from orders table if order exists
        if (!empty($input['orderId'])) {
            try {
                $orderStmt = $pdo->prepare('SELECT shipping_address FROM orders WHERE order_number = :order_number AND user_id = :user_id LIMIT 1');
                $orderStmt->execute([
                    ':order_number' => $input['orderId'],
                    ':user_id' => $userId
                ]);
                $order = $orderStmt->fetch();
                if ($order && !empty($order['shipping_address'])) {
                    $shippingAddressJson = $order['shipping_address'];
                }
            } catch (PDOException $e) {
                error_log('receipt.php - Could not fetch shipping address from orders: ' . $e->getMessage());
            }
        }
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
    error_log('receipt.php - Shipping address: ' . ($shippingAddressJson ? 'present' : 'missing'));
    error_log('receipt.php - Order ID from orders table: ' . ($orderId ?: 'not found'));
    error_log('receipt.php - Subtotal: ' . $subtotal . ', Shipping: ' . $shipping . ', Total: ' . $total);
    
    // Ensure receipt can be saved even without shipping address
    try {
        $stmt->execute([
            ':user_id' => $userId,
            ':order_id' => $orderId,
            ':order_number' => $input['orderId'],
            ':receipt_data' => json_encode($input),
            ':shipping_address' => $shippingAddressJson, // Can be NULL
            ':subtotal' => $subtotal,
            ':shipping' => $shipping,
            ':total' => $total,
            ':payment_method' => $input['payment'] ?? null,
            ':courier_service' => $input['courier'] ?? null,
            ':customer_email' => $input['customerEmail'] ?? null,
            ':customer_phone' => $input['customerPhone'] ?? null,
        ]);

        $receiptId = (int)$pdo->lastInsertId();
        
        if ($receiptId > 0) {
            error_log('receipt.php - ✅ Receipt saved successfully! Receipt ID: ' . $receiptId . ', Order: ' . $input['orderId']);
            
            // Verify the receipt was actually inserted
            $verifyStmt = $pdo->prepare('SELECT id, order_number, created_at FROM receipts WHERE id = :receipt_id LIMIT 1');
            $verifyStmt->execute([':receipt_id' => $receiptId]);
            $verifyReceipt = $verifyStmt->fetch();
            
            if ($verifyReceipt) {
                error_log('receipt.php - ✅✅✅ VERIFIED: Receipt exists in database! ID: ' . $verifyReceipt['id'] . ', Order: ' . $verifyReceipt['order_number']);
            } else {
                error_log('receipt.php - ❌ CRITICAL: Receipt ID returned but NOT found in database!');
            }
        } else {
            error_log('receipt.php - ❌ CRITICAL: Receipt insert returned ID 0!');
            error_log('receipt.php - This means the INSERT failed silently. Check database constraints.');
            
            // Try to find the receipt by order_number as fallback
            $fallbackStmt = $pdo->prepare('SELECT id FROM receipts WHERE order_number = :order_number AND user_id = :user_id ORDER BY id DESC LIMIT 1');
            $fallbackStmt->execute([
                ':order_number' => $input['orderId'],
                ':user_id' => $userId
            ]);
            $fallbackReceipt = $fallbackStmt->fetch();
            if ($fallbackReceipt) {
                $receiptId = (int)$fallbackReceipt['id'];
                error_log('receipt.php - Found receipt by order_number fallback: ' . $receiptId);
            }
        }
    } catch (PDOException $executeError) {
        error_log('receipt.php - ❌ EXECUTE ERROR: ' . $executeError->getMessage());
        error_log('receipt.php - SQL State: ' . $executeError->getCode());
        throw $executeError; // Re-throw to be caught by outer catch
    }

    if ($receiptId > 0) {
        jsonResponse([
            'success' => true,
            'receipt_id' => $receiptId,
            'order_number' => $input['orderId'],
            'message' => 'Receipt saved successfully'
        ]);
    } else {
        error_log('receipt.php - ❌ Cannot return success - receipt ID is 0');
        jsonError('Receipt save failed - no ID returned. Check database logs.', 500);
    }

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
