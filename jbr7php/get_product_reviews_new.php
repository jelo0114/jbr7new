<?php
// get_product_reviews_new.php
// Clean review fetching - public access, latest 10 reviews

ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);
ob_clean();

header('Content-Type: application/json');
// Public access - no authentication required

$product_title = isset($_GET['product']) ? trim(urldecode($_GET['product'])) : '';

if (empty($product_title)) {
    echo json_encode(['success' => false, 'error' => 'Product title required']);
    exit;
}

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
    // Generate item_id from product title (must match submit_review_new.php)
    $item_id = 'item_' . md5($product_title);
    
    // Get reviews for this product - latest 10, ordered by newest first
    $stmt = $pdo->prepare("
        SELECT r.id, r.rating, r.comment, r.created_at, r.product_title,
               u.username, u.email, u.full_name
        FROM reviews r
        INNER JOIN users u ON r.user_id = u.id
        WHERE r.item_id = ? OR r.product_title = ?
        ORDER BY r.created_at DESC
        LIMIT 10
    ");
    
    $stmt->execute([$item_id, $product_title]);
    $reviews = $stmt->fetchAll();
    
    // Format reviews for display
    $formatted = [];
    foreach ($reviews as $review) {
        // Get user name
        $name = !empty($review['full_name']) ? $review['full_name'] : 
                (!empty($review['username']) ? $review['username'] : 
                (!empty($review['email']) ? explode('@', $review['email'])[0] : 'Anonymous'));
        
        // Generate initials
        $words = explode(' ', $name);
        $initials = '';
        foreach ($words as $word) {
            if (!empty($word)) {
                $initials .= strtoupper(substr($word, 0, 1));
            }
        }
        if (strlen($initials) > 2) {
            $initials = substr($initials, 0, 2);
        }
        if (empty($initials)) {
            $initials = 'AN';
        }
        
        $formatted[] = [
            'id' => (int)$review['id'],
            'name' => $name,
            'initials' => $initials,
            'rating' => (int)$review['rating'],
            'date' => date('F j, Y', strtotime($review['created_at'])),
            'content' => $review['comment'] ?? '',
            'verified' => true,
            'helpful' => 0
        ];
    }
    
    // Calculate rating summary
    $totalReviews = count($reviews);
    $sumRating = 0;
    $breakdown = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
    
    foreach ($reviews as $review) {
        $rating = (int)$review['rating'];
        $sumRating += $rating;
        if (isset($breakdown[$rating])) {
            $breakdown[$rating]++;
        }
    }
    
    $avgRating = $totalReviews > 0 ? round($sumRating / $totalReviews, 1) : 0;
    
    echo json_encode([
        'success' => true,
        'reviews' => $formatted,
        'summary' => [
            'total' => $totalReviews,
            'average' => $avgRating,
            'breakdown' => $breakdown
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Get reviews error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error occurred']);
} catch (Exception $e) {
    error_log("Get reviews exception: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Unexpected error occurred']);
}

ob_end_flush();
?>
