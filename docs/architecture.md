# Architecture — UMKM CRM Lite

Arsitektur aplikasi manajemen stok & pengeluaran UMKM. **Vanilla JS ES Modules,
tanpa framework, tanpa build step, tanpa backend.**

---

## 1. Struktur Folder

```
public/
├── index.html              # SPA shell: sidebar + topbar + #content-area
└── assets/
    ├── css/
    │   └── style.css        # Global styles + design tokens (CSS variables)
    └── js/
        ├── app.js           # Entry + global error boundary (window error/rejection)
        ├── layout.js        # Sidebar toggle (mobile)
        ├── navigation.js    # Render .sidebar-nav dari NAVIGATION.MENU
        ├── router.js        # Dynamic hash router + per-route error boundary
        ├── constants.js     # NAVIGATION.MENU, COLORS, BREAKPOINTS, TEXT (SSOT)
        ├── components/      # Reusable UI
        │   ├── button.js, input.js, badge.js, modal.js
        │   ├── toast.js, loading-state.js, empty-state.js
        │   ├── inventory-table.js, inventory-form.js
        │   └── design-system/card.js   # createStatCard()
        ├── pages/           # Route targets
        │   ├── dashboard.js                 # renderDashboard() — import statis
        │   ├── inventory.js                 # InventoryPage + inventory/{state,render}.js
        │   ├── stock-movement.js            # StockMovementPage
        │   ├── expenses.js                  # ExpensesPage
        │   ├── customer/customer.{page,state,render}.js
        │   ├── transaction/transaction.{page,state,render}.js
        │   └── report/report.{page,state,render}.js
        ├── services/        # Business logic (Promise-based)
        │   ├── inventory.service.js, expense.service.js
        │   ├── stock-movement.service.js, customer.service.js
        │   ├── transaction.service.js, report.service.js
        │   └── export.service.js
        └── utils/           # Utility layer
            ├── storage.js   # safeGet/safeSet/safeRemove + STORAGE_KEYS
            ├── format.js    # formatCurrency, formatDate, formatNumber
            ├── sanitize.js  # escapeHtml, escapeAttr, sanitizeInput
            ├── csv.js       # parse/arrayToCsv/downloadFile
            ├── stock-level.js # getStockLevel, getStockBadgeVariant
            └── index.js     # barrel export
```

---

## 2. Flow Data

```
User Action (page UI)
      │
      ▼
Page (pages/*.page.js / *.js)
  - render UI, bind events, call Service
      │
      ▼
Service (services/*.service.js)
  - Promise-based, simulasi delay 300–500ms
  - validasi + defensive programming
      │
      ▼
Storage (utils/storage.js)
  - safeGet / safeSet / safeRemove → localStorage
  - fallback ke default bila storage unavailable
      │
      ▼
Response → Service → Page re-render (innerHTML partial / textContent)
```

**Contoh alur Inventory:**
`InventoryPage.render` → `InventoryService.getAll()` → `safeGet(STORAGE_KEYS.INVENTORY)`
→ parse → `inventory.render.js` render tabel → user edit → `InventoryService.update()`
→ `safeSet(...)` → re-render.

---

## 3. Routing

- **Tipe:** Hash-based SPA (`#route`).
- **Entry:** `dashboard` (import statis, selalu tersedia).
- **Lazy routes:** `inventory, stock, expenses, customer, transaction, report`
  di-load via `import()` dinamis (`ROUTE_LOADERS` di `router.js`).
- **Resilience:** bila 1 modul gagal load/throw → hanya route itu yang render
  `.route-error` (visible, `role=alert`); route lain tetap jalan.
- **Unknown route** → fallback ke `#dashboard`.
- **Breadcrumb & sidebar active** di-sinkron dari `NAVIGATION.MENU` (`constants.js`).

```
ROUTE_LOADERS = {
  inventory:    () => import('./pages/inventory.js')          → InventoryPage
  stock:        () => import('./pages/stock-movement.js')     → StockMovementPage
  expenses:     () => import('./pages/expenses.js')           → ExpensesPage
  customer:     () => import('./pages/customer/customer.page.js') → CustomerPage
  transaction:  () => import('./pages/transaction/transaction.page.js') → TransactionPage
  report:       () => import('./pages/report/report.page.js') → ReportPage
}
```

---

## 4. State Management

- **Tidak ada store global** (Redux/Zustand tidak dipakai).
- State per-modul disimpan di **module-level variable** dalam `*Page` object
  (contoh: `inventory.state.js` memegang array + filter/sort/pagination state).
- **Single source of truth untuk data** = `localStorage` (via Service).
- UI state (loading, error, selected item) di-hold di page module, bukan global.
- `NAVIGATION.MENU`, `COLORS`, `BREAKPOINTS`, `TEXT` di `constants.js` = SSOT konfigurasi.

---

## 5. Service Layer

Semua logika bisnis ada di `services/`. Contract:
- Return **Promise** (simulasi async 300–500ms).
- Akses storage **hanya** via `safeGet/safeSet` (`utils/storage.js`) — bukan `localStorage` langsung.
- Defensive: validasi input, fallback default, try/catch.

| Service | Tanggung jawab | Storage Key |
|---------|---------------|-------------|
| `InventoryService` | CRUD barang + migrasi legacy | `umkm_crm_inventory` |
| `ExpenseService` | CRUD pengeluaran | `umkm_crm_expenses` |
| `StockMovementService` | barang masuk/keluar + riwayat | `umkm_crm_stock_in`, `umkm_crm_stock_out` |
| `CustomerService` | CRUD pelanggan | (customer store) |
| `TransactionService` | CRUD transaksi | (transaction store) |
| `ReportService` | agregat read-only (TIDAK akses localStorage) | — |
| `ExportService` | export/import CSV | — |

---

## 6. Utility Layer

`utils/` — fungsi murni, DOM-free (Node-testable):
- `storage.js` — `safeGet/safeSet/safeRemove`, `STORAGE_KEYS`, availability check.
- `format.js` — `formatCurrency`, `formatDate`, `formatNumber`.
- `sanitize.js` — `escapeHtml`, `escapeAttr`, `sanitizeInput` (XSS-safe).
- `csv.js` — `parseCsv`, `arrayToCsv`, `escapeCsvField`, `downloadFile`.
- `stock-level.js` — `getStockLevel`, `getStockBadgeVariant`.
- `index.js` — barrel export.

---

## 7. Storage Layer

- **Mechanism:** `localStorage` per-browser, per-device. Tidak ada backend.
- **Defensive access:** `utils/storage.js` cek availability → fallback default bila gagal.
- **Keys yang digunakan (fakta dari kode):**
  - `umkm_crm_inventory` — daftar barang (via `STORAGE_KEYS.INVENTORY`)
  - `umkm_crm_expenses` — daftar pengeluaran (via `STORAGE_KEYS.EXPENSES`)
  - `umkm_crm_stock_in` — riwayat barang masuk (via `STORAGE_KEYS.STOCK_IN`)
  - `umkm_crm_stock_out` — riwayat barang keluar (via `STORAGE_KEYS.STOCK_OUT`)
  - `umkm_crm_customers` — daftar pelanggan (hardcoded const di `customer.service.js`; TODO pindah ke `STORAGE_KEYS.CUSTOMERS`)
  - `umkm_crm_transactions` — daftar transaksi (hardcoded const di `transaction.service.js`)
  - `sidebar_collapsed` — preferensi UI (via `STORAGE_KEYS.SIDEBAR_STATE`)
- **Catatan:** `STORAGE_KEYS` (di `utils/storage.js`) baru mencakup INVENTORY,
  EXPENSES, STOCK_IN, STOCK_OUT, SIDEBAR_STATE. Customer & Transaction masih
  pakai const lokal (tercatat sebagai TODO, bukan bug — akses tetap via
  `safeGet/safeSet`, defensive).
- **Report Module:** TIDAK punya storage sendiri — `ReportService` hanya membaca
  dari service lain (read-only, tidak mutasi).
- **Migrasi:** `InventoryService` migrasi otomatis dari legacy `stok_umkm_barang`
  (model lama `{id,nama,harga,stok}`) ke `umkm_crm_inventory`
  (model baru `{id,code,name,category,stock,unit,price,status}`). Key lama tidak dihapus.

---

## 8. Hubungan Antar Modul

```
                 index.html (shell)
                       │
                  app.js (init)
       ┌───────────────┼─────────────────┐
    layout.js    navigation.js        router.js
                  (NAVIGATION)      (ROUTE_LOADERS)
                       │
            ┌──────────┴───────────┬──────────────┬─────────────┐
        dashboard          inventory          stock         expenses
                                        │
                                   customer ──▶ transaction
                                        │            │
                                        └──▶ report (agregat, read-only)
                                                 │
                                     semua page ──▶ services/* ──▶ utils/storage (localStorage)
                                     semua page ──▶ components/* (UI)
                                     semua page ──▶ utils/* (format, sanitize, csv)
```

- **Report** bergantung pada service lain (read-only aggregation), tidak punya storage sendiri.
- **Export** dipakai oleh inventory/stock/expenses/report untuk backup/restore CSV.
- **Customers** berelasi ke **Transactions** (setiap transaksi punya `customerId`).
- **Transactions** berelasi ke **Inventory** (referensi barang, validasi stok).
- Semua page render via `components/` + format/sanitize dari `utils/`.

---

## 9. Security Posture

- User-data → `innerHTML` selalu di-escape (`escapeHtml`/`escapeAttr`).
- Modal/toast → `textContent` untuk user-data (defense-in-depth).
- Global error handler (`app.js`) → `textContent` banner fallback.
- Route error boundary → 1 modul gagal tidak mematikan app.
- Input divalidasi (stok ≥ 0, field required) sebelum `Modal.confirm`.
- Font Awesome CDN → SRI `integrity` + `crossorigin`.
