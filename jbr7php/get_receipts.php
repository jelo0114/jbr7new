<?php
// get_receipts.php
// Fetches all receipts for the authenticated user

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

// $pdo is now available from config/database.php

try {
    // Check if receipts table exists (PostgreSQL compatible)
    $tableExists = false;
    try {
        $checkTable = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'receipts')");
        $tableExists = $checkTable->fetchColumn();
    } catch (PDOException $e) {
        error_log('get_receipts.php - Could not check receipts table: ' . $e->getMessage());
    }
    
    if (!$tableExists) {
        jsonResponse([
            'success' => true,
            'receipts' => [],
            'message' => 'Receipts table does not exist yet'
        ]);
    }

    // Get optional query parameters
    $orderNumber = $_GET['order_number'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
    
    // Build query
    if ($orderNumber) {
        // Get specific receipt by order number
        $stmt = $pdo->prepare('
            SELECT 
                id, user_id, order_id, order_number, receipt_data, shipping_address,
                subtotal, shipping, total, payment_method, courier_service,
                customer_email, customer_phone, created_at
            FROM receipts 
            WHERE user_id = :user_id AND order_number = :order_number
            ORDER BY created_at DESC
            LIMIT 1
        ');
        $stmt->execute([
            ':user_id' => $userId,
            ':order_number' => $orderNumber
        ]);
    } else {
        // Get all receipts for user
        $sql = '
            SELECT 
                id, user_id, order_id, order_number, receipt_data, shipping_address,
                subtotal, shipping, total, payment_method, courier_service,
                customer_email, customer_phone, created_at
            FROM receipts 
            WHERE user_id = :user_id
            ORDER BY created_at DESC
        ';
        
        if ($limit) {
            $sql .= ' LIMIT :limit';
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        if ($limit) {
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        }
        $stmt->execute();
    }
    
    $receipts = $stmt->fetchAll();
    
    // Parse JSON fields for easier frontend use
    foreach ($receipts as &$receipt) {
        if (!empty($receipt['receipt_data'])) {
            $receipt['receipt_data'] = json_decode($receipt['receipt_data'], true);
        }
        if (!empty($receipt['shipping_address'])) {
            $receipt['shipping_address'] = json_decode($receipt['shipping_address'], true);
        }
    }
    
    jsonResponse([
        'success' => true,
        'receipts' => $receipts,
        'count' => count($receipts)
    ]);

} catch (PDOException $e) {
    $errorMsg = $e->getMessage();
    error_log('get_receipts.php - PDO error: ' . $errorMsg);
    
    if (strpos($errorMsg, 'Table') !== false && strpos($errorMsg, "doesn't exist") !== false) {
        jsonError('Receipts table does not exist. Please run the SQL setup script.', 500);
    } else {
        jsonError('Failed to fetch receipts: ' . $errorMsg, 500);
    }
} catch (Throwable $e) {
    error_log('get_receipts.php - unexpected error: ' . $e->getMessage());
    jsonError('Server error: ' . $e->getMessage(), 500);
}
