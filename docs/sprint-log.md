# Sprint Log

## Sprint 4 — Expense Module + localStorage Persistence (2026-07-09)
Status: DONE

### Fitur
- Modul Pengeluaran (`pages/expenses.js` + `services/expense.service.js`): tambah/hapus, persist ke localStorage `umkm_crm_expenses`.
- Modul Stock Movement (barang masuk/keluar + riwayat), persist ke `umkm_crm_stock_in` / `umkm_crm_stock_out`.
- Inventory service: migrasi otomatis dari legacy `stok_umkm_barang` ke `umkm_crm_inventory` (backward compatible, key lama tidak dihapus).

### Bug kritis yang diperbaiki (app sebelumnya TIDAK load sama sekali)
- `components/button.js`: tambah ekspor `Button.render({...})` — sebelumnya hanya `createButton` (DOM element), menyebabkan link error `does not provide an export named 'Button'` di semua page.
- `components/loading-state.js`: tambah ekspor `Loading.show()/.hide()` — sebelumnya hanya `createLoadingState`.
- CSS yang di-impor `style.css` tapi filenya tidak ada: `loading.css`, `empty-state.css`, `alert.css`, `select.css`, `layout/page-title.css`, `layout/section-header.css`, `layout/action-bar.css`.

### Security (defensive programming)
- Escape output user (`deskripsi`/`kategori` di expenses, `namaBarang` di stock-movement) sebelum di-inject ke innerHTML → cegah XSS dari data localStorage.

### Konsistensi komponen
- `expenses.js`: gunakan `EmptyState` untuk kondisi kosong, `Modal.confirm()` untuk hapus (sudah dipakai di Inventory).

### Verifikasi
- node link-check: semua modul ter-link (tidak ada missing export).
- node --check: sintaks valid di semua file.
- Tes render (DOM shim di Node): expenses & stock-movement render tanpa error, tombol aksi ter-wiring via delegation (`data-btn-id`), payload XSS ter-escape.
- Serve lokal (`python -m http.server`): semua aset HTTP 200.

### Catatan
- `inventory-table.js` masih menginject `item.code/name/category` tanpa escape (pola XSS sama). Belum diubah di Sprint 4 (di luar scope yang disetujui); bisa diperbaiki di sprint berikutnya.
- Tidak ada fitur baru ditambahkan — hanya perbaikan/security/polesan sesuai prinsip SAFE MODE.
