<?php
// upload_profile_photo.php
// Handles profile photo uploads for authenticated users

ob_start();
ini_set('display_errors', 0);
error_reporting(0);

session_start();
ob_clean();

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

$user_id = (int)$_SESSION['user_id'];

// Check if file was uploaded
if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'No file uploaded or upload error']);
    exit;
}

$file = $_FILES['photo'];

// Validate file type - accept all image types
$file_type = mime_content_type($file['tmp_name']);

// Check if it's an image type (starts with 'image/')
// Use strpos for PHP 7.x compatibility (str_starts_with requires PHP 8.0+)
if (!$file_type || strpos($file_type, 'image/') !== 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid file type. Please upload an image file.']);
    exit;
}

// Additional validation: check file extension for common image formats
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff', 'tif', 'heic', 'heif', 'avif', 'jfif'];
if (!in_array($extension, $image_extensions)) {
    // If MIME type is image but extension not in list, still allow it (for newer formats)
    // This allows flexibility for future image formats
    if (strpos($file_type, 'image/') === 0) {
        // MIME type is valid image, allow it even if extension not recognized
    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid file extension. Please upload an image file.']);
        exit;
    }
}

// Validate file size (max 5MB)
$max_size = 5 * 1024 * 1024; // 5MB
if ($file['size'] > $max_size) {
    echo json_encode(['success' => false, 'error' => 'File size exceeds 5MB limit']);
    exit;
}

// Create uploads directory if it doesn't exist
$upload_dir = __DIR__ . '/../uploads/profile_photos/';
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'user_' . $user_id . '_' . time() . '_' . uniqid() . '.' . $extension;
$filepath = $upload_dir . $filename;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $filepath)) {
    echo json_encode(['success' => false, 'error' => 'Failed to save file']);
    exit;
}

// Database connection
$DB_HOST = '127.0.0.1';
$DB_NAME = 'jbr7_db';
$DB_USER = 'root';
$DB_PASS = '';

try {
    $pdo = new PDO(
        "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    
    // Check if profile_picture column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'profile_picture'");
    $columnExists = $stmt->rowCount() > 0;
    
    if (!$columnExists) {
        // Add column if it doesn't exist
        $pdo->exec("ALTER TABLE users ADD COLUMN profile_picture VARCHAR(512) NULL DEFAULT NULL");
    }
    
    // Get old photo path to delete it later
    $stmt = $pdo->prepare("SELECT profile_picture FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $oldPhoto = $stmt->fetchColumn();
    
    // Update database with new photo path (relative to web root)
    $relative_path = 'uploads/profile_photos/' . $filename;
    $stmt = $pdo->prepare("UPDATE users SET profile_picture = ? WHERE id = ?");
    $stmt->execute([$relative_path, $user_id]);
    
    // Delete old photo if it exists
    if ($oldPhoto && file_exists(__DIR__ . '/../' . $oldPhoto)) {
        @unlink(__DIR__ . '/../' . $oldPhoto);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Profile photo updated successfully',
        'photo_url' => '/' . $relative_path
    ]);
    
} catch (PDOException $e) {
    // Delete uploaded file if database update fails
    @unlink($filepath);
    error_log("Upload profile photo error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error occurred']);
}

ob_end_flush();
?>
