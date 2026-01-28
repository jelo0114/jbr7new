// theme.js - Global theme management for all pages

// Apply theme to the page
function applyTheme(theme) {
    const body = document.body;
    const html = document.documentElement;
    
    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark');
    html.classList.remove('theme-light', 'theme-dark');
    
    let actualTheme = theme;
    
    // Handle auto theme
    if (theme === 'auto') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            actualTheme = 'dark';
        } else {
            actualTheme = 'light';
        }
        
        // Listen for system theme changes
        if (!window.themeMediaQuery) {
            window.themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            window.themeMediaQuery.addEventListener('change', (e) => {
                if (localStorage.getItem('jbr7_theme') === 'auto') {
                    applyTheme('auto');
                }
            });
        }
    }
    
    // Apply theme class
    if (actualTheme === 'dark') {
        body.classList.add('theme-dark');
        html.classList.add('theme-dark');
    } else {
        body.classList.add('theme-light');
        html.classList.add('theme-light');
    }
    
    // Update meta theme-color for mobile browsers
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = actualTheme === 'dark' ? '#1a1a1a' : '#ffffff';
}

// Initialize theme on page load
function initializeTheme() {
    const savedTheme = localStorage.getItem('jbr7_theme') || 'light';
    applyTheme(savedTheme);
}

// Change theme (can be called from settings)
function changeTheme(theme) {
    localStorage.setItem('jbr7_theme', theme);
    applyTheme(theme);
    const themeName = theme === 'auto' ? 'Auto (System)' : theme.charAt(0).toUpperCase() + theme.slice(1);
    
    // Show notification if function exists
    if (typeof showNotification === 'function') {
        showNotification(`Theme changed to ${themeName}`, 'success');
    }
}

// Expose functions globally
window.applyTheme = applyTheme;
window.changeTheme = changeTheme;
window.initializeTheme = initializeTheme;

// Initialize theme immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTheme);
} else {
    initializeTheme();
}
