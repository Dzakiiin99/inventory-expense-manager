# Architecture — UMKM CRM Lite

Aplikasi manajemen stok & pengeluaran UMKM (Vanilla JS, ES Modules).

## Struktur
public/
  index.html
  assets/
    css/ (style.css, base/, themes/, components/)
    js/
      app.js (entry point)
      layout.js, navigation.js, router.js
      constants.js
      services/   (inventory, stock-movement, expense)
      pages/      (dashboard, inventory, stock-movement, expenses)
      components/ (button, input, badge, modal, card, table, ...)

## Alur Data
pages -> services (Promise, simulasi delay 300-500ms) -> localStorage (defensive programming).

## Storage Keys
- umkm_crm_inventory   : daftar barang
- umkm_crm_stock_in    : riwayat barang masuk
- umkm_crm_stock_out   : riwayat barang keluar
- umkm_crm_expenses    : daftar pengeluaran

Migrasi otomatis dari legacy `stok_umkm_barang` (model lama {id,nama,harga,stok})
ke `umkm_crm_inventory` (model baru {id,code,name,category,stock,unit,price,status})
saat module inventory.service.js pertama kali di-load. Key lama tidak dihapus.

## Catatan Unifikasi (2026-07-07)
- Menggabungkan fitur dari `stok-umkm-backup-20260706` (monolitik) ke struktur modular crm-lite.
- `umkm-saas-sprint4` (folder kosong) dihapus.
- `stok-umkm-backup-20260706` diarsipkan (tidak diubah).
- Sprint 4 (Expense Module) sudah port ke pages/expenses.js + services/expense.service.js.
