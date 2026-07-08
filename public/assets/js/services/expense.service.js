// services/expense.service.js
const KEY = 'umkm_crm_expenses';

function safeGet() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []) : [];
  } catch (e) { console.error(e); return []; }
}
function safeSet(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
  catch (e) { console.error(e); return false; }
}
function validate(item) {
  const errors = {};
  if (!item.deskripsi || !item.deskripsi.trim()) errors.deskripsi = 'Deskripsi wajib diisi';
  if (!item.kategori) errors.kategori = 'Kategori wajib dipilih';
  if (isNaN(item.jumlah) || item.jumlah < 0) errors.jumlah = 'Jumlah harus angka >= 0';
  return errors;
}

export const ExpenseService = {
  getAll: () => new Promise((res) => setTimeout(() => res([...safeGet()]), 300)),
  add: (item) => new Promise((resolve, reject) => {
    setTimeout(() => {
      const errors = validate(item);
      if (Object.keys(errors).length) { reject(errors); return; }
      const list = safeGet();
      const record = { id: Date.now().toString(), tanggal: new Date().toISOString(), ...item };
      list.push(record);
      safeSet(list);
      resolve(record);
    }, 300);
  }),
  delete: (id) => new Promise((resolve) => {
    setTimeout(() => {
      const list = safeGet().filter((i) => i.id !== id);
      safeSet(list);
      resolve(true);
    }, 300);
  })
};
