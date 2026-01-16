<?php
session_start();
header('Content-Type: application/json');

$response = ['success' => false, 'message' => ''];

try {
    $_SESSION = [];
    if (session_id() != '') {
        setcookie(session_name(), '', time() - 2592000, '/');
    }
    session_destroy();
    
    $response['success'] = true;
    $response['message'] = 'Logged out successfully';
    $response['redirect'] = 'index.html';
} catch (Exception $e) {
    $response['message'] = 'Error during logout: ' . $e->getMessage();
    error_log("Logout Error: " . $e->getMessage());
}

echo json_encode($response);
?>
