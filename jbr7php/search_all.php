<?php
// search_all.php
// Comprehensive search endpoint for products, settings, etc.

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

$query = isset($_GET['q']) ? trim($_GET['q']) : '';
$type = isset($_GET['type']) ? $_GET['type'] : 'all'; // 'all', 'products', 'settings'
$sort = isset($_GET['sort']) ? $_GET['sort'] : 'relevance'; // 'relevance', 'rating', 'price_low', 'price_high'

if (empty($query)) {
    jsonError('Search query required', 400);
}

// $pdo is now available from config/database.php

try {
    error_log('search_all.php - DB connect error: ' . $e->getMessage());
    jsonError('Database unavailable', 500);
}

$results = [
    'products' => [],
    'suggestions' => []
];

try {
    // Search products
    if ($type === 'all' || $type === 'products') {
        $tableCheck = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'product_title')");
        $hasNewStructure = $tableCheck->fetchColumn();
        
        $searchTerm = '%' . $query . '%';
        $exactTerm = $query;
        $startTerm = $query . '%';
        
        $sql = "
            SELECT i.id, i.item_id, i.title, i.description, i.price, i.image, i.category,
                   COALESCE(AVG(CAST(r.rating AS DECIMAL(3,1))), 0) as rating,
                   COUNT(DISTINCT r.id) as review_count
            FROM items i
            LEFT JOIN reviews r ON (
                r.item_id = CONCAT('item_', MD5(i.title)) 
                OR r.item_id = i.item_id
                OR r.item_id = i.title
                OR r.product_title = i.title
            )
            WHERE i.title LIKE :query 
               OR i.description LIKE :query
               OR i.category LIKE :query
            GROUP BY i.id, i.item_id, i.title, i.description, i.price, i.image, i.category
        ";
        
        // Add sorting
        switch ($sort) {
            case 'rating':
                $sql .= " ORDER BY rating DESC, review_count DESC";
                break;
            case 'price_low':
                $sql .= " ORDER BY i.price ASC";
                break;
            case 'price_high':
                $sql .= " ORDER BY i.price DESC";
                break;
            default: // relevance
                $sql .= " ORDER BY 
                    CASE 
                        WHEN i.title = :exact THEN 1
                        WHEN i.title LIKE :start THEN 2
                        WHEN i.description LIKE :query THEN 3
                        ELSE 4
                    END,
                    rating DESC,
                    review_count DESC";
        }
        
        $sql .= " LIMIT 50";
        
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':query', $searchTerm, PDO::PARAM_STR);
        
        // Only bind exact and start if used in ORDER BY (relevance sort)
        if ($sort === 'relevance' || $sort === 'all') {
            $stmt->bindValue(':exact', $exactTerm, PDO::PARAM_STR);
            $stmt->bindValue(':start', $startTerm, PDO::PARAM_STR);
        }
        
        $stmt->execute();
        $items = $stmt->fetchAll();
        
        foreach ($items as $item) {
            $rating = isset($item['rating']) ? (float)$item['rating'] : 0.0;
            $rating = max(0.0, min(5.0, round($rating, 1)));
            
            $results['products'][] = [
                'id' => (int)$item['id'],
                'item_id' => $item['item_id'],
                'title' => $item['title'],
                'description' => $item['description'],
                'price' => (float)$item['price'],
                'image' => $item['image'],
                'category' => $item['category'],
                'rating' => $rating,
                'review_count' => (int)$item['review_count'],
            ];
        }
    }
    
    // Generate comprehensive system-wide suggestions
    if ($type === 'all' || $type === 'settings' || $type === 'pages') {
        $queryLower = strtolower($query);
        
        // All system pages and sections
        $systemSuggestions = [
            // Main Pages
            ['text' => 'Home', 'url' => 'home.html', 'icon' => 'fa-home', 'match' => ['home', 'main', 'landing', 'start']],
            ['text' => 'Explore Products', 'url' => 'explore.html', 'icon' => 'fa-compass', 'match' => ['explore', 'products', 'shop', 'browse', 'catalog', 'collection']],
            ['text' => 'My Cart', 'url' => 'cart.html', 'icon' => 'fa-shopping-cart', 'match' => ['cart', 'basket', 'checkout', 'buy', 'purchase']],
            ['text' => 'Saved Items', 'url' => 'saved.html', 'icon' => 'fa-bookmark', 'match' => ['saved', 'bookmark', 'wishlist', 'favorite', 'favourite']],
            ['text' => 'My Profile', 'url' => 'profile.html', 'icon' => 'fa-user-circle', 'match' => ['profile', 'account', 'user', 'my profile', 'my account']],
            ['text' => 'Track Order', 'url' => 'track-order.html', 'icon' => 'fa-truck', 'match' => ['track', 'order', 'tracking', 'status', 'delivery', 'shipment']],
            ['text' => 'Notifications', 'url' => 'notification.html', 'icon' => 'fa-bell', 'match' => ['notification', 'alert', 'reminder', 'notify', 'message']],
            ['text' => 'Contact Us', 'url' => 'contact.html', 'icon' => 'fa-envelope', 'match' => ['contact', 'help', 'support', 'faq', 'question', 'inquiry']],
            ['text' => 'About Us', 'url' => 'about.html', 'icon' => 'fa-info-circle', 'match' => ['about', 'company', 'us', 'information']],
            ['text' => 'Receipt', 'url' => 'receipt.html', 'icon' => 'fa-receipt', 'match' => ['receipt', 'invoice', 'order confirmation', 'purchase']],
            
            // Settings Sections
            ['text' => 'Settings > Shipping Addresses', 'url' => 'settings.html#shipping', 'icon' => 'fa-truck', 'match' => ['address', 'shipping address', 'delivery address', 'location', 'where']],
            ['text' => 'Settings > Payment Methods', 'url' => 'settings.html#payment', 'icon' => 'fa-credit-card', 'match' => ['payment', 'card', 'pay', 'method', 'credit', 'debit', 'billing']],
            ['text' => 'Settings > Account Information', 'url' => 'settings.html#account', 'icon' => 'fa-user-circle', 'match' => ['account info', 'account information', 'personal', 'details', 'name', 'email', 'phone']],
            ['text' => 'Settings > Privacy & Security', 'url' => 'settings.html#privacy', 'icon' => 'fa-lock', 'match' => ['privacy', 'security', 'password', 'login', 'change password', 'secure']],
            ['text' => 'Settings > Notifications', 'url' => 'settings.html#notifications', 'icon' => 'fa-bell', 'match' => ['notification settings', 'alert settings', 'preferences']],
            ['text' => 'Settings > Couriers', 'url' => 'settings.html#couriers', 'icon' => 'fa-truck', 'match' => ['courier', 'courier settings', 'delivery option']],
            ['text' => 'Settings > Help & Support', 'url' => 'settings.html#help', 'icon' => 'fa-question-circle', 'match' => ['help', 'support', 'assistance']],
            
            // Legal/Policy Pages
            ['text' => 'Privacy Policy', 'url' => 'privacy-policy.html', 'icon' => 'fa-shield-alt', 'match' => ['privacy policy', 'privacy', 'data protection']],
            ['text' => 'Terms of Service', 'url' => 'terms-of-service.html', 'icon' => 'fa-file-contract', 'match' => ['terms', 'terms of service', 'conditions', 'agreement']],
            ['text' => 'Warranty', 'url' => 'warranty.html', 'icon' => 'fa-certificate', 'match' => ['warranty', 'guarantee', 'return', 'refund']],
            
            // Auth Pages
            ['text' => 'Sign In', 'url' => 'signin.html', 'icon' => 'fa-sign-in-alt', 'match' => ['sign in', 'login', 'log in', 'signin']],
            ['text' => 'Sign Up', 'url' => 'signup.html', 'icon' => 'fa-user-plus', 'match' => ['sign up', 'register', 'registration', 'signup', 'create account']],
        ];
        
        // Score and rank suggestions based on relevance
        $scoredSuggestions = [];
        foreach ($systemSuggestions as $suggestion) {
            $score = 0;
            $queryWords = explode(' ', $queryLower);
            
            foreach ($suggestion['match'] as $matchTerm) {
                $matchLower = strtolower($matchTerm);
                
                // Exact match gets highest score
                if ($matchLower === $queryLower) {
                    $score = 100;
                    break;
                }
                
                // Check if query contains match term or vice versa
                if (strpos($queryLower, $matchLower) !== false) {
                    $score += 50;
                } elseif (strpos($matchLower, $queryLower) !== false) {
                    $score += 30;
                }
                
                // Check individual word matches
                foreach ($queryWords as $word) {
                    if (strlen($word) > 2 && strpos($matchLower, $word) !== false) {
                        $score += 10;
                    }
                }
            }
            
            if ($score > 0) {
                $suggestion['score'] = $score;
                $scoredSuggestions[] = $suggestion;
            }
        }
        
        // Sort by score (highest first) and limit to top 10
        usort($scoredSuggestions, function($a, $b) {
            return $b['score'] - $a['score'];
        });
        
        $results['suggestions'] = array_slice($scoredSuggestions, 0, 10);
        
        // Remove score from final results
        foreach ($results['suggestions'] as &$suggestion) {
            unset($suggestion['score']);
        }
    }
    
    jsonResponse([
        'success' => true,
        'query' => $query,
        'results' => $results,
        'count' => [
            'products' => count($results['products']),
            'suggestions' => count($results['suggestions'])
        ]
    ]);
    
} catch (PDOException $e) {
    error_log('search_all.php - error: ' . $e->getMessage());
    jsonError('Search failed', 500);
} catch (Throwable $e) {
    error_log('search_all.php - unexpected error: ' . $e->getMessage());
    jsonError('Server error', 500);
}
