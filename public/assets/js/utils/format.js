// utils/format.js
// Shared formatting utilities

/**
 * Format number to Indonesian Rupiah currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return `Rp ${Number(amount).toLocaleString('id-ID')}`;
}

/**
 * Format ISO date string to Indonesian locale
 * @param {string} isoDate - ISO date string
 * @param {boolean} [includeTime=false] - Whether to include time
 * @returns {string} Formatted date string
 */
export function formatDate(isoDate, includeTime = false) {
  const date = new Date(isoDate);
  if (includeTime) {
    return date.toLocaleString('id-ID');
  }
  return date.toLocaleDateString('id-ID');
}

/**
 * Format number with Indonesian locale
 * @param {number} number - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(number) {
  return Number(number).toLocaleString('id-ID');
}