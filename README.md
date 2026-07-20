# 📦 UMKM CRM Lite

Modern Inventory & Expense Management System untuk UMKM Indonesia.
Dibangun dengan **Vanilla JavaScript** (ES Modules, tanpa framework) — tanpa build step, tanpa backend.

**Live Demo:** https://umkm-crm-lite.netlify.app

---

## Deskripsi

UMKM CRM Lite adalah aplikasi web ringan untuk membantu pelaku UMKM mengelola
inventori barang, pergerakan stok (masuk/keluar), pengeluaran, pelanggan,
transaksi, dan laporan — semuanya berjalan di browser tanpa server. Data
disimpan di `localStorage` masing-masing perangkat (defensive programming,
dengan fallback graceful bila storage tidak tersedia).

Aplikasi dirancang dengan arsitektur modular: **pages → services → storage**,
dipisah menjadi layer `pages/`, `services/`, `components/`, dan `utils/`.
Router hash-based dengan dynamic import per-route agar satu modul yang gagal
tidak mematikan seluruh aplikasi.

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS (ES Modules, **tanpa framework**) |
| Routing | Hash-based SPA router (`router.js`) dengan dynamic `import()` per-route |
| State | In-memory + `localStorage` (`utils/storage.js`, defensive) |
| UI Components | Reusable components + design-system (`components/`, `components/design-system/`) |
| Styling | Single `style.css` + design tokens (CSS variables) |
| Icons | Font Awesome 6 (CDN, SRI-protected) |
| Testing | Node.js `node --test` (built-in) + Playwright (verifikasi produksi) |
| Linting | ESLint 9 (flat config) |
| Hosting | Static files di **Netlify** (publish = `public/`) |

---

## Struktur Project

```
umkm-crm-lite/
├── public/                      # Root statis (di-deploy ke Netlify)
│   ├── index.html               # Entry point SPA
│   └── assets/
│       ├── css/
│       │   └── style.css        # Global styles + design tokens
│       └── js/
│           ├── app.js           # Entry + global error boundary
│           ├── layout.js        # Controller toggle sidebar (mobile)
│           ├── navigation.js    # Nav dari NAVIGATION.MENU (constants)
│           ├── router.js        # Dynamic router (hash-based)
│           ├── constants.js     # NAVIGATION.MENU, COLORS, BREAKPOINTS, TEXT
│           ├── components/      # Reusable UI components
│           │   ├── button.js, input.js, badge.js, modal.js,
│           │   ├── toast.js, loading-state.js, empty-state.js,
│           │   ├── inventory-table.js, inventory-form.js
│           │   └── design-system/   # card.js (StatCard)
│           ├── pages/           # Route targets (modular)
│           │   ├── dashboard.js
│           │   ├── inventory.js + inventory/{state,render}.js
│           │   ├── stock-movement.js
│           │   ├── expenses.js
│           │   ├── customer/customer.{page,state,render}.js
│           │   ├── transaction/transaction.{page,state,render}.js
│           │   └── report/report.{page,state,render}.js
│           ├── services/report.service.js   # Report service (level services)
│           ├── services/        # Business logic layer
│           │   ├── inventory.service.js, expense.service.js,
│           │   ├── stock-movement.service.js, customer.service.js,
│           │   ├── transaction.service.js, report.service.js,
│           │   └── export.service.js
│           └── utils/           # Utility layer
│               ├── storage.js, format.js, sanitize.js,
│               ├── csv.js, stock-level.js, index.js
├── docs/                       # Dokumentasi proyek
│   ├── roadmap.md
│   ├── sprint-history.md
│   ├── architecture.md
│   └── deployment.md
├── netlify.toml                # Config deploy (publish = public)
├── eslint.config.js
├── package.json                # version 0.9.0
└── test/                       # Unit test (node --test)
    └── inventory.state.test.js
```

---

## Cara Instalasi

Butuh **Node.js 18+** (untuk `node --test` & ESLint). Tidak ada build step —
aplikasi langsung dibuka dari `public/`.

```bash
# Clone repo
git clone https://github.com/Dzakiiin99/inventory-expense-manager.git
cd inventory-expense-manager

# Install dev dependencies (ESLint + Playwright untuk verifikasi)
npm install
```

---

## Cara Menjalankan Project

**Opsi 1 — Live Demo (online):**
Buka https://umkm-crm-lite.netlify.app — langsung bisa dipakai tanpa install.

**Opsi 2 — Lokal (tanpa build):**
Buka `public/index.html` langsung di browser, atau gunakan static server:

```bash
# Dengan Node (serve), contoh:
npx serve public
# atau
python3 -m http.server 8080 --directory public
```

Buka `http://localhost:8080`. Data tersimpan di `localStorage` browser masing-masing
(tanpa backend), jadi aman untuk dicoba.

---

## Cara Menjalankan Test

**Unit test (pure logic, DOM-free, jalan di Node):**
```bash
npm test
```

**Lint:**
```bash
npm run lint
```

**Verifikasi produksi (real browser, Playwright):**
Skrip verifikasi 12-kriteria terdapat di root repo (`verify_*.mjs`). Jalankan
setelah deploy/perubahan untuk memastikan tiap route benar-benar render di
browser nyata (bukan jsdom). Contoh:

```bash
node verify_per_route.mjs
node verify_no_errors.mjs
```

> Catatan: file `verify_*.mjs`, `test/*.html`, dan `deno.lock` adalah artifact
> verifikasi — tidak di-commit ke branch utama (gitignored / untracked).

---

## Cara Build

**Tidak ada build step.** Aplikasi menggunakan ES Modules native yang dibaca
langsung oleh browser. "Build" = pastikan `public/` lengkap & `npm test` + `npm run lint` lolos.

---

## Cara Deploy

Deploy otomatis ke **Netlify** dari branch `main` (GitHub: `Dzakiiin99/inventory-expense-manager`).

- **Publish directory:** `public` (lihat `netlify.toml`)
- **Auto-deploy:** setiap push ke `main` otomatis build & deploy
- **URL produksi:** https://umkm-crm-lite.netlify.app

Manual deploy (jika perlu):
```bash
netlify deploy --prod --dir public
```

---

## Daftar Fitur

- **Dashboard** — stat cards (total barang, nilai stok, total pengeluaran) + ringkasan
- **Inventory Management** — CRUD barang, modal Detail/Edit, konfirmasi hapus, filter/search/sort/pagination
- **Stock Movement** — barang masuk/keluar + riwayat, validasi stok tidak minus
- **Expense Tracking** — tambah/hapus pengeluaran, persist `localStorage`
- **Customer Module** — CRUD pelanggan + relasi transaksi
- **Transaction Module** — CRUD transaksi (cash/transfer), relasi ke pelanggan & barang
- **Report Module** — agregat & ringkasan data (read-only, tanpa mutasi)
- **Export / Import CSV** — backup & restore data inventori, pengeluaran, stok
- **Responsive UI** — sidebar mobile (toggle hamburger + overlay)
- **Global Error Handler** — anti halaman putih saat JS error
- **Route-level Error Boundary** — 1 modul gagal → route lain tetap jalan
- **XSS-Safe Rendering** — `escapeHtml`/`escapeAttr` di semua titik user-data
- **Unit Test + Lint** — Node test (pure logic) + ESLint

---

## Modul yang Tersedia

| Modul | Route | Status | File Utama |
|-------|-------|--------|-----------|
| Dashboard | `#dashboard` | ✅ Selesai | `pages/dashboard.js` |
| Inventory | `#inventory` | ✅ Selesai | `pages/inventory.js` + `inventory/{state,render}.js` |
| Expenses | `#expenses` | ✅ Selesai | `pages/expenses.js` |
| Stock Movement | `#stock` | ✅ Selesai | `pages/stock-movement.js` |
| Pelanggan | `#customer` | ✅ Selesai | `pages/customer/customer.{page,state,render}.js` |
| Transaksi | `#transaction` | ✅ Selesai | `pages/transaction/transaction.{page,state,render}.js` |
| Laporan | `#report` | ✅ Selesai | `pages/report/report.{page,state,render}.js` + `services/report.service.js` |

---

## Completed Modules

Berikut 7 modul yang **sudah selesai & terverifikasi** (semua route aktif di produksi,
https://umkm-crm-lite.netlify.app). Setiap modul mengikuti pola arsitektur
**page → service → storage** (lihat `docs/architecture.md`).

### 1. Dashboard — `#dashboard`
- **Tujuan:** Ringkasan bisnis untuk pemilik UMKM di satu layar.
- **Fitur:** Stat cards (total barang, nilai stok, total pengeluaran) + ringkasan data.
- **Status:** ✅ Selesai (entry page, import statis di `router.js`).
- **File:** `pages/dashboard.js`.

### 2. Inventory — `#inventory`
- **Tujuan:** Kelola master barang.
- **Fitur:** CRUD barang, modal Detail/Edit, konfirmasi hapus, filter / search / sort / pagination (pure logic di `inventory.state.js`), validasi stok, relasi ke Stock Movement & Transaction.
- **Status:** ✅ Selesai.
- **File:** `pages/inventory.js` + `inventory/{state,render}.js`, `services/inventory.service.js`.

### 3. Stock Movement — `#stock`
- **Tujuan:** Catat pergerakan stok barang masuk & keluar.
- **Fitur:** Barang masuk / keluar + riwayat, validasi stok tidak minus (BUG-4 resolved).
- **Status:** ✅ Selesai.
- **File:** `pages/stock-movement.js`, `services/stock-movement.service.js`.

### 4. Expenses — `#expenses`
- **Tujuan:** Tracking pengeluaran operasional.
- **Fitur:** Tambah / hapus pengeluaran, persist `localStorage`, empty-state + `Modal.confirm()` untuk hapus.
- **Status:** ✅ Selesai.
- **File:** `pages/expenses.js`, `services/expense.service.js`.

### 5. Customer — `#customer`
- **Tujuan:** Kelola data pelanggan & relasinya ke transaksi.
- **Fitur:** CRUD pelanggan + relasi transaksi, struktur modular `customer.{page,state,render}.js`.
- **Status:** ✅ Selesai.
- **File:** `pages/customer/`, `services/customer.service.js`.

### 6. Transaction — `#transaction`
- **Tujuan:** Kelola transaksi penjualan (cash / transfer).
- **Fitur:** CRUD transaksi, `generateTransactionCode()`, relasi ke pelanggan & barang, validasi stok sebelum `Modal.confirm` (BUG-1 / BUG-4).
- **Status:** ✅ Selesai.
- **File:** `pages/transaction/`, `services/transaction.service.js`.

### 7. Report — `#report`
- **Tujuan:** Agregat & ringkasan data (read-only).
- **Fitur:** Laporan dari data existing, **tidak mutasi**; `ReportService` mengambil dari service lain (TIDAK akses `localStorage`).
- **Status:** ✅ Selesai (Sprint 9).
- **File:** `pages/report/`, `services/report.service.js`.

**Cross-cutting (semua modul):** Export/Import CSV (`services/export.service.js`),
XSS-safe rendering (`utils/sanitize.js`), global + route-level error boundary
(`app.js`, `router.js`), responsive sidebar (`layout.js`).

---

## Status Project

**Status:** Stable / Production-Ready (Sprint 9 selesai, terverifikasi di Netlify)

**Current Version:** `0.9.0`

**Current Sprint:** Sprint 9 — Report Module, Deployment Stabilization, Routing Improvement, Netlify Production Verification

**Next Sprint:** Sprint 10 — Data Resilience & Project Consolidation

---

## Dokumentasi

Dokumentasi lengkap ada di folder [`docs/`](./docs):
- [Roadmap](./docs/roadmap.md)
- [Sprint History](./docs/sprint-history.md)
- [Architecture](./docs/architecture.md)
- [Deployment](./docs/deployment.md)
- [Testing](./docs/testing.md)

---

## Security Notes

- Semua user-data yang di-render ke `innerHTML` di-escape via `escapeHtml` / `escapeAttr`
- Modal content & toast message → user-data selalu di-escape / `textContent`
- `localStorage` diakses via `safeGet/safeSet/safeRemove` dengan fallback (storage unavailable → default)
- Global error handler menampilkan pesan via `textContent` (bukan innerHTML)
- Route error boundary: kegagalan 1 modul tidak mematikan app
- Input divalidasi di semua form (stok tidak minus, field required)
- Font Awesome dimuat via CDN dengan SRI `integrity` + `crossorigin`

---

## License

MIT

## Author

Developed by **Khairul Dzakirin**
