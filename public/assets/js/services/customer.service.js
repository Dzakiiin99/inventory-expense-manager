/* global crypto: readonly */
// services/customer.service.js
// Customer Service — lapisan bisnis Customer Module (Sprint 7, Phase 2.1).
// Mengikuti pola inventory.service.js / expense.service.js:
//   - Akses storage via safeGet/safeSet (defensive, TIDAK localStorage langsung)
//   - Operasi async dibungkus Promise + setTimeout (simulasi latency)
//   - Tidak ada DOM, tidak ada HTML, tidak ada event listener, tidak ada UI
//
// Strategi delete: INACTIVE FLAG (sesuai Design Freeze V2).
//   deleteCustomer() menyetel isActive=false; record TETAP ada agar aman
//   untuk audit & future Report/Sales/Invoice/Payment.
//
// CATATAN SCOPE PHASE 2.1:
//   - HANYA file ini yang dibuat. utils/storage.js TIDAK diubah, sehingga
//     storage key didefinisikan lokal di bawah. Centralisasi ke
//     STORAGE_KEYS.CUSTOMERS ditunda ke step di mana storage.js boleh diubah.
//   - id menggunakan crypto.randomUUID() (PK internal, unik, standard).
//     Lihat "Potensi Risiko" & "Self Review" di laporan Phase 2.1.

import { safeGet, safeSet } from '../utils/storage.js';

// Key storage lokal (nilai identik dengan rencana STORAGE_KEYS.CUSTOMERS).
// TODO(Sprint7): pindahkan ke STORAGE_KEYS.CUSTOMERS saat storage.js dalam scope.
const STORAGE_KEY = 'umkm_crm_customers';

// Latency simulasi (konsisten dengan expense.service = 300ms).
const LATENCY = 300;

const CODE_PREFIX = 'CUST';
const CODE_RE = /^CUST(\d+)$/;

/**
 * Generate customerCode berikutnya: CUST0001, CUST0002, ...
 * Nomor TIDAK dipakai ulang: dihitung dari max suffix yang ada + 1.
 * Karena delete = Inactive Flag (record tetap tersimpan), max hanya naik
 * sehingga penomoran monotonic & bebas reuse.
 * @returns {string} customerCode unik berikutnya (deterministik terhadap storage)
 */
export function generateCustomerCode() {
  const customers = safeGet(STORAGE_KEY);
  let max = 0;
  for (const c of customers) {
    const m = CODE_RE.exec(c.customerCode || '');
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  const next = max + 1;
  return CODE_PREFIX + String(next).padStart(4, '0');
}

/**
 * Cek apakah customerCode sudah terpakai.
 * @param {string} customerCode
 * @returns {boolean} true bila sudah ada
 */
export function customerExists(customerCode) {
  if (!customerCode) return false;
  const customers = safeGet(STORAGE_KEY);
  return customers.some((c) => c.customerCode === customerCode);
}

/**
 * Ambil semua customer (aktif + nonaktif).
 * Filter isActive dilakukan di layer state (customers.state.js).
 * @returns {Promise<Array<Object>>}
 */
export const getAllCustomers = () => new Promise((resolve) => {
  setTimeout(() => resolve([...safeGet(STORAGE_KEY)]), LATENCY);
});

/**
 * Ambil customer berdasarkan id.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export const getCustomerById = (id) => new Promise((resolve) => {
  setTimeout(() => {
    const found = safeGet(STORAGE_KEY).find((c) => c.id === id);
    resolve(found ? { ...found } : null);
  }, LATENCY);
});

/**
 * Buat customer baru.
 * @param {Object} customer - { name, phone?, email?, address?, notes? }
 * @returns {Promise<Object>} record tersimpan (lengkap dengan id, customerCode, timestamps)
 * @throws {Error} bila name kosong / kurang dari 2 karakter
 */
export const createCustomer = (customer) => new Promise((resolve, reject) => {
  setTimeout(() => {
    const data = customer || {};
    const name = (data.name || '').trim();
    if (name.length < 2) {
      reject(new Error('Nama wajib diisi (minimal 2 karakter)'));
      return;
    }
    const now = new Date().toISOString();
    const record = {
      id: generateId(),
      customerCode: generateCustomerCode(),
      name,
      phone: (data.phone || '').toString().trim(),
      email: (data.email || '').toString().trim(),
      address: (data.address || '').toString(),
      notes: (data.notes || '').toString(),
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    const list = safeGet(STORAGE_KEY);
    list.push(record);
    safeSet(STORAGE_KEY, list);
    resolve(record);
  }, LATENCY);
});

/**
 * Update customer (partial). Field id, customerCode, createdAt TIDAK berubah.
 * @param {string} id
 * @param {Object} customer - field yang diupdate (name?, phone?, email?, address?, notes?, isActive?)
 * @returns {Promise<Object|null>} record ter-update, atau null bila id tidak ditemukan
 * @throws {Error} bila name di-update menjadi kosong / kurang dari 2 karakter
 */
export const updateCustomer = (id, customer) => new Promise((resolve, reject) => {
  setTimeout(() => {
    const list = safeGet(STORAGE_KEY);
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) { resolve(null); return; }

    const data = customer || {};
    if (data.name !== undefined) {
      const name = (data.name || '').trim();
      if (name.length < 2) {
        reject(new Error('Nama wajib diisi (minimal 2 karakter)'));
        return;
      }
      list[idx].name = name;
    }
    if (data.phone !== undefined) list[idx].phone = (data.phone || '').toString().trim();
    if (data.email !== undefined) list[idx].email = (data.email || '').toString().trim();
    if (data.address !== undefined) list[idx].address = (data.address || '').toString();
    if (data.notes !== undefined) list[idx].notes = (data.notes || '').toString();
    if (data.isActive !== undefined) list[idx].isActive = !!data.isActive;

    list[idx].updatedAt = new Date().toISOString();
    safeSet(STORAGE_KEY, list);
    resolve({ ...list[idx] });
  }, LATENCY);
});

/**
 * Delete customer = Inactive Flag (isActive=false). Record TETAP ada.
 * @param {string} id
 * @returns {Promise<boolean>} true bila berhasil, false bila id tidak ditemukan
 */
export const deleteCustomer = (id) => new Promise((resolve) => {
  setTimeout(() => {
    const list = safeGet(STORAGE_KEY);
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) { resolve(false); return; }
    list[idx].isActive = false;
    list[idx].updatedAt = new Date().toISOString();
    safeSet(STORAGE_KEY, list);
    resolve(true);
  }, LATENCY);
});

/**
 * Generate id unik (Primary Key internal, terpisah dari customerCode).
 * @returns {string}
 */
function generateId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch { /* fallback di bawah */ }
  return 'cust_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/**
 * Aggregat service (konsisten dengan InventoryService / ExpenseService).
 * Memungkinkan `import { CustomerService } from '...'` maupun import per-fungsi.
 */
export const CustomerService = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  generateCustomerCode,
  customerExists
};
