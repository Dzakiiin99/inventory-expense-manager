// utils/storage.js
// Centralized localStorage access with defensive programming

/**
 * Storage keys used by the application
 */
export const STORAGE_KEYS = {
  INVENTORY: 'umkm_crm_inventory',
  EXPENSES: 'umkm_crm_expenses',
  STOCK_IN: 'umkm_crm_stock_in',
  STOCK_OUT: 'umkm_crm_stock_out',
  SIDEBAR_STATE: 'sidebar_collapsed'
};

/**
 * Check if localStorage is available
 * @returns {boolean} True if localStorage is available
 */
function isLocalStorageAvailable() {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('localStorage tidak tersedia:', e);
    return false;
  }
}

/**
 * Safely get data from localStorage
 * @param {string} key - Storage key
 * @param {Array} defaultValue - Default value if key doesn't exist
 * @returns {Array} Parsed array or default value
 */
export function safeGet(key, defaultValue = []) {
  try {
    if (!isLocalStorageAvailable()) {
      return defaultValue;
    }
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultValue;
  } catch (e) {
    console.error(`Gagal membaca ${key}:`, e);
    return defaultValue;
  }
}

/**
 * Safely set data to localStorage
 * @param {string} key - Storage key
 * @param {any} data - Data to store
 * @returns {boolean} True if successful
 */
export function safeSet(key, data) {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage tidak tersedia, data tidak disimpan');
      return false;
    }
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error(`Gagal menyimpan ${key}:`, e);
    return false;
  }
}

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} True if successful
 */
export function safeRemove(key) {
  try {
    if (!isLocalStorageAvailable()) {
      return false;
    }
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error(`Gagal menghapus ${key}:`, e);
    return false;
  }
}