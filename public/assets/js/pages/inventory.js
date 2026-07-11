// pages/inventory.js
// Entry / orchestrator halaman inventori.
//   - State + pure logic   → ./inventory/inventory.state.js
//   - Render partial       → ./inventory/inventory.render.js
// File ini: lifecycle page, wiring listener, CRUD handler, CSV modal handler.
import { InventoryService } from '../services/inventory.service.js';
import { InventoryForm } from '../components/inventory-form.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { Loading } from '../components/loading-state.js';
import { exportInventoryCsv, parseInventoryCsv, applyInventoryImport } from '../services/export.service.js';
import { downloadFile } from '../utils/csv.js';
import { escapeHtml, formatCurrency } from '../utils/index.js';
import { state, getVisibleItems, getTotalPages, PAGE_SIZE } from './inventory/inventory.state.js';
import { renderStats, renderTable, buildPageShellHtml } from './inventory/inventory.render.js';

let pageContainer = null;

// Attach submit handler to form after modal renders
function attachFormHandler() {
  const form = document.getElementById('inventory-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
    // Store item ID for edit mode
    const editId = form.dataset.itemId;
    if (editId) {
      form.setAttribute('data-item-id', editId);
    }
  }
}

const showAddForm = () => {
  Modal.show({
    title: 'Tambah Barang',
    content: InventoryForm.render({}),
    onClose: () => {}
  });
  // Attach handler after modal content is in DOM
  setTimeout(attachFormHandler, 0);
};

const editItem = (id) => {
  const item = state.items.find((item) => item.id === id);
  if (!item) return;

  Modal.show({
    title: 'Edit Barang',
    content: InventoryForm.render(item),
    onClose: () => {}
  });
  // Attach handler and set item ID for edit mode
  setTimeout(() => {
    attachFormHandler();
    const form = document.getElementById('inventory-form');
    if (form) {
      form.setAttribute('data-item-id', id);
    }
  }, 0);
};

const deleteItem = (id) => {
  const item = state.items.find((item) => item.id === id);
  Modal.confirm({
    title: 'Hapus Barang',
    content: `Apakah Anda yakin ingin menghapus <strong>${escapeHtml(item?.name || '')}</strong>?`,
    onConfirm: async () => {
      try {
        await InventoryService.deleteItem(id);
        Toast.show('Barang berhasil dihapus', 'success');
        await renderInventoryPage(pageContainer);
      } catch (error) {
        console.error('Gagal menghapus barang:', error);
        Toast.show('Gagal menghapus barang. Silakan coba lagi.', 'error');
      }
    }
  });
};

const detailItem = (id) => {
  const item = state.items.find((item) => item.id === id);
  if (!item) return;

  Modal.show({
    title: 'Detail Barang',
    content: `
      <div class="detail-content">
        <p><strong>Kode:</strong> ${escapeHtml(item.code)}</p>
        <p><strong>Nama:</strong> ${escapeHtml(item.name)}</p>
        <p><strong>Kategori:</strong> ${escapeHtml(item.category)}</p>
        <p><strong>Stok:</strong> ${item.stock} ${escapeHtml(item.unit)}</p>
        <p><strong>Harga:</strong> ${formatCurrency(item.price)}</p>
        <p><strong>Status:</strong> ${item.status === 'active' ? 'Aktif' : 'Nonaktif'}</p>
      </div>
    `,
    onClose: () => {}
  });
};

const handleFormSubmit = async (e) => {
  e.preventDefault();
  const formData = InventoryForm.getFormData();
  const errors = InventoryForm.validate(formData);

  if (Object.keys(errors).length > 0) {
    Toast.show(Object.values(errors).join('\n'), 'error');
    return;
  }

  try {
    const form = document.getElementById('inventory-form');
    const itemId = form?.dataset?.itemId;

    if (itemId) {
      await InventoryService.updateItem(itemId, formData);
      Toast.show('Barang berhasil diperbarui', 'success');
    } else {
      await InventoryService.addItem(formData);
      Toast.show('Barang berhasil ditambahkan', 'success');
    }
    Modal.close();
    await renderInventoryPage(pageContainer);
  } catch (error) {
    console.error('Gagal menyimpan barang:', error);
    Toast.show('Gagal menyimpan barang. Silakan coba lagi.', 'error');
  }
};

// Handlers CRUD dipakai oleh renderTable (via InventoryTable) & modal
const handlers = {
  onEdit: editItem,
  onDelete: deleteItem,
  onDetail: detailItem,
};

const renderInventoryPage = async (container) => {
  pageContainer = container || document.getElementById('app');
  if (!pageContainer) {
    console.error('Container tidak ditemukan');
    return;
  }
  // reset state tiap buka page → konsisten dengan input kosong
  state.searchQuery = '';
  state.filterCategory = '';
  state.filterStock = '';
  state.sortBy = 'name-asc';
  state.currentPage = 1;
  state.importParsed = null;

  Loading.show();
  try {
    state.items = await InventoryService.getAllItems();

    pageContainer.innerHTML = buildPageShellHtml(state, {
      onAdd: showAddForm,
      onExport: exportInventory,
      onImport: showImportModal,
    });

    // Listener search + filter + sort di-attach SEKALI (realtime). Hanya renderTable() yang dijalankan → no dup listener / no full re-render
    const searchInput = pageContainer.querySelector('#search-barang');
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      state.currentPage = 1;
      renderTable(pageContainer, state, handlers);
    });

    const filterKategori = pageContainer.querySelector('#filter-kategori');
    filterKategori.addEventListener('change', (e) => {
      state.filterCategory = e.target.value;
      state.currentPage = 1;
      renderTable(pageContainer, state, handlers);
    });

    const filterStok = pageContainer.querySelector('#filter-stok');
    filterStok.addEventListener('change', (e) => {
      state.filterStock = e.target.value;
      state.currentPage = 1;
      renderTable(pageContainer, state, handlers);
    });

    const sortBarang = pageContainer.querySelector('#sort-barang');
    sortBarang.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      state.currentPage = 1;
      renderTable(pageContainer, state, handlers);
    });

    // Pagination: delegated click (1 listener, tidak dobel tiap render)
    const tableContainer = pageContainer.querySelector('#inventory-table-container');
    tableContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-page]');
      if (!btn || btn.disabled) return;
      const page = btn.getAttribute('data-page');
      const allItems = getVisibleItems(state);
      const totalPages = getTotalPages(allItems.length, PAGE_SIZE);
      if (page === 'prev') {
        state.currentPage = Math.max(1, state.currentPage - 1);
      } else if (page === 'next') {
        state.currentPage = Math.min(totalPages, state.currentPage + 1);
      } else {
        state.currentPage = parseInt(page);
      }
      renderTable(pageContainer, state, handlers);
    });

    renderStats(pageContainer, state); // render stats awal
    renderTable(pageContainer, state, handlers); // render awal
  } catch (error) {
    console.error('Gagal memuat data barang:', error);
    pageContainer.innerHTML = `
      <div class="error-state">
        <p>Gagal memuat data barang</p>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;
  } finally {
    Loading.hide();
  }
};

// ---- Sprint 6: Export / Import CSV ----
const exportInventory = () => {
  try {
    const csv = exportInventoryCsv();
    downloadFile('inventori.csv', csv, 'text/csv;charset=utf-8');
    Toast.show('Data inventori berhasil diekspor', 'success');
  } catch (error) {
    console.error('Gagal mengekspor inventori:', error);
    Toast.show('Gagal mengekspor data', 'error');
  }
};

const showImportModal = () => {
  state.importParsed = null;
  Modal.show({
    title: 'Import Inventori dari CSV',
    content: `
      <div class="import-modal">
        <p>Pilih file CSV dengan kolom: Kode, Nama, Kategori, Stok, Satuan, Harga, Status.</p>
        <input type="file" id="import-file" accept=".csv,text/csv" class="input-field">
        <div class="form-group">
          <label>Mode Import</label>
          <select id="import-mode" class="input-field">
            <option value="merge">Gabung (update jika Kode sama, tambah jika baru)</option>
            <option value="replace">Ganti Semua (hapus data lama)</option>
          </select>
        </div>
        <div id="import-preview" class="import-preview"></div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="import-preview-btn" type="button">Preview</button>
          <button class="btn btn-primary" id="import-do-btn" type="button">Import</button>
        </div>
      </div>
    `,
    onClose: () => { state.importParsed = null; }
  });

  const fileInput = document.getElementById('import-file');
  if (fileInput) fileInput.addEventListener('change', onImportFileSelected);
  const previewBtn = document.getElementById('import-preview-btn');
  if (previewBtn) previewBtn.addEventListener('click', previewImport);
  const doBtn = document.getElementById('import-do-btn');
  if (doBtn) doBtn.addEventListener('click', doImport);
};

const onImportFileSelected = (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state.importParsed = parseInventoryCsv(reader.result);
      previewImport();
    } catch (err) {
      state.importParsed = null;
      const preview = document.getElementById('import-preview');
      if (preview) preview.innerHTML = `<p class="import-error">Gagal membaca file: ${escapeHtml(err.message)}</p>`;
    }
  };
  reader.readAsText(file);
};

const previewImport = () => {
  const preview = document.getElementById('import-preview');
  if (!preview) return;
  if (!state.importParsed) {
    preview.innerHTML = '<p class="import-error">Pilih file terlebih dahulu.</p>';
    return;
  }
  const { rows, errors } = state.importParsed;
  let html = `<p><strong>${rows.length}</strong> baris valid, <strong>${errors.length}</strong> error.</p>`;
  if (rows.length) {
    html += '<table class="table import-preview-table"><thead><tr><th>Kode</th><th>Nama</th><th>Stok</th><th>Harga</th></tr></thead><tbody>';
    html += rows.slice(0, 5).map((r) =>
      `<tr><td>${escapeHtml(r.code)}</td><td>${escapeHtml(r.name)}</td><td>${r.stock}</td><td>${r.price}</td></tr>`
    ).join('');
    html += '</tbody></table>';
    if (rows.length > 5) html += `<p>...dan ${rows.length - 5} baris lainnya.</p>`;
  }
  if (errors.length) {
    html += '<ul class="import-error-list">' +
      errors.slice(0, 10).map((er) => `<li>${escapeHtml(er)}</li>`).join('') +
      '</ul>';
  }
  preview.innerHTML = html;
};

const doImport = () => {
  if (!state.importParsed || state.importParsed.rows.length === 0) {
    Toast.show('Tidak ada data valid untuk diimpor', 'error');
    return;
  }
  const mode = (document.getElementById('import-mode') || {}).value || 'merge';
  const apply = () => {
    try {
      const count = applyInventoryImport(state.importParsed.rows, mode);
      Modal.close();
      Toast.show(`Berhasil mengimpor ${count} barang (mode: ${mode === 'replace' ? 'ganti semua' : 'gabung'})`, 'success');
      state.importParsed = null;
      renderInventoryPage(pageContainer);
    } catch (err) {
      console.error('Gagal mengimpor:', err);
      Toast.show('Gagal mengimpor data', 'error');
    }
  };
  if (mode === 'replace') {
    Modal.confirm({
      title: 'Ganti Semua Data?',
      content: 'Mode <strong>Ganti Semua</strong> akan menghapus seluruh data inventori saat ini dan menggantinya dengan data dari CSV. Lanjutkan?',
      onConfirm: apply
    });
  } else {
    apply();
  }
};

export const InventoryPage = {
  render: renderInventoryPage
};
