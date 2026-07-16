/* global crypto: readonly */
// services/inventory.service.js
// Inventory Service: localStorage + defensive programming + migrasi data lama

import { safeGet, safeSet, STORAGE_KEYS } from '../utils/storage.js';

const LEGACY_KEY = 'stok_umkm_barang';

const CODE_PREFIX = 'INV-';
const CODE_RE = /^INV-(\d+)$/;

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

/**
 * Generate id unik (Primary Key internal).
 * Menggunakan crypto.randomUUID() dengan fallback untuk environment
 * yang tidak mendukung (mis. browser lama, HTTP non-localhost).
 * @returns {string}
 */
function generateId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch { /* fallback di bawah */ }
  return 'inv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/**
 * Generate code berikutnya: INV-001, INV-002, ...
 * Nomor TIDAK dipakai ulang: dihitung dari max suffix yang ada + 1.
 * Aman meski ada item yang dihapus (splice), karena berbasis max bukan length.
 * @returns {string}
 */
function generateNextCode() {
  const items = safeGet(STORAGE_KEYS.INVENTORY);
  let max = 0;
  for (const it of items) {
    const m = CODE_RE.exec(it.code || '');
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return CODE_PREFIX + String(max + 1).padStart(3, '0');
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
      const id = generateId();
      const code = generateNextCode();
      const item = { id, code, status: 'active', ...newItem };
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
