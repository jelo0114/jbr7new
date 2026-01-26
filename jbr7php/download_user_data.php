<?php
// download_user_data.php
// Downloads all user data as professionally formatted PDF

header('Access-Control-Allow-Credentials: true');
session_start();

// Use centralized database connection
require_once __DIR__ . '/../config/database.php';

// Require authentication
if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

$userId = (int)$_SESSION['user_id'];

// $pdo is now available from config/database.php

try {
    error_log('download_user_data.php - DB connect error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database unavailable']);
    exit;
}

// Function to escape HTML
function escapeHtml($text) {
    return htmlspecialchars($text ?? '', ENT_QUOTES, 'UTF-8');
}

// Function to format date
function formatDate($date) {
    if (empty($date)) return 'N/A';
    return date('F d, Y g:i A', strtotime($date));
}

// Function to format currency
function formatCurrency($amount) {
    return '₱' . number_format((float)$amount, 2);
}

try {
    // 1. Get user profile
    $stmt = $pdo->prepare('SELECT id, username, email, points, created_at, profile_picture FROM users WHERE id = :user_id LIMIT 1');
    $stmt->execute([':user_id' => $userId]);
    $user = $stmt->fetch() ?: [];

    // 2. Get shipping addresses
    $addresses = [];
    try {
        $stmt = $pdo->prepare('SELECT * FROM shipping_addresses WHERE user_id = :user_id ORDER BY created_at DESC');
        $stmt->execute([':user_id' => $userId]);
        $addresses = $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log('download_user_data.php - Could not fetch addresses: ' . $e->getMessage());
    }

    // 3. Get orders
    $orders = [];
    try {
        $stmt = $pdo->prepare('SELECT * FROM orders WHERE user_id = :user_id ORDER BY created_at DESC');
        $stmt->execute([':user_id' => $userId]);
        $orders = $stmt->fetchAll();
        
        foreach ($orders as &$order) {
            $orderId = $order['id'];
            $itemStmt = $pdo->prepare('SELECT * FROM order_items WHERE order_id = :order_id');
            $itemStmt->execute([':order_id' => $orderId]);
            $order['items'] = $itemStmt->fetchAll();
        }
    } catch (PDOException $e) {
        error_log('download_user_data.php - Could not fetch orders: ' . $e->getMessage());
    }

    // 4. Get receipts
    $receipts = [];
    try {
        $stmt = $pdo->prepare('SELECT * FROM receipts WHERE user_id = :user_id ORDER BY created_at DESC');
        $stmt->execute([':user_id' => $userId]);
        $receipts = $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log('download_user_data.php - Could not fetch receipts: ' . $e->getMessage());
    }

    // 5. Get reviews
    $reviews = [];
    try {
        $stmt = $pdo->prepare('SELECT * FROM reviews WHERE user_id = :user_id ORDER BY created_at DESC');
        $stmt->execute([':user_id' => $userId]);
        $reviews = $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log('download_user_data.php - Could not fetch reviews: ' . $e->getMessage());
    }

    // 6. Get saved items
    $savedItems = [];
    try {
        $stmt = $pdo->prepare('SELECT * FROM saved_items WHERE user_id = :user_id ORDER BY created_at DESC');
        $stmt->execute([':user_id' => $userId]);
        $savedItems = $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log('download_user_data.php - Could not fetch saved items: ' . $e->getMessage());
    }

    // 7. Get login history
    $loginHistory = [];
    try {
        $stmt = $pdo->prepare('SELECT * FROM login_history WHERE user_id = :user_id ORDER BY login_time DESC LIMIT 100');
        $stmt->execute([':user_id' => $userId]);
        $loginHistory = $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log('download_user_data.php - Could not fetch login history: ' . $e->getMessage());
    }

    // 8. Get user activities
    $activities = [];
    try {
        $stmt = $pdo->prepare('SELECT * FROM user_activities WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 100');
        $stmt->execute([':user_id' => $userId]);
        $activities = $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log('download_user_data.php - Could not fetch activities: ' . $e->getMessage());
    }

    // 9. Get notification preferences
    $notifications = [];
    try {
        $stmt = $pdo->prepare('SELECT * FROM notification_preferences WHERE user_id = :user_id');
        $stmt->execute([':user_id' => $userId]);
        $notifications = $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log('download_user_data.php - Could not fetch notification preferences: ' . $e->getMessage());
    }

    // Generate professional PDF HTML
    $html = generatePDFHTML($user, $addresses, $orders, $receipts, $reviews, $savedItems, $loginHistory, $activities, $notifications);
    
    // Output HTML optimized for PDF printing
    // No headers for attachment - let it display and auto-print
    echo $html;
    exit;

} catch (PDOException $e) {
    error_log('download_user_data.php - error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to generate data export']);
} catch (Throwable $e) {
    error_log('download_user_data.php - unexpected error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}

function generatePDFHTML($user, $addresses, $orders, $receipts, $reviews, $savedItems, $loginHistory, $activities, $notifications) {
    $exportDate = date('F d, Y \a\t g:i A');
    $username = escapeHtml($user['username'] ?? 'N/A');
    $email = escapeHtml($user['email'] ?? 'N/A');
    $points = (int)($user['points'] ?? 0);
    $accountCreated = formatDate($user['created_at'] ?? '');
    
    $html = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Data Export - JBR7 Bags</title>
    <style>
        @page { 
            margin: 1.5cm; 
            size: A4;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: "Segoe UI", Arial, "Helvetica Neue", sans-serif; 
            font-size: 11pt; 
            line-height: 1.6; 
            color: #333; 
            background: #fff; 
            padding: 0;
        }
        .header { 
            background: linear-gradient(135deg, #006923 0%, #37b36a 100%); 
            color: white; 
            padding: 30px 20px; 
            margin: 0 0 30px 0; 
            text-align: center; 
            page-break-after: avoid;
        }
        .header h1 { font-size: 24pt; margin-bottom: 10px; font-weight: 700; }
        .header p { font-size: 12pt; opacity: 0.95; }
        .meta { 
            background: #f8f9fa; 
            padding: 15px 20px; 
            border-radius: 8px; 
            margin-bottom: 25px; 
            border: 1px solid #e0e0e0;
            page-break-inside: avoid;
        }
        .meta-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .meta-label { font-weight: 600; color: #666; }
        .section { 
            margin: 30px 0; 
            page-break-inside: avoid; 
        }
        .section-title { 
            font-size: 16pt; 
            color: #006923; 
            border-bottom: 3px solid #006923; 
            padding-bottom: 8px; 
            margin-bottom: 15px; 
            font-weight: 700; 
            page-break-after: avoid;
        }
        .card { 
            background: #fff; 
            border: 1px solid #e0e0e0; 
            border-radius: 8px; 
            padding: 20px; 
            margin-bottom: 15px; 
            page-break-inside: avoid;
        }
        .card-title { 
            font-size: 13pt; 
            font-weight: 600; 
            color: #006923; 
            margin-bottom: 12px; 
        }
        .info-row { 
            display: flex; 
            padding: 8px 0; 
            border-bottom: 1px solid #f0f0f0; 
        }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: 600; width: 180px; color: #555; flex-shrink: 0; }
        .info-value { flex: 1; color: #333; }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0; 
            font-size: 10pt; 
            page-break-inside: auto;
        }
        table thead { display: table-header-group; }
        table tbody { display: table-row-group; }
        table th { 
            background: #006923; 
            color: white; 
            padding: 10px 8px; 
            text-align: left; 
            font-weight: 600; 
            font-size: 10pt;
        }
        table td { 
            padding: 8px; 
            border-bottom: 1px solid #e0e0e0; 
            font-size: 9.5pt;
        }
        table tr:nth-child(even) { background: #f9f9f9; }
        .badge { 
            display: inline-block; 
            padding: 4px 10px; 
            border-radius: 12px; 
            font-size: 9pt; 
            font-weight: 600; 
        }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-info { background: #d1ecf1; color: #0c5460; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .empty-state { 
            text-align: center; 
            padding: 30px; 
            color: #999; 
            font-style: italic; 
        }
        .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 2px solid #e0e0e0; 
            text-align: center; 
            color: #666; 
            font-size: 9pt; 
            page-break-inside: avoid;
        }
        @media print {
            body { margin: 0; padding: 0; }
            .header { margin: 0 0 20px 0; padding: 25px 15px; }
            .section { page-break-inside: avoid; margin: 20px 0; }
            .card { page-break-inside: avoid; }
            table { page-break-inside: auto; }
            table tr { page-break-inside: avoid; page-break-after: auto; }
            .footer { position: fixed; bottom: 0; width: 100%; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>JBR7 BAGS MANUFACTURING</h1>
        <p>User Data Export Report</p>
    </div>
    
    <div class="meta">
        <div class="meta-row">
            <span class="meta-label">Export Date:</span>
            <span>' . $exportDate . '</span>
        </div>
        <div class="meta-row">
            <span class="meta-label">User ID:</span>
            <span>#' . ($user['id'] ?? 'N/A') . '</span>
        </div>
        <div class="meta-row">
            <span class="meta-label">Account Created:</span>
            <span>' . $accountCreated . '</span>
        </div>
    </div>';

    // Profile Section
    $html .= '<div class="section">
        <h2 class="section-title">1. Account Profile</h2>
        <div class="card">
            <div class="info-row">
                <span class="info-label">Full Name:</span>
                <span class="info-value">' . $username . '</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email Address:</span>
                <span class="info-value">' . $email . '</span>
            </div>
            <div class="info-row">
                <span class="info-label">Loyalty Points:</span>
                <span class="info-value">' . number_format($points) . ' points</span>
            </div>
            <div class="info-row">
                <span class="info-label">Member Since:</span>
                <span class="info-value">' . $accountCreated . '</span>
            </div>
        </div>
    </div>';

    // Shipping Addresses Section
    $html .= '<div class="section">
        <h2 class="section-title">2. Shipping Addresses (' . count($addresses) . ')</h2>';
    if (empty($addresses)) {
        $html .= '<div class="empty-state">No shipping addresses saved</div>';
    } else {
        foreach ($addresses as $idx => $addr) {
            $isDefault = ($addr['is_default'] ?? 0) == 1 ? '<span class="badge badge-success">Default</span>' : '';
            $addrType = escapeHtml($addr['address_type'] ?? 'Home');
            $fullName = escapeHtml($addr['full_name'] ?? 'N/A');
            $phone = escapeHtml($addr['phone'] ?? 'N/A');
            $line1 = escapeHtml($addr['address_line1'] ?? '');
            $line2 = escapeHtml($addr['address_line2'] ?? '');
            $city = escapeHtml($addr['city'] ?? '');
            $province = escapeHtml($addr['province'] ?? '');
            $postal = escapeHtml($addr['postal_code'] ?? '');
            $country = escapeHtml($addr['country'] ?? 'Philippines');
            
            $html .= '<div class="card">
                <div class="card-title">Address #' . ($idx + 1) . ' - ' . $addrType . ' ' . $isDefault . '</div>
                <div class="info-row">
                    <span class="info-label">Recipient:</span>
                    <span class="info-value">' . $fullName . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">' . $phone . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Address:</span>
                    <span class="info-value">' . $line1 . ($line2 ? ', ' . $line2 : '') . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">City/Province:</span>
                    <span class="info-value">' . $city . ', ' . $province . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Postal Code:</span>
                    <span class="info-value">' . $postal . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Country:</span>
                    <span class="info-value">' . $country . '</span>
                </div>
            </div>';
        }
    }
    $html .= '</div>';

    // Orders Section
    $html .= '<div class="section">
        <h2 class="section-title">3. Orders (' . count($orders) . ')</h2>';
    if (empty($orders)) {
        $html .= '<div class="empty-state">No orders found</div>';
    } else {
        foreach ($orders as $order) {
            $orderNumber = escapeHtml($order['order_number'] ?? 'N/A');
            $status = escapeHtml($order['status'] ?? 'N/A');
            $statusBadge = '<span class="badge badge-info">' . ucfirst($status) . '</span>';
            $total = formatCurrency($order['total'] ?? 0);
            $created = formatDate($order['created_at'] ?? '');
            $payment = escapeHtml($order['payment_method'] ?? 'N/A');
            $courier = escapeHtml($order['courier_service'] ?? 'N/A');
            
            $html .= '<div class="card">
                <div class="card-title">Order: ' . $orderNumber . ' ' . $statusBadge . '</div>
                <div class="info-row">
                    <span class="info-label">Date:</span>
                    <span class="info-value">' . $created . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value">' . ucfirst($status) . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Payment Method:</span>
                    <span class="info-value">' . $payment . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Courier:</span>
                    <span class="info-value">' . $courier . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Amount:</span>
                    <span class="info-value"><strong>' . $total . '</strong></span>
                </div>';
            
            if (!empty($order['items'])) {
                $html .= '<table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th class="text-right">Unit Price</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>';
                foreach ($order['items'] as $item) {
                    $itemName = escapeHtml($item['item_name'] ?? 'N/A');
                    $qty = (int)($item['quantity'] ?? 1);
                    $unitPrice = formatCurrency($item['item_price'] ?? 0);
                    $lineTotal = formatCurrency($item['line_total'] ?? 0);
                    $html .= '<tr>
                        <td>' . $itemName . '</td>
                        <td>' . $qty . '</td>
                        <td class="text-right">' . $unitPrice . '</td>
                        <td class="text-right">' . $lineTotal . '</td>
                    </tr>';
                }
                $html .= '</tbody></table>';
            }
            $html .= '</div>';
        }
    }
    $html .= '</div>';

    // Receipts Section
    $html .= '<div class="section">
        <h2 class="section-title">4. Receipts (' . count($receipts) . ')</h2>';
    if (empty($receipts)) {
        $html .= '<div class="empty-state">No receipts found</div>';
    } else {
        foreach ($receipts as $receipt) {
            $receiptNumber = escapeHtml($receipt['order_number'] ?? 'N/A');
            $receiptTotal = formatCurrency($receipt['total'] ?? 0);
            $receiptDate = formatDate($receipt['created_at'] ?? '');
            $html .= '<div class="card">
                <div class="card-title">Receipt: ' . $receiptNumber . '</div>
                <div class="info-row">
                    <span class="info-label">Date:</span>
                    <span class="info-value">' . $receiptDate . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total:</span>
                    <span class="info-value"><strong>' . $receiptTotal . '</strong></span>
                </div>
            </div>';
        }
    }
    $html .= '</div>';

    // Reviews Section
    $html .= '<div class="section">
        <h2 class="section-title">5. Product Reviews (' . count($reviews) . ')</h2>';
    if (empty($reviews)) {
        $html .= '<div class="empty-state">No reviews submitted</div>';
    } else {
        $html .= '<table>
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>';
        foreach ($reviews as $review) {
            $productTitle = escapeHtml($review['product_title'] ?? 'Unknown Product');
            $rating = (float)($review['rating'] ?? 0);
            $comment = escapeHtml($review['comment'] ?? 'No comment');
            $reviewDate = formatDate($review['created_at'] ?? '');
            $stars = str_repeat('★', floor($rating)) . ($rating % 1 >= 0.5 ? '½' : '');
            $html .= '<tr>
                <td>' . $productTitle . '</td>
                <td>' . $stars . ' (' . number_format($rating, 1) . '/5)</td>
                <td>' . (strlen($comment) > 50 ? substr($comment, 0, 50) . '...' : $comment) . '</td>
                <td>' . $reviewDate . '</td>
            </tr>';
        }
        $html .= '</tbody></table>';
    }
    $html .= '</div>';

    // Saved Items Section
    $html .= '<div class="section">
        <h2 class="section-title">6. Saved Items (' . count($savedItems) . ')</h2>';
    if (empty($savedItems)) {
        $html .= '<div class="empty-state">No saved items</div>';
    } else {
        $html .= '<table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Saved Date</th>
                </tr>
            </thead>
            <tbody>';
        foreach ($savedItems as $item) {
            $itemTitle = escapeHtml($item['title'] ?? 'Unknown Item');
            $itemPrice = formatCurrency($item['price'] ?? 0);
            $savedDate = formatDate($item['created_at'] ?? '');
            $html .= '<tr>
                <td>' . $itemTitle . '</td>
                <td class="text-right">' . $itemPrice . '</td>
                <td>' . $savedDate . '</td>
            </tr>';
        }
        $html .= '</tbody></table>';
    }
    $html .= '</div>';

    // Login History Section
    $html .= '<div class="section">
        <h2 class="section-title">7. Login History (' . count($loginHistory) . ' recent logins)</h2>';
    if (empty($loginHistory)) {
        $html .= '<div class="empty-state">No login history available</div>';
    } else {
        $html .= '<table>
            <thead>
                <tr>
                    <th>Login Time</th>
                    <th>IP Address</th>
                    <th>Device/Browser</th>
                    <th>Duration</th>
                </tr>
            </thead>
            <tbody>';
        foreach ($loginHistory as $login) {
            $loginTime = formatDate($login['login_time'] ?? '');
            $ip = escapeHtml($login['ip_address'] ?? 'N/A');
            $userAgent = escapeHtml($login['user_agent'] ?? 'N/A');
            $duration = $login['session_duration'] ? (int)$login['session_duration'] . ' minutes' : 'N/A';
            $html .= '<tr>
                <td>' . $loginTime . '</td>
                <td>' . $ip . '</td>
                <td>' . (strlen($userAgent) > 40 ? substr($userAgent, 0, 40) . '...' : $userAgent) . '</td>
                <td>' . $duration . '</td>
            </tr>';
        }
        $html .= '</tbody></table>';
    }
    $html .= '</div>';

    // Activities Section
    $html .= '<div class="section">
        <h2 class="section-title">8. Account Activities (' . count($activities) . ' recent)</h2>';
    if (empty($activities)) {
        $html .= '<div class="empty-state">No activities recorded</div>';
    } else {
        $html .= '<table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Activity</th>
                    <th>Description</th>
                    <th>Points</th>
                </tr>
            </thead>
            <tbody>';
        foreach ($activities as $activity) {
            $actDate = formatDate($activity['created_at'] ?? '');
            $actType = escapeHtml($activity['activity_type'] ?? 'N/A');
            $actDesc = escapeHtml($activity['description'] ?? '');
            $actPoints = (int)($activity['points_awarded'] ?? 0);
            $html .= '<tr>
                <td>' . $actDate . '</td>
                <td>' . ucfirst($actType) . '</td>
                <td>' . $actDesc . '</td>
                <td class="text-right">' . ($actPoints > 0 ? '+' . $actPoints : '0') . '</td>
            </tr>';
        }
        $html .= '</tbody></table>';
    }
    $html .= '</div>';

    // Footer
    $html .= '<div class="footer">
        <p>This document contains all your account data from JBR7 Bags Manufacturing</p>
        <p>Generated on ' . $exportDate . ' | For account ID: #' . ($user['id'] ?? 'N/A') . '</p>
        <p style="margin-top: 10px; color: #999;">© ' . date('Y') . ' JBR7 Bags Manufacturing. All rights reserved.</p>
    </div>
    
    <script>
        // Auto-trigger print dialog for PDF generation
        (function() {
            // Wait for page to fully load
            if (document.readyState === "complete") {
                setTimeout(function() {
                    window.print();
                }, 500);
            } else {
                window.addEventListener("load", function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                });
            }
        })();
    </script>
</body>
</html>';

    return $html;
}
