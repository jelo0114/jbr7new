<?php
declare(strict_types=1);
// get_item.php
// Fetches item details including images from database

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

// Get item_id or title from query parameter
$itemId = $_GET['item_id'] ?? null;
$itemTitle = $_GET['title'] ?? null;

if (!$itemId && !$itemTitle) {
    jsonError('Item ID or title required', 400);
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
    error_log('get_item.php - DB connect error: ' . $e->getMessage());
    jsonError('Database unavailable', 500);
}

try {
    // Build query
    if ($itemId) {
        $stmt = $pdo->prepare('SELECT * FROM items WHERE item_id = :item_id LIMIT 1');
        $stmt->execute([':item_id' => $itemId]);
    } else {
        $stmt = $pdo->prepare('SELECT * FROM items WHERE title = :title LIMIT 1');
        $stmt->execute([':title' => $itemTitle]);
    }
    
    $item = $stmt->fetch();
    
    if (!$item) {
        jsonError('Item not found', 404);
    }

    // Parse images (can be JSON array or comma-separated string)
    $images = [];
    if (!empty($item['images'])) {
        $decoded = json_decode($item['images'], true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $images = array_filter($decoded, function($img) {
                return !empty($img) && is_string($img);
            });
        } else {
            // Try comma-separated
            $images = array_filter(array_map('trim', explode(',', $item['images'])));
        }
    }
    
    // If no images array, use the main image
    if (empty($images) && !empty($item['image'])) {
        $images = [$item['image']];
    }
    
    // Ensure we have at least one image
    if (empty($images)) {
        $images = ['totebag.avif'];
    }

    jsonResponse([
        'success' => true,
        'item' => [
            'id' => (int)$item['id'],
            'item_id' => $item['item_id'],
            'title' => $item['title'],
            'description' => $item['description'],
            'price' => (float)$item['price'],
            'image' => $item['image'],
            'images' => $images,
            'category' => $item['category'],
            'rating' => (float)($item['rating'] ?? 0),
            'review_count' => (int)($item['review_count'] ?? 0),
        ]
    ]);

} catch (PDOException $e) {
    error_log('get_item.php - error: ' . $e->getMessage());
    jsonError('Failed to fetch item', 500);
} catch (Throwable $e) {
    error_log('get_item.php - unexpected error: ' . $e->getMessage());
    jsonError('Server error', 500);
}
