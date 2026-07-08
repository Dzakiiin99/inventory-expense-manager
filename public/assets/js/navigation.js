/**
 * Setup navigation menu
 */
export function setupNavigation() {
    const navItems = [
        { id: "dashboard", icon: "fas fa-home", label: "Dashboard", path: "#dashboard" },
        { id: "inventory", icon: "fas fa-boxes", label: "Inventory", path: "#inventory" },
        { id: "expenses", icon: "fas fa-file-invoice-dollar", label: "Expenses", path: "#expenses" },
        { id: "stock-movement", icon: "fas fa-exchange-alt", label: "Stock Movement", path: "#stock-movement" }
    ];

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