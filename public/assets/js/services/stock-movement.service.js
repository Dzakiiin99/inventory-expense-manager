// services/stock-movement.service.js
import { InventoryService } from './inventory.service.js';

const KEY_IN = 'umkm_crm_stock_in';
const KEY_OUT = 'umkm_crm_stock_out';

function safeGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []) : [];
  } catch (e) { console.error(e); return []; }
}
function safeSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); return true; }
  catch (e) { console.error(e); return false; }
}

function pushHistory(key, record) {
  const list = safeGet(key);
  list.push(record);
  safeSet(key, list);
}

export const StockMovementService = {
  addStockIn: async (barangId, jumlah) => {
    const item = await InventoryService.getItemById(barangId);
    if (!item) throw new Error('Barang tidak ditemukan');
    if (!Number.isInteger(jumlah) || jumlah <= 0) throw new Error('Jumlah harus positif');
    await InventoryService.adjustStock(barangId, jumlah);
    pushHistory(KEY_IN, {
      id: Date.now().toString(),
      barangId,
      namaBarang: item.name,
      jumlah,
      tanggal: new Date().toISOString()
    });
    return true;
  },
  addStockOut: async (barangId, jumlah) => {
    const item = await InventoryService.getItemById(barangId);
    if (!item) throw new Error('Barang tidak ditemukan');
    if (!Number.isInteger(jumlah) || jumlah <= 0) throw new Error('Jumlah harus positif');
    if (item.stock < jumlah) throw new Error('Stok tidak cukup');
    await InventoryService.adjustStock(barangId, -jumlah);
    pushHistory(KEY_OUT, {
      id: Date.now().toString(),
      barangId,
      namaBarang: item.name,
      jumlah,
      tanggal: new Date().toISOString()
    });
    return true;
  },
  getStockInHistory: () => new Promise((res) => setTimeout(() => res([...safeGet(KEY_IN)]), 300)),
  getStockOutHistory: () => new Promise((res) => setTimeout(() => res([...safeGet(KEY_OUT)]), 300))
};
