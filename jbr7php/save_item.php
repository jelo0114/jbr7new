<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
if (empty($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['success'=>false,'error'=>'Not authenticated']); exit; }

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];
$title = trim($data['title'] ?? '');
$image = $data['image'] ?? '';
$price = $data['price'] ?? null;

if ($title === '') { http_response_code(400); echo json_encode(['success'=>false,'error'=>'Missing title']); exit; }

$DB_HOST = '127.0.0.1'; $DB_NAME='jbr7_db'; $DB_USER='root'; $DB_PASS='';
try{
    $pdo = new PDO("mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4", $DB_USER, $DB_PASS, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    // upsert: avoid duplicates by title per user
    $stmt = $pdo->prepare('SELECT id FROM saved_items WHERE user_id = :uid AND title = :title LIMIT 1');
    $stmt->execute([':uid'=>$_SESSION['user_id'], ':title'=>$title]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $meta = json_encode(['image'=>$image]);
    if ($row) {
        $stmt = $pdo->prepare('UPDATE saved_items SET price = :price, metadata = :meta, updated_at = NOW() WHERE id = :id');
        $stmt->execute([':price'=>$price, ':meta'=>$meta, ':id'=>$row['id']]);
    } else {
        $stmt = $pdo->prepare('INSERT INTO saved_items (user_id, title, price, metadata, created_at) VALUES (:uid, :title, :price, :meta, NOW())');
        $stmt->execute([':uid'=>$_SESSION['user_id'], ':title'=>$title, ':price'=>$price, ':meta'=>$meta]);
    }
    echo json_encode(['success'=>true]);
    exit;
} catch(Exception $e){ http_response_code(500); echo json_encode(['success'=>false,'error'=>$e->getMessage()]); exit; }
