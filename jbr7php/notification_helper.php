<?php
// notification_helper.php
// Include this file in your order processing and cart management scripts

require_once '/jbr7php/config_loader.php';

/**
 * Create a notification for a user
 * 
 * @param int $user_id The user ID
 * @param string $type Notification type: 'order_status' or 'cart_reminder'
 * @param string $title Notification title
 * @param string $message Notification message
 * @param int|null $related_id Related order ID or cart item ID
 * @return bool Success status
 */
function createNotification($user_id, $type, $title, $message, $related_id = null) {
    global $pdo;
    
    try {
        // Check if user has this notification type enabled
        $pref_stmt = $pdo->prepare("
            SELECT $type
            FROM notification_preferences
            WHERE user_id = ?
        ");
        $pref_stmt->execute([$user_id]);
        $preference = $pref_stmt->fetch(PDO::FETCH_ASSOC);
        
        // If preference not found or disabled, don't create notification
        if (!$preference || $preference[$type] != 1) {
            return false;
        }
        
        // Create the notification
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, notification_type, title, message, related_id)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$user_id, $type, $title, $message, $related_id]);
        
        return true;
        
    } catch (PDOException $e) {
        error_log("Error creating notification: " . $e->getMessage());
        return false;
    }
}

/**
 * Send order status notification
 * 
 * @param int $user_id User ID
 * @param int $order_id Order ID
 * @param string $status Order status (e.g., 'processing', 'shipped', 'delivered')
 */
function sendOrderStatusNotification($user_id, $order_id, $status) {
    $status_messages = [
        'pending' => [
            'title' => 'Order Received',
            'message' => "Your order #$order_id has been received and is being processed."
        ],
        'processing' => [
            'title' => 'Order Processing',
            'message' => "Your order #$order_id is now being prepared for shipment."
        ],
        'shipped' => [
            'title' => 'Order Shipped',
            'message' => "Great news! Your order #$order_id has been shipped and is on its way."
        ],
        'delivered' => [
            'title' => 'Order Delivered',
            'message' => "Your order #$order_id has been delivered. Enjoy your purchase!"
        ],
        'cancelled' => [
            'title' => 'Order Cancelled',
            'message' => "Your order #$order_id has been cancelled."
        ]
    ];
    
    if (isset($status_messages[$status])) {
        $notification = $status_messages[$status];
        createNotification(
            $user_id,
            'order_status',
            $notification['title'],
            $notification['message'],
            $order_id
        );
    }
}

/**
 * Send cart reminder notification
 * 
 * @param int $user_id User ID
 * @param int $item_count Number of items in cart
 */
function sendCartReminderNotification($user_id, $item_count) {
    $title = "Don't Forget Your Cart!";
    $message = "You have $item_count " . ($item_count == 1 ? 'item' : 'items') . " waiting in your cart. Complete your purchase today!";
    
    createNotification(
        $user_id,
        'cart_reminder',
        $title,
        $message,
        null
    );
}

/**
 * Get user notifications
 * 
 * @param int $user_id User ID
 * @param bool $unread_only Get only unread notifications
 * @param int $limit Limit number of notifications
 * @return array Notifications
 */
function getUserNotifications($user_id, $unread_only = false, $limit = 20) {
    global $pdo;
    
    try {
        $sql = "SELECT * FROM notifications WHERE user_id = ?";
        if ($unread_only) {
            $sql .= " AND is_read = 0";
        }
        $sql .= " ORDER BY created_at DESC LIMIT ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id, $limit]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
        
    } catch (PDOException $e) {
        error_log("Error getting notifications: " . $e->getMessage());
        return [];
    }
}

/**
 * Mark notification as read
 * 
 * @param int $notification_id Notification ID
 * @param int $user_id User ID (for security)
 * @return bool Success status
 */
function markNotificationAsRead($notification_id, $user_id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            UPDATE notifications
            SET is_read = 1
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$notification_id, $user_id]);
        
        return true;
        
    } catch (PDOException $e) {
        error_log("Error marking notification as read: " . $e->getMessage());
        return false;
    }
}
?>