<?php
// submit_review_new.php
// Clean review submission - saves to new reviews table structure

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

$input = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit;
}

$user_id = $_SESSION['user_id'];
$product_title = isset($input['item_title']) ? trim($input['item_title']) : '';
$rating = isset($input['rating']) ? (float)$input['rating'] : 0;
$comment = isset($input['content']) ? trim($input['content']) : '';

// Validate input - allow half stars (0.5 increments from 0.5 to 5.0)
if (empty($product_title) || empty($comment)) {
    echo json_encode(['success' => false, 'error' => 'Invalid input - all fields required']);
    exit;
}

// Validate rating - must be between 0.5 and 5.0, and in 0.5 increments
if ($rating < 0.5 || $rating > 5.0) {
    echo json_encode(['success' => false, 'error' => 'Rating must be between 0.5 and 5.0 stars']);
    exit;
}

// Round to nearest 0.5 (allow half stars)
$rating = round($rating * 2) / 2;
$rating = max(0.5, min(5.0, $rating));

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
    // Generate item_id from product title (consistent hashing)
    $item_id = 'item_' . md5($product_title);
    
    // Check if user already reviewed this product (UNIQUE constraint: user_id + item_id)
    $checkStmt = $pdo->prepare("SELECT id, rating, comment FROM reviews WHERE user_id = ? AND item_id = ? LIMIT 1");
    $checkStmt->execute([$user_id, $item_id]);
    $existing = $checkStmt->fetch();
    
    if ($existing) {
        echo json_encode([
            'success' => false, 
            'error' => 'You have already reviewed this product. Each user can only submit one review per item.',
            'existing_review_id' => (int)$existing['id']
        ]);
        exit;
    }
    
    // Insert review - UNIQUE KEY unique_user_product (user_id, item_id) ensures one review per user per item
    $stmt = $pdo->prepare("
        INSERT INTO reviews (user_id, product_title, item_id, rating, comment, created_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
    ");
    
    $result = $stmt->execute([
        $user_id,
        $product_title,
        $item_id,
        $rating,
        $comment
    ]);
    
    if (!$result) {
        echo json_encode(['success' => false, 'error' => 'Failed to save review']);
        exit;
    }
    
    // Verify the saved review
    $verifyStmt = $pdo->prepare("SELECT id, rating, comment FROM reviews WHERE id = LAST_INSERT_ID()");
    $verifyStmt->execute();
    $saved = $verifyStmt->fetch();
    
    error_log("Review saved - ID: " . $saved['id'] . ", Rating: " . $saved['rating'] . ", Comment length: " . strlen($saved['comment']));
    
    // Award points (optional)
    try {
        $pointsStmt = $pdo->prepare("UPDATE users SET points = points + 50 WHERE id = ?");
        $pointsStmt->execute([$user_id]);
    } catch (PDOException $e) {
        // Points column might not exist
    }
    
    // Log activity (optional)
    try {
        $activityStmt = $pdo->prepare("
            INSERT INTO user_activities (user_id, activity_type, description, points_earned, created_at) 
            VALUES (?, 'review', ?, 50, NOW())
        ");
        $activityStmt->execute([$user_id, "Reviewed: $product_title"]);
    } catch (PDOException $e) {
        // Table might not exist
    }
    
    echo json_encode([
        'success' => true, 
        'message' => 'Review submitted successfully',
        'review_id' => $saved['id']
    ]);
    
} catch (PDOException $e) {
    error_log("Submit review error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Submit review exception: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Unexpected error occurred']);
}

ob_end_flush();
?>
