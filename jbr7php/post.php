<?php
declare(strict_types=1);
// post.php - Router for admin POST actions (e.g. update product).
// Point admin panel API_BASE to this folder and POST here so updates persist to SQL.

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit;
}

$action = $input['action'] ?? '';
if ($action === 'admin-update-product') {
    $GLOBALS['_admin_update_item_input'] = $input;
    require_once __DIR__ . '/admin_update_item.php';
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Invalid action: ' . $action]);
