/**
 * Setup navigation menu
 */
import { NAVIGATION } from './constants.js';

export function setupNavigation() {
    const navItems = NAVIGATION.MENU;

    const navContainer = document.querySelector('.sidebar-nav ul');
    if (navContainer) {
        navContainer.innerHTML = navItems.map(item =>
            `<li data-path="${item.path}">
                <a href="${item.path}">
                    <i class="${item.icon}"></i>
                    <span>${item.label}</span>
                </a>
            </li>`
        ).join('');
        console.log("[Navigation] Setup completed");
    } else {
        console.error("[Navigation] Sidebar nav container not found");
    }
}