// EmailJS Configuration
const EMAILJS_CONFIG = {
    serviceID: 'service_bwniz2u',
    templateID: 'template_xg1gobv',
    publicKey: 'nbW5cNH5Zylk8cmdh'
};

// Initialize EmailJS
(function() {
    emailjs.init(EMAILJS_CONFIG.publicKey);
})();

// Global variables for verification
let generatedCode = '';
let userSignupData = null;
let resendTimeout = null;
let resendCountdown = null;

// Simple password toggle for the eye icon
function togglePassword(icon) {
    const input = icon.parentElement.querySelector('input[type="password"]');
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    }
}

// Generate 6-digit verification code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email via EmailJS
function sendVerificationEmail(email, username, code) {
    const templateParams = {
        to_email: email, 
        customer_name: username,
        verification_code: code,
        expiry_time: '10',
        contact_email: 'support@jbr7bags.com',
        company_address: 'JBR7 Bags Manufacturing',
        facebook_url: 'https://facebook.com/jbr7bags',
        instagram_url: 'https://instagram.com/jbr7bags'
    };

    return emailjs.send(
        EMAILJS_CONFIG.serviceID,
        EMAILJS_CONFIG.templateID,
        templateParams
    );
}

// Open verification modal
function openVerificationModal(email) {
    const modal = document.getElementById('verification-modal');
    const emailDisplay = document.getElementById('verification-email');
    
    emailDisplay.textContent = email;
    modal.classList.add('active');
    
    // Focus first input
    const firstInput = document.querySelector('.code-input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
    
    // Reset all inputs
    document.querySelectorAll('.code-input').forEach(input => {
        input.value = '';
        input.classList.remove('error');
    });
    
    // Hide messages
    document.getElementById('verify-error').classList.remove('show');
    document.getElementById('verify-success').classList.remove('show');
}

// Close verification modal
function closeVerificationModal() {
    const modal = document.getElementById('verification-modal');
    modal.classList.remove('active');
    
    // Clear timeout if exists
    if (resendTimeout) {
        clearTimeout(resendTimeout);
        resendTimeout = null;
    }
    if (resendCountdown) {
        clearInterval(resendCountdown);
        resendCountdown = null;
    }
}

// Handle code input (auto-focus next field)
function setupCodeInputs() {
    const inputs = document.querySelectorAll('.code-input');
    
    inputs.forEach((input, index) => {
        // Only allow numbers
        input.addEventListener('input', function(e) {
            const value = e.target.value;
            
            // Remove non-numeric characters
            if (!/^\d*$/.test(value)) {
                e.target.value = value.replace(/\D/g, '');
                return;
            }
            
            // Auto-focus next input
            if (value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
            
            // Remove error class
            e.target.classList.remove('error');
        });
        
        // Handle backspace
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
        
        // Handle paste
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
            
            if (pastedData.length === 6) {
                inputs.forEach((input, i) => {
                    input.value = pastedData[i] || '';
                });
                inputs[5].focus();
            }
        });
    });
}

// Get entered code
function getEnteredCode() {
    const inputs = document.querySelectorAll('.code-input');
    return Array.from(inputs).map(input => input.value).join('');
}

// Verify the code
function verifyCode() {
    const enteredCode = getEnteredCode();
    const errorMsg = document.getElementById('verify-error');
    const successMsg = document.getElementById('verify-success');
    const spinner = document.getElementById('verify-spinner');
    const verifyBtn = document.getElementById('verify-code-btn');
    
    // Hide previous messages
    errorMsg.classList.remove('show');
    successMsg.classList.remove('show');
    
    // Validate code length
    if (enteredCode.length !== 6) {
        errorMsg.textContent = 'Please enter all 6 digits';
        errorMsg.classList.add('show');
        document.querySelectorAll('.code-input').forEach(input => {
            if (!input.value) input.classList.add('error');
        });
        return;
    }
    
    // Show loading
    spinner.classList.add('show');
    verifyBtn.disabled = true;
    
    // Verify code
    setTimeout(() => {
        if (enteredCode === generatedCode) {
            // Success
            successMsg.textContent = 'Verification successful!';
            successMsg.classList.add('show');
            spinner.classList.remove('show');
            
            // Complete signup - insert user to database
            completeSignup();
        } else {
            // Error
            errorMsg.textContent = 'Invalid code. Please try again.';
            errorMsg.classList.add('show');
            spinner.classList.remove('show');
            verifyBtn.disabled = false;
            
            // Add error class to all inputs
            document.querySelectorAll('.code-input').forEach(input => {
                input.classList.add('error');
            });
        }
    }, 500);
}

// Complete signup after verification
function completeSignup() {
    if (!userSignupData) {
        alert('Signup data not found. Please try again.');
        closeVerificationModal();
        return;
    }
    
    // Call the API to insert user
    fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'signup',
            username: userSignupData.username,
            email: userSignupData.email,
            password: userSignupData.password
        })
    })
    .then(r => {
        if (!r.ok) {
            throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
    })
    .then(data => {
        if (data.success && data.user_id) {
            var uid = data.user_id.toString();
            sessionStorage.setItem('jbr7_user_id', uid);
            sessionStorage.setItem('jbr7_auth_uid', uid);
            
            // Close modal and redirect
            setTimeout(() => {
                closeVerificationModal();
                window.location.href = 'home.html';
            }, 1500);
        } else {
            alert(data.error || 'Signup failed');
            closeVerificationModal();
        }
    })
    .catch(err => {
        console.error('Signup error:', err);
        alert('Signup failed. Please try again.');
        closeVerificationModal();
    });
}

// Resend verification code
function resendCode() {
    if (!userSignupData) return;
    
    const resendBtn = document.getElementById('resend-btn');
    const errorMsg = document.getElementById('verify-error');
    const successMsg = document.getElementById('verify-success');
    const timerDisplay = document.getElementById('resend-timer');
    
    // Disable resend button
    resendBtn.disabled = true;
    errorMsg.classList.remove('show');
    successMsg.classList.remove('show');
    
    // Generate new code
    generatedCode = generateVerificationCode();
    
    // Send new email
    sendVerificationEmail(userSignupData.email, userSignupData.username, generatedCode)
        .then(() => {
            successMsg.textContent = 'New code sent! Check your email.';
            successMsg.classList.add('show');
            
            // Clear inputs
            document.querySelectorAll('.code-input').forEach(input => {
                input.value = '';
                input.classList.remove('error');
            });
            document.querySelector('.code-input').focus();
            
            // Start 60 second countdown
            let countdown = 60;
            timerDisplay.style.display = 'block';
            timerDisplay.textContent = `Resend available in ${countdown}s`;
            
            resendCountdown = setInterval(() => {
                countdown--;
                timerDisplay.textContent = `Resend available in ${countdown}s`;
                
                if (countdown <= 0) {
                    clearInterval(resendCountdown);
                    timerDisplay.style.display = 'none';
                    resendBtn.disabled = false;
                }
            }, 1000);
        })
        .catch(error => {
            console.error('Resend error:', error);
            errorMsg.textContent = 'Failed to resend code. Please try again.';
            errorMsg.classList.add('show');
            resendBtn.disabled = false;
        });
}

// Handle signup form submission
document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const username = form.querySelector('input[name="username"]').value.trim();
    const email = form.querySelector('input[name="email"]').value.trim();
    const password = form.querySelector('input[name="password"]').value;
    const termsAccepted = form.querySelector('#signup-terms').checked;

    if (!username || !email || !password) {
        alert('Please fill in all fields');
        return;
    }
    if (password.length < 8) {
        alert('Password must be at least 8 characters.');
        return;
    }
    if (!termsAccepted) {
        alert('You must accept the Terms of Use & Conditions and the Privacy Policy to sign up.');
        return;
    }

    // Store signup data temporarily
    userSignupData = { username, email, password };
    
    // Generate verification code
    generatedCode = generateVerificationCode();
    
    // Disable submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending verification code...';
    
    // Send verification email
    sendVerificationEmail(email, username, generatedCode)
        .then(() => {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign Up';
            
            // Open verification modal
            openVerificationModal(email);
        })
        .catch(error => {
            console.error('Email sending error:', error);
            alert('Failed to send verification code. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign Up';
        });
});

// Tab switching functionality
function switchTab(type) {
    const signInForm = document.getElementById('sign-in-form');
    const signUpForm = document.getElementById('sign-up-form');
    const tabSignIn = document.getElementById('tab-signin');
    const tabSignUp = document.getElementById('tab-signup');
    const tabsContainer = document.querySelector('.tabs');

    if (type === 'signup') {
        if (signInForm) signInForm.style.display = 'none';
        if (signUpForm) signUpForm.style.display = 'block';
        if (tabSignUp) tabSignUp.classList.add('active');
        if (tabSignIn) tabSignIn.classList.remove('active');
        if (tabsContainer) tabsContainer.classList.remove('signin-active');
    } else {
        if (signUpForm) signUpForm.style.display = 'none';
        if (signInForm) signInForm.style.display = 'block';
        if (tabSignIn) tabSignIn.classList.add('active');
        if (tabSignUp) tabSignUp.classList.remove('active');
        if (tabsContainer) tabsContainer.classList.add('signin-active');
    }
}

// Initialize code inputs on page load
document.addEventListener('DOMContentLoaded', function() {
    setupCodeInputs();
    
    // Tab switching setup (if tabs exist on this page)
    const tabSignIn = document.getElementById('tab-signin');
    const tabSignUp = document.getElementById('tab-signup');
    
    if (tabSignIn && tabSignUp) {
        // Set Sign Up as active by default for signup.html
        switchTab('signup');
        
        tabSignIn.addEventListener('click', function() {
            switchTab('signin');
        });
        
        tabSignUp.addEventListener('click', function() {
            switchTab('signup');
        });
    }
    
    // Allow Enter key to verify
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && document.getElementById('verification-modal').classList.contains('active')) {
            verifyCode();
        }
    });
});