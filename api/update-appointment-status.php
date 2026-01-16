<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

$response = ['success' => false, 'message' => ''];

if (!isset($_SESSION['admin_logged_in'])) {
    http_response_code(401);
    $response['message'] = 'Unauthorized access';
    echo json_encode($response);
    exit();
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(400);
    $response['message'] = 'Invalid request method';
    echo json_encode($response);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['consultation_id']) || !isset($data['status'])) {
    http_response_code(400);
    $response['message'] = 'Missing required parameters';
    echo json_encode($response);
    exit();
}

$consultation_id = $data['consultation_id'];
$status = $data['status'];

// Validate status
$allowed_statuses = ['pending', 'approved', 'completed', 'rejected', 'cancelled'];
if (!in_array($status, $allowed_statuses)) {
    http_response_code(400);
    $response['message'] = 'Invalid status';
    echo json_encode($response);
    exit();
}

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    $stmt = $conn->prepare("UPDATE consultations SET status = ? WHERE consultation_id = ?");
    $stmt->bind_param("si", $status, $consultation_id);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Status updated successfully';
    } else {
        $response['message'] = 'Failed to update status';
    }
    $stmt->close();
} catch (Exception $e) {
    http_response_code(500);
    $response['message'] = 'Database error: ' . $e->getMessage();
    error_log("Update Appointment Error: " . $e->getMessage());
}

echo json_encode($response);
?>
