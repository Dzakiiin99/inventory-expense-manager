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

// Loading: singleton overlay reusing the createLoadingState markup.
let _loadingRoot = null;

export const Loading = {
  show: (message) => {
    Loading.hide();
    _loadingRoot = createLoadingState(message);
    _loadingRoot.id = 'loading-root';
    document.body.appendChild(_loadingRoot);
  },
  hide: () => {
    if (_loadingRoot && _loadingRoot.parentNode) _loadingRoot.parentNode.removeChild(_loadingRoot);
    _loadingRoot = null;
  }
};