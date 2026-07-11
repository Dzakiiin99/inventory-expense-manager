# 📦 UMKM CRM Lite

Modern Inventory & Expense Management System untuk UMKM Indonesia.
Dibangun dengan **Vanilla JavaScript** (ES Modules, tanpa framework).

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS (ES Modules) |
| Routing | Hash-based SPA router (`router.js`) |
| State | In-memory + localStorage (`utils/storage.js`) |
| Testing | Node.js `node --test` (built-in) |
| Linting | ESLint 9 (flat config) |
| Hosting | Static files (Vercel / Netlify / local) |

## Features

- **Dashboard** — stat cards: total barang, nilai stok, total pengeluaran
- **Inventory Management** — CRUD barang, modal Detail/Edit, konfirmasi hapus
- **Stock Movement** — barang masuk/keluar + riwayat, validasi stok tidak minus
- **Expense Tracking** — tambah/hapus pengeluaran, persist localStorage
- **Export / Import CSV** — backup & restore data inventori, pengeluaran, stok
- **Responsive UI** — sidebar mobile (toggle hamburger + overlay)
- **Global Error Handler** — anti halaman putih saat JS error
- **XSS-Safe Rendering** — `escapeHtml` di semua titik user-data
- **Unit Test + Lint** — Node test (14 test) + ESLint (0 warning)

## Sprint Progress

| Sprint | Fokus | Status | Commit |
|--------|-------|--------|--------|
| **Sprint 1** | Project Foundation | ✅ Selesai | `b5475e5` |
| **Sprint 2** | Design System (Button, Input, Badge, Modal, Card, Toast) | ✅ Selesai | `fe23170` |
| **Sprint 3** | Inventory Module (CRUD, filter, sort, search, pagination) | ✅ Selesai | `fe23170` |
| **Sprint 4** | Expense Module + localStorage persistence | ✅ Selesai | `67201de` |
| **Sprint 4B** | Foundation Hardening Phase 1 — utils terpusat, dead-code cleanup | ✅ Selesai | `30ab838` |
| **Sprint 4C** | Foundation Hardening Phase 2 — re-audit XSS (inventory modal, input atribut, toast textContent) | ✅ Selesai | `30ab838` |
| **Sprint 5** | Revision — DRY renderStats() pakai getStockLevel(); code quality | ✅ Selesai | `ec1cb74` |
| **Sprint 6** | Data Safety & Maintainability — Export/Import CSV + framework fixes (sidebar, NAVIGATION, layout) | ✅ Selesai | `98a86a6` |
| **Sprint 6.5** | Technical Debt Reduction — refactor inventory.js, ESLint, unit test, global error handler | ✅ Selesai | `974823a` |
| **Sprint 7** | Customer Module (CRUD pelanggan + relasi transaksi) | 🔜 Next | — |

## Architecture

```
public/
  index.html               # entry point SPA
  assets/
    css/                   # global styles
    js/
      app.js               # entry + global error boundary
      layout.js            # controller toggle sidebar (mobile)
      navigation.js        # nav pakai NAVIGATION.MENU terpusat
      router.js            # dynamic router (hash-based)
      constants.js         # NAVIGATION.MENU, TEXT, dsb (single source of truth)
      services/            # logika bisnis
        inventory.service.js
        expense.service.js
        stock-movement.service.js
        export.service.js
      utils/               # utility terpusat
        csv.js             # parse/generate CSV
        format.js          # formatCurrency, formatDate
        sanitize.js        # escapeHtml (XSS-safe)
        storage.js         # safeGet/safeSet/safeRemove (localStorage)
        stock-level.js     # getStockLevel()
        index.js           # barrel export
      components/          # reusable UI components
        Button.js, Input.js, Badge.js, Modal.js,
        Card.js, Toast.js, Table.js, Form.js, StatCard.js
      pages/               # halaman (route targets)
        inventory.js       # orchestrator → ekspor InventoryPage
        inventory/         # refactor Sprint 6.5:
          inventory.state.js    # state + pure logic (DOM-free, Node-testable)
          inventory.render.js   # render partial (stats/table/pagination/shell)
        expenses.js
        stock-movement.js
        dashboard.js
test/
  inventory.state.test.js  # 14 unit test (node --test)
```

## Development

Butuh **Node.js 18+** (untuk `node --test` & ESLint).

```bash
# Install dependencies
npm install

# Jalankan unit test
npm test

# Jalankan ESLint
npm run lint

# Buka di browser (tanpa build step)
# Langsung buka public/index.html atau pakai live-server
```

Unit test hanya cover pure logic (filter/sort/stats/pagination) yang DOM-free,
sehingga bisa dijalankan di Node tanpa browser/jsdom.

## Security Notes

- Semua user-data yang di-render ke `innerHTML` di-escape via `escapeHtml`
- Modal content & toast message → user-data selalu di-escape
- localStorage diakses via `safeGet/safeSet/safeRemove` dengan fallback
- Global error handler menampilkan pesan via `textContent` (bukan innerHTML)
- Input validasi di semua form (stok tidak minus, field required)

## License

MIT

## Author

Developed by **Andhi**
