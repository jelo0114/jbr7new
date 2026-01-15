<?php
session_start();
require_once 'config/database.php';

// Check if the form was submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    try {
        // Get form data
        $full_name = $_POST['full_name'];
        $email = $_POST['email'];
        $phone = $_POST['phone'];
        $legal_issue = $_POST['legal_issue'];
        $preferred_date = $_POST['preferred_date'];  // This is in the format "YYYY-MM-DDTHH:MM"
        $message = $_POST['message'];

        // Convert preferred_date to the correct format for DATETIME ("YYYY-MM-DD HH:MM:SS")
        $preferred_date = str_replace('T', ' ', $preferred_date) . ':00';
        $selected_dt = new DateTime($preferred_date);

        // Calculate 2-hour window
        $start_time = $selected_dt->modify('-2 hours')->format('Y-m-d H:i:s');
        $end_time = $selected_dt->modify('+4 hours')->format('Y-m-d H:i:s'); // 2 hours back + 2 forward = 4

        // Check for conflicts
        $conflict_sql = "SELECT COUNT(*) as conflict_count 
                        FROM consultations 
                        WHERE preferred_date BETWEEN ? AND ?";

        $db = Database::getInstance();
        $conn = $db->getConnection();

        $conflict_stmt = $conn->prepare($conflict_sql);
        $conflict_stmt->bind_param("ss", $start_time, $end_time);
        $conflict_stmt->execute();
        $conflict_result = $conflict_stmt->get_result();
        $conflict_row = $conflict_result->fetch_assoc();

        if ($conflict_row['conflict_count'] > 0) {
            $_SESSION['error_message'] = "The selected time overlaps with another consultation. Please choose a different time.";
            header("Location: consultation.php");
            exit();
        }

        // Get user ID if logged in, otherwise set to NULL
        $uid = isset($_SESSION['client_logged_in']) && isset($_SESSION['client_id']) ? $_SESSION['client_id'] : NULL;

        // Get database instance
        $db = Database::getInstance();
        $conn = $db->getConnection();

        // Prepare SQL statement
        $sql = "INSERT INTO consultations (uid, full_name, email, phone, legal_issue, preferred_date, message) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);

        // Bind parameters: "i" for integer (uid), "s" for strings (full_name, email, phone, legal_issue, preferred_date, message)
        $stmt->bind_param("issssss", $uid, $full_name, $email, $phone, $legal_issue, $preferred_date, $message);
        
        // Execute the statement
        if ($stmt->execute()) {
            // Success - redirect with success message
            $_SESSION['success_message'] = "Your consultation request has been submitted successfully. We will contact you shortly.";
            header("Location: consultation.php");
            exit();
        } else {
            throw new Exception("Error executing statement: " . $stmt->error);
        }
    } catch (Exception $e) {
        // Error - redirect with error message
        $_SESSION['error_message'] = "Sorry, there was an error submitting your consultation request. Please try again later.";
        header("Location: consultation.php");
        exit();
    } finally {
        // Close the database connection
        if (isset($db)) {
            $db->closeConnection();
        }
    }
} else {
    // If someone tries to access this file directly without POST data
    header("Location: consultation.php");
    exit();
}
?>