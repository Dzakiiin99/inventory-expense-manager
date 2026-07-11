// pages/inventory/inventory.state.js
// State + pure logic untuk halaman inventori.
// DOM-free → aman di-impor & di-unit test di Node (tanpa jsdom).
import { getStockLevel } from '../../utils/index.js';

export const PAGE_SIZE = 10;

// Shared mutable state. Satu object reference dishare ke semua modul
// (render + orchestrator) sehingga update terlihat global tanpa global var.
export const state = {
  items: [],
  searchQuery: '',
  filterCategory: '',
  filterStock: '',
  sortBy: 'name-asc',
  currentPage: 1,
  importParsed: null, // hasil parse CSV import, untuk preview sebelum apply
};

const collator = new Intl.Collator('id', { sensitivity: 'base', numeric: false });

// Strategy map untuk sorting (Open/Closed: tambah opsi = tambah entry, bukan ubah logic)
export const SORTERS = {
  'name-asc':     (a, b) => collator.compare(a.name || '', b.name || ''),
  'name-desc':    (a, b) => collator.compare(b.name || '', a.name || ''),
  'price-asc':    (a, b) => (a.price || 0) - (b.price || 0),
  'price-desc':   (a, b) => (b.price || 0) - (a.price || 0),
  'stock-asc':    (a, b) => (a.stock || 0) - (b.stock || 0),
  'stock-desc':   (a, b) => (b.stock || 0) - (a.stock || 0),
  'category-asc': (a, b) => collator.compare(a.category || '', b.category || ''),
};

// Pure filter pipeline: search → kategori → stok → sort
export function getVisibleItems(s = state) {
  const q = (s.searchQuery || '').trim().toLowerCase();
  const result = s.items.filter((it) => {
    // Search: nama / SKU (code) / kategori, case-insensitive, substring
    if (q) {
      const match =
        (it.name || '').toLowerCase().includes(q) ||
        (it.code || '').toLowerCase().includes(q) ||
        (it.category || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    // Filter kategori
    if (s.filterCategory && it.category !== s.filterCategory) return false;
    // Filter stok
    if (s.filterStock && getStockLevel(it.stock) !== s.filterStock) return false;
    return true;
  });

  // Sort (pure, non-mutating via spread)
  const sorted = [...result];
  const sorter = SORTERS[s.sortBy];
  if (sorter) sorted.sort(sorter);
  return sorted;
}

// Derive kategori unik dari items (sorted, pure)
export function getUniqueCategories(s = state) {
  const cats = [...new Set(s.items.map((i) => i.category).filter(Boolean))];
  cats.sort((a, b) => a.localeCompare(b, 'id'));
  return cats;
}

// Pure: hitung nilai untuk stat cards
export function computeStats(s = state) {
  const items = s.items;
  const totalBarang = items.length;
  const nilaiInventory = items.reduce((sum, i) => sum + ((i.price || 0) * (i.stock || 0)), 0);
  const stokRendah = items.filter((i) => getStockLevel(i.stock) === 'rendah').length;
  const stokHabis = items.filter((i) => getStockLevel(i.stock) === 'habis').length;
  return { totalBarang, nilaiInventory, stokRendah, stokHabis };
}

// Pure: total halaman (min 1)
export function getTotalPages(visibleCount, pageSize = PAGE_SIZE) {
  return Math.max(1, Math.ceil(visibleCount / pageSize));
}
