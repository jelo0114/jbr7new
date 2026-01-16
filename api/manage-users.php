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

$method = $_SERVER["REQUEST_METHOD"];

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    if ($method === 'GET') {
        // Get all users
        $stmt = $conn->prepare("SELECT uid, username, email, first_name, last_name, contact_number FROM users");
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
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $action = $data['action'] ?? '';
        $user_id = $data['user_id'] ?? '';
        
        if ($action === 'edit') {
            $username = $data['username'] ?? '';
            $email = $data['email'] ?? '';
            $first_name = $data['first_name'] ?? '';
            $last_name = $data['last_name'] ?? '';
            $contact_number = $data['contact_number'] ?? '';
            
            if (!$user_id || !$username || !$email) {
                $response['message'] = 'Missing required fields';
                echo json_encode($response);
                exit();
            }
            
            $stmt = $conn->prepare("UPDATE users SET username = ?, email = ?, first_name = ?, last_name = ?, contact_number = ? WHERE uid = ?");
            $stmt->bind_param("sssssi", $username, $email, $first_name, $last_name, $contact_number, $user_id);
            
            if ($stmt->execute()) {
                $response['success'] = true;
                $response['message'] = 'User information updated successfully';
            } else {
                $response['message'] = 'Error updating user information: ' . $stmt->error;
            }
            $stmt->close();
        } 
        elseif ($action === 'delete') {
            if (!$user_id) {
                $response['message'] = 'User ID is required';
                echo json_encode($response);
                exit();
            }
            
            // Start transaction
            $conn->begin_transaction();
            
            try {
                // Delete from consultations table
                $stmt_consultations = $conn->prepare("DELETE FROM consultations WHERE uid = ?");
                $stmt_consultations->bind_param("i", $user_id);
                $stmt_consultations->execute();
                $stmt_consultations->close();
                
                // Delete from user_activities table
                $stmt_activities = $conn->prepare("DELETE FROM user_activities WHERE uid = ?");
                $stmt_activities->bind_param("i", $user_id);
                $stmt_activities->execute();
                $stmt_activities->close();
                
                // Finally delete the user
                $stmt_user = $conn->prepare("DELETE FROM users WHERE uid = ?");
                $stmt_user->bind_param("i", $user_id);
                $stmt_user->execute();
                $stmt_user->close();
                
                // Commit the transaction
                $conn->commit();
                
                $response['success'] = true;
                $response['message'] = 'User and all associated records successfully deleted';
            } catch (Exception $e) {
                // If any error occurs, rollback the transaction
                $conn->rollback();
                $response['message'] = 'Error deleting user: ' . $e->getMessage();
                error_log("Delete User Error: " . $e->getMessage());
            }
        }
    } 
    else {
        http_response_code(400);
        $response['message'] = 'Invalid request method';
    }
} catch (Exception $e) {
    http_response_code(500);
    $response['message'] = 'Database error: ' . $e->getMessage();
    error_log("Manage Users Error: " . $e->getMessage());
}

echo json_encode($response);
?>
