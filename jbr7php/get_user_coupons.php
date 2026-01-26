<?php
// get_user_coupons.php
// Gets user's available (unused, not expired) coupons
// GET: Returns all active coupons for the user

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
    jsonError('Not authenticated. Please log in again.', 401);
}

$userId = (int)$_SESSION['user_id'];

// $pdo is now available from config/database.php

try {
    // Check if user_coupons table exists (PostgreSQL compatible)
    $tableExists = false;
    try {
        $checkTable = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_coupons')");
        $tableExists = $checkTable->fetchColumn();
    } catch (PDOException $e) {
        error_log('get_user_coupons.php - Could not check user_coupons table: ' . $e->getMessage());
    }
    
    if (!$tableExists) {
        // Return empty array if table doesn't exist yet
        jsonResponse([
            'success' => true,
            'coupons' => [],
            'message' => 'Coupons table does not exist yet'
        ]);
    }

    // Get all coupons for user (both active and expired, for display purposes)
    $stmt = $pdo->prepare('
        SELECT 
            id,
            discount_percentage,
            points_cost,
            coupon_code,
            expires_at,
            used_at,
            is_used,
            created_at,
            CASE 
                WHEN is_used = TRUE THEN 'used'
                WHEN expires_at < NOW() THEN 'expired'
                ELSE 'active'
            END AS status
        FROM user_coupons
        WHERE user_id = :user_id
        ORDER BY 
            CASE 
                WHEN is_used = FALSE AND expires_at >= NOW() THEN 1
                WHEN is_used = FALSE AND expires_at < NOW() THEN 2
                ELSE 3
            END,
            created_at DESC
    ');

    $stmt->execute([':user_id' => $userId]);
    $coupons = $stmt->fetchAll();

    // Format coupons for frontend
    $formattedCoupons = [];
    foreach ($coupons as $coupon) {
        $formattedCoupons[] = [
            'id' => (int)$coupon['id'],
            'discount_percentage' => (int)$coupon['discount_percentage'],
            'points_cost' => (int)$coupon['points_cost'],
            'coupon_code' => $coupon['coupon_code'],
            'expires_at' => $coupon['expires_at'],
            'used_at' => $coupon['used_at'],
            'is_used' => (bool)$coupon['is_used'],
            'status' => $coupon['status'],
            'created_at' => $coupon['created_at']
        ];
    }

    // Filter active coupons (for cart dropdown)
    $activeCoupons = array_filter($formattedCoupons, function($c) {
        return $c['status'] === 'active';
    });

    jsonResponse([
        'success' => true,
        'coupons' => $formattedCoupons,
        'active_coupons' => array_values($activeCoupons),
        'count' => count($formattedCoupons),
        'active_count' => count($activeCoupons)
    ]);

} catch (PDOException $e) {
    error_log('get_user_coupons.php - PDO error: ' . $e->getMessage());
    jsonError('Failed to fetch coupons: ' . $e->getMessage(), 500);
}
