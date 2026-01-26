<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
if (empty($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['success'=>false,'error'=>'Not authenticated']); exit; }

// Use centralized database connection
require_once __DIR__ . '/../config/database.php';

// $pdo is now available from config/database.php

try{
    $stmt = $pdo->prepare('DELETE FROM saved_items WHERE user_id = :uid');
    $stmt->execute([':uid' => $_SESSION['user_id']]);
    $deleted = $stmt->rowCount();
    echo json_encode(['success'=>true,'deleted'=>$deleted]);
    exit;
} catch(Exception $e){ http_response_code(500); echo json_encode(['success'=>false,'error'=>$e->getMessage()]); exit; }
