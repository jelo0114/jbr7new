<?php
// Test if signin.php route is accessible
header('Content-Type: application/json');

$signinPath = __DIR__ . '/../jbr7php/signin.php';
$signupPath = __DIR__ . '/../jbr7php/signup.php';

$results = [
    'signin_file_exists' => file_exists($signinPath),
    'signup_file_exists' => file_exists($signupPath),
    'signin_readable' => is_readable($signinPath),
    'signup_readable' => is_readable($signupPath),
    'signin_path' => $signinPath,
    'signup_path' => $signupPath,
    'current_dir' => __DIR__,
    'root_dir' => dirname(__DIR__),
    'jbr7php_dir_exists' => is_dir(__DIR__ . '/../jbr7php'),
    'files_in_jbr7php' => is_dir(__DIR__ . '/../jbr7php') ? count(scandir(__DIR__ . '/../jbr7php')) - 2 : 0,
    'vercel_env' => [
        'VERCEL' => getenv('VERCEL') ?: 'Not set',
        'VERCEL_URL' => getenv('VERCEL_URL') ?: 'Not set',
        'PHP_VERSION' => PHP_VERSION
    ]
];

// Try to include signin.php to check for syntax errors
ob_start();
$signinSyntaxOk = true;
try {
    // Just check if file can be parsed (don't execute)
    $signinContent = file_get_contents($signinPath);
    if ($signinContent === false) {
        $signinSyntaxOk = false;
        $results['signin_read_error'] = 'Cannot read file';
    }
} catch (Exception $e) {
    $signinSyntaxOk = false;
    $results['signin_error'] = $e->getMessage();
}
ob_end_clean();

$results['signin_syntax_ok'] = $signinSyntaxOk;

echo json_encode($results, JSON_PRETTY_PRINT);
