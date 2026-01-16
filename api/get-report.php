<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

$response = ['success' => false, 'message' => '', 'data' => []];

// Check if admin is logged in
if (!isset($_SESSION['admin_logged_in'])) {
    http_response_code(401);
    $response['message'] = 'Unauthorized access';
    echo json_encode($response);
    exit();
}

// Get query parameters
$report_type = $_GET['type'] ?? 'consultations';
$start_date = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
$end_date = $_GET['end_date'] ?? date('Y-m-d');

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    if ($report_type === 'consultations') {
        // Get consultations report
        $stmt = $conn->prepare("SELECT consultation_id, full_name, email, phone, legal_issue, status, preferred_date 
                               FROM consultations 
                               WHERE DATE(created_at) BETWEEN ? AND ? 
                               ORDER BY created_at DESC");
        $stmt->bind_param("ss", $start_date, $end_date);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $consultations = [];
        while ($row = $result->fetch_assoc()) {
            $consultations[] = $row;
        }
        
        $response['success'] = true;
        $response['data'] = $consultations;
        $stmt->close();
    } 
    elseif ($report_type === 'activities') {
        // Get user activities report
        $stmt = $conn->prepare("SELECT u.username, ua.activity_type, ua.activity_description, ua.ip_address, ua.created_at 
                               FROM user_activities ua 
                               JOIN users u ON ua.uid = u.uid 
                               WHERE DATE(ua.created_at) BETWEEN ? AND ? 
                               ORDER BY ua.created_at DESC");
        $stmt->bind_param("ss", $start_date, $end_date);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $activities = [];
        while ($row = $result->fetch_assoc()) {
            $activities[] = $row;
        }
        
        $response['success'] = true;
        $response['data'] = $activities;
        $stmt->close();
    } 
    elseif ($report_type === 'users') {
        // Get users report
        $stmt = $conn->prepare("SELECT uid, username, email, first_name, last_name, contact_number, created_at 
                               FROM users 
                               WHERE DATE(created_at) BETWEEN ? AND ? 
                               ORDER BY created_at DESC");
        $stmt->bind_param("ss", $start_date, $end_date);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        
        $response['success'] = true;
        $response['data'] = $users;
        $stmt->close();
    } 
    else {
        http_response_code(400);
        $response['message'] = 'Invalid report type';
    }
} catch (Exception $e) {
    http_response_code(500);
    $response['message'] = 'Database error: ' . $e->getMessage();
    error_log("Generate Report Error: " . $e->getMessage());
}

echo json_encode($response);
?>
