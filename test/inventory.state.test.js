// test/inventory.state.test.js
// Unit test untuk pure logic halaman inventori (DOM-free).
// Jalankan: npm test  (node --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PAGE_SIZE,
  SORTERS,
  getVisibleItems,
  getUniqueCategories,
  computeStats,
  getTotalPages,
} from '../public/assets/js/pages/inventory/inventory.state.js';

// Fixture: stok 10(aman), 3(rendah), 0(habis), 2(rendah)
const items = [
  { id: '1', code: 'A1', name: 'Apel',   category: 'Buah',  stock: 10, price: 1000, unit: 'pcs' },
  { id: '2', code: 'B2', name: 'Berri',  category: 'Buah',  stock: 3,  price: 2000, unit: 'pcs' },
  { id: '3', code: 'C3', name: 'Ceri',   category: 'Sayur', stock: 0,  price: 500,  unit: 'pcs' },
  { id: '4', code: 'D4', name: 'Durian', category: 'Buah',  stock: 2,  price: 5000, unit: 'pcs' },
];

const base = () => ({
  items: items.map((i) => ({ ...i })),
  searchQuery: '',
  filterCategory: '',
  filterStock: '',
  sortBy: 'name-asc',
  currentPage: 1,
  importParsed: null,
});

test('getVisibleItems: tanpa filter mengembalikan semua (urut name-asc)', () => {
  const s = base();
  s.sortBy = 'name-asc';
  const vis = getVisibleItems(s);
  assert.equal(vis.length, 4);
  assert.deepEqual(vis.map((i) => i.name), ['Apel', 'Berri', 'Ceri', 'Durian']);
});

test('getVisibleItems: search case-insensitive by nama', () => {
  const s = base();
  s.searchQuery = 'AP'; // cocok "Apel"
  const vis = getVisibleItems(s);
  assert.deepEqual(vis.map((i) => i.name), ['Apel']);
});

test('getVisibleItems: search by kategori (substring)', () => {
  const s = base();
  s.searchQuery = 'buah'; // cocok kategori Buah (3 item)
  const vis = getVisibleItems(s);
  assert.equal(vis.length, 3);
  assert.ok(vis.every((i) => i.category === 'Buah'));
});

test('getVisibleItems: filter kategori eksak', () => {
  const s = base();
  s.filterCategory = 'Buah';
  const vis = getVisibleItems(s);
  assert.equal(vis.length, 3);
});

test('getVisibleItems: filter stok habis / rendah / aman', () => {
  const habis = getVisibleItems({ ...base(), filterStock: 'habis' });
  assert.deepEqual(habis.map((i) => i.name), ['Ceri']);

  const rendah = getVisibleItems({ ...base(), filterStock: 'rendah' });
  assert.deepEqual(rendah.map((i) => i.name).sort(), ['Berri', 'Durian']);

  const aman = getVisibleItems({ ...base(), filterStock: 'aman' });
  assert.deepEqual(aman.map((i) => i.name), ['Apel']);
});

test('getVisibleItems: kombinasi search + filter kategori', () => {
  const s = base();
  s.searchQuery = 'r';
  s.filterCategory = 'Buah';
  // nama mengandung 'r' & kategori Buah: Berri, Durian
  const vis = getVisibleItems(s);
  assert.deepEqual(vis.map((i) => i.name).sort(), ['Berri', 'Durian']);
});

test('SORTERS: name-desc membalik urutan', () => {
  const s = base();
  s.sortBy = 'name-desc';
  const vis = getVisibleItems(s);
  assert.deepEqual(vis.map((i) => i.name), ['Durian', 'Ceri', 'Berri', 'Apel']);
});

test('SORTERS: price-asc & price-desc', () => {
  const asc = getVisibleItems({ ...base(), sortBy: 'price-asc' });
  assert.deepEqual(asc.map((i) => i.price), [500, 1000, 2000, 5000]);
  const desc = getVisibleItems({ ...base(), sortBy: 'price-desc' });
  assert.deepEqual(desc.map((i) => i.price), [5000, 2000, 1000, 500]);
});

test('SORTERS: stock-asc & stock-desc', () => {
  const asc = getVisibleItems({ ...base(), sortBy: 'stock-asc' });
  assert.deepEqual(asc.map((i) => i.stock), [0, 2, 3, 10]);
  const desc = getVisibleItems({ ...base(), sortBy: 'stock-desc' });
  assert.deepEqual(desc.map((i) => i.stock), [10, 3, 2, 0]);
});

test('SORTERS: 7 strategy keys tersedia', () => {
  assert.deepEqual(
    Object.keys(SORTERS).sort(),
    ['category-asc', 'name-asc', 'name-desc', 'price-asc', 'price-desc', 'stock-asc', 'stock-desc']
  );
});

test('getUniqueCategories: unik & terurut', () => {
  const cats = getUniqueCategories(base());
  assert.deepEqual(cats, ['Buah', 'Sayur']);
});

test('computeStats: total, nilai, rendah, habis', () => {
  const stats = computeStats(base());
  assert.equal(stats.totalBarang, 4);
  // 10*1000 + 3*2000 + 0*500 + 2*5000 = 26000
  assert.equal(stats.nilaiInventory, 26000);
  assert.equal(stats.stokRendah, 2);
  assert.equal(stats.stokHabis, 1);
});

test('getTotalPages: clamp min 1 & pembulatan ke atas', () => {
  assert.equal(getTotalPages(0), 1);
  assert.equal(getTotalPages(4, PAGE_SIZE), 1);
  assert.equal(getTotalPages(11, PAGE_SIZE), 2);
  assert.equal(getTotalPages(25, PAGE_SIZE), 3);
});

test('PAGE_SIZE bernilai 10', () => {
  assert.equal(PAGE_SIZE, 10);
});
