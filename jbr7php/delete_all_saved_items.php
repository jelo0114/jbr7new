<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
if (empty($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['success'=>false,'error'=>'Not authenticated']); exit; }

$DB_HOST = '127.0.0.1'; $DB_NAME='jbr7_db'; $DB_USER='root'; $DB_PASS='';
try{
    $pdo = new PDO("mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4", $DB_USER, $DB_PASS, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $stmt = $pdo->prepare('DELETE FROM saved_items WHERE user_id = :uid');
    $stmt->execute([':uid' => $_SESSION['user_id']]);
    $deleted = $stmt->rowCount();
    echo json_encode(['success'=>true,'deleted'=>$deleted]);
    exit;
} catch(Exception $e){ http_response_code(500); echo json_encode(['success'=>false,'error'=>$e->getMessage()]); exit; }
