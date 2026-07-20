# Sprint History — UMKM CRM Lite

Dokumentasi seluruh sprint yang telah selesai. Status per **Sprint 9** (baseline).

---

## Sprint 1 — Project Initialization
**Status:** ✅ Selesai

- **Tujuan:** Membangun fondasi aplikasi SPA tanpa framework.
- **Fitur:** Struktur folder `public/`, `index.html` (shell SPA dengan sidebar + content-area), CSS global, hash router dasar, layout controller.
- **Bug yang diselesaikan:** —
- **Hasil akhir:** App boot dengan shell + global error boundary (`app.js`).

---

## Sprint 2 — Design System
**Status:** ✅ Selesai

- **Tujuan:** Komponen UI reusable & konsisten.
- **Fitur:** `Button`, `Input`, `Badge`, `Modal`, `Card` (StatCard), `Toast`, `Loading`, `EmptyState`.
- **Bug yang diselesaikan:** Inkonsistensi styling antar halaman.
- **Hasil akhir:** Komponen terpusat di `components/` + `components/design-system/`.

---

## Sprint 3 — Dashboard
**Status:** ✅ Selesai

- **Tujuan:** Halaman ringkasan untuk pemilik UMKM.
- **Fitur:** Stat cards (total barang, nilai stok, total pengeluaran) + ringkasan data.
- **Bug yang diselesaikan:** —
- **Hasil akhir:** `pages/dashboard.js` (import statis di router, entry page).

---

## Sprint 4 — Stock Management
**Status:** ✅ Selesai

- **Tujuan:** Kelola pergerakan stok barang masuk/keluar.
- **Fitur:** `StockMovementPage` (barang masuk/keluar + riwayat), validasi stok tidak minus, persist ke `umkm_crm_stock_in` / `umkm_crm_stock_out`.
- **Bug yang diselesaikan:** App sebelumnya tidak load (lihat Sprint 4 log di `docs/sprint-log.md`): missing exports `Button.render`, `Loading.show/hide`, CSS file hilang.
- **Hasil akhir:** `pages/stock-movement.js` + `services/stock-movement.service.js`.

---

## Sprint 5 — Expense Module
**Status:** ✅ Selesai

- **Tujuan:** Tracking pengeluaran UMKM.
- **Fitur:** `ExpensesPage` (tambah/hapus pengeluaran), persist `umkm_crm_expenses`, `EmptyState` + `Modal.confirm()` untuk hapus.
- **Bug yang diselesaikan:** —
- **Hasil akhir:** `pages/expenses.js` + `services/expense.service.js`.

---

## Sprint 6 — UI Improvement
**Status:** ✅ Selesai

- **Tujuan:** Data safety & maintainability.
- **Fitur:** Export/Import CSV (`services/export.service.js`), hardening sidebar/layout/navigation (`NAVIGATION.MENU` terpusat di `constants.js`), global error handler (`app.js`), `utils/` terpusat (`storage`, `format`, `sanitize`).
- **Bug yang diselesaikan:** XSS pada escape user-data (`docs/sprint-log.md` Sprint 4C), dead code cleanup (Sprint 4B).
- **Hasil akhir:** Fondasi defensive programming & XSS-safe terpasang.

---

## Sprint 7 — Customer Module
**Status:** ✅ Selesai

- **Tujuan:** Kelola data pelanggan & relasinya ke transaksi.
- **Fitur:** `CustomerPage` CRUD pelanggan + relasi transaksi, modular `pages/customer/{page,state,render}.js`.
- **Bug yang diselesaikan:** Validasi state via `try/finally` pada Loading (BUG-3).
- **Hasil akhir:** `pages/customer/` + `services/customer.service.js`.

---

## Sprint 8 — Transaction Module
**Status:** ✅ Selesai

- **Tujuan:** Kelola transaksi penjualan (cash/transfer) dengan relasi pelanggan & barang.
- **Fitur:** `TransactionPage` CRUD transaksi, `generateTransactionCode()`, relasi ke customer & inventory, modular `pages/transaction/{page,state,render}.js`.
- **Bug yang diselesaikan:** Validasi stok & jumlah sebelum `Modal.confirm` (BUG-1, BUG-4), `Toast.success/error/info` shorthand (BUG-1).
- **Hasil akhir:** `pages/transaction/` + `services/transaction.service.js`.

---

## Sprint 9 — Report Module + Deployment Stabilization + Routing Improvement + Netlify Production Verification
**Status:** ✅ Selesai

- **Tujuan:** Menutup gap pelaporan, menstabilkan deployment, dan memverifikasi produksi di browser nyata.
- **Fitur:**
  - `ReportPage` — agregat & ringkasan data (read-only), modular `pages/report/{page,state,render}.js` + `services/report.service.js`.
  - `ReportService` — mengambil data dari service existing (TIDAK akses localStorage, tidak mutasi).
  - Router hardening: dynamic `import()` per-route + `.route-error` visible (1 modul gagal ≠ app mati).
  - `netlify.toml` (publish = `public`).
  - CSS cleanup #1–#4 (konsistensi design tokens).
- **Bug yang diselesaikan:**
  - Report module file tidak ter-commit → app 404 di produksi (diperbaiki & diverifikasi).
  - Router: static import mematikan seluruh app bila 1 modul 404 → ganti dynamic import + error boundary.
- **Hasil akhir:** App live & terverifikasi di https://umkm-crm-lite.netlify.app (12-kriteria produksi Playwright lolos).

---

## Ringkasan Status

| Sprint | Fokus | Status |
|--------|-------|--------|
| 1 | Project Initialization | ✅ |
| 2 | Design System | ✅ |
| 3 | Dashboard | ✅ |
| 4 | Stock Management | ✅ |
| 5 | Expense Module | ✅ |
| 6 | UI Improvement | ✅ |
| 7 | Customer Module | ✅ |
| 8 | Transaction Module | ✅ |
| 9 | Report + Deploy Stabilization + Routing + Verification | ✅ |
| 10 | Data Resilience & Project Consolidation | 🔜 Next |
