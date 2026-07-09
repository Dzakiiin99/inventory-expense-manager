// utils/index.js
// Central export for all utilities

export { formatCurrency, formatDate, formatNumber } from './format.js';
export { escapeHtml, sanitizeInput } from './sanitize.js';
export { safeGet, safeSet, safeRemove, STORAGE_KEYS } from './storage.js';
export { getStockLevel, getStockBadgeVariant } from './stock-level.js';