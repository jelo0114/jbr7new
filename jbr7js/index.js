// JavaScript file for JBR7 Bags Manufacturing

// Prefer /api/* routes (Supabase/Vercel) but fall back to PHP (XAMPP)
function jbr7Fetch(apiUrl, phpUrl, options) {
    return fetch(apiUrl, options).then(res => {
        if (res.status === 404 || res.status === 405) return fetch(phpUrl, options);
        return res;
    }).catch(() => fetch(phpUrl, options));
}

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

// -----------------------------
// Auth guard for landing page
// -----------------------------

async function isLandingUserAuthenticated() {
    try {
        const res = await jbr7Fetch('/api/session_user', '/jbr7php/session_user.php', { credentials: 'same-origin' });
        return res.ok;
    } catch (err) {
        console.warn('index.js auth check failed, treating as guest', err);
        return false;
    }
}

function redirectLandingToSignin(redirectTo = 'home.html') {
    const url = `signin.html?redirect=${encodeURIComponent(redirectTo)}`;
    window.location.href = url;
}

async function handleLandingAuthClick(event) {
    event.preventDefault();
    const el = event.currentTarget;
    const href = el.getAttribute('href') || 'home.html';
    const ok = await isLandingUserAuthenticated();
    if (ok) {
        window.location.href = href;
    } else {
        redirectLandingToSignin(href);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Any element tagged with data-requires-auth will be protected
    document.querySelectorAll('[data-requires-auth]').forEach(el => {
        el.addEventListener('click', handleLandingAuthClick);
    });
});