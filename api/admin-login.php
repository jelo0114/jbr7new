<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

$response = ['success' => false, 'message' => ''];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';
        
        if (!$username || !$password) {
            $response['message'] = 'Username and password are required.';
            echo json_encode($response);
            exit();
        }
        
        $db = Database::getInstance();
        
        // Prepare and execute the query
        $query = "SELECT admin_id, username, password FROM admins WHERE username = ?";
        $stmt = $db->prepareAndExecute($query, "s", [$username]);
        
        if ($stmt) {
            $result = $stmt->get_result();
            
            if ($result->num_rows === 1) {
                $admin = $result->fetch_assoc();
                // Note: Passwords appear to be stored in plain text. Consider hashing in future.
                if ($password === $admin['password']) {
                    $_SESSION['admin_logged_in'] = true;
                    $_SESSION['admin_id'] = $admin['admin_id'];
                    $response['success'] = true;
                    $response['message'] = 'Admin login successful';
                    $response['redirect'] = 'admin-home.html';
                } else {
                    $response['message'] = "Invalid password.";
                }
            } else {
                $response['message'] = "Invalid username.";
            }
            
            $stmt->close();
        } else {
            $response['message'] = 'Database error. Please try again later.';
        }
    } catch (Exception $e) {
        $response['message'] = "An error occurred. Please try again later.";
        error_log("Admin Login Error: " . $e->getMessage());
    } finally {
        if (isset($db)) {
            $db->closeConnection();
        }
    }
} else {
    $response['message'] = 'Invalid request method';
}

echo json_encode($response);
?>
