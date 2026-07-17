// utils/sanitize.js
// Shared sanitization utilities

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for innerHTML
 */
export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (char) => {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapeMap[char];
  });
}

/**
 * Sanitize user input by trimming and escaping
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
  return escapeHtml(String(input).trim());
}

/**
 * Escape string untuk atribut HTML (mencegah XSS di value="...").
 * Single source of truth — dipakai oleh page modules (customer, transaction, report).
 * @param {string} str
 * @returns {string}
 */
export function escapeAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}