// EmptyState Component for UMKM CRM Lite
import { TEXT } from '../constants.js';

/**
 * Create an empty state component
 * @param {string} [message] - Custom message (defaults to TEXT.EMPTY_STATE)
 * @param {string} [icon='fas fa-box-open'] - Icon class
 * @returns {HTMLElement} EmptyState element
 */
export function createEmptyState(message, icon = 'fas fa-box-open') {
    const container = document.createElement('div');
    container.className = 'empty-state';
    
    container.innerHTML = `
        <div class="empty-state-icon">
            <i class="${icon}"></i>
        </div>
        <div class="empty-state-message">
            ${message || TEXT.EMPTY_STATE}
        </div>
    `;
    
    return container;
}