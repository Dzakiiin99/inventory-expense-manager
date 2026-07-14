// pages/customer/customer.state.js
// State + pure logic untuk halaman pelanggan.
// DOM-free → aman di-impor & di-unit test di Node (tanpa jsdom).

export const PAGE_SIZE = 10;

// Shared mutable state. Satu object reference dishare ke semua modul
// (render + orchestrator) sehingga update terlihat global tanpa global var.
export const state = {
  items: [],
  searchQuery: '',
  filterStatus: '', // '' = semua, 'active', 'inactive'
  sortBy: 'name-asc',
  currentPage: 1,
  importParsed: null, // hasil parse CSV import, untuk preview sebelum apply
};

const collator = new Intl.Collator('id', { sensitivity: 'base', numeric: false });

// Strategy map untuk sorting (Open/Closed: tambah opsi = tambah entry, bukan ubah logic)
export const SORTERS = {
  'name-asc':  (a, b) => collator.compare(a.name || '', b.name || ''),
  'name-desc': (a, b) => collator.compare(b.name || '', a.name || ''),
  'date-asc':  (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
  'date-desc': (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
};

/**
 * Pure filter pipeline: search → status → sort.
 * @param {object} s - state object (default: state)
 * @returns {Array} filtered & sorted customers
 */
export function getVisibleItems(s = state) {
  const q = (s.searchQuery || '').trim().toLowerCase();
  const result = s.items.filter((c) => {
    // Search: name / code / phone / address, case-insensitive, substring
    if (q) {
      const match =
        (c.name || '').toLowerCase().includes(q) ||
        (c.customerCode || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    // Filter status
    if (s.filterStatus === 'active' && !c.isActive) return false;
    if (s.filterStatus === 'inactive' && c.isActive) return false;
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
 * @returns {object} { totalCustomers, activeCustomers, inactiveCustomers, noEmailCustomers, noPhoneCustomers }
 */
export function computeStats(s = state) {
  const items = s.items;
  const totalCustomers = items.length;
  const activeCustomers = items.filter((c) => c.isActive).length;
  const inactiveCustomers = totalCustomers - activeCustomers;
  const noEmailCustomers = items.filter((c) => !(c.email || '').trim()).length;
  const noPhoneCustomers = items.filter((c) => !(c.phone || '').trim()).length;

  return { totalCustomers, activeCustomers, inactiveCustomers, noEmailCustomers, noPhoneCustomers };
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
