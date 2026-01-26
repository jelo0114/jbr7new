<?php
// Test signin endpoint accessibility
header('Content-Type: application/json');

$signinPath = __DIR__ . '/../jbr7php/signin.php';
$signupPath = __DIR__ . '/../jbr7php/signup.php';

echo json_encode([
    'signin_file_exists' => file_exists($signinPath),
    'signup_file_exists' => file_exists($signupPath),
    'signin_path' => $signinPath,
    'signup_path' => $signupPath,
    'current_dir' => __DIR__,
    'root_dir' => dirname(__DIR__),
    'files_in_jbr7php' => file_exists(__DIR__ . '/../jbr7php') ? count(scandir(__DIR__ . '/../jbr7php')) : 0
], JSON_PRETTY_PRINT);
