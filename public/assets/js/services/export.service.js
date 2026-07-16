/* global crypto: readonly */
// services/export.service.js
// CSV export + inventory import orchestration.
// Reads/writes storage directly via utils/storage.js (defensive).
import { safeGet, safeSet, STORAGE_KEYS } from '../utils/storage.js';
import { arrayToCsv, parseCsv } from '../utils/csv.js';

const CODE_RE = /^INV-(\d+)$/;

/**
 * Generate id unik (Primary Key internal).
 * Pola konsisten dengan customer.service.js / inventory.service.js.
 * @returns {string}
 */
function _generateId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch { /* fallback */ }
  return 'inv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/**
 * Hitung max numeric suffix dari code INV-XXX yang ada.
 * @param {Array<object>} items
 * @returns {number}
 */
function _maxCodeSuffix(items) {
  let max = 0;
  for (const it of items) {
    const m = CODE_RE.exec(it.code || '');
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return max;
}

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
    // replace: generate id & code untuk setiap row yang belum punya
    let maxCode = _maxCodeSuffix(rows);
    const result = rows.map((row) => {
      const id = row.id || _generateId();
      const code = row.code || `INV-${String(++maxCode).padStart(3, '0')}`;
      return { id, code, ...row };
    });
    safeSet(STORAGE_KEYS.INVENTORY, result);
    return result.length;
  }
  // merge: update by code if exists, else add as new item
  const byCode = new Map(existing.map((it) => [it.code, it]));
  let maxCode = _maxCodeSuffix(existing);
  const result = existing.slice();
  for (const row of rows) {
    const code = row.code || `INV-${String(++maxCode).padStart(3, '0')}`;
    const prev = byCode.get(code);
    if (prev) {
      const idx = result.findIndex((it) => it.code === code);
      result[idx] = { ...result[idx], ...row, code, id: prev.id };
    } else {
      const id = _generateId();
      const item = { id, code, ...row };
      result.push(item);
      byCode.set(code, item);
    }
  }
  safeSet(STORAGE_KEYS.INVENTORY, result);
  return result.length;
}

/**
 * Export report data to CSV and trigger download.
 * Hanya menerima rows dan headers, tidak ada business logic.
 * @param {Array<Array<string|number>>} rows - data rows
 * @param {Array<string>} headers - column headers
 */
export function exportReportCsv(rows, headers) {
  // Escape CSV field sesuai RFC 4180
  const escapeCsvField = (field) => {
    const str = String(field ?? '');
    // Jika mengandung koma, kutip, atau newline, bungkus dengan kutip
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  // Build CSV content
  const headerLine = headers.map(escapeCsvField).join(',');
  const dataLines = (rows || []).map((row) => row.map(escapeCsvField).join(','));
  const csvContent = [headerLine, ...dataLines].join('\n');

  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  // Filename: report-YYYY-MM-DD.csv
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  a.download = `report-${yyyy}-${mm}-${dd}.csv`;

  // Download + cleanup
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
