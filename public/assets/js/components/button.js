/* global MutationObserver */
// Button Component for UMKM CRM Lite
import { COLORS } from '../constants.js';

/**
 * Create a button component
 * @param {string} text - Button text
 * @param {string} [variant='primary'] - Button variant (primary, secondary, success, danger, info, text)
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
        case 'info':
            bgColor = '#06B6D4';
            hoverColor = '#0891B2';
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
//
// Memory-leak fix: MutationObserver watches the DOM for button removals and
// automatically cleans up orphaned handler entries. Combined with `subtree`
// monitoring, this ensures the _handlers Map never grows unboundedly — entries
// are removed as soon as their DOM elements are garbage-collected.

const _handlers = new Map();
let _seq = 0;
let _delegated = false;

function _cleanupOrphans(root) {
  const removed = root.querySelectorAll
    ? root.querySelectorAll('[data-btn-id]')
    : [];
  removed.forEach((el) => _handlers.delete(el.getAttribute('data-btn-id')));
}

function _ensureDelegation() {
  if (_delegated) return;

  // Delegated click listener — single handler for all Button.render() buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-btn-id]');
    if (!btn) return;
    const handler = _handlers.get(btn.getAttribute('data-btn-id'));
    if (handler) handler();
  });

  // MutationObserver: auto-cleanup handlers when buttons are removed from DOM.
  // subtree:true covers all descendants — lightweight for small/medium DOMs.
  const observer = new MutationObserver((mutations) => {
    for (const mut of mutations) {
      for (const node of mut.removedNodes) {
        if (node.nodeType !== 1) continue;
        // Clean up the removed node itself + any descendant buttons
        if (node.hasAttribute && node.hasAttribute('data-btn-id')) {
          _handlers.delete(node.getAttribute('data-btn-id'));
        }
        _cleanupOrphans(node);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

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
