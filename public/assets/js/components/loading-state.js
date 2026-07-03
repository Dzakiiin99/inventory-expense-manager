// LoadingState Component for UMKM CRM Lite
import { TEXT } from '../constants.js';

/**
 * Create a loading state component
 * @param {string} [message] - Custom message (defaults to TEXT.LOADING)
 * @returns {HTMLElement} LoadingState element
 */
export function createLoadingState(message) {
    const container = document.createElement('div');
    container.className = 'loading-state';
    
    container.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-message">
            ${message || TEXT.LOADING}
        </div>
    `;
    
    return container;
}