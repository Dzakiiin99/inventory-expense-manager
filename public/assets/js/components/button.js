// Button Component for UMKM CRM Lite
import { COLORS } from '../constants.js';

/**
 * Create a button component
 * @param {string} text - Button text
 * @param {string} [variant='primary'] - Button variant (primary, secondary, success, danger, text)
 * @param {string} [icon] - Optional icon class (e.g., 'fas fa-plus')
 * @param {function} [onClick] - Click handler
 * @returns {HTMLElement} Button element
 */
export function createButton(text, variant = 'primary', icon, onClick) {
    const button = document.createElement('button');
    button.className = `btn btn-${variant}`;
    
    // Set button styles based on variant
    let bgColor, textColor, hoverColor;
    switch(variant) {
        case 'secondary':
            bgColor = COLORS.SECONDARY;
            hoverColor = COLORS.SECONDARY_HOVER;
            textColor = COLORS.SURFACE;
            break;
        case 'success':
            bgColor = COLORS.SUCCESS;
            hoverColor = '#059669';
            textColor = COLORS.SURFACE;
            break;
        case 'danger':
            bgColor = COLORS.DANGER;
            hoverColor = '#DC2626';
            textColor = COLORS.SURFACE;
            break;
        case 'text':
            bgColor = 'transparent';
            hoverColor = 'transparent';
            textColor = COLORS.PRIMARY;
            break;
        default: // primary
            bgColor = COLORS.PRIMARY;
            hoverColor = COLORS.PRIMARY_HOVER;
            textColor = COLORS.SURFACE;
    }
    
    button.style.backgroundColor = bgColor;
    button.style.color = textColor;
    
    // Add hover effect
    button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = hoverColor;
    });
    button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = bgColor;
    });
    
    // Add icon if provided
    let buttonContent = text;
    if (icon) {
        buttonContent = `<i class="${icon}"></i> ${text}`;
    }
    
    button.innerHTML = buttonContent;
    
    // Add click handler if provided
    if (onClick) {
        button.addEventListener('click', onClick);
    }
    
    return button;
};

// Button.render: returns an HTML string (safe for template literals / innerHTML)
// and wires onClick via a single document-level delegated listener, so closures
// work even when the button is injected as a string.
const _handlers = new Map();
let _seq = 0;
let _delegated = false;

function _ensureDelegation() {
  if (_delegated) return;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-btn-id]');
    if (!btn) return;
    const handler = _handlers.get(btn.getAttribute('data-btn-id'));
    if (handler) handler();
  });
  _delegated = true;
}

export const Button = {
  render: ({ text = '', variant = 'primary', icon, onClick, type, size } = {}) => {
    _ensureDelegation();
    const hasHandler = typeof onClick === 'function';
    const id = hasHandler ? 'btn-' + (++_seq) : '';
    if (hasHandler) _handlers.set(id, onClick);
    const sizeCls = size === 'small' ? ' btn-small' : '';
    const typeAttr = type ? ` type="${type}"` : '';
    const iconHtml = icon ? `<i class="${icon}"></i> ` : '';
    return `<button class="btn btn-${variant}${sizeCls}"${id ? ` data-btn-id="${id}"` : ''}${typeAttr}>${iconHtml}${text}</button>`;
  }
};