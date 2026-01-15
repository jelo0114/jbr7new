<?php
session_start();

// Store the session name
$session_name = session_name();

// Unset all session variables
$_SESSION = array();

// If it's desired to kill the session, also delete the session cookie.
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie($session_name, '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destroy the session
session_destroy();

// Double check that session is destroyed
if (session_status() === PHP_SESSION_ACTIVE) {
    session_destroy();
}

// Clear any remaining session variables
$_SESSION = array();

// Redirect back to index.php
header("Location: index.php");
exit();
?>