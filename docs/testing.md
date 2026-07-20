# Testing — UMKM CRM Lite

Strategi pengujian: **unit test** untuk pure logic (Node, tanpa browser) +
**production verification** dengan real browser (Playwright) untuk memastikan
app benar-benar jalan di produksi.

> ⚠️ **jsdom / `node --check` DILARANG** sebagai bukti "app jalan". Keduanya
> tidak mereproduksi bug browser asli: static ES-module 404, CSS, layout,
> event lifecycle. Bukti harus dari browser nyata (Playwright/Chromium).

---

## 1. Unit Test (Node `node --test`)

Pure logic yang DOM-free diuji di Node tanpa browser/jsdom.

```bash
npm test
```

- **Lokasi:** `test/inventory.state.test.js`
- **Scope:** filter / sort / stats / pagination pada `inventory.state.js`
  (fungsi murni, tidak sentuh DOM).
- **Runner:** Node built-in `node --test` (Node 18+).
- **Lint:** `npm run lint` (ESLint 9, `eslint public/assets/js`).

---

## 2. Production Verification (Playwright / Real Browser)

Verifikasi 12-kriteria produksi. Skrip di root repo (`verify_*.mjs`).

**Setup lokal:**
```bash
npm i playwright --no-save
npx playwright install chromium
```

**Jalankan (contoh):**
```bash
node verify_per_route.mjs        # tiap route render nyata
node verify_no_errors.mjs        # tidak ada console error / JS 4xx-5xx
node verify_refresh.mjs          # cold load + refresh persist
node verify_resilient.mjs        # 1 modul gagal ≠ app mati
# ... verify_sidebar, verify_heading_visible, verify_content_area,
#     verify_direct_open, verify_not_empty, verify_no_js_4xx,
#     verify_build_smoke, verify_browser
```

**Kontrak verifikasi (wajib):**
- Listener `console` / `pageerror` / `requestfailed` / `response` **SEBELUM** `goto`.
- Capture response `≥ 400` (4xx/5xx).
- Cache kosong: `browser.newContext()` fresh setiap run.
- Uji **cold load** + **refresh** untuk tiap route.
- Inspeksi DOM nyata: element count + computed visibility — BUKAN cuma `textContent.length`.
- JANGAN klaim "beres" tanpa evidence browser nyata.

---

## 3. Kriteria 12-Produksi (Template Laporan)

1. Per-route render nyata (elemen terhitung > 0)
2. Sidebar = menu navigasi
3. Content area berisi elemen nyata
4. Judul halaman visible
5. Tidak ada JS 4xx/5xx (response ≥ 400)
6. Tidak ada console error
7. Refresh persist (cold + refresh)
8. File diperbaiki = 200 (app/js)
9. Direct-open + refresh tiap route
10. Tidak kosong (elemen ter-render)
11. 1 modul gagal ≠ matikan app (`.route-error` visible)
12. Build + smoke test lolos

---

## 4. Format Laporan Verifikasi

Setiap verifikasi produksi dilaporkan dengan struktur:
1. Akar masalah
2. File terlibat (2 file utama)
3. Perubahan
4. Perintah tes
5. Hasil per route
6. Belum diverifikasi
7. Status deploy
8. Ulang tes produksi

---

## 5. Catatan Artifact

File `verify_*.mjs`, `test/*.html`, dan `deno.lock` adalah **artifact
verifikasi** — tidak di-commit ke branch utama (gitignored / untracked),
agar repo tetap bersih.

---

## 6. Unit Test — Detail

Unit test mencover **pure logic** yang DOM-free, sehingga bisa dijalankan di
Node tanpa browser/jsdom.

```bash
npm test          # jalankan semua test (node --test)
npm run lint      # ESLint 9 pada public/assets/js
```

- **Lokasi test:** `test/inventory.state.test.js`
- **Target:** fungsi murni di `pages/inventory/inventory.state.js`
  (filter, sort, stats/agregasi, pagination) — tidak menyentuh DOM.
- **Runner:** Node built-in `node --test` (Node 18+).
- **Tidak butuh setup:** tidak ada mock, tidak ada jsdom, tidak ada browser.
- **Prinsip:** hanya logic murni yang di-test di level unit. UI/render &
  integrasi diuji via Production Verification (section 2), bukan unit test.

> Catatan: jumlah test saat ini terbatas pada `inventory.state` (satu modul
> dengan logic terbanyak). Ekspansi test ke `customer.state`, `transaction.state`,
> `report.state` direncanakan di sprint mendatang (lihat roadmap).

---

## 7. Smoke Test

Smoke test = verifikasi cepat bahwa **build/deploy menghasilkan app yang
boot tanpa error fatal** — gerbang sebelum verifikasi 12-kriteria penuh.

- **Skrip:** `verify_build_smoke.mjs` (root repo, Playwright/Chromium).
- **Yang diuji:**
  1. App boot: `index.html` + `app.js` load 200.
  2. Tidak ada JS 404/5xx pada asset kritis (app, router, constants, layout).
  3. Tidak ada console error / unhandled rejection saat boot.
  4. `#content-area` terisi setelah render dashboard (elemen > 0).
  5. Sidebar nav ter-render dari `NAVIGATION.MENU`.
- **Kontrak sama dengan Production Verification:** listener console/pageerror/
  response SEBELUM `goto`, cache kosong, inspeksi DOM nyata.
- **Kapan dijalankan:** setelah setiap deploy/perubahan kode sebelum klaim
  "beres". Gagal smoke → blokir, jangan lanjut ke verifikasi detail.

```bash
node verify_build_smoke.mjs
```

> Smoke test adalah kriteria #12 dari template 12-produksi ("Build + smoke test
> lolos"). Untuk verifikasi menyeluruh tiap route, gunakan `verify_per_route.mjs`
> + skrip lainnya (section 2).

---

## 8. Manual Testing

Pengujian manual dilakukan dengan membuka aplikasi di browser nyata dan
mengeksekusi alur pengguna (happy path + edge case) secara interaktif.

**Target environment:**
- Browser modern (Chrome/Edge/Firefox) — desktop & mobile viewport.
- Live: https://umkm-crm-lite.netlify.app
- Lokal: `npx serve public` / `python3 -m http.server 8080 --directory public`

**Checklist manual per rilis:**
1. Sidebar toggle (hamburger) jalan di mobile viewport (< 768px).
2. Navigasi tiap menu (`#dashboard`, `#inventory`, `#expenses`, `#stock`,
   `#customer`, `#transaction`, `#report`) render konten nyata.
3. CRUD Inventory: tambah → edit → hapus (modal konfirmasi) → data persist
   setelah refresh.
4. Stock Movement: barang masuk/keluar, validasi stok tidak minus.
5. Expense: tambah/hapus, tampil di dashboard.
6. Customer & Transaction: buat pelanggan → buat transaksi terkait → cek relasi.
7. Report: agregat muncul, read-only (tidak ada tombol mutasi).
8. Export/Import CSV: download CSV → import kembali → data utuh.
9. XSS sanity: input `<img src=x onerror=alert(1)>` di nama barang → tidak
   mengeksekusi script (ter-render sebagai teks).
10. Refresh halaman di route mana pun → state tetap (localStorage persist).

**Catatan:** manual testing melengkapi (bukan mengganti) automated verification.
Bukti otomatis dari Playwright (section 2) tetap wajib untuk klaim "Production Ready".

---

## 9. Regression Testing

Regression test memastikan perubahan/penambahan fitur **tidak memutus**
fungsi yang sudah ada.

**Kapan dijalankan:** setelah setiap perubahan kode (bugfix, fitur baru, refactor)
SEBELUM commit/push ke `main`.

**Prosedur:**
1. `npm test` — pastikan unit test (pure logic) masih lolos.
2. `npm run lint` — ESLint 0 error.
3. `node verify_build_smoke.mjs` — smoke test boot lolos.
4. `node verify_per_route.mjs` — semua 7 route masih render nyata.
5. `node verify_no_errors.mjs` — tidak ada console error / JS 4xx-5xx.
6. `node verify_resilient.mjs` — 1 modul gagal masih ≠ app mati.
7. Manual spot-check (section 8) pada fitur yang disentuh perubahan.

**Prinsip SAFE MODE:** reliability > kecepatan. Jika regression gagal,
blokir deploy — jangan lanjutkan.

---

## 10. Deployment Verification

Verifikasi bahwa artifact yang **sudah ter-deploy ke produksi** benar-benar
jalan di URL live (bukan cuma di lokal).

**Target:** https://umkm-crm-lite.netlify.app

**Cara:**
- Jalankan skrip `verify_*.mjs` yang menunjuk ke URL produksi (bukan `localhost`):
  ```bash
  node verify_per_route.mjs        # pastikan BASE_URL = produksi
  node verify_no_js_4xx.mjs
  node verify_refresh.mjs
  node verify_direct_open.mjs      # buka tiap #route langsung
  node verify_resilient.mjs
  ```
- Setiap skrip menggunakan Playwright dengan kontrak ketat:
  listener console/pageerror/response SEBELUM `goto`, cache kosong
  (`browser.newContext()` fresh), capture response `≥ 400`, uji cold + refresh.

**Kriteria lulus (semua 12-produksi, lihat section 3):**
- Tiap route render nyata di produksi.
- Tidak ada 4xx/5xx pada app/js/css.
- Tidak ada console error.
- Refresh persist.
- 1 modul gagal ≠ app mati.

**Gerbang:** deployment verification LOLOS = aplikasi resmi "Production Ready".
Gagal = rollback / fix + redeploy (lihat deployment.md section 8).

---

## 11. Project Status

| Item | Nilai |
|------|-------|
| **Current Version** | `v0.9.0` |
| **Status** | Production Ready |
| **Deployment** | Netlify (https://umkm-crm-lite.netlify.app) |
| **Current Sprint** | Sprint 9 — selesai (baseline dokumentasi) |
| **Next Sprint** | Sprint 10 — Data Resilience & Project Consolidation |
| **Repo** | `Dzakiiin99/inventory-expense-manager` (branch `main`) |
| **Test Coverage** | Unit (`inventory.state`) + Production Verification (Playwright 12-kriteria) |
| **Lint** | ESLint 9 — 0 error |

**Definisi "Production Ready" untuk proyek ini:**
- Semua 7 modul (Dashboard, Inventory, Expenses, Stock, Customer, Transaction,
  Report) tersedia & terverifikasi di browser nyata.
- Router resilient: 1 modul gagal tidak mematikan app.
- Data persist di `localStorage` dengan defensive fallback.
- XSS-safe rendering di seluruh titik user-data.
- Deploy otomatis Netlify dari `main`, terverifikasi pasca-deploy.
