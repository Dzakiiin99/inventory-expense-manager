// components/input.js
// Reusable Input component

import { escapeHtml } from '../utils/index.js';

export const Input = {
  render: ({ label, name, value = '', type = 'text', placeholder = '', required = false, min } = {}) => {
    const requiredAttr = required ? 'required' : '';
    const minAttr = (min !== undefined && min !== '') ? `min="${min}"` : '';
    return `
      <div class="form-group">
        <label for="${name}">${label}${required ? ' *' : ''}</label>
        <input
          type="${type}"
          id="${name}"
          name="${name}"
          value="${escapeHtml(value)}"
          placeholder="${escapeHtml(placeholder)}"
          ${requiredAttr}
          ${minAttr}
          class="input-field"
        />
      </div>
    `;
  }
};
