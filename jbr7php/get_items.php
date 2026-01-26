<?php
declare(strict_types=1);
// get_items.php
// Fetches all items for explore page

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

// $pdo is now available from config/database.php

try {
    // Check if reviews table has new structure (PostgreSQL compatible)
    $tableCheck = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'product_title')");
    $hasNewStructure = $tableCheck->fetchColumn();
    
    // Match reviews using multiple strategies to ensure we get all reviews
    // Use COUNT(DISTINCT r.id) to avoid duplicate counts
    $stmt = $pdo->query('
        SELECT i.id, i.item_id, i.title, i.description, i.price, i.image, i.category,
               COALESCE(AVG(CAST(r.rating AS DECIMAL(3,1))), 0) as rating,
               COUNT(DISTINCT r.id) as review_count
        FROM items i
        LEFT JOIN reviews r ON (
            r.item_id = CONCAT("item_", MD5(i.title)) 
            OR r.item_id = i.item_id
            OR r.item_id = i.title
            OR r.product_title = i.title
        )
        GROUP BY i.id, i.item_id, i.title, i.description, i.price, i.image, i.category
        ORDER BY i.created_at DESC
    ');
    $items = $stmt->fetchAll();

    // Format items - ensure rating is calculated correctly
    $formattedItems = array_map(function($item) {
        // Get rating from database calculation
        $rating = isset($item['rating']) ? (float)$item['rating'] : 0.0;
        $reviewCount = isset($item['review_count']) ? (int)$item['review_count'] : 0;
        
        // Strictly clamp rating between 0.0 and 5.0
        $rating = max(0.0, min(5.0, $rating));
        
        // Round to 1 decimal place
        $rating = round($rating, 1);
        
        // Double-check: if somehow rating is still > 5, force it to 5.0
        if ($rating > 5.0) {
            $rating = 5.0;
        }
        
        return [
            'id' => (int)$item['id'],
            'item_id' => $item['item_id'],
            'title' => $item['title'],
            'description' => $item['description'],
            'price' => (float)$item['price'],
            'image' => $item['image'],
            'category' => $item['category'],
            'rating' => $rating,
            'review_count' => $reviewCount,
        ];
    }, $items);

    jsonResponse([
        'success' => true,
        'items' => $formattedItems,
        'count' => count($formattedItems)
    ]);

} catch (PDOException $e) {
    error_log('get_items.php - error: ' . $e->getMessage());
    jsonError('Failed to fetch items', 500);
} catch (Throwable $e) {
    error_log('get_items.php - unexpected error: ' . $e->getMessage());
    jsonError('Server error', 500);
}
