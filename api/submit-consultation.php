<?php
session_start();
date_default_timezone_set('Asia/Manila');
require_once '../config/database.php';
header('Content-Type: application/json');

$response = ['success' => false, 'message' => ''];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $full_name = $data['full_name'] ?? '';
        $email = $data['email'] ?? '';
        $phone = $data['phone'] ?? '';
        $legal_issue = $data['legal_issue'] ?? '';
        $preferred_date = $data['preferred_date'] ?? '';
        $message = $data['message'] ?? '';
        
        if (!$full_name || !$email || !$phone || !$legal_issue || !$preferred_date) {
            $response['message'] = 'All required fields must be filled.';
            echo json_encode($response);
            exit();
        }
        
        // Convert preferred_date to correct format
        $preferred_date = str_replace('T', ' ', $preferred_date) . ':00';
        $selected_dt = new DateTime($preferred_date, new DateTimeZone('Asia/Manila'));
        
        // Calculate 2-hour window
        $start_time = (clone $selected_dt)->modify('-2 hours')->format('Y-m-d H:i:s');
        $end_time = (clone $selected_dt)->modify('+4 hours')->format('Y-m-d H:i:s');
        
        $db = Database::getInstance();
        $conn = $db->getConnection();
        
        // Check for conflicts
        $conflict_sql = "SELECT COUNT(*) as conflict_count, 
                        GROUP_CONCAT(CONCAT(full_name, ' at ', TIME_FORMAT(preferred_date, '%h:%i %p')) SEPARATOR '; ') as conflicting_appointments
                        FROM consultations 
                        WHERE preferred_date BETWEEN ? AND ? 
                        AND status IN ('pending', 'completed')";
        
        $conflict_stmt = $conn->prepare($conflict_sql);
        $conflict_stmt->bind_param("ss", $start_time, $end_time);
        $conflict_stmt->execute();
        $conflict_result = $conflict_stmt->get_result();
        $conflict_row = $conflict_result->fetch_assoc();
        
        if ($conflict_row['conflict_count'] > 0) {
            $response['message'] = "The selected time overlaps with another consultation. Conflicting appointments: " . $conflict_row['conflicting_appointments'];
            echo json_encode($response);
            exit();
        }
        
        // Get user ID if logged in
        $uid = isset($_SESSION['client_logged_in']) && isset($_SESSION['client_id']) ? $_SESSION['client_id'] : NULL;
        
        // Insert consultation
        $sql = "INSERT INTO consultations (uid, full_name, email, phone, legal_issue, preferred_date, message) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("issssss", $uid, $full_name, $email, $phone, $legal_issue, $preferred_date, $message);
        
        if ($stmt->execute()) {
            $response['success'] = true;
            $response['message'] = "Your consultation request has been submitted successfully. We will contact you shortly.";
        } else {
            throw new Exception("Error executing statement: " . $stmt->error);
        }
        
        $stmt->close();
    } catch (Exception $e) {
        $response['message'] = "Error submitting consultation: " . $e->getMessage();
        error_log("Consultation Error: " . $e->getMessage());
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
