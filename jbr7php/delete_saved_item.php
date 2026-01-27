<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
if (empty($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['success'=>false,'error'=>'Not authenticated']); exit; }

// Accept JSON body or form-encoded 'title' for broader compatibility
$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];
$title = '';
if (!empty($data['title'])) {
    $title = trim($data['title']);
} elseif (!empty($_POST['title'])) {
    $title = trim($_POST['title']);
} else {
    // as last resort, try parsing raw input like a querystring
    parse_str($raw, $parsed);
    if (!empty($parsed['title'])) $title = trim($parsed['title']);
}
if ($title === '') { http_response_code(400); echo json_encode(['success'=>false,'error'=>'Missing title']); exit; }

$DB_HOST = '127.0.0.1'; $DB_NAME='jbr7_db'; $DB_USER='root'; $DB_PASS='';
try{
    $pdo = new PDO("mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4", $DB_USER, $DB_PASS, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $stmt = $pdo->prepare('DELETE FROM saved_items WHERE user_id = :uid AND title = :title');
    $stmt->execute([':uid'=>$_SESSION['user_id'], ':title'=>$title]);
    echo json_encode(['success'=>true]);
    exit;
} catch(Exception $e){ http_response_code(500); echo json_encode(['success'=>false,'error'=>$e->getMessage()]); exit; }
