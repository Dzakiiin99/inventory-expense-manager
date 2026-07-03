// components/inventory-table.js
// Tabel Barang menggunakan reusable components (Button, Badge)

import { Button } from "./button.js";
import { Badge } from "./badge.js";

// Fungsi untuk menentukan warna badge stok
const getStockBadgeVariant = (stock) => {
  if (stock > 20) return "success";
  if (stock > 5) return "warning";
  return "danger";
};

export const InventoryTable = {
  render: (items, onEdit, onDelete, onDetail) => {
    if (!items || items.length === 0) {
      return `
        <div class="empty-state">
          <p>Tidak ada barang tersedia</p>
          <p>Tambahkan barang baru untuk memulai</p>
        </div>
      `;
    }

    return `
      <table class="table">
        <thead>
          <tr>
            <th>Kode</th>
            <th>Nama</th>
            <th>Kategori</th>
            <th>Stok</th>
            <th>Satuan</th>
            <th>Harga</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr key=${item.id}>
              <td>${item.code}</td>
              <td>${item.name}</td>
              <td>${item.category}</td>
              <td>
                <span class="badge badge-${getStockBadgeVariant(item.stock)}">
                  ${item.stock}
                </span>
              </td>
              <td>${item.unit}</td>
              <td>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)}</td>
              <td>${item.status === 'active' ? 'Aktif' : 'Nonaktif'}</td>
              <td class="table-actions">
                ${Button.render({
                  text: "Detail",
                  onClick: () => onDetail(item.id),
                  variant: "info",
                  size: "small"
                })}
                ${Button.render({
                  text: "Edit",
                  onClick: () => onEdit(item.id),
                  variant: "primary",
                  size: "small"
                })}
                ${Button.render({
                  text: "Hapus",
                  onClick: () => onDelete(item.id),
                  variant: "danger",
                  size: "small"
                })}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
};