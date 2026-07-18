// Dynamic Router for UMKM CRM Lite
import { renderDashboard } from './pages/dashboard.js';
import { NAVIGATION } from './constants.js';

// Lazy-loaded page modules. Each entry resolves its module + the exported
// page object. Using dynamic import() means a single failing route module
// (e.g. a 404 in production) can no longer abort the entire module graph
// before initApp() runs — only that one route degrades, the rest keep working.
const ROUTE_LOADERS = {
    inventory: { loader: () => import('./pages/inventory.js'), exportName: 'InventoryPage' },
    stock: { loader: () => import('./pages/stock-movement.js'), exportName: 'StockMovementPage' },
    expenses: { loader: () => import('./pages/expenses.js'), exportName: 'ExpensesPage' },
    customer: { loader: () => import('./pages/customer/customer.page.js'), exportName: 'CustomerPage' },
    transaction: { loader: () => import('./pages/transaction/transaction.page.js'), exportName: 'TransactionPage' },
    report: { loader: () => import('./pages/report/report.page.js'), exportName: 'ReportPage' }
};

/**
 * Initialize the router
 */
export async function initRouter() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) {
        console.error('Content area not found');
        return;
    }

    // Load initial route
    const hash = window.location.hash.substring(1) || 'dashboard';
    await loadRoute(hash, contentArea);
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
 * Load the appropriate route.
 * A failure loading ONE route shows a visible message in that route's
 * container instead of blanking the whole application.
 * @param {string} route - Route to load
 * @param {HTMLElement} container - Container to render the route
 */
async function loadRoute(route, container) {
    // Clear content area
    container.innerHTML = '';

    // Dashboard is imported statically (entry page, always available).
    if (route === 'dashboard') {
        try {
            await renderDashboard(container);
        } catch (err) {
            console.error('[Router] Gagal merender dashboard:', err);
            renderRouteError(container, 'Dashboard', err);
        }
        return;
    }

    const entry = ROUTE_LOADERS[route];
    if (!entry) {
        // Unknown route -> fallback to dashboard
        console.warn(`Route '${route}' not found. Falling back to dashboard.`);
        window.location.hash = '#dashboard';
        try {
            await renderDashboard(container);
        } catch (err) {
            renderRouteError(container, 'Dashboard', err);
        }
        return;
    }

    try {
        const mod = await entry.loader();
        const Page = mod[entry.exportName];
        if (!Page || typeof Page.render !== 'function') {
            throw new Error(`Ekspor '${entry.exportName}' tidak ditemukan di modul route '${route}'.`);
        }
        container.innerHTML = '<div id="app"></div>';
        Page.render(container.querySelector('#app'));
    } catch (err) {
        console.error(`[Router] Gagal memuat route '${route}':`, err);
        renderRouteError(container, route, err);
    }
}

/**
 * Render a visible, non-blank error state for a failed route so the user
 * sees feedback instead of an empty <main>.
 */
function renderRouteError(container, route, err) {
    const safeRoute = String(route || 'unknown').replace(/[^\w-]/g, '');
    const message = (err && err.message) ? err.message : 'Unknown error';
    const box = document.createElement('div');
    box.className = 'route-error';
    box.setAttribute('role', 'alert');
    box.style.cssText =
        'padding:2rem;color:#c0392b;font-family:sans-serif;font-size:14px;line-height:1.5';
    const title = document.createElement('strong');
    title.textContent = `Halaman "${safeRoute}" gagal dimuat.`;
    const detail = document.createElement('div');
    detail.style.marginTop = '0.5rem';
    detail.textContent = 'Detail: ' + message;
    box.appendChild(title);
    box.appendChild(detail);
    container.appendChild(box);
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
