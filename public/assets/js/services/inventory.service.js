// services/inventory.service.js
// Inventory Service: localStorage + defensive programming + migrasi data lama

const STORAGE_KEY = 'umkm_crm_inventory';
const LEGACY_KEY = 'stok_umkm_barang';

// ---- Defensive storage helpers (di-port dari backup) ----
function isLocalStorageAvailable() {
  try {
    const k = '__test__';
    localStorage.setItem(k, k);
    localStorage.removeItem(k);
    return true;
  } catch (e) {
    console.error('localStorage tidak tersedia:', e);
    return false;
  }
}

function safeGet(key) {
  try {
    if (!isLocalStorageAvailable()) {
      return JSON.parse(sessionStorage.getItem(key)) || [];
    }
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`Gagal membaca ${key}:`, e);
    return [];
  }
}

function safeSet(key, data) {
  try {
    if (!isLocalStorageAvailable()) {
      sessionStorage.setItem(key, JSON.stringify(data));
      return true;
    }
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error(`Gagal menyimpan ${key}:`, e);
    return false;
  }
}

// ---- Migrasi data lama -> model baru (backward compatible) ----
function migrateLegacyIfNeeded() {
  const existing = safeGet(STORAGE_KEY);
  if (existing.length > 0) return; // sudah migrasi
  const legacy = safeGet(LEGACY_KEY);
  if (legacy.length === 0) return; // tidak ada data lama
  const migrated = legacy.map((item) => ({
    id: String(item.id),
    code: `INV-${String(item.id).padStart(3, '0')}`,
    name: item.nama || '',
    category: '',
    stock: Number(item.stok) || 0,
    unit: '',
    price: Number(item.harga) || 0,
    status: 'active'
  }));
  safeSet(STORAGE_KEY, migrated);
}

function generateCode(id) {
  return `INV-${String(id).padStart(3, '0')}`;
}

// Inisialisasi migrasi saat module load
migrateLegacyIfNeeded();

export const InventoryService = {
  getAllItems: () => new Promise((resolve) => {
    setTimeout(() => resolve([...safeGet(STORAGE_KEY)]), 500);
  }),
  getItemById: (id) => new Promise((resolve) => {
    setTimeout(() => {
      const item = safeGet(STORAGE_KEY).find((i) => i.id === id);
      resolve(item ? { ...item } : null);
    }, 500);
  }),
  addItem: (newItem) => new Promise((resolve) => {
    setTimeout(() => {
      const items = safeGet(STORAGE_KEY);
      const id = (items.length + 1).toString();
      const item = { id, code: generateCode(id), status: 'active', ...newItem };
      items.push(item);
      safeSet(STORAGE_KEY, items);
      resolve(item);
    }, 500);
  }),
  updateItem: (id, updatedItem) => new Promise((resolve) => {
    setTimeout(() => {
      const items = safeGet(STORAGE_KEY);
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) { resolve(null); return; }
      items[idx] = { ...items[idx], ...updatedItem };
      safeSet(STORAGE_KEY, items);
      resolve(items[idx]);
    }, 500);
  }),
  deleteItem: (id) => new Promise((resolve) => {
    setTimeout(() => {
      const items = safeGet(STORAGE_KEY);
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) { resolve(false); return; }
      items.splice(idx, 1);
      safeSet(STORAGE_KEY, items);
      resolve(true);
    }, 500);
  }),
  // Helper untuk update stok (dipakai stock-movement)
  adjustStock: (id, delta) => new Promise((resolve, reject) => {
    setTimeout(() => {
      const items = safeGet(STORAGE_KEY);
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) { reject(new Error('Barang tidak ditemukan')); return; }
      const newStock = items[idx].stock + delta;
      if (newStock < 0) { reject(new Error('Stok tidak cukup')); return; }
      items[idx] = { ...items[idx], stock: newStock };
      safeSet(STORAGE_KEY, items);
      resolve(items[idx]);
    }, 500);
  })
};
