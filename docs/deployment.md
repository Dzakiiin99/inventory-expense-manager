# Deployment — UMKM CRM Lite

Panduan deployment resmi. Aplikasi adalah **static site murni** (HTML/CSS/JS),
tanpa build step dan tanpa backend.

---

## 1. Platform

**Netlify** (auto-deploy dari GitHub).

- Repo: `Dzakiiin99/inventory-expense-manager` (branch `main`)
- URL produksi: **https://umkm-crm-lite.netlify.app**
- Publish directory: `public`
- Build command: *(kosong — tidak ada build step)*

---

## 2. Konfigurasi (`netlify.toml`)

```toml
[build]
  publish = "public"

[dev]
  publish = "public"
```

> `public/` adalah root statis. Semua aset (`assets/js`, `assets/css`) harus
> lengkap di dalamnya agar ES Modules ter-resolve di browser.

---

## 3. Auto-Deploy Flow

```
git push origin main
        │
        ▼
GitHub → Netlify webhook
        │
        ▼
Netlify deploy `public/` → https://umkm-crm-lite.netlify.app
```

Setiap push ke `main` otomatis di-deploy. Tidak perlu intervensi manual.

---

## 4. Manual Deploy (jika perlu)

```bash
# Pastikan netlify-cli terinstall
npm i -g netlify-cli

# Deploy produksi dari folder public
netlify deploy --prod --dir public
```

---

## 5. Pre-Deploy Checklist

Sebelum push ke `main`, pastikan:
- [ ] `npm test` lolos (unit test pure logic)
- [ ] `npm run lint` lolos (ESLint 0 error)
- [ ] Semua file modul baru **ter-commit** (termasuk `pages/*`, `services/*`)
      → modul tidak ter-commit = 404 di produksi (lihat insiden Sprint 9)
- [ ] `public/assets/js` lengkap & path import benar (case-sensitive di Linux/Netlify)
- [ ] Tidak ada referensi file yang tidak ada (CSS/JS missing)

---

## 6. Production Verification (Real Browser)

Verify produksi **wajib via real browser (Playwright/Chromium)** — jsdom/node
**dilarang** sebagai bukti "app jalan" karena tidak mereproduksi bug browser
asli (static ES-module 404, CSS, layout).

Kriteria 12-produksi (template verifikasi):
1. Per-route render nyata (DOM element count > 0)
2. Sidebar = menu navigasi
3. Content area berisi elemen nyata
4. Judul halaman visible
5. Tidak ada JS 404/5xx (listener response ≥ 400 SEBELUM goto)
6. Tidak ada console error
7. Refresh persist (cold load + refresh)
8. File diperbaiki = 200 (app/js)
9. Direct-open + refresh tiap route
10. Tidak kosong (elemen ter-render)
11. 1 modul gagal ≠ matikan app (route-error visible)
12. Build + smoke test lolos

Skrip verifikasi (`verify_*.mjs` di root repo) menjalankan kriteria di atas
dengan Playwright: listener console/pageerror/requestfailed/response SEBELUM
`goto`, capture response ≥ 400, cache kosong (new context), uji cold + refresh.

---

## 7. Deployment Details

Detail konfigurasi deployment berdasarkan kode & file aktual repo.

### 7.1 Netlify

- **Tipe hosting:** Static site (HTML/CSS/JS murni, ES Modules native).
- **Sumber:** GitHub `Dzakiiin99/inventory-expense-manager`, branch `main`.
- **Trigger:** Setiap push ke `main` → Netlify auto-build & deploy.
- **URL produksi:** https://umkm-crm-lite.netlify.app
- **Tidak ada backend:** semua logika di client, data di `localStorage` per-browser.
- **Tidak ada environment variable rahasia** (tidak ada API key di client).

### 7.2 SPA Routing

Aplikasi menggunakan **hash-based routing** (`#route`), BUKAN History API
(`/route`). Konsekuensi untuk hosting statis:

- Netlify **tidak butuh** `redirects`/`rewrites` ke `index.html`
  (seperti SPA pakai History API) karena route ada di hash, bukan path URL.
- Deep-link langsung (mis. `https://...netlify.app/#report`) langsung
  di-resolve oleh `router.js` di client — tidak ada 404 dari server.
- Unknown route (`#xxx`) → `router.js` fallback ke `#dashboard`.
- Kegagalan 1 modul → hanya route itu render `.route-error`, app tetap jalan.

> Jika kelak migrasi ke History API (clean URL tanpa `#`), maka wajib
> tambah `[[redirects]] from="/*" to="/index.html" status=200` di `netlify.toml`.
> Untuk arsitektur saat ini, itu TIDAK diperlukan.

### 7.3 netlify.toml

File konfigurasi ada di root repo (`netlify.toml`), isi aktual:

```toml
[build]
  publish = "public"

[dev]
  publish = "public"
```

- `publish = "public"` → Netlify menyajikan isi folder `public/` sebagai site.
- `[dev]` → untuk `netlify dev` lokal (preview sama dengan produksi).
- Tidak ada `command` di `[build]` → Netlify tidak menjalankan build apa pun.

### 7.4 Build Command

**Tidak ada build command.** Aplikasi tidak di-bundle/transpile.

- `netlify.toml` tidak mendefinisikan `command` → Netlify skip build step.
- Browser membaca ES Modules langsung (`<script type="module">` di `index.html`).
- "Build" dalam praktik = pastikan `public/` lengkap & `npm test` + `npm run lint` lolos
  (lihat Pre-Deploy Checklist section 5).
- Dev dependencies (`eslint`, `playwright`) **tidak** ikut ke produksi —
  hanya file statis di `public/` yang di-deploy.

### 7.5 Publish Directory

- **Publish directory = `public`** (didefinisikan di `netlify.toml`: `publish = "public"`).
- Netlify hanya menyajikan isi `public/` sebagai site produksi.
- Struktur wajib di dalam `public/`:
  - `public/index.html` — SPA shell (entry `<script type="module" src="assets/js/app.js">`).
  - `public/assets/js/**` — semua ES Modules (app, router, pages, services, components, utils).
  - `public/assets/css/style.css` — global styles + design tokens.
- Semua path import antar-modul **case-sensitive** (Linux/Netlify) — penting saat
  menambah file baru di Windows (lihat Known Issues 7.6).
- File di luar `public/` (root repo: `docs/`, `test/`, `verify_*.mjs`, `package.json`)
  **tidak** ikut ke produksi.

### 7.6 Deep-link Handling

Deep-link = user membuka URL lengkap dengan hash langsung, mis.
`https://umkm-crm-lite.netlify.app/#report`.

- **Hash-based routing** → deep-link di-resolve 100% di client oleh `router.js`,
  tidak melibatkan server. Tidak ada request ke path `/report` ke Netlify.
- `initRouter()` membaca `window.location.hash` saat load → langsung render route
  target (`dashboard` jika hash kosong).
- **Tidak butuh** konfigurasi redirect Netlify karena route berada di fragment (`#`),
  bukan di path URL. Ini keunggulan hash routing untuk static hosting tanpa backend.
- Unknown hash (`#xyz`) → `router.js` set `window.location.hash = '#dashboard'`
  (fallback otomatis, tidak 404).
- Deep-link ke route yang modulnya gagal load → hanya route itu render
  `.route-error`, app tidak mati.

### 7.7 Known Deployment Issues

1. **Modul tidak ter-commit → 404 di produksi (Sprint 9).**
   Report module (`pages/report/report.page.js`, `pages/report/report.state.js`,
   `services/report.service.js`) tidak di-commit ke git → Netlify deploy tanpa
   file tersebut → browser dapat 404 saat dynamic `import()` ke
   `./pages/report/report.page.js` → route Laporan blank/error di produksi
   (meski lokal jalan karena file ada di disk).

2. **Static import mematikan seluruh app (pre-Sprint 9).**
   Router awalnya `import` statis semua page di top-level → bila SATU modul 404
   (seperti isu #1), seluruh graph module gagal parse sebelum `initApp()` jalan
   → aplikasi TIDAK boot sama sekali (layar putih total).

3. **Case-sensitivity path (Windows dev → Linux prod).**
   Git di Windows bisa mengizinkan `import './Report.js'` sementara file asli
   `report.js`. Lokal jalan, tapi Netlify/Linux strict case → 404.

4. **Missing CSS/JS reference.**
   `index.html` atau modul mereferensi file yang tidak ada di `public/` → 404
   runtime (pernah terjadi di Sprint 4: `loading.css`, `empty-state.css`, dll. hilang).

### 7.8 Solusi yang Diterapkan

1. **Commit-all-modules discipline + pre-deploy checklist.**
   Setiap modul baru WAJIB ter-commit sebelum push `main`. Pre-deploy checklist
   (section 5) mewajibkan verifikasi `public/assets/js` lengkap & path benar.

2. **Router hardening: dynamic `import()` per-route + error boundary.**
   `router.js` menggunakan `ROUTE_LOADERS` dengan `import()` dinamis. Kegagalan
   SATU modul → hanya route itu yang `renderRouteError()` (`.route-error` visible,
   `role=alert`); route lain tetap jalan. App tidak lagi mati total.

3. **Case-sensitivity audit.**
   Semua `import` antar-modul di-normalisasi ke nama file asli (lowercase path).
   Konvensi: nama file & folder page selalu lowercase + hyphen/underscore.

4. **Production verification wajib (real browser).**
   Sebelum klaim "beres", jalankan `verify_*.mjs` (Playwright) yang menangkap
   response `≥ 400` SEBELUM `goto` — mendeteksi 404 module & missing asset
   secara otomatis. jsdom/`node --check` **dilarang** sebagai bukti.

---

## 8. Rollback

Netlify menyimpan deploy history. Rollback = pilih deploy sebelumnya di
dashboard Netlify, atau `git revert` + push (trigger deploy baru).

---

## 9. Catatan Environment

- **Hosting statis:** tidak ada server-side code. Semua logika di client.
- **Data:** `localStorage` per-browser. Tidak ada sinkronisasi antar device.
- **CORS/CDN:** Font Awesome dari cdnjs (SRI-protected). Tidak ada API eksternal lain.
- **SLA:** Best-effort (static hosting). Tidak ada backend yang perlu di-scale.
