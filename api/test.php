<?php
// Test endpoint to verify PHP is working on Vercel
header('Content-Type: application/json');

$response = [
    'success' => true,
    'message' => 'PHP is working on Vercel!',
    'php_version' => PHP_VERSION,
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'timestamp' => date('Y-m-d H:i:s'),
    'environment' => [
        'DB_HOST' => isset($_ENV['DB_HOST']) ? 'Set' : 'Not set',
        'DB_NAME' => isset($_ENV['DB_NAME']) ? 'Set' : 'Not set',
        'DB_USER' => isset($_ENV['DB_USER']) ? 'Set' : 'Not set',
        'DB_PASSWORD' => isset($_ENV['DB_PASSWORD']) ? 'Set (hidden)' : 'Not set'
    ]
];

echo json_encode($response, JSON_PRETTY_PRINT);
