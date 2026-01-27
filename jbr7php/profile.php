<?php
declare(strict_types=1);
// profile.php
// Returns JSON with user info, stats and saved items for the currently authenticated session.

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

// Require an authenticated session
if (empty($_SESSION['user_id'])) {
    jsonError('Not authenticated', 401);
}

$userId = (int)$_SESSION['user_id'];

// Connect to database
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
    error_log('profile.php - DB connect error: ' . $e->getMessage());
    jsonError('Database unavailable', 500);
}

try {
    // Check if phone and profile_picture columns exist in users table
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'phone'");
    $phoneColumnExists = $stmt->fetch() !== false;
    
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'profile_picture'");
    $profilePictureColumnExists = $stmt->fetch() !== false;

    // Build SELECT query based on column existence
    $selectFields = ['id', 'username', 'email', 'created_at', 'COALESCE(points, 0) AS points'];
    if ($phoneColumnExists) {
        $selectFields[] = 'phone';
    }
    if ($profilePictureColumnExists) {
        $selectFields[] = 'profile_picture';
    }
    
    $stmt = $pdo->prepare('SELECT ' . implode(', ', $selectFields) . ' FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();

    if (!$user) {
        session_destroy();
        jsonError('User not found', 404);
    }

    // Fetch stats - Total Orders
    $totalOrders = 0;
    try {
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM orders WHERE user_id = :id');
        $stmt->execute([':id' => $userId]);
        $totalOrders = (int)$stmt->fetchColumn();
    } catch (PDOException $e) {
        error_log('profile.php - orders count error: ' . $e->getMessage());
    }

    // Fetch stats - Saved Items
    $savedCount = 0;
    try {
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM saved_items WHERE user_id = :id');
        $stmt->execute([':id' => $userId]);
        $savedCount = (int)$stmt->fetchColumn();
    } catch (PDOException $e) {
        error_log('profile.php - saved_items count error: ' . $e->getMessage());
    }

    // Fetch stats - Reviews
    $reviewsCount = 0;
    try {
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM reviews WHERE user_id = :id');
        $stmt->execute([':id' => $userId]);
        $reviewsCount = (int)$stmt->fetchColumn();
    } catch (PDOException $e) {
        error_log('profile.php - reviews count error: ' . $e->getMessage());
    }

    // Fetch saved items details
    $savedItems = [];
    try {
        $stmt = $pdo->prepare('
            SELECT id, title, price, metadata, created_at 
            FROM saved_items 
            WHERE user_id = :id 
            ORDER BY created_at DESC
        ');
        $stmt->execute([':id' => $userId]);
        $rows = $stmt->fetchAll();
        
        foreach ($rows as $row) {
            $metadata = null;
            if (!empty($row['metadata'])) {
                $decoded = json_decode($row['metadata'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $metadata = $decoded;
                }
            }
            
            $savedItems[] = [
                'id' => (int)$row['id'],
                'title' => (string)$row['title'],
                'price' => (string)$row['price'],
                'metadata' => $metadata,
                'created_at' => (string)$row['created_at'],
            ];
        }
    } catch (PDOException $e) {
        error_log('profile.php - saved_items fetch error: ' . $e->getMessage());
    }

    // Fetch orders (optional)
    $orders = [];
    try {
        $stmt = $pdo->prepare('
            SELECT id, order_number, total, status, created_at 
            FROM orders 
            WHERE user_id = :id 
            ORDER BY created_at DESC 
            LIMIT 20
        ');
        $stmt->execute([':id' => $userId]);
        $orderRows = $stmt->fetchAll();
        
        foreach ($orderRows as $order) {
            $orders[] = [
                'id' => (int)$order['id'],
                'order_number' => (string)$order['order_number'],
                'total' => (string)$order['total'],
                'status' => (string)$order['status'],
                'created_at' => (string)$order['created_at'],
            ];
        }
    } catch (PDOException $e) {
        error_log('profile.php - orders fetch error: ' . $e->getMessage());
    }

    // Build response
    $profilePictureUrl = '';
    if (isset($user['profile_picture']) && !empty($user['profile_picture'])) {
        $profilePictureUrl = '/' . ltrim($user['profile_picture'], '/');
    }
    
    $response = [
        'success' => true,
        'user' => [
            'id' => (int)$user['id'],
            'username' => (string)$user['username'],
            'email' => (string)$user['email'],
            'phone' => isset($user['phone']) ? (string)$user['phone'] : '',
            'created_at' => (string)$user['created_at'],
            'points' => (int)$user['points'],
            'profile_picture' => $profilePictureUrl,
        ],
        'stats' => [
            'orders' => $totalOrders,
            'total_orders' => $totalOrders,
            'saved' => $savedCount,
            'saved_items' => $savedCount,
            'reviews' => $reviewsCount,
            'favorites' => 0, // Add this if you have a favorites table
        ],
        'items' => $savedItems,
        'saved_items' => $savedItems,
        'orders' => $orders,
    ];

    jsonResponse($response, 200);

} catch (PDOException $e) {
    error_log('profile.php - query error: ' . $e->getMessage());
    jsonError('Server error', 500);
} catch (Throwable $e) {
    error_log('profile.php - unexpected error: ' . $e->getMessage());
    jsonError('Server error', 500);
}