// pages/stock-movement.js
import { InventoryService } from '../services/inventory.service.js';
import { StockMovementService } from '../services/stock-movement.service.js';
import { Loading } from '../components/loading-state.js';
import { Button } from '../components/button.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { createEmptyState } from '../components/empty-state.js';
import { formatDate, escapeHtml } from '../utils/index.js';

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
      ? inHist.map((r) => `<tr><td>${escapeHtml(r.namaBarang)}</td><td>${r.jumlah}</td><td>${formatDate(r.tanggal, true)}</td></tr>`).join('')
      : '';
    const outRows = outHist.length
      ? outHist.map((r) => `<tr><td>${escapeHtml(r.namaBarang)}</td><td>${r.jumlah}</td><td>${formatDate(r.tanggal, true)}</td></tr>`).join('')
      : '';

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
          <div class="card">
            <h2>Riwayat Masuk</h2>
            ${inHist.length ? `<table class="table"><thead><tr><th>Barang</th><th>Jumlah</th><th>Tanggal</th></tr></thead><tbody>${inRows}</tbody></table>` : ''}
            <div id="stock-in-empty"></div>
          </div>
          <div class="card">
            <h2>Riwayat Keluar</h2>
            ${outHist.length ? `<table class="table"><thead><tr><th>Barang</th><th>Jumlah</th><th>Tanggal</th></tr></thead><tbody>${outRows}</tbody></table>` : ''}
            <div id="stock-out-empty"></div>
          </div>
        </div>
      </div>`;

    // Empty states
    if (inHist.length === 0) {
      container.querySelector('#stock-in-empty').appendChild(createEmptyState('Belum ada stok masuk'));
    }
    if (outHist.length === 0) {
      container.querySelector('#stock-out-empty').appendChild(createEmptyState('Belum ada stok keluar'));
    }

    // Stock In with confirmation
    container.querySelector('#form-masuk').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const barangId = f.get('barangId');
      const jumlah = parseInt(f.get('jumlah'));
      const selectedItem = items.find(i => i.id === barangId);
      
      Modal.confirm({
        title: 'Konfirmasi Stok Masuk',
        content: `Tambah ${jumlah} unit <strong>${escapeHtml(selectedItem?.name || '')}</strong> ke stok?`,
        onConfirm: async () => {
          try {
            await StockMovementService.addStockIn(barangId, jumlah);
            Toast.show(`${jumlah} unit ${selectedItem?.name} berhasil ditambahkan`, 'success');
            renderStockMovementPage(container);
          } catch (err) { 
            Toast.show(err.message, 'error');
          }
        }
      });
    });

    // Stock Out with confirmation
    container.querySelector('#form-keluar').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const barangId = f.get('barangId');
      const jumlah = parseInt(f.get('jumlah'));
      const selectedItem = items.find(i => i.id === barangId);
      
      Modal.confirm({
        title: 'Konfirmasi Stok Keluar',
        content: `Kurangi ${jumlah} unit <strong>${escapeHtml(selectedItem?.name || '')}</strong> dari stok?`,
        onConfirm: async () => {
          try {
            await StockMovementService.addStockOut(barangId, jumlah);
            Toast.show(`${jumlah} unit ${selectedItem?.name} berhasil dikurangi`, 'success');
            renderStockMovementPage(container);
          } catch (err) { 
            Toast.show(err.message, 'error');
          }
        }
      });
    });
  } catch (e) {
    console.error(e);
    container.innerHTML = '<div class="error-state"><p>Gagal memuat data stok</p></div>';
  } finally {
    Loading.hide();
  }
};

export const StockMovementPage = { render: renderStockMovementPage };