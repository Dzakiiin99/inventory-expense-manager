# 📦 Inventory Expense Manager

Modern Inventory & Expense Management System built with Vanilla JavaScript (ES Modules, no framework).

## Features
- Dashboard (stat cards: total barang, nilai stok, total pengeluaran)
- Inventory Management (CRUD barang, modal Detail/Edit, konfirmasi hapus)
- Stock Movement (barang masuk/keluar + riwayat, validasi stok)
- Expense Tracking (tambah/hapus, persist localStorage)
- Responsive UI
- Modular Architecture (services / pages / components / utils)
- Defensive programming & XSS-safe rendering (escapeHtml di semua titik user-data)

## Current Progress
- ✅ Sprint 1 - Project Foundation
- ✅ Sprint 2 - Design System (Button, Input, Badge, Modal, Card, Toast)
- ✅ Sprint 3 - Inventory Module
- ✅ Sprint 4 - Expense Module + localStorage persistence (XSS fix di expenses/stock-movement)
- ✅ Sprint 4B - Foundation Hardening Phase 1 (utils/ terpusat, hapus dead code)
- ✅ Sprint 4C - Foundation Hardening Phase 2 (re-audit XSS: fix inventory.js modal, input.js atribut, toast.js textContent)

## Security Notes
- Semua user-data yang di-render ke innerHTML di-escape via `utils/sanitize.js#escapeHtml`.
- Modal content & toast message dianggap HTML context → user-data selalu di-escape.
- localStorage diakses via `utils/storage.js` (safeGet/safeSet/safeRemove) dengan fallback.

## Author
Developed by Andhi
