// Navigation Configuration for UMKM CRM Lite
import { NAVIGATION } from './constants.js';

/**
 * Setup navigation menu
 */
export function setupNavigation() {
    const sidebarNav = document.querySelector('.sidebar-nav ul');
    if (!sidebarNav) {
        console.error('Sidebar navigation not found');
        return;
    }
    
    // Generate navigation items
    sidebarNav.innerHTML = NAVIGATION.MENU.map(item => `
        <li>
            <a href="${item.route}" id="${item.id}">
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
            </a>
        </li>
    `).join('');
    
    // Set active menu based on current route
    updateActiveMenu();
    
    // Update active menu on navigation changes
    window.addEventListener('hashchange', updateActiveMenu);
}

/**
 * Update active menu state
 */
function updateActiveMenu() {
    const currentRoute = window.location.hash.substring(1) || 'dashboard';
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.toggle('active', link.id === currentRoute);
    });
}