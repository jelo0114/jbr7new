<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

$response = ['success' => false, 'data' => [], 'message' => ''];

if (!isset($_SESSION['client_logged_in'])) {
    http_response_code(401);
    $response['message'] = 'Unauthorized access';
    echo json_encode($response);
    exit();
}

$user_id = $_SESSION['client_id'] ?? '';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    // Get user profile
    $stmt = $conn->prepare("SELECT uid, username, email, first_name, last_name, contact_number, created_at FROM users WHERE uid = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $response['success'] = true;
        $response['data'] = $result->fetch_assoc();
    } else {
        $response['message'] = 'User not found';
    }
    
    $stmt->close();
} catch (Exception $e) {
    http_response_code(500);
    $response['message'] = 'Database error: ' . $e->getMessage();
    error_log("Get User Profile Error: " . $e->getMessage());
}

echo json_encode($response);
?>
