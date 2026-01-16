<?php
require_once '../config/database.php';
session_start();
header('Content-Type: application/json');

$response = ['success' => false, 'message' => ''];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $login_id = trim($data['login_id'] ?? '');
        $password = $data['login_password'] ?? '';
        
        if (!$login_id || !$password) {
            $response['message'] = "Please enter your username/email and password.";
            error_log("Login failed - Empty credentials");
            echo json_encode($response);
            exit();
        }
        
        $db = Database::getInstance();
        $conn = $db->getConnection();
        
        $query = "SELECT uid, username, email, first_name, last_name, contact_number, password FROM users WHERE username = ? OR email = ? LIMIT 1";
        $stmt = $db->prepareAndExecute($query, "ss", [$login_id, $login_id]);
        
        if ($stmt) {
            $result = $stmt->get_result();
            
            if ($result && $result->num_rows === 1) {
                $user = $result->fetch_assoc();
                if (password_verify($password, $user['password'])) {
                    session_unset();
                    session_destroy();
                    session_start();
                    
                    $_SESSION['client_logged_in'] = true;
                    $_SESSION['client_id'] = $user['uid'];
                    $_SESSION['client_username'] = $user['username'];
                    $_SESSION['client_email'] = $user['email'];
                    $_SESSION['client_first_name'] = $user['first_name'];
                    $_SESSION['client_last_name'] = $user['last_name'];
                    $_SESSION['client_contact_number'] = $user['contact_number'];
                    
                    // Log activity
                    $activity_type = 'login';
                    $activity_description = 'User logged in successfully';
                    $ip_address = $_SERVER['REMOTE_ADDR'];
                    $user_agent = $_SERVER['HTTP_USER_AGENT'];
                    
                    $log_query = "INSERT INTO user_activities (uid, activity_type, activity_description, ip_address, user_agent) 
                                VALUES (?, ?, ?, ?, ?)";
                    $log_stmt = $db->prepareAndExecute($log_query, "issss", [
                        $user['uid'],
                        $activity_type,
                        $activity_description,
                        $ip_address,
                        $user_agent
                    ]);
                    
                    $response['success'] = true;
                    $response['message'] = 'Login successful';
                    $response['redirect'] = 'index.html';
                } else {
                    $response['message'] = "Invalid credentials.";
                    error_log("Login failed - Invalid password for user: $login_id");
                }
            } else {
                $response['message'] = "Invalid credentials.";
                error_log("Login failed - User not found: $login_id");
            }
            $stmt->close();
        } else {
            $response['message'] = "Database error. Please try again later.";
            error_log("Login failed - Database query error");
        }
    } catch (Exception $e) {
        $response['message'] = "Error: " . $e->getMessage();
        error_log("Login Exception: " . $e->getMessage());
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
