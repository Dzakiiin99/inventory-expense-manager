// pages/expenses.js
import { ExpenseService } from '../services/expense.service.js';
import { Loading } from '../components/loading-state.js';
import { Button } from '../components/button.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { createEmptyState } from '../components/empty-state.js';
import { formatCurrency, formatDate, escapeHtml } from '../utils/index.js';

const renderExpensesPage = async (container) => {
  Loading.show();
  try {
    const list = await ExpenseService.getAll();
    const rows = list.map((e) => `
      <tr>
        <td>${escapeHtml(e.deskripsi)}</td>
        <td>${escapeHtml(e.kategori)}</td>
        <td>${formatCurrency(e.jumlah)}</td>
        <td>${formatDate(e.tanggal)}</td>
        <td class="table-actions">${Button.render({ text: 'Hapus', variant: 'danger', size: 'small', onClick: () => deleteExpense(e.id, container) })}</td>
      </tr>`).join('');

    container.innerHTML = `
      <div class="expense-page">
        <div class="page-header">
          <h1 class="page-title">Pengeluaran</h1>
        </div>
        <div class="card">
          <h2>Tambah Pengeluaran</h2>
          <form id="form-pengeluaran">
            <input type="text" name="deskripsi" placeholder="Deskripsi" class="input-field" required>
            <select name="kategori" class="input-field" required>
              <option value="Operasional">Operasional</option>
              <option value="Pembelian">Pembelian</option>
              <option value="Gaji">Gaji</option>
              <option value="Lainnya">Lainnya</option>
            </select>
            <input type="number" name="jumlah" min="0" placeholder="Jumlah (Rp)" class="input-field" required>
            ${Button.render({ text: 'Simpan', type: 'submit', variant: 'primary' })}
          </form>
        </div>
        <div class="card">
          <h2>Riwayat Pengeluaran</h2>
          ${list.length ? `<table class="table"><thead><tr><th>Deskripsi</th><th>Kategori</th><th>Jumlah</th><th>Tanggal</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table>` : ''}
          <div id="expense-empty"></div>
        </div>
      </div>`;

    if (list.length === 0) {
      container.querySelector('#expense-empty').appendChild(createEmptyState('Belum ada pengeluaran'));
    }

    container.querySelector('#form-pengeluaran').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      try {
        await ExpenseService.add({
          deskripsi: f.get('deskripsi').trim(),
          kategori: f.get('kategori'),
          jumlah: parseFloat(f.get('jumlah'))
        });
        Toast.show('Pengeluaran berhasil ditambahkan', 'success');
        renderExpensesPage(container);
      } catch (err) {
        Toast.show(typeof err === 'object' ? Object.values(err).join('\n') : err.message, 'error');
      }
    });
  } catch (e) {
    console.error(e);
    container.innerHTML = '<div class="error-state"><p>Gagal memuat pengeluaran</p></div>';
  } finally {
    Loading.hide();
  }
};

const deleteExpense = (id, container) => {
  Modal.confirm({
    title: 'Hapus Pengeluaran',
    content: 'Yakin hapus pengeluaran ini?',
    onConfirm: async () => {
      await ExpenseService.delete(id);
      Toast.show('Pengeluaran berhasil dihapus', 'success');
      renderExpensesPage(container);
    }
  });
};

export const ExpensesPage = { render: renderExpensesPage };