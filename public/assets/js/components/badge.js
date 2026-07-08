// components/badge.js
// Reusable Badge component

export const Badge = {
  render: ({ text, variant = 'default' } = {}) => {
    return `<span class="badge badge-${variant}">${text}</span>`;
  }
};
