<?php
// get_product_reviews.php
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

// Use centralized database connection
require_once __DIR__ . '/../config/database.php';

// $pdo is now available from config/database.php

try {
    // Normalize product title
    $normalizedProduct = trim($product_title);
    $item_id = 'item_' . md5($normalizedProduct);
    
    // Get reviews with user information - each user can only review once (enforced by UNIQUE KEY)
    $stmt = $pdo->prepare("
        SELECT r.id, r.user_id, r.rating, r.comment, r.product_title, r.item_id, r.created_at,
               u.id as user_table_id, u.username, u.email
        FROM reviews r
        INNER JOIN users u ON r.user_id = u.id
        WHERE (r.item_id = ? OR r.product_title = ?)
        ORDER BY r.created_at DESC
        LIMIT 50
    ");
    $stmt->execute([$item_id, $normalizedProduct]);
    $reviews = $stmt->fetchAll();
    
    // Format reviews for display
    $formatted = [];
    $sumRating = 0;
    $breakdown = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
    
    foreach ($reviews as $review) {
        // Get user name - prioritize username, fallback to email prefix
        $name = !empty($review['username']) ? trim($review['username']) : 
                (!empty($review['email']) ? explode('@', $review['email'])[0] : 'Anonymous');
        
        // Generate initials from name
        $words = explode(' ', $name);
        $initials = '';
        foreach ($words as $word) {
            if (!empty(trim($word))) {
                $initials .= strtoupper(substr(trim($word), 0, 1));
            }
        }
        if (strlen($initials) > 2) {
            $initials = substr($initials, 0, 2);
        }
        if (empty($initials)) {
            $initials = 'AN';
        }
        
        // Get review comment - use comment field directly (required field)
        $content = !empty($review['comment']) ? trim($review['comment']) : 'No comment provided';
        
        // Get rating - ensure it's valid (1-5)
        $rating = isset($review['rating']) ? (int)$review['rating'] : 0;
        if ($rating < 1) $rating = 1;
        if ($rating > 5) $rating = 5;
        
        // Add to rating calculation for summary
        $sumRating += $rating;
        if (isset($breakdown[$rating])) {
            $breakdown[$rating]++;
        }
        
        // Format review data - each review is unique per user_id (enforced by UNIQUE KEY)
        $formatted[] = [
            'id' => (int)$review['id'],
            'user_id' => (int)$review['user_id'], // Include user_id for reference
            'name' => $name, // Reviewer's name
            'initials' => $initials,
            'rating' => $rating, // Rating (1-5 stars)
            'date' => date('F j, Y', strtotime($review['created_at'])),
            'content' => $content, // Comment text
            'body' => $content, // Compatibility
            'comment' => $content, // Compatibility
            'verified' => true,
            'helpful' => 0
        ];
    }
    
    // Calculate average rating
    $totalReviews = count($reviews);
    $avgRating = $totalReviews > 0 ? round($sumRating / $totalReviews, 1) : 0;
    
    echo json_encode([
        'success' => true,
        'reviews' => $formatted,
        'summary' => [
            'total' => $totalReviews,
            'average' => $avgRating,
            'breakdown' => $breakdown
        ]
    ], JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    error_log("Get reviews error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error occurred']);
} catch (Exception $e) {
    error_log("Get reviews exception: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Unexpected error occurred']);
}

ob_end_flush();
?>
