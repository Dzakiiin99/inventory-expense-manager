# Roadmap — UMKM CRM Lite

Roadmap ini mencerminkan kondisi proyek per **Sprint 9** (baseline dokumentasi).
Jangan mengubah rencana Sprint 11+ tanpa alasan teknis yang jelas.

---

## Completed (Selesai)

- **Sprint 1** — Project Initialization (HTML, CSS, router, layout foundation)
- **Sprint 2** — Design System (Button, Input, Badge, Modal, Card, Toast)
- **Sprint 3** — Dashboard (stat cards + ringkasan)
- **Sprint 4** — Stock Management (barang masuk/keluar + riwayat, validasi stok)
- **Sprint 5** — Expense Module (tambah/hapus pengeluaran, persist localStorage)
- **Sprint 6** — UI Improvement (Export/Import CSV, hardening sidebar/layout, global error handler)
- **Sprint 7** — Customer Module (CRUD pelanggan + relasi transaksi)
- **Sprint 8** — Transaction Module (CRUD transaksi cash/transfer, relasi pelanggan & barang)
- **Sprint 9** — Report Module + Deployment Stabilization + Routing Improvement + Netlify Production Verification

---

## Next (Rencana)

- **Sprint 10** — Data Resilience & Project Consolidation
  - Konsolidasi dokumentasi & struktur repo (baseline resmi)
  - Audit ketahanan data localStorage (migrasi, backup otomatis, recovery)
  - Penyatuan skrip verifikasi ke workflow terstandar
  - Pembersihan artifact testing & dead config

- **Sprint 11** — Authentication
- **Sprint 12** — Role Management
- **Sprint 13** — Export PDF
- **Sprint 14** — Analytics
- **Sprint 15** — Offline Mode

---

## Catatan

- Sprint belum diberi nomor melampaui 15. Setiap penambahan harus via keputusan
  arsitektur eksplisit (jangan widen scope tanpa alasan teknis).
- Backend belum ada — semua data di `localStorage` per-device. Sprint 11+
  (Auth, Role, Offline) akan menuntut evaluasi apakah perlu lapisan backend/sync.
