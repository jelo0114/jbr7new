// Index page functionality
document.addEventListener('DOMContentLoaded', function() {
    setupConsultationModal();
});

function setupConsultationModal() {
    const modal = document.getElementById('consultationModal');
    const openBtn = document.getElementById('bookConsultationBtn');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelModal');
    
    if (!openBtn) return;
    
    const isLoggedIn = localStorage.getItem('client_logged_in') === 'true';
    
    openBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (isLoggedIn) {
            window.location.href = 'consultation.html';
        } else {
            modal.style.display = 'flex';
        }
    });
    
    closeBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    cancelBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}
