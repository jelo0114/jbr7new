<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

$response = ['success' => false, 'data' => [], 'error' => ''];

// Check if user is logged in as admin
if (!isset($_SESSION['admin_logged_in'])) {
    http_response_code(401);
    $response['error'] = 'Unauthorized access';
    echo json_encode($response);
    exit();
}

// Check if date parameter is present
if (!isset($_GET['date'])) {
    http_response_code(400);
    $response['error'] = 'Date parameter is required';
    echo json_encode($response);
    exit();
}

$date = $_GET['date'];

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    // Get appointments for the specified date - only future dates
    $stmt = $conn->prepare("SELECT consultation_id, preferred_date, full_name 
                           FROM consultations 
                           WHERE DATE(preferred_date) = ? 
                           AND status = 'pending'
                           AND preferred_date >= CURDATE()");
    $stmt->bind_param("s", $date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $appointments = [];
    while ($row = $result->fetch_assoc()) {
        $datetime = new DateTime($row['preferred_date']);
        $appointments[] = [
            'id' => $row['consultation_id'],
            'name' => $row['full_name'],
            'time' => $datetime->format('H:i')
        ];
    }
    
    $response['success'] = true;
    $response['data'] = $appointments;
} catch (Exception $e) {
    http_response_code(500);
    $response['error'] = 'Database error: ' . $e->getMessage();
    error_log("Get Appointments Error: " . $e->getMessage());
}

echo json_encode($response);
?>
