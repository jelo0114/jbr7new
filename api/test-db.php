<?php
// Test database connection on Vercel
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../config/database.php';
    
    $stmt = $pdo->query('SELECT NOW() as current_time, version() as pg_version');
    $result = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'Database connected successfully!',
        'database_time' => $result['current_time'],
        'postgres_version' => substr($result['pg_version'], 0, 50) . '...',
        'environment' => [
            'DB_HOST' => isset($_ENV['DB_HOST']) ? substr($_ENV['DB_HOST'], 0, 20) . '...' : 'Not set',
            'DB_NAME' => $_ENV['DB_NAME'] ?? 'Not set',
            'DB_USER' => $_ENV['DB_USER'] ?? 'Not set',
            'VERCEL' => getenv('VERCEL') ? 'Yes' : 'No'
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'environment' => [
            'DB_HOST' => isset($_ENV['DB_HOST']) ? 'Set' : 'Not set',
            'DB_NAME' => isset($_ENV['DB_NAME']) ? 'Set' : 'Not set',
            'DB_USER' => isset($_ENV['DB_USER']) ? 'Set' : 'Not set',
            'DB_PASSWORD' => isset($_ENV['DB_PASSWORD']) ? 'Set (hidden)' : 'Not set',
            'VERCEL' => getenv('VERCEL') ? 'Yes' : 'No'
        ]
    ], JSON_PRETTY_PRINT);
}
