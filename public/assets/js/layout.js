/**
 * Initialize application layout.
 * Wires layout-level behavior, including the mobile sidebar toggle.
 */
export function initLayout() {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.getElementById('menu-toggle');
    const overlay = document.getElementById('sidebar-overlay');

    const openSidebar = () => {
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.add('show');
    };
    const closeSidebar = () => {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
    };

    // Toggle button (visible on mobile via CSS)
    if (toggle) {
        toggle.addEventListener('click', () => {
            if (sidebar && sidebar.classList.contains('open')) closeSidebar();
            else openSidebar();
        });
    }

    // Tap overlay to close
    if (overlay) overlay.addEventListener('click', closeSidebar);

    // Close after picking a nav link. Delegation on .sidebar because the
    // nav links are generated later by setupNavigation().
    if (sidebar) {
        sidebar.addEventListener('click', (e) => {
            if (e.target.closest('.sidebar-nav a')) closeSidebar();
        });
    }
}
