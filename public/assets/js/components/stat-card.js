// StatCard Component for UMKM CRM Lite
import { COLORS } from '../constants.js';

/**
 * Create a stat card component
 * @param {string} title - Card title
 * @param {string} value - Card value
 * @param {string} icon - Icon class (e.g., 'fas fa-users')
 * @param {string} [variant='primary'] - Card variant (primary, success, warning, danger)
 * @returns {HTMLElement} StatCard element
 */
export function createStatCard(title, value, icon, variant = 'primary') {
    const card = document.createElement('div');
    card.className = 'stat-card';
    
    // Determine background color based on variant
    let bgColor;
    switch(variant) {
        case 'success':
            bgColor = COLORS.SUCCESS;
            break;
        case 'warning':
            bgColor = COLORS.WARNING;
            break;
        case 'danger':
            bgColor = COLORS.DANGER;
            break;
        default:
            bgColor = COLORS.PRIMARY;
    }
    
    card.innerHTML = `
        <div class="stat-card-header">
            <div class="stat-card-icon" style="background-color: ${bgColor};">
                <i class="${icon}"></i>
            </div>
        </div>
        <div class="stat-card-title">${title}</div>
        <div class="stat-card-value">${value}</div>
    `;
    
    return card;
}