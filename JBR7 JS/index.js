// JavaScript file for JBR7 Bags Manufacturing

// Open modal and switch to specific tab
function openModal(type) {
    const modal = document.getElementById('authModal');
    modal.classList.add('active');
    switchTab(type);
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('authModal');
    if (event.target === modal) {
        modal.classList.remove('active');
    }
});

// Close modal on ESC key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('authModal');
        modal.classList.remove('active');
    }
});

// Switch between Sign In and Sign Up tabs
function switchTab(type) {
    const signInForm = document.getElementById('sign-in-form');
    const signUpForm = document.getElementById('sign-up-form');
    const tabSignIn = document.getElementById('tab-signin');
    const tabSignUp = document.getElementById('tab-signup');

    if (type === 'signup') {
        signInForm.style.display = 'none';
        signUpForm.style.display = 'block';
        tabSignUp.classList.add('active');
        tabSignIn.classList.remove('active');
    } else {
        signUpForm.style.display = 'none';
        signInForm.style.display = 'block';
        tabSignIn.classList.add('active');
        tabSignUp.classList.remove('active');
    }
}

// Toggle password visibility
function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
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