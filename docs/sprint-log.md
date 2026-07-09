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
- Escape output user (`deskripsi`/`kategori` di expenses, `namaBarang` di stock-movement, `code`/`name`/`category`/`unit` di inventory-table & inventory modal) sebelum di-inject ke innerHTML → cegah XSS dari data localStorage.

### Konsistensi komponen
- `expenses.js`: gunakan `EmptyState` untuk kondisi kosong, `Modal.confirm()` untuk hapus (sudah dipakai di Inventory).

### Catatan
- `inventory-table.js`: SELESAI di-escape pada Sprint 4B (Hardening Phase 1) — `code`/`name`/`category`/`unit` sudah pakai `escapeHtml`. (Catatan lama di bawah sudah tidak berlaku.)
- Tidak ada fitur baru ditambahkan — hanya perbaikan/security/polesan sesuai prinsip SAFE MODE.

---

## Sprint 4B — Foundation Hardening Phase 1 (2026-07-09)
Status: DONE

- Architecture audit (score 6.1/10 sebelum hardening).
- Buat `utils/` terpusat: `format.js`, `sanitize.js`, `storage.js`, `index.js`.
- Hapus dead code: `app.backup.js`, `components/sidebar.js`, `components/navbar.js`, `components/card.js`, `components/stat-card.js`.
- Update semua services → pakai `utils/storage.js` (STORAGE_KEYS).
- Update semua pages/components → pakai `formatCurrency`, `formatDate`, `escapeHtml` dari `utils/`.

---

## Sprint 4C — Foundation Hardening Phase 2: XSS Re-Audit (2026-07-10)
Status: DONE

### Temuan re-audit (celah XSS user-data → HTML tanpa escape)
- `pages/inventory.js`: `item.name` di modal konfirmasi hapus; `item.code`/`name`/`category`/`unit` di modal Detail; `error.message` di error-state. (Modal merender `content` sebagai HTML → ini XSS nyata.)
- `components/input.js`: `value` & `placeholder` di-render ke atribut HTML tanpa escape → celah attribute-breakout dari form Edit (item.name/category/unit).
- `components/toast.js`: `message` di-render via `innerHTML` → nama barang di toast (stock-movement) XSS.

### Perbaikan
- `pages/inventory.js`: import `escapeHtml`; wrap 5 field modal + `error.message` dengan `escapeHtml`.
- `components/input.js`: import `escapeHtml`; escape `value` & `placeholder` (tutup celah form Edit).
- `components/toast.js`: `message` di-render via `textContent` (defense-in-depth, tutup seluruh kelas bug toast — bukan cuma escape per-call).

### Verifikasi
- `node --check` lolos untuk ke-25 file JS.
- Grep: semua field user-data (`item.*`, `e.*`, `r.namaBarang`, `i.name`) kini di-escape. Sisa yang tidak di-escape hanya nav constants (static) & id/angka generate (bukan user-data).
- `escapeHtml` (file asli) diuji terhadap payload `<img src=x onerror=alert(1)>` → menghasilkan `&lt;img...&gt;` (PASS).

### Latent risk (TIDAK diubah — scope discipline)
- `components/badge.js` & `components/button.js`: inject `text` ke innerHTML, tapi `text` saat ini selalu static (bukan user-data). Aman; esc bila kelak menerima user-data.
