// pages/transaction/transaction.state.js
// State + pure logic untuk halaman transaksi.
// DOM-free → aman di-impor & di-unit test di Node (tanpa jsdom).

export const PAGE_SIZE = 10;

// Shared mutable state. Satu object reference dishare ke semua modul
// (render + orchestrator) sehingga update terlihat global tanpa global var.
export const state = {
  items: [],
  searchQuery: '',
  filterPaymentMethod: '', // '' = semua, 'cash', 'transfer'
  filterCustomer: '',      // '' = semua, customerId
  sortBy: 'date-desc',
  currentPage: 1,
};

const collator = new Intl.Collator('id', { sensitivity: 'base', numeric: false });

// Strategy map untuk sorting (Open/Closed: tambah opsi = tambah entry, bukan ubah logic)
export const SORTERS = {
  'date-desc':     (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  'date-asc':      (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
  'amount-desc':   (a, b) => (b.total || 0) - (a.total || 0),
  'amount-asc':    (a, b) => (a.total || 0) - (b.total || 0),
  'customer-asc':  (a, b) => collator.compare(a.customerName || '', b.customerName || ''),
  'customer-desc': (a, b) => collator.compare(b.customerName || '', a.customerName || ''),
};

/**
 * Pure filter pipeline: search → payment method → customer → sort.
 * @param {object} s - state object (default: state)
 * @returns {Array} filtered & sorted transactions
 */
export function getVisibleItems(s = state) {
  const q = (s.searchQuery || '').trim().toLowerCase();
  const result = s.items.filter((t) => {
    // Skip soft-deleted items
    if (t.isDeleted) return false;

    // Search: transactionCode / customerName / itemName, case-insensitive, substring
    if (q) {
      const match =
        (t.transactionCode || '').toLowerCase().includes(q) ||
        (t.customerName || '').toLowerCase().includes(q) ||
        (t.items || []).some((item) => (item.itemName || '').toLowerCase().includes(q));
      if (!match) return false;
    }

    // Filter payment method
    if (s.filterPaymentMethod && t.paymentMethod !== s.filterPaymentMethod) {
      return false;
    }

    // Filter customer
    if (s.filterCustomer && t.customerId !== s.filterCustomer) {
      return false;
    }

    return true;
  });

  // Sort (pure, non-mutating via spread)
  const sorted = [...result];
  const sorter = SORTERS[s.sortBy];
  if (sorter) sorted.sort(sorter);
  return sorted;
}

/**
 * Pure: hitung nilai untuk stat cards (single source of truth).
 * @param {object} s - state object (default: state)
 * @returns {object} { totalTransactions, totalRevenue, cashTransactions, transferTransactions, averageTransactionValue }
 */
export function computeStats(s = state) {
  // Hanya hitung transaksi yang tidak di-soft-delete
  const activeItems = s.items.filter((t) => !t.isDeleted);
  const totalTransactions = activeItems.length;
  const totalRevenue = activeItems.reduce((sum, t) => sum + (t.total || 0), 0);
  const cashTransactions = activeItems.filter((t) => t.paymentMethod === 'cash').length;
  const transferTransactions = activeItems.filter((t) => t.paymentMethod === 'transfer').length;
  const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  return {
    totalTransactions,
    totalRevenue,
    cashTransactions,
    transferTransactions,
    averageTransactionValue
  };
}

/**
 * Pure: total halaman (min 1).
 * @param {number} visibleCount - jumlah item yang terlihat
 * @param {number} pageSize - ukuran halaman (default: PAGE_SIZE)
 * @returns {number}
 */
export function getTotalPages(visibleCount, pageSize = PAGE_SIZE) {
  return Math.max(1, Math.ceil(visibleCount / pageSize));
}
