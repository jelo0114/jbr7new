<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
if (empty($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['success'=>false,'error'=>'Not authenticated']); exit; }

// Use centralized database connection
require_once __DIR__ . '/../config/database.php';

// $pdo is now available from config/database.php

try{
    $stmt = $pdo->prepare('SELECT id, title, price, metadata, created_at FROM saved_items WHERE user_id = :uid ORDER BY created_at DESC');
    $stmt->execute([':uid' => $_SESSION['user_id']]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // decode metadata
    foreach ($rows as &$r) {
        $r['metadata'] = $r['metadata'] ? json_decode($r['metadata'], true) : null;
    }
    echo json_encode(['success'=>true,'items'=>$rows]);
    exit;
} catch(Exception $e){ http_response_code(500); echo json_encode(['success'=>false,'error'=>$e->getMessage()]); exit; }
