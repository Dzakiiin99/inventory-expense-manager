// components/input.js
// Reusable Input component

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
          value="${value}"
          placeholder="${placeholder}"
          ${requiredAttr}
          ${minAttr}
          class="input-field"
        />
      </div>
    `;
  }
};
