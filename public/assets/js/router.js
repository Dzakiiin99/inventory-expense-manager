// Dynamic Router for UMKM CRM Lite
import { renderDashboard } from './pages/dashboard.js';
import { NAVIGATION } from './constants.js';

// Route configuration
import { InventoryPage } from './pages/inventory.js';
import { StockMovementPage } from './pages/stock-movement.js';
import { ExpensesPage } from './pages/expenses.js';
import { CustomerPage } from './pages/customer/customer.page.js';
import { TransactionPage } from './pages/transaction/transaction.page.js';
import { ReportPage } from './pages/report/report.page.js';

const routes = {
    'dashboard': (container) => renderDashboard(container),
    'inventory': (container) => {
        container.innerHTML = '<div id="app"></div>';
        InventoryPage.render(container.querySelector('#app'));
    },
    'stock': (container) => {
        container.innerHTML = '<div id="app"></div>';
        StockMovementPage.render(container.querySelector('#app'));
    },
    'expenses': (container) => {
        container.innerHTML = '<div id="app"></div>';
        ExpensesPage.render(container.querySelector('#app'));
    },
    'customer': (container) => {
        container.innerHTML = '<div id="app"></div>';
        CustomerPage.render(container.querySelector('#app'));
    },
    'transaction': (container) => {
        container.innerHTML = '<div id="app"></div>';
        TransactionPage.render(container.querySelector('#app'));
    },
    'report': (container) => {
        container.innerHTML = '<div id="app"></div>';
        ReportPage.render(container.querySelector('#app'));
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
    updateBreadcrumb();
    
    // Handle navigation changes
    window.addEventListener('hashchange', () => {
        const newHash = window.location.hash.substring(1) || 'dashboard';
        loadRoute(newHash, contentArea);
        updateBreadcrumb();
    });
    
    // Setup sidebar navigation active state
    setupSidebarActiveState();
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

/**
 * Update breadcrumb based on current page.
 * Label diambil dari NAVIGATION.MENU (single source of truth),
 * sehingga otomatis sinkron saat halaman baru ditambahkan.
 */
function updateBreadcrumb() {
    const breadcrumb = document.querySelector('.breadcrumb span');
    if (!breadcrumb) return;
    
    const hash = window.location.hash.substring(1) || 'dashboard';
    const menuItem = NAVIGATION.MENU.find((item) => item.id === hash);
    breadcrumb.textContent = menuItem ? menuItem.label : 'Dashboard';
}

/**
 * Setup sidebar navigation active state
 */
function setupSidebarActiveState() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    
    function updateActiveLink() {
        const hash = window.location.hash.substring(1) || 'dashboard';
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href').substring(1);
            if (href === hash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    // Update on load
    updateActiveLink();
    
    // Update on hash change
    window.addEventListener('hashchange', updateActiveLink);
}