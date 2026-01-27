<?php
// get_user_reviews.php
// Get all reviews by the logged-in user

ob_start();
ini_set('display_errors', 0);
error_reporting(0);

session_start();
ob_clean();

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

$user_id = $_SESSION['user_id'];

$DB_HOST = '127.0.0.1';
$DB_NAME = 'jbr7_db';
$DB_USER = 'root';
$DB_PASS = '';

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
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

try {
    // Check if table has new structure
    $tableCheck = $pdo->query("SHOW COLUMNS FROM reviews LIKE 'product_title'");
    $hasNewStructure = $tableCheck->rowCount() > 0;
    
    if ($hasNewStructure) {
        // Get reviews with product info from items table
        $stmt = $pdo->prepare("
            SELECT r.id, r.product_title, r.rating, r.comment, r.created_at, r.item_id,
                   COALESCE(i.price, 0) as price, 
                   COALESCE(NULLIF(i.image, ''), 'totebag.avif') as image
            FROM reviews r
            LEFT JOIN items i ON i.title = r.product_title
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        ");
    } else {
        $stmt = $pdo->prepare("
            SELECT r.id, r.item_id, r.rating, r.title, r.body, r.created_at
            FROM reviews r
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        ");
    }
    
    $stmt->execute([$user_id]);
    $reviews = $stmt->fetchAll();
    
    $formatted = [];
    foreach ($reviews as $review) {
        if ($hasNewStructure) {
            // Ensure product_title is not empty - check multiple sources
            $productTitle = '';
            if (!empty($review['product_title'])) {
                $productTitle = trim($review['product_title']);
            }
            
            // If still empty, try to get from items table using item_id
            if (empty($productTitle) && !empty($review['item_id'])) {
                $itemStmt = $pdo->prepare("SELECT title FROM items WHERE item_id = ? LIMIT 1");
                $itemStmt->execute([$review['item_id']]);
                $item = $itemStmt->fetch();
                if ($item && !empty($item['title'])) {
                    $productTitle = trim($item['title']);
                }
            }
            
            // Final fallback
            if (empty($productTitle)) {
                $productTitle = 'Unknown Product';
            }
            
            // Get price and image from query result (already joined with items table)
            $price = isset($review['price']) && $review['price'] > 0 ? (float)$review['price'] : 0;
            $image = isset($review['image']) && !empty(trim($review['image'])) && trim($review['image']) !== 'totebag.avif' 
                     ? trim($review['image']) 
                     : 'totebag.avif';
            
            // If price is still 0 or image is default, try to find product in items table by exact title match
            if (($price == 0 || $image == 'totebag.avif') && $productTitle !== 'Unknown Product') {
                $itemStmt = $pdo->prepare("SELECT price, image FROM items WHERE title = ? LIMIT 1");
                $itemStmt->execute([$productTitle]);
                $item = $itemStmt->fetch();
                if ($item) {
                    if ($price == 0 && isset($item['price']) && $item['price'] > 0) {
                        $price = (float)$item['price'];
                    }
                    if ($image == 'totebag.avif' && !empty($item['image'])) {
                        $image = trim($item['image']);
                    }
                }
            }
            
            $formatted[] = [
                'id' => (int)$review['id'],
                'product_title' => $productTitle,
                'item_title' => $productTitle, // Alias for compatibility with profile.html
                'rating' => (float)$review['rating'], // Support decimals for half-stars
                'comment' => !empty($review['comment']) ? trim($review['comment']) : '',
                'item_price' => $price,
                'item_image' => $image,
                'date' => date('F j, Y', strtotime($review['created_at']))
            ];
        } else {
            $formatted[] = [
                'id' => (int)$review['id'],
                'product_title' => $review['title'] ?? 'Product',
                'item_title' => $review['title'] ?? 'Product',
                'rating' => (int)$review['rating'],
                'comment' => $review['body'] ?? $review['title'] ?? '',
                'item_price' => 0,
                'item_image' => 'totebag.avif',
                'date' => date('F j, Y', strtotime($review['created_at']))
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'reviews' => $formatted
    ]);
    
} catch (PDOException $e) {
    error_log("Get user reviews error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error occurred']);
}

ob_end_flush();
?>
