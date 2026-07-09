// services/expense.service.js
import { safeGet, safeSet, STORAGE_KEYS } from '../utils/storage.js';

function validate(item) {
  const errors = {};
  if (!item.deskripsi || !item.deskripsi.trim()) errors.deskripsi = 'Deskripsi wajib diisi';
  if (!item.kategori) errors.kategori = 'Kategori wajib dipilih';
  if (isNaN(item.jumlah) || item.jumlah < 0) errors.jumlah = 'Jumlah harus angka >= 0';
  return errors;
}

export const ExpenseService = {
  getAll: () => new Promise((res) => setTimeout(() => res([...safeGet(STORAGE_KEYS.EXPENSES)]), 300)),
  add: (item) => new Promise((resolve, reject) => {
    setTimeout(() => {
      const errors = validate(item);
      if (Object.keys(errors).length) { reject(errors); return; }
      const list = safeGet(STORAGE_KEYS.EXPENSES);
      const record = { id: Date.now().toString(), tanggal: new Date().toISOString(), ...item };
      list.push(record);
      safeSet(STORAGE_KEYS.EXPENSES, list);
      resolve(record);
    }, 300);
  }),
  delete: (id) => new Promise((resolve) => {
    setTimeout(() => {
      const list = safeGet(STORAGE_KEYS.EXPENSES).filter((i) => i.id !== id);
      safeSet(STORAGE_KEYS.EXPENSES, list);
      resolve(true);
    }, 300);
  })
};