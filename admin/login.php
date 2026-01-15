<?php
session_start();
require_once '../config/database.php';

$error = null;


$host = 'localhost';
$db = 'carillolawdb';
$user = 'root'; 
$pass = '';     

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}


if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'];
    $password = $_POST['password'];

    try {
        $db = Database::getInstance();
        
        // Prepare and execute the query
        $query = "SELECT * FROM admins WHERE username = ? AND password = ?";
        $stmt = $db->prepareAndExecute($query, "ss", [$username, $password]);
        
        if ($stmt) {
            $result = $stmt->get_result();
            
            if ($result->num_rows === 1) {
                $_SESSION['admin_logged_in'] = true;
                header("Location: admin-home.php");
                exit();
            } else {
                $_SESSION['error'] = "Invalid login credentials.";
                header("Location: login.php");
                exit();
            }
            
            $stmt->close();
        }
    } catch (Exception $e) {
        $_SESSION['error'] = "An error occurred. Please try again later.";
        error_log("Login Error: " . $e->getMessage());
    } finally {
        if (isset($db)) {
            $db->closeConnection();
        }
    }
}


if (isset($_SESSION['error'])) {
    $error = $_SESSION['error'];
    unset($_SESSION['error']);
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Login</title>
  <link rel="stylesheet" href="login-style.css" />
</head>

<body>
  <section>
    <div class="admin-box">
        <div class="admin-content">
            <h2>Administration Login</h2>
            <p>Use a valid username and password to gain access to the Administration Back-end</p>
            <a href="../index.php">Return to site Home Page</a>
        </div>

        <div class="login-box">
            <form action="login.php" method="post">
                <h2>Login</h2>
                <div class="input-box">
                    <span class="icon"><ion-icon name="mail"></ion-icon></span>
                    <input type="text" name="username" required>
                    <label>Username</label>
                </div>
                <div class="input-box">
                    <span class="icon"><ion-icon name="lock-closed"></ion-icon></span>
                    <input type="password" name="password" required>
                    <label>Password</label>
                </div>
                <!-- <div class="remember-forget">
                    <label><input type="checkbox">Remember Me</label>
                    <a href="#">Forget Password</a>
                </div> -->
                <button type="submit">Login</button>

          
                <?php if ($error): ?>
                    <p class="error-message" id="login-error"><?= $error ?></p>
                <?php endif; ?>
            </form>
        </div>
    </div>
  </section>

  <script type="module" src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"></script>
  <script nomodule src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"></script>

</body>
</html>
