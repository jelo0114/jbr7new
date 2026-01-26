<?php
declare(strict_types=1);
// get_user_activities.php
// Fetches user activity history for rewards section

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
    // Get user points
    $userStmt = $pdo->prepare('SELECT COALESCE(points, 0) as points FROM users WHERE id = :user_id');
    $userStmt->execute([':user_id' => $userId]);
    $user = $userStmt->fetch();
    $points = (int)($user['points'] ?? 0);

    // Get activities (check if table exists first)
    $activities = [];
    try {
        $activityStmt = $pdo->prepare('
            SELECT activity_type, description, points_awarded, created_at
            FROM user_activities
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT 50
        ');
        $activityStmt->execute([':user_id' => $userId]);
        $activities = $activityStmt->fetchAll();
    } catch (PDOException $e) {
        // Table might not exist yet, that's okay
        error_log('get_user_activities.php - activities table might not exist: ' . $e->getMessage());
    }

    // Format activities
    $formattedActivities = array_map(function($activity) {
        return [
            'type' => $activity['activity_type'] ?? 'unknown',
            'description' => $activity['description'] ?? '',
            'points' => (int)($activity['points_awarded'] ?? 0),
            'date' => date('F j, Y', strtotime($activity['created_at'])),
            'time_ago' => getTimeAgo($activity['created_at']),
        ];
    }, $activities);

    jsonResponse([
        'success' => true,
        'points' => $points,
        'activities' => $formattedActivities,
        'count' => count($formattedActivities)
    ]);

} catch (PDOException $e) {
    error_log('get_user_activities.php - error: ' . $e->getMessage());
    jsonError('Failed to fetch activities', 500);
} catch (Throwable $e) {
    error_log('get_user_activities.php - unexpected error: ' . $e->getMessage());
    jsonError('Server error', 500);
}

function getTimeAgo($datetime) {
    $timestamp = strtotime($datetime);
    $diff = time() - $timestamp;
    
    if ($diff < 60) return 'just now';
    if ($diff < 3600) return floor($diff / 60) . ' minutes ago';
    if ($diff < 86400) return floor($diff / 3600) . ' hours ago';
    if ($diff < 604800) return floor($diff / 86400) . ' days ago';
    if ($diff < 2592000) return floor($diff / 604800) . ' weeks ago';
    if ($diff < 31536000) return floor($diff / 2592000) . ' months ago';
    return floor($diff / 31536000) . ' years ago';
}
