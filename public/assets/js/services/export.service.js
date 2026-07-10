// services/export.service.js
// CSV export + inventory import orchestration.
// Reads/writes storage directly via utils/storage.js (defensive).
import { safeGet, safeSet, STORAGE_KEYS } from '../utils/storage.js';
import { arrayToCsv, parseCsv } from '../utils/csv.js';

const INVENTORY_HEADERS = ['Kode', 'Nama', 'Kategori', 'Stok', 'Satuan', 'Harga', 'Status'];

/** Export all inventory items to a CSV string. */
export function exportInventoryCsv() {
  const items = safeGet(STORAGE_KEYS.INVENTORY);
  const rows = items.map((it) => [
    it.code || '',
    it.name || '',
    it.category || '',
    it.stock ?? 0,
    it.unit || '',
    it.price ?? 0,
    it.status || 'active'
  ]);
  return arrayToCsv(INVENTORY_HEADERS, rows);
}

/** Export expenses to a CSV string. */
export function exportExpensesCsv() {
  const list = safeGet(STORAGE_KEYS.EXPENSES);
  const headers = ['Deskripsi', 'Kategori', 'Jumlah', 'Tanggal'];
  const rows = list.map((e) => [
    e.deskripsi || '',
    e.kategori || '',
    e.jumlah ?? 0,
    e.tanggal || ''
  ]);
  return arrayToCsv(headers, rows);
}

/** Export stock in/out history to a single CSV (Tipe = Masuk/Keluar). */
export function exportStockMovementsCsv() {
  const inHist = safeGet(STORAGE_KEYS.STOCK_IN);
  const outHist = safeGet(STORAGE_KEYS.STOCK_OUT);
  const headers = ['Tipe', 'Barang', 'Jumlah', 'Tanggal'];
  const rows = [
    ...inHist.map((r) => ['Masuk', r.namaBarang || '', r.jumlah ?? 0, r.tanggal || '']),
    ...outHist.map((r) => ['Keluar', r.namaBarang || '', r.jumlah ?? 0, r.tanggal || ''])
  ];
  return arrayToCsv(headers, rows);
}

/**
 * Parse + validate a CSV string for inventory import.
 * Header matching is case-insensitive on Indonesian column names.
 * @param {string} text
 * @returns {{ rows: Array<object>, errors: string[] }}
 */
export function parseInventoryCsv(text) {
  const parsed = parseCsv(text);
  if (parsed.length < 2) {
    return { rows: [], errors: ['File kosong atau tidak ada baris data.'] };
  }
  const headerMap = {};
  parsed[0].forEach((h, idx) => { headerMap[String(h).trim().toLowerCase()] = idx; });
  const col = (name) => (headerMap[name] !== undefined ? headerMap[name] : -1);
  const idx = {
    code: col('kode'),
    nama: col('nama'),
    kategori: col('kategori'),
    stok: col('stok'),
    satuan: col('satuan'),
    harga: col('harga'),
    status: col('status')
  };

  const errors = [];
  const rows = [];
  for (let r = 1; r < parsed.length; r++) {
    const cells = parsed[r];
    // skip fully-empty rows (blank lines, or trailing ",\n")
    if (cells.every((c) => String(c).trim() === '')) continue;
    const get = (i) => (i >= 0 && i < cells.length ? String(cells[i] || '').trim() : '');
    const name = get(idx.nama);
    if (!name) {
      errors.push(`Baris ${r + 1}: Nama wajib diisi.`);
      continue;
    }
    const stockRaw = get(idx.stok);
    const stock = stockRaw === '' ? 0 : Number(stockRaw);
    const priceRaw = get(idx.harga);
    const price = priceRaw === '' ? 0 : Number(priceRaw);
    rows.push({
      code: get(idx.code),
      name,
      category: get(idx.kategori),
      stock: Number.isFinite(stock) && stock >= 0 ? stock : 0,
      unit: get(idx.satuan),
      price: Number.isFinite(price) && price >= 0 ? price : 0,
      status: get(idx.status) || 'active'
    });
  }
  return { rows, errors };
}

/**
 * Apply parsed inventory rows to storage.
 * @param {Array<object>} rows - validated rows from parseInventoryCsv
 * @param {'merge'|'replace'} [mode='merge']
 * @returns {number} total items after import
 */
export function applyInventoryImport(rows, mode = 'merge') {
  const existing = safeGet(STORAGE_KEYS.INVENTORY);
  if (mode === 'replace') {
    safeSet(STORAGE_KEYS.INVENTORY, rows);
    return rows.length;
  }
  // merge: update by code if exists, else add as new item
  const byCode = new Map(existing.map((it) => [it.code, it]));
  let maxId = existing.reduce((m, it) => Math.max(m, parseInt(it.id, 10) || 0), 0);
  const result = existing.slice();
  for (const row of rows) {
    const code = row.code || `INV-${String(++maxId).padStart(3, '0')}`;
    const prev = byCode.get(code);
    if (prev) {
      const idx = result.findIndex((it) => it.code === code);
      result[idx] = { ...result[idx], ...row, code, id: prev.id };
    } else {
      const id = String(++maxId);
      const item = { id, code, ...row };
      result.push(item);
      byCode.set(code, item);
    }
  }
  safeSet(STORAGE_KEYS.INVENTORY, result);
  return result.length;
}
