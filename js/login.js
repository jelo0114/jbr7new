// Login page functionality
document.addEventListener('DOMContentLoaded', function() {
    setupFormToggle();
    setupPasswordToggle();
    setupTermsModal();
});

function setupFormToggle() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const formContainer = document.getElementById('formContainer');
    
    if (loginBtn && signupBtn && formContainer) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            formContainer.style.transform = 'translateX(0%)';
            loginBtn.classList.add('active');
            signupBtn.classList.remove('active');
        });
        
        signupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            formContainer.style.transform = 'translateX(-50%)';
            signupBtn.classList.add('active');
            loginBtn.classList.remove('active');
        });
    }
}

function setupPasswordToggle() {
    // Handle password toggles for login form
    const toggleLoginPassword = document.getElementById('toggleLoginPassword');
    const loginPassword = document.getElementById('loginPassword');
    
    if (toggleLoginPassword && loginPassword) {
        toggleLoginPassword.addEventListener('click', () => {
            const isPassword = loginPassword.getAttribute('type') === 'password';
            loginPassword.setAttribute('type', isPassword ? 'text' : 'password');
            toggleLoginPassword.src = isPassword
                ? 'https://cdn-icons-png.flaticon.com/512/159/159604.png'
                : 'https://cdn-icons-png.flaticon.com/512/565/565655.png';
        });
    }
    
    // Handle password toggles for signup form
    const toggleSignupPassword = document.getElementById('toggleSignupPassword');
    const signupPassword = document.getElementById('signupPassword');
    
    if (toggleSignupPassword && signupPassword) {
        toggleSignupPassword.addEventListener('click', () => {
            const isPassword = signupPassword.getAttribute('type') === 'password';
            signupPassword.setAttribute('type', isPassword ? 'text' : 'password');
            toggleSignupPassword.src = isPassword
                ? 'https://cdn-icons-png.flaticon.com/512/159/159604.png'
                : 'https://cdn-icons-png.flaticon.com/512/565/565655.png';
        });
    }
    
    // Handle password toggles for confirm password field
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (toggleConfirmPassword && confirmPassword) {
        toggleConfirmPassword.addEventListener('click', () => {
            const isPassword = confirmPassword.getAttribute('type') === 'password';
            confirmPassword.setAttribute('type', isPassword ? 'text' : 'password');
            toggleConfirmPassword.src = isPassword
                ? 'https://cdn-icons-png.flaticon.com/512/159/159604.png'
                : 'https://cdn-icons-png.flaticon.com/512/565/565655.png';
        });
    }
}

function setupTermsModal() {
    const termsLink = document.getElementById('termsLink');
    const termsModal = document.getElementById('termsModal');
    const closeButton = document.querySelector('.close-button');
    
    if (termsLink && termsModal && closeButton) {
        termsLink.addEventListener('click', function(e) {
            e.preventDefault();
            termsModal.style.display = 'flex';
        });
        
        closeButton.addEventListener('click', function() {
            termsModal.style.display = 'none';
        });
        
        window.addEventListener('click', function(e) {
            if (e.target === termsModal) {
                termsModal.style.display = 'none';
            }
        });
    }
}
