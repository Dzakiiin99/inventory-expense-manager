// pages/stock-movement.js
import { InventoryService } from '../services/inventory.service.js';
import { StockMovementService } from '../services/stock-movement.service.js';
import { Loading } from '../components/loading-state.js';
import { Button } from '../components/button.js';

const fmtDate = (iso) => new Date(iso).toLocaleString('id-ID');

// Defensive: escape user-controlled strings before injecting into innerHTML (XSS prevention).
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const renderStockMovementPage = async (container) => {
  Loading.show();
  try {
    const [items, inHist, outHist] = await Promise.all([
      InventoryService.getAllItems(),
      StockMovementService.getStockInHistory(),
      StockMovementService.getStockOutHistory()
    ]);
    const options = items.map((i) => `<option value="${i.id}">${escapeHtml(i.name)} (Stok: ${i.stock})</option>`).join('');
    const inRows = inHist.length
      ? inHist.map((r) => `<tr><td>${escapeHtml(r.namaBarang)}</td><td>${r.jumlah}</td><td>${fmtDate(r.tanggal)}</td></tr>`).join('')
      : '<tr><td colspan="3">Belum ada riwayat</td></tr>';
    const outRows = outHist.length
      ? outHist.map((r) => `<tr><td>${escapeHtml(r.namaBarang)}</td><td>${r.jumlah}</td><td>${fmtDate(r.tanggal)}</td></tr>`).join('')
      : '<tr><td colspan="3">Belum ada riwayat</td></tr>';

    container.innerHTML = `
      <div class="stock-page">
        <h1 class="page-title">Stok Masuk / Keluar</h1>
        <div class="grid-2">
          <div class="card">
            <h2>Barang Masuk</h2>
            <form id="form-masuk">
              <select name="barangId" class="input-field" required>${options}</select>
              <input type="number" name="jumlah" min="1" placeholder="Jumlah" class="input-field" required>
              ${Button.render({ text: 'Simpan Masuk', type: 'submit', variant: 'primary' })}
            </form>
          </div>
          <div class="card">
            <h2>Barang Keluar</h2>
            <form id="form-keluar">
              <select name="barangId" class="input-field" required>${options}</select>
              <input type="number" name="jumlah" min="1" placeholder="Jumlah" class="input-field" required>
              ${Button.render({ text: 'Simpan Keluar', type: 'submit', variant: 'danger' })}
            </form>
          </div>
        </div>
        <div class="grid-2">
          <div class="card"><h2>Riwayat Masuk</h2><table class="table"><thead><tr><th>Barang</th><th>Jumlah</th><th>Tanggal</th></tr></thead><tbody>${inRows}</tbody></table></div>
          <div class="card"><h2>Riwayat Keluar</h2><table class="table"><thead><tr><th>Barang</th><th>Jumlah</th><th>Tanggal</th></tr></thead><tbody>${outRows}</tbody></table></div>
        </div>
      </div>`;

    container.querySelector('#form-masuk').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      try {
        await StockMovementService.addStockIn(f.get('barangId'), parseInt(f.get('jumlah')));
        renderStockMovementPage(container);
      } catch (err) { alert(err.message); }
    });
    container.querySelector('#form-keluar').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      try {
        await StockMovementService.addStockOut(f.get('barangId'), parseInt(f.get('jumlah')));
        renderStockMovementPage(container);
      } catch (err) { alert(err.message); }
    });
  } catch (e) {
    console.error(e);
    container.innerHTML = '<div class="error-state"><p>Gagal memuat data stok</p></div>';
  } finally {
    Loading.hide();
  }
};

export const StockMovementPage = { render: renderStockMovementPage };
