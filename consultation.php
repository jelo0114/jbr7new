<?php
session_start();

require_once 'config/database.php';

$full_name = $email = $phone = "";

// Get DB connection
$db = Database::getInstance();
$conn = $db->getConnection();

if (isset($_SESSION['client_logged_in']) && $_SESSION['client_logged_in']) {
    $uid = $_SESSION['client_id'];

    $stmt = $conn->prepare("SELECT first_name, last_name, email, contact_number FROM users WHERE uid = ?");
    $stmt->bind_param("i", $uid);
    $stmt->execute();
    $stmt->bind_result($first_name, $last_name, $email, $contact_number);

    if ($stmt->fetch()) {
        $full_name = $first_name . " " . $last_name;
        $phone = $contact_number;
    }

    $stmt->close();
}
?>


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consultations</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        .alert {
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            text-align: center;
        }
        .alert-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .alert-error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
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
                <li><a href="services.php">SERVICES</a></li>
                <li><a href="#">CONTACTS</a></li>
                <li><a href="#">TESTIMONIALS</a></li>
                <li><a href="#">APPOINTMENTS</a></li>
                <li>
                <?php if (isset($_SESSION['client_logged_in']) && $_SESSION['client_logged_in']): ?>
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

<!-- HERO BANNER -->
<section class="consul-hero">
    <div class="consul-hero-content">
        <div class="consul-hero-text">
            <h1>Legal Solutions with Integrity & Expertise</h1>
            <p>Professional legal and notarial services, committed to protecting your rights.</p>
            <p2>JUSTICE • EQUALITY • TRUTH</p2>
        </div>
    </div>
</section>


<!-- Consultation Booking Section -->
<div class="consultation-container">
    <h1>Book a Legal Consultation</h1>
    <p class="subtext">Fill out the form below and our legal team will contact you to confirm your appointment.</p>

    <?php if (isset($_SESSION['success_message'])): ?>
        <div class="alert alert-success">
            <?php 
            echo $_SESSION['success_message'];
            unset($_SESSION['success_message']);
            ?>
        </div>
    <?php endif; ?>

    <?php if (isset($_SESSION['error_message'])): ?>
        <div class="alert alert-error">
            <?php 
            echo $_SESSION['error_message'];
            unset($_SESSION['error_message']);
            ?>
        </div>
    <?php endif; ?>

    <form action="submit-consultation.php" method="POST" class="consultation-form">
        <label for="full_name">Full Name</label>
        <input type="text" id="full_name" name="full_name" required value="<?= htmlspecialchars($full_name) ?>">

        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" required value="<?= htmlspecialchars($email) ?>">

        <label for="phone">Phone Number</label>
        <input type="tel" id="phone" name="phone" required value="<?= htmlspecialchars($phone) ?>">

        <label for="legal_issue">Type of Legal Concern</label>
        <select id="legal_issue" name="legal_issue" required>s
            <option value="">-- Please Select --</option>
            <option value="Family Law">Family Law</option>s
            <option value="Criminal Law">Criminal Law</option>
            <option value="Property Law">Property Law</option>
            <option value="Contracts">Contracts</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Labor and Employment">Labor and Employment</option>
            <option value="Business or Corporate">Business or Corporate</option>
            <option value="Estate and Inheritance">Estate and Inheritance</option>
            <option value="Civil Litigation">Court Representation(Civil, Criminal, Administrative)</option>
            <option value="Notarial Services">Notarial Services</option>
        </select>

        <label for="preferred_date">Preferred Date</label>
        <input type="datetime-local" name="preferred_date" id="preferred_date" min="<?php echo date('Y-m-d\TH:i'); ?>" required>


        <label for="message">Brief Description</label>
        <textarea id="message" name="message" rows="4" placeholder="Tell us a bit about your legal concern..." required></textarea>

        <button type="submit" class="submit-btn">Submit Consultation Request</button>
    </form>

    <p class="confidential-note">All information submitted is kept strictly confidential and used only for appointment scheduling.</p>
</div>


    <footer class="footer">
        <div class="footer-container">
            <div class="footer-section about">
                <h3>Carillo Law Office</h3>
                <p>Providing trusted legal and notarial services in civil, real estate, and contract law for over 5 years.</p>
            </div>
            <div class="footer-section contact">
                <h4>Contact Us</h4>
                <p>📍 9017 C.P. Trinidad St., Concepcion, Baliuag, Philippines</p>
                <p>📞 0973 727 8473</p>
                <p><a href="mailto:pcvcarillolaw@gmail.com" class="email-link"><i class="fas fa-envelope"></i> pcvcarillolaw@gmail.com</a></p>
                <p>
                    <a href="https://www.facebook.com/profile.php?id=100083055586233" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        class="facebook-link">
                        <i class="fab fa-facebook-square" style = " margin-right: 5px;"></i>  Facebook
                    </a>
                </p>
            </div>
            <div class="footer-section hours">
                <h4>Office Hours</h4>
                <p>Mon – Fri: 9:00 AM – 6:00 PM</p>
                <p>Sat: 8:00 AM – 5:00 PM</p>
                <p>Sun & Holidays: Closed</p>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2025 Carillo Law Office. All rights reserved.</p>
            <p>All legal services comply with Philippine law. This website is for informational purposes only and does not constitute legal advice.</p>
        </div>
    </footer>
</body>
</html>