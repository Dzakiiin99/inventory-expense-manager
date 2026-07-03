// Card Component for UMKM CRM Lite

/**
 * Create a card component
 * @param {string} title - Card title
 * @param {string} content - Card content
 * @param {string} [variant='default'] - Card variant (default, primary, success, etc.) * @returns {HTMLElement} Card element
 */
export function createCard(title, content, variant = 'default') {
    const card = document.createElement('div');
    card.className = `card ${variant !== 'default' ? 'card-' + variant : ''}`;
    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${title}</h3>
        </div>
        <div class="card-content">
            <p>${content}</p>
        </div>
    `;
    return card;
}