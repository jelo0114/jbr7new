// Consultation form functionality
document.addEventListener('DOMContentLoaded', function() {
    setupConsultationForm();
});

function setupConsultationForm() {
    const form = document.getElementById('consultationForm');
    const messageEl = document.getElementById('consultationMessage');
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('client_logged_in') === 'true';
    if (!isLoggedIn) {
        alert('You must be logged in to book a consultation');
        window.location.href = 'client-login.html';
        return;
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const full_name = document.getElementById('full_name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const legal_issue = document.getElementById('legal_issue').value;
        const preferred_date = document.getElementById('preferred_date').value;
        const message = document.getElementById('message').value.trim();
        
        if (!full_name || !email || !phone || !legal_issue || !preferred_date) {
            showMessage(messageEl, 'All required fields must be filled', 'error');
            return;
        }
        
        try {
            const response = await fetch('api/submit-consultation.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    full_name: full_name,
                    email: email,
                    phone: phone,
                    legal_issue: legal_issue,
                    preferred_date: preferred_date,
                    message: message
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage(messageEl, data.message, 'success');
                form.reset();
                setTimeout(() => {
                    window.location.href = 'appointments.html';
                }, 2000);
            } else {
                showMessage(messageEl, data.message, 'error');
            }
        } catch (error) {
            showMessage(messageEl, 'An error occurred. Please try again.', 'error');
            console.error('Consultation error:', error);
        }
    });
}

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = 'message ' + type;
    element.style.color = type === 'error' ? 'red' : 'green';
}
