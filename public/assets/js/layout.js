// Layout Manager for UMKM CRM Lite
import { renderSidebar } from './components/sidebar.js';
import { renderNavbar } from './components/navbar.js';

/**
 * Initialize the application layout
 */
export function initLayout() {
    renderSidebar();
    renderNavbar();
}