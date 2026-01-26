<?php
// config/database.php
// PostgreSQL Database Connection for Supabase
// Works with both local development and Vercel deployment

// Get environment variables (Vercel) or use defaults (local)
$DB_HOST = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost';
$DB_PORT = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '5432';
$DB_NAME = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'jbr7_db';
$DB_USER = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'postgres';
$DB_PASS = $_ENV['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: '';

// Connection string for PostgreSQL
$dsn = "pgsql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME}";

// Global PDO connection
$pdo = null;

try {
    $pdo = new PDO(
        $dsn,
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false, // Important for PostgreSQL
        ]
    );
} catch (PDOException $e) {
    error_log('Database connection error: ' . $e->getMessage());
    
    // Don't expose connection details in production
    if (getenv('VERCEL') === '1') {
        http_response_code(500);
        die(json_encode(['success' => false, 'error' => 'Database connection failed']));
    } else {
        // Show detailed error in development
        die('Database connection failed: ' . $e->getMessage());
    }
}

// Helper function to get PDO instance
function getDB() {
    global $pdo;
    return $pdo;
}

?>
