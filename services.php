<?php
session_start();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SERVICES</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>
<body>
    <div class="upperbar">
        <div class="topbar">
            <span>[📞 0973 727 8473]</span>
            <span><a href="mailto:pcvcarillolaw@gmail.com" class="email-link">[ <i class="fas fa-envelope"></i> pcvcarillolaw@gmail.com]</a></span>
        </div>
        <nav class="navbar">
            <div class="logo">
                <a href = "index.php"><img src="src/web_logo-removebg-preview.png" alt="Carillo Law Office"></a>
                <span><a href = "index.php" class = "webname">CARILLO LAW</a></span>
            </div>

            <ul class="nav-links">
                <li><a href="index.php">HOME</a></li>
                <li><a href="#">ABOUT</a></li>
                <li><a href="#">SERVICES</a></li>
                <li><a href="#">CONTACTS</a></li>
                <li><a href="#">TESTIMONIALS</a></li>
                <li><a href="#">APPOINTMENTS</a></li>
                <li><?php if (isset($_SESSION['client_logged_in']) && $_SESSION['client_logged_in']): ?>
                    <div class="user-dropdown">
                        <a href="profile.php" class="user-nav" style="color:#FFD700; font-weight:bold; display:flex; align-items:center; gap:6px; text-decoration:none; text-transform:none;">
                            <i class="fas fa-user-circle" style="font-size: 20px;"></i>
                            <?= htmlspecialchars($_SESSION['client_first_name']) ?>
                        </a>
                        <div class="user-dropdown-content">
                            <a href="account-settings.php" class="dropdown-btn"><i class="fas fa-cog"></i> Settings</a>
                            <a href="logout.php" class="dropdown-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
                        </div>
                    </div>
                <?php else: ?>
                    <a href="client-login.php" class="login-btn" style="color:#0f3f41;">Login</a>
                <?php endif; ?>
            </li>
            </ul>
        </nav>
    </div>

    <section class="services-hero">
        <div class ="services-hero-content">
            <div class="services-hero-text">
                <h1>OUR SERVICES</h1>
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem tempora, cumque</p>
            </div>
        </div>
    </section>

    <section class="services-offered">
        <div class="services-offered-content">
            
        </div>
    </section>
</body>
</html>
