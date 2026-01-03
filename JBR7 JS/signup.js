function switchTab(type) {
    const signInForm = document.getElementById('sign-in-form');
    const signUpForm = document.getElementById('sign-up-form');
    const tabSignIn = document.getElementById('tab-signin');
    const tabSignUp = document.getElementById('tab-signup');
    const tabsContainer = document.querySelector('.tabs');

    if (type === 'signup') {
        signInForm.style.display = 'none';
        signUpForm.style.display = 'block';
        tabSignUp.classList.add('active');
        tabSignIn.classList.remove('active');
        tabsContainer.classList.remove('signin-active');
    } else {
        signUpForm.style.display = 'none';
        signInForm.style.display = 'block';
        tabSignIn.classList.add('active');
        tabSignUp.classList.remove('active');
        tabsContainer.classList.add('signin-active');
    }
}

// Initialize on page load - since it's signup.html, start with Sign Up active
document.addEventListener('DOMContentLoaded', function() {
    const tabSignIn = document.getElementById('tab-signin');
    const tabSignUp = document.getElementById('tab-signup');
    
    // Set Sign Up as active by default for signup.html
    switchTab('signup');
    
    tabSignIn.addEventListener('click', function() {
        switchTab('signin');
    });
    
    tabSignUp.addEventListener('click', function() {
        switchTab('signup');
    });
});