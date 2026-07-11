# 📦 Inventory Expense Manager

Modern Inventory & Expense Management System built with Vanilla JavaScript (ES Modules, no framework).

## Features
- Dashboard (stat cards: total barang, nilai stok, total pengeluaran)
- Inventory Management (CRUD barang, modal Detail/Edit, konfirmasi hapus)
- Stock Movement (barang masuk/keluar + riwayat, validasi stok)
- Expense Tracking (tambah/hapus, persist localStorage)
- Export / Import Inventori via CSV (backup & restore data)
- Responsive UI + sidebar mobile (toggle hamburger + overlay)
- Global error handler (anti halaman putih saat JS error)
- Modular Architecture (services / pages / components / utils)
- Defensive programming & XSS-safe rendering (escapeHtml di semua titik user-data)
- Unit test (Node `node --test`) + ESLint (lint otomatis)

## Current Progress
- ✅ Sprint 1 - Project Foundation
- ✅ Sprint 2 - Design System (Button, Input, Badge, Modal, Card, Toast)
- ✅ Sprint 3 - Inventory Module
- ✅ Sprint 4 - Expense Module + localStorage persistence (XSS fix di expenses/stock-movement)
- ✅ Sprint 4B - Foundation Hardening Phase 1 (utils/ terpusat, hapus dead code)
- ✅ Sprint 4C - Foundation Hardening Phase 2 (re-audit XSS: fix inventory.js modal, input.js atribut, toast.js textContent)
- ✅ Sprint 5 - Revision (DRY: renderStats() pakai getStockLevel(); code quality improvements)
- ✅ Sprint 6 - Data Safety & Maintainability
  - Track A: Export/Import CSV (Inventori + Pengeluaran + Stok) + modal preview/validasi
  - Framework fix: sidebar mobile toggle, NAVIGATION.MENU terpusat, layout.js repurpose jadi controller
- ✅ Sprint 6.5 - Technical Debt Reduction
  - Refactor inventory.js (monolith 487 baris) → `pages/inventory/` (state + render + orchestrator)
  - Setup ESLint (flat config) + bebas warning
  - Unit test pure logic (`test/inventory.state.test.js`, 14 test hijau)
  - Global error handler di `app.js` (window error + unhandledrejection → Toast/banner fallback)

## Architecture
```
public/assets/js/
  app.js                 # entry + global error boundary
  layout.js              # controller toggle sidebar (mobile)
  navigation.js          # nav pakai NAVIGATION.MENU terpusat
  router.js              # dynamic router (hash-based)
  constants.js           # NAVIGATION.MENU, TEXT, dsb (single source of truth)
  services/              # logika bisnis (inventory, expense, stock-movement, export)
  utils/                 # csv, format, sanitize, storage, stock-level
  components/            # Button, Input, Badge, Modal, Card, Toast, Table, Form
  pages/
    inventory.js         # orchestrator halaman inventori (ekspor InventoryPage)
    inventory/           # hasil refactor Sprint 6.5:
      inventory.state.js   # state + pure logic (DOM-free, di-test Node)
      inventory.render.js  # render partial (stats/table/pagination/shell)
    expenses.js, stock-movement.js, dashboard.js
```

## Development
Butuh Node.js 18+ (untuk `node --test` & ESLint).

```bash
npm install        # install devDependencies (eslint)
npm test           # jalankan unit test (node --test)
npm run lint       # jalankan ESLint (node_modules/.bin/eslint public/assets/js test)
```

Unit test hanya mencover pure logic (filter/sort/stats/pagination) yang DOM-free,
sehingga bisa dijalankan di Node tanpa browser/jsdom.

## Security Notes
- Semua user-data yang di-render ke innerHTML di-escape via `utils/sanitize.js#escapeHtml`.
- Modal content & toast message dianggap HTML context → user-data selalu di-escape.
- localStorage diakses via `utils/storage.js` (safeGet/safeSet/safeRemove) dengan fallback.
- Global error handler menampilkan pesan via `textContent` (bukan innerHTML) → XSS-safe.

## Author
Developed by Andhi
