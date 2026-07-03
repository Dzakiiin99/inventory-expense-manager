// Sidebar Component for UMKM CRM Lite

/**
 * Render the sidebar
 * @returns {HTMLElement} The sidebar element
 */
export function renderSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) {
        console.error('Sidebar element not found');
        return null;
    }
    
    // Initialize sidebar functionality
    initSidebarToggle(sidebar);
    
    return sidebar;
}

/**
 * Initialize sidebar toggle functionality
 * @param {HTMLElement} sidebar - The sidebar element
 */
function initSidebarToggle(sidebar) {
    const toggleBtn = document.querySelector('.toggle-sidebar-btn');
    if (!toggleBtn) return;
    
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) &&
            !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}