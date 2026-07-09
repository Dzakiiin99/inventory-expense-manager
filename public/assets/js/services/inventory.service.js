// services/inventory.service.js
// Inventory Service: localStorage + defensive programming + migrasi data lama

import { safeGet, safeSet, STORAGE_KEYS } from '../utils/storage.js';

const LEGACY_KEY = 'stok_umkm_barang';

// ---- Migrasi data lama -> model baru (backward compatible) ----
function migrateLegacyIfNeeded() {
  const existing = safeGet(STORAGE_KEYS.INVENTORY);
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
  safeSet(STORAGE_KEYS.INVENTORY, migrated);
}

function generateCode(id) {
  return `INV-${String(id).padStart(3, '0')}`;
}

// Inisialisasi migrasi saat module load
migrateLegacyIfNeeded();

export const InventoryService = {
  getAllItems: () => new Promise((resolve) => {
    setTimeout(() => resolve([...safeGet(STORAGE_KEYS.INVENTORY)]), 500);
  }),
  getItemById: (id) => new Promise((resolve) => {
    setTimeout(() => {
      const item = safeGet(STORAGE_KEYS.INVENTORY).find((i) => i.id === id);
      resolve(item ? { ...item } : null);
    }, 500);
  }),
  addItem: (newItem) => new Promise((resolve) => {
    setTimeout(() => {
      const items = safeGet(STORAGE_KEYS.INVENTORY);
      const id = (items.length + 1).toString();
      const item = { id, code: generateCode(id), status: 'active', ...newItem };
      items.push(item);
      safeSet(STORAGE_KEYS.INVENTORY, items);
      resolve(item);
    }, 500);
  }),
  updateItem: (id, updatedItem) => new Promise((resolve) => {
    setTimeout(() => {
      const items = safeGet(STORAGE_KEYS.INVENTORY);
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) { resolve(null); return; }
      items[idx] = { ...items[idx], ...updatedItem };
      safeSet(STORAGE_KEYS.INVENTORY, items);
      resolve(items[idx]);
    }, 500);
  }),
  deleteItem: (id) => new Promise((resolve) => {
    setTimeout(() => {
      const items = safeGet(STORAGE_KEYS.INVENTORY);
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) { resolve(false); return; }
      items.splice(idx, 1);
      safeSet(STORAGE_KEYS.INVENTORY, items);
      resolve(true);
    }, 500);
  }),
  // Helper untuk update stok (dipakai stock-movement)
  adjustStock: (id, delta) => new Promise((resolve, reject) => {
    setTimeout(() => {
      const items = safeGet(STORAGE_KEYS.INVENTORY);
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) { reject(new Error('Barang tidak ditemukan')); return; }
      const newStock = items[idx].stock + delta;
      if (newStock < 0) { reject(new Error('Stok tidak cukup')); return; }
      items[idx] = { ...items[idx], stock: newStock };
      safeSet(STORAGE_KEYS.INVENTORY, items);
      resolve(items[idx]);
    }, 500);
  })
};