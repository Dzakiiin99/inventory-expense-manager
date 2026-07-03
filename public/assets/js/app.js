// Entry Point for UMKM CRM Lite
import { initLayout } from './layout.js';
import { setupNavigation } from './navigation.js';
import { initRouter } from './router.js';

/**
 * Initialize the application
 */
export function initApp() {
    initLayout();
    setupNavigation();
    initRouter();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);