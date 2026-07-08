// Dynamic Router for UMKM CRM Lite
import { renderDashboard } from './pages/dashboard.js';
import { TEXT } from './constants.js';

// Route configuration
import { InventoryPage } from './pages/inventory.js';
import { StockMovementPage } from './pages/stock-movement.js';
import { ExpensesPage } from './pages/expenses.js';

const routes = {
    'dashboard': (container) => renderDashboard(container),
    'inventory': (container) => {
        // Render inventory page into the container
        container.innerHTML = '<div id="app"></div>';
        InventoryPage.render();
    },
    'stock': (container) => {
        container.innerHTML = '<div id="app"></div>';
        StockMovementPage.render(container.querySelector('#app'));
    },
    'expenses': (container) => {
        container.innerHTML = '<div id="app"></div>';
        ExpensesPage.render(container.querySelector('#app'));
    }
};

/**
 * Initialize the router
 */
export function initRouter() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) {
        console.error('Content area not found');
        return;
    }
    
    // Load initial route
    const hash = window.location.hash.substring(1) || 'dashboard';
    loadRoute(hash, contentArea);
    
    // Handle navigation changes
    window.addEventListener('hashchange', () => {
        const newHash = window.location.hash.substring(1) || 'dashboard';
        loadRoute(newHash, contentArea);
    });
}

/**
 * Load the appropriate route
 * @param {string} route - Route to load
 * @param {HTMLElement} container - Container to render the route
 */
function loadRoute(route, container) {
    // Clear content area
    container.innerHTML = '';
    
    // Load the route if it exists
    if (routes[route]) {
        routes[route](container);
    } else {
        // Fallback to dashboard
        console.warn(`Route '${route}' not found. Falling back to dashboard.`);
        window.location.hash = '#dashboard';
        renderDashboard(container);
    }
}