<?php
session_start();

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HOMEPAGE</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
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
                <li><a href="#">HOME</a></li>
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

        <section class="hero">
            <div class="hero-content">
                <div class="hero-text">
                    <h1>Legal Solutions with Integrity & Expertise</h1>
                    <p>Professional legal and notarial services, committed to protecting your rights.</p>
                    <p2>JUSTICE • EQUALITY • TRUTH</p2>
                    <?php if (isset($_SESSION['client_logged_in']) && $_SESSION['client_logged_in']): ?>
                        <a href="consultation.php" class="hero-button">Book Consultation</a>
                    <?php else: ?>
                        <a href="#" class="hero-button" id="bookConsultationBtn">Book Consultation</a>
                    <?php endif; ?>
                    <!-- Modal (only appears if not logged in) -->
                    <div id="consultationModal" class="modal">
                        <div class="modal-content">
                            <span class="close-btn" id="closeModal">&times;</span>
                            <h2>Sign In Required</h2>
                            <p>You need to be signed in to book a consultation.</p>
                            <div class="modal-actions">
                                <a href="client-login.php" class="modal-btn login">Login</a>
                                <button class="modal-btn cancel" id="cancelModal">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="about">
            <div class="about-container">
                <div class="about-text">
                    <h2>About</h2>
                </div>
                <div class="about-brief">
                    <p>Attorney Carillo has over 5 years of experience in providing legal and notarial services with professionalism and care. A graduate from the esteemed University of Santo Tomas...</p>
                    <a href="#" class="learn-more">LEARN MORE &rarr;</a>
                </div>
            </div>
        </section>

        <section class="services">
            <div class="services-container">
                <h2 class="section-title">Our Services</h2>
                <div class="service-cards">
                    <div class="service-card">
                        <h3>Notarial Services</h3>
                        <p>Quick, reliable, and professional notarization of documents, affidavits, contracts, and more.</p>
                    </div>
                    <div class="service-card">
                        <h3>Real Estate Law</h3>
                        <p>Guidance and legal assistance with property purchases, sales, disputes, and documentation.</p>
                    </div>
                    <div class="service-card">
                        <h3>Contract Drafting</h3>
                        <p>Well-structured and legally sound contracts tailored to your business or personal needs.</p>
                    </div>
                </div>  
                <div class="button-wrapper">   
                    <a href="services.php" class="view-all-services">VIEW ALL SERVICES &rarr;</a>    
                </div>   
            </div>
        </section>

        <section class="testimonials">
            <div class="testimonial-slider">
                <div class="testimonial-card">
                    <p>"I had a great experience with Carillo Law Office. Highly recommend!"</p>
                    <p>- John Doe</p>
                </div>
                <div class="testimonial-card">
                    <p>"The service was quick and professional, and I felt well taken care of."</p>
                    <p>- Jane Smith</p>
                </div>
                <div class="testimonial-card">
                    <p>"Expert legal advice and very responsive. Will definitely use their services again!"</p>
                    <p>- Mark Johnson</p>
                </div>
            </div>
            <button class="prev">Prev</button>
            <button class="next">Next</button>
        </section>

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
    <script>
        const slider = document.querySelector('.testimonial-slider');
        const cards = document.querySelectorAll('.testimonial-card');
        const nextBtn = document.querySelector('.next');
        const prevBtn = document.querySelector('.prev');

        let index = 0;
        const totalCards = cards.length;

        function updateSlider() {
            slider.style.transform = `translateX(-${index * 100}%)`;
        }

        function showNext() {
            index = (index + 1) % totalCards;
            updateSlider();
        }

        function showPrev() {
            index = (index - 1 + totalCards) % totalCards;
            updateSlider();
        }

        nextBtn.addEventListener('click', showNext);
        prevBtn.addEventListener('click', showPrev);


        setInterval(showNext, 5000);

        const modal = document.getElementById("consultationModal");
        const openBtn = document.getElementById("bookConsultationBtn");
        const closeBtn = document.getElementById("closeModal");
        const cancelBtn = document.getElementById("cancelModal");

        if (openBtn) {
            openBtn.addEventListener("click", function (e) {
                e.preventDefault();
                modal.style.display = "flex";
            });
        }

        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });

        cancelBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });

        window.addEventListener("click", function (e) {
            if (e.target == modal) {
                modal.style.display = "none";
            }
        });
    </script>
</body>
</html>
