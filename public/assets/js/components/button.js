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
}