// Navbar Component for UMKM CRM Lite

/**
 * Render the navbar
 * @returns {HTMLElement} The navbar element
 */
export function renderNavbar() {
    const navbar = document.querySelector('.top-navbar');
    if (!navbar) {
        console.error('Navbar element not found');
        return null;
    }
    
    // Initialize navbar functionality
    initNavbarProfile(navbar);
    
    return navbar;
}

/**
 * Initialize navbar profile functionality
 * @param {HTMLElement} navbar - The navbar element
 */
function initNavbarProfile(navbar) {
    const notificationBtn = navbar.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            console.log('Notification button clicked');
            // Placeholder for future functionality
        });
    }
}