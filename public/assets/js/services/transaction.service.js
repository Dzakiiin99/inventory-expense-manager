/* global crypto: readonly */
// services/transaction.service.js
// Transaction Service — lapisan bisnis Sales Module (Sprint 8, Phase 2.1).
// Mengikuti pola customer.service.js:
//   - Akses storage via safeGet/safeSet (defensive, TIDAK localStorage langsung)
//   - Operasi async dibungkus Promise + setTimeout (simulasi latency)
//   - Tidak ada DOM, tidak ada HTML, tidak ada event listener, tidak ada UI
//
// Strategi delete: SOFT DELETE (isDeleted=true).
//   deleteTransaction() menyetel isDeleted=true; record TETAP ada agar aman
//   untuk audit trail & riwayat transaksi.
//
// CATATAN SCOPE PHASE 2.1:
//   - HANYA file ini yang dibuat.
//   - storage key didefinisikan lokal di bawah.
//   - id menggunakan crypto.randomUUID() (PK internal, unik, standard).

import { safeGet, safeSet } from '../utils/storage.js';

// Key storage lokal.
const STORAGE_KEY = 'umkm_crm_transactions';

// Latency simulasi (konsisten dengan customer.service = 300ms).
const LATENCY = 300;

const CODE_PREFIX = 'TRX';
const CODE_RE = /^TRX(\d+)$/;

/** Payment methods yang didukung. */
export const PAYMENT_METHODS = ['cash', 'transfer'];

/**
 * Generate transactionCode berikutnya: TRX0001, TRX0002, ...
 * Nomor TIDAK dipakai ulang: dihitung dari max suffix yang ada + 1.
 * Karena delete = Soft Delete (record tetap tersimpan), max hanya naik
 * sehingga penomoran monotonic & bebas reuse.
 * @returns {string} transactionCode unik berikutnya (deterministik terhadap storage)
 */
export function generateTransactionCode() {
  const transactions = safeGet(STORAGE_KEY);
  let max = 0;
  for (const t of transactions) {
    const m = CODE_RE.exec(t.transactionCode || '');
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  const next = max + 1;
  return CODE_PREFIX + String(next).padStart(4, '0');
}

/**
 * Cek apakah transactionCode sudah terpakai.
 * @param {string} transactionCode
 * @returns {boolean} true bila sudah ada
 */
export function transactionExists(transactionCode) {
  if (!transactionCode) return false;
  const transactions = safeGet(STORAGE_KEY);
  return transactions.some((t) => t.transactionCode === transactionCode);
}

/**
 * Ambil semua transaksi (termasuk yang di-soft-delete).
 * Filter isDeleted dilakukan di layer state (transaction.state.js).
 * @returns {Promise<Array<Object>>}
 */
export const getAllTransactions = () => new Promise((resolve) => {
  setTimeout(() => resolve([...safeGet(STORAGE_KEY)]), LATENCY);
});

/**
 * Ambil transaksi berdasarkan id.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export const getTransactionById = (id) => new Promise((resolve) => {
  setTimeout(() => {
    const found = safeGet(STORAGE_KEY).find((t) => t.id === id);
    resolve(found ? { ...found } : null);
  }, LATENCY);
});

/**
 * Validasi data transaksi sebelum create/update.
 * @param {Object} data - data transaksi
 * @param {boolean} isCreate - true untuk create, false untuk update
 * @throws {Error} bila validasi gagal
 */
function validate(data, isCreate = true) {
  if (isCreate) {
    if (!data.customerId || !data.customerId.toString().trim()) {
      throw new Error('Customer wajib dipilih');
    }
  }

  if (data.items !== undefined) {
    if (!Array.isArray(data.items)) {
      throw new Error('Items harus berupa array');
    }
    if (isCreate && data.items.length < 1) {
      throw new Error('Minimal 1 item diperlukan');
    }
    if (data.items.length > 100) {
      throw new Error('Maksimal 100 item per transaksi');
    }
    // Validasi setiap item
    for (const item of data.items) {
      if (!item.inventoryId) {
        throw new Error('Setiap item harus memiliki inventoryId');
      }
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        throw new Error('Quantity harus angka positif');
      }
      if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
        throw new Error('Harga satuan harus angka >= 0');
      }
    }
  }

  if (data.discount !== undefined && (isNaN(data.discount) || data.discount < 0)) {
    throw new Error('Discount harus angka >= 0');
  }

  if (data.paymentMethod !== undefined) {
    if (!PAYMENT_METHODS.includes(data.paymentMethod)) {
      throw new Error('Payment method harus ' + PAYMENT_METHODS.join(' atau '));
    }
  }
}

/**
 * Buat transaksi baru.
 * @param {Object} transaction - { customerId, items, subtotal?, discount?, total?, paymentMethod?, notes? }
 * @returns {Promise<Object>} record tersimpan (lengkap dengan id, transactionCode, timestamps)
 * @throws {Error} bila validasi gagal
 */
export const createTransaction = (transaction) => new Promise((resolve, reject) => {
  setTimeout(() => {
    try {
      const data = transaction || {};
      validate(data, true);

      const now = new Date().toISOString();

      // Hitung ulang subtotal per item dan total (jangan percaya input)
      const items = (data.items || []).map((item) => {
        const qty = Number(item.quantity);
        const price = Number(item.unitPrice);
        return {
          id: generateId(),
          inventoryId: item.inventoryId.toString(),
          itemCode: (item.itemCode || '').toString().trim(),
          itemName: (item.itemName || '').toString().trim(),
          name: (item.name || '').toString().trim(),
          unit: (item.unit || '').toString().trim(),
          quantity: qty,
          unitPrice: price,
          subtotal: qty * price
        };
      });

      const computedSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const discount = Number(data.discount) || 0;
      const computedTotal = Math.max(0, computedSubtotal - discount);

      const record = {
        id: generateId(),
        transactionCode: generateTransactionCode(),
        customerId: data.customerId.toString().trim(),
        customerName: (data.customerName || '').toString().trim(),
        items,
        subtotal: computedSubtotal,
        discount,
        total: computedTotal,
        paymentMethod: (data.paymentMethod || 'cash').toString(),
        notes: (data.notes || '').toString(),
        isDeleted: false,
        createdAt: now,
        updatedAt: now
      };

      const list = safeGet(STORAGE_KEY);
      list.push(record);
      safeSet(STORAGE_KEY, list);
      resolve(record);
    } catch (err) {
      reject(err);
    }
  }, LATENCY);
});

/**
 * Update transaksi (partial). Field id, transactionCode, createdAt TIDAK berubah.
 * @param {string} id
 * @param {Object} transaction - field yang diupdate
 * @returns {Promise<Object|null>} record ter-update, atau null bila id tidak ditemukan
 * @throws {Error} bila validasi gagal
 */
export const updateTransaction = (id, transaction) => new Promise((resolve, reject) => {
  setTimeout(() => {
    try {
      const list = safeGet(STORAGE_KEY);
      const idx = list.findIndex((t) => t.id === id);
      if (idx === -1) { resolve(null); return; }

      const data = transaction || {};
      validate(data, false);

      if (data.customerId !== undefined) list[idx].customerId = data.customerId.toString().trim();
      if (data.customerName !== undefined) list[idx].customerName = data.customerName.toString().trim();
      if (data.items !== undefined) {
        list[idx].items = data.items.map((item) => {
          const qty = Number(item.quantity);
          const price = Number(item.unitPrice);
          return {
            id: item.id || generateId(),
            inventoryId: item.inventoryId.toString(),
            itemCode: (item.itemCode || '').toString().trim(),
            itemName: (item.itemName || '').toString().trim(),
            name: (item.name || '').toString().trim(),
            unit: (item.unit || '').toString().trim(),
            quantity: qty,
            unitPrice: price,
            subtotal: qty * price
          };
        });
        // Hitung ulang subtotal dari items
        list[idx].subtotal = list[idx].items.reduce((sum, item) => sum + item.subtotal, 0);
      }
      if (data.discount !== undefined) {
        list[idx].discount = Number(data.discount);
      }
      // Hitung ulang total = subtotal - discount
      list[idx].total = Math.max(0, (list[idx].subtotal || 0) - (list[idx].discount || 0));
      if (data.paymentMethod !== undefined) list[idx].paymentMethod = data.paymentMethod.toString();
      if (data.notes !== undefined) list[idx].notes = data.notes.toString();

      list[idx].updatedAt = new Date().toISOString();
      safeSet(STORAGE_KEY, list);
      resolve({ ...list[idx] });
    } catch (err) {
      reject(err);
    }
  }, LATENCY);
});

/**
 * Delete transaksi = Soft Delete (isDeleted=true). Record TETAP ada.
 * @param {string} id
 * @returns {Promise<boolean>} true bila berhasil, false bila id tidak ditemukan
 */
export const deleteTransaction = (id) => new Promise((resolve) => {
  setTimeout(() => {
    const list = safeGet(STORAGE_KEY);
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) { resolve(false); return; }
    list[idx].isDeleted = true;
    list[idx].updatedAt = new Date().toISOString();
    safeSet(STORAGE_KEY, list);
    resolve(true);
  }, LATENCY);
});

/**
 * Generate id unik (Primary Key internal, terpisah dari transactionCode).
 * @returns {string}
 */
function generateId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch { /* fallback di bawah */ }
  return 'trx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/**
 * Aggregat service (konsisten dengan CustomerService).
 * Memungkinkan `import { TransactionService } from '...'` maupun import per-fungsi.
 */
export const TransactionService = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  generateTransactionCode,
  transactionExists
};
