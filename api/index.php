<?php
// API index.php - Entry point for Vercel PHP
// This file helps Vercel understand PHP routing

header('Content-Type: application/json');
echo json_encode([
    'status' => 'ok',
    'message' => 'PHP API is working',
    'php_version' => PHP_VERSION,
    'timestamp' => date('Y-m-d H:i:s')
]);
