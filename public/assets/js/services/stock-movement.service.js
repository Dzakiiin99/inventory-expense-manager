// services/stock-movement.service.js
import { InventoryService } from './inventory.service.js';
import { safeGet, safeSet, STORAGE_KEYS } from '../utils/storage.js';

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
    pushHistory(STORAGE_KEYS.STOCK_IN, {
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
    pushHistory(STORAGE_KEYS.STOCK_OUT, {
      id: Date.now().toString(),
      barangId,
      namaBarang: item.name,
      jumlah,
      tanggal: new Date().toISOString()
    });
    return true;
  },
  getStockInHistory: () => new Promise((res) => setTimeout(() => res([...safeGet(STORAGE_KEYS.STOCK_IN)]), 300)),
  getStockOutHistory: () => new Promise((res) => setTimeout(() => res([...safeGet(STORAGE_KEYS.STOCK_OUT)]), 300))
};