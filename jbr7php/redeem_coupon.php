<?php
// redeem_coupon.php
// Redeems points for discount coupons
// POST: Redeem points for a coupon

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

// Only allow POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST to redeem coupons.', 405);
}

// Get JSON input
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (!$input || empty($input['discount_percentage'])) {
    jsonError('Invalid input - discount percentage required', 400);
}

$discountPercentage = (int)$input['discount_percentage'];

// Define available reward tiers
$rewardTiers = [
    10 => ['points' => 300, 'name' => '10% Off'],
    20 => ['points' => 600, 'name' => '20% Off'],
    30 => ['points' => 900, 'name' => '30% Off'],
    50 => ['points' => 1300, 'name' => '50% Off']
];

if (!isset($rewardTiers[$discountPercentage])) {
    jsonError('Invalid discount percentage. Available: 10%, 20%, 30%, 50%', 400);
}

$pointsCost = $rewardTiers[$discountPercentage]['points'];
$couponName = $rewardTiers[$discountPercentage]['name'];

// $pdo is now available from config/database.php

try {
    // Check if user_coupons table exists (PostgreSQL compatible)
    $tableExists = false;
    try {
        $checkTable = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_coupons')");
        $tableExists = $checkTable->fetchColumn();
    } catch (PDOException $e) {
        error_log('redeem_coupon.php - Could not check user_coupons table: ' . $e->getMessage());
    }
    
    if (!$tableExists) {
        jsonError('User coupons table does not exist. Please run the SQL setup script.', 500);
    }

    // Get user's current points
    $userStmt = $pdo->prepare('SELECT COALESCE(points, 0) as points FROM users WHERE id = :user_id');
    $userStmt->execute([':user_id' => $userId]);
    $user = $userStmt->fetch();
    $currentPoints = (int)($user['points'] ?? 0);

    if ($currentPoints < $pointsCost) {
        jsonError("Insufficient points. You need {$pointsCost} points but only have {$currentPoints} points.", 400);
    }

    // Generate unique coupon code
    $couponCode = 'JBR' . strtoupper(substr(md5($userId . time() . rand()), 0, 8));
    
    // Check if coupon code already exists (very unlikely but check anyway)
    $codeCheckStmt = $pdo->prepare('SELECT id FROM user_coupons WHERE coupon_code = :code LIMIT 1');
    $codeCheckStmt->execute([':code' => $couponCode]);
    if ($codeCheckStmt->fetch()) {
        // Regenerate if collision
        $couponCode = 'JBR' . strtoupper(substr(md5($userId . time() . rand() . microtime()), 0, 8));
    }

    // Set expiration to 30 days from now
    $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));

    // Start transaction
    $pdo->beginTransaction();

    try {
        // Deduct points from user
        $updatePointsStmt = $pdo->prepare('UPDATE users SET points = points - :points_cost WHERE id = :user_id AND points >= :points_cost');
        $updatePointsStmt->execute([
            ':points_cost' => $pointsCost,
            ':user_id' => $userId
        ]);

        if ($updatePointsStmt->rowCount() === 0) {
            throw new Exception('Failed to deduct points. Insufficient points or user not found.');
        }

        // Create coupon
        $insertStmt = $pdo->prepare('
            INSERT INTO user_coupons (
                user_id, discount_percentage, points_cost, coupon_code, expires_at
            ) VALUES (
                :user_id, :discount_percentage, :points_cost, :coupon_code, :expires_at
            )
        ');

        $insertStmt->execute([
            ':user_id' => $userId,
            ':discount_percentage' => $discountPercentage,
            ':points_cost' => $pointsCost,
            ':coupon_code' => $couponCode,
            ':expires_at' => $expiresAt
        ]);

        $couponId = (int)$pdo->lastInsertId();

        // Log activity
        try {
            $activityStmt = $pdo->prepare('
                INSERT INTO user_activities (user_id, activity_type, description, points_awarded)
                VALUES (:user_id, :activity_type, :description, :points_awarded)
            ');
            $activityStmt->execute([
                ':user_id' => $userId,
                ':activity_type' => 'coupon_redeemed',
                ':description' => "Redeemed {$pointsCost} points for {$couponName} coupon ({$couponCode})",
                ':points_awarded' => -$pointsCost
            ]);
        } catch (PDOException $e) {
            // Activity logging is optional, don't fail if it doesn't work
            error_log('redeem_coupon.php - Activity log error: ' . $e->getMessage());
        }

        // Commit transaction
        $pdo->commit();

        // Get updated points
        $userStmt->execute([':user_id' => $userId]);
        $user = $userStmt->fetch();
        $newPoints = (int)($user['points'] ?? 0);

        jsonResponse([
            'success' => true,
            'coupon' => [
                'id' => $couponId,
                'coupon_code' => $couponCode,
                'discount_percentage' => $discountPercentage,
                'points_cost' => $pointsCost,
                'expires_at' => $expiresAt,
                'name' => $couponName
            ],
            'points_remaining' => $newPoints,
            'message' => "Successfully redeemed {$pointsCost} points for {$couponName} coupon!"
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('redeem_coupon.php - PDO error: ' . $e->getMessage());
    jsonError('Failed to redeem coupon: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('redeem_coupon.php - Error: ' . $e->getMessage());
    jsonError($e->getMessage(), 500);
}
