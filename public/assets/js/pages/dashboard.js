// Dashboard Page for UMKM CRM Lite
import { createStatCard } from '../components/design-system/card.js';
import { DASHBOARD_STATS } from '../constants.js';

/**
 * Render the dashboard page
 * @param {HTMLElement} container - Container to render the dashboard
 */
export function renderDashboard(container) {
    // Clear container
    container.innerHTML = '<h1 class="page-title">Dashboard</h1>';
    
    // Create dashboard grid
    const grid = document.createElement('div');
    grid.className = 'dashboard-grid';
    
    // Add stat cards
    DASHBOARD_STATS.forEach(stat => {
        grid.appendChild(createStatCard(stat.title, stat.value, stat.icon, stat.variant));
    });
    
    container.appendChild(grid);
}