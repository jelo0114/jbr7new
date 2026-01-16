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
    
    // Get user's consultations
    $stmt = $conn->prepare("SELECT consultation_id, full_name, email, phone, legal_issue, status, preferred_date, message, created_at 
                           FROM consultations 
                           WHERE uid = ? 
                           ORDER BY created_at DESC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $consultations = [];
    while ($row = $result->fetch_assoc()) {
        $consultations[] = $row;
    }
    
    $response['success'] = true;
    $response['data'] = $consultations;
    $stmt->close();
} catch (Exception $e) {
    http_response_code(500);
    $response['message'] = 'Database error: ' . $e->getMessage();
    error_log("Get User Consultations Error: " . $e->getMessage());
}

echo json_encode($response);
?>
