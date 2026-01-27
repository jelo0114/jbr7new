<?php
// config.php - Database Configuration
// Place this file in /jbr7php/config.php

// ==========================================
// DATABASE CREDENTIALS - CHANGE THESE!
// ==========================================
$host = '127.0.0.1';           // Usually 'localhost'
$dbname = 'jbr7_db'; // CHANGE THIS to your actual database name
$username = 'root';     // CHANGE THIS to your database username  
$password = ''; // CHANGE THIS to your database password

// ==========================================
// CREATE PDO CONNECTION
// ==========================================
try {
    // Create the PDO connection
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        )
    );
    
    // Log success (optional - remove in production)
    error_log("Database connection successful");
    
} catch (PDOException $e) {
    // Log the error
    error_log("Database Connection Error: " . $e->getMessage());
    
    // Die with a generic message (don't expose details to users)
    die("Database connection failed. Please contact support.");
}

// ==========================================
// VERIFY CONNECTION WORKED
// ==========================================
// This ensures $pdo is set
if (!isset($pdo)) {
    error_log("ERROR: PDO was not created!");
    die("Database connection failed.");
}
?>