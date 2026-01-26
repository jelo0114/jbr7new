<?php
// Health check endpoint for Vercel
header('Content-Type: application/json');
http_response_code(200);
echo json_encode([
    'status' => 'ok',
    'php_version' => PHP_VERSION,
    'timestamp' => date('Y-m-d H:i:s'),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Vercel PHP'
]);
