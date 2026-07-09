// utils/stock-level.js
// Single source of truth untuk level stok (konsisten di filter & badge)

/**
 * Tentukan level stok berdasarkan threshold
 * @param {number} stock - Jumlah stok
 * @returns {'habis'|'rendah'|'aman'} Level stok
 */
export const getStockLevel = (stock) => {
  if (stock <= 0) return 'habis';
  if (stock <= 5) return 'rendah';
  return 'aman';
};

/**
 * Variant badge berdasarkan level stok (untuk inventory-table.js)
 * @param {number} stock - Jumlah stok
 * @returns {'danger'|'warning'|'success'} Badge variant
 */
export const getStockBadgeVariant = (stock) => {
  if (stock > 20) return 'success';
  if (stock > 5) return 'warning';
  return 'danger';
};