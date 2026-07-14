// pages/customer/customer.page.js
// Orchestrator — menghubungkan CustomerService, customer.state, customer.render.
// TIDAK BOLEH: business logic baru, akses storage langsung, filter/sort/stats manual.

import { CustomerService } from '../../services/customer.service.js';
import { Loading } from '../../components/loading-state.js';
import { Modal } from '../../components/modal.js';
import { Toast } from '../../components/toast.js';
import { escapeHtml } from '../../utils/index.js';
import {
  state,
  PAGE_SIZE,
  getVisibleItems,
  computeStats,
  getTotalPages,
} from './customer.state.js';
import {
  buildPageShellHtml,
  renderStats,
  renderTable,
  renderPagination,
  renderLoadingState,
  renderErrorState,
} from './customer.render.js';

// ─── RENDER ALL ──────────────────────────────────────────────────

/**
 * Re-render seluruh tampilan (stats + table + pagination).
 * Dipanggil setelah setiap perubahan state.
 * @param {HTMLElement} container
 */
function renderAll(container) {
  // Stats: computeStats() = single source of truth
  const stats = computeStats(state);
  renderStats(container, stats);

  // Table: getVisibleItems() sudah filter + sort
  const visibleItems = getVisibleItems(state);
  const totalPages = getTotalPages(visibleItems.length, PAGE_SIZE);

  // Clamp currentPage jika data berkurang
  if (state.currentPage > totalPages) state.currentPage = totalPages;

  // Slice untuk halaman saat ini
  const start = (state.currentPage - 1) * PAGE_SIZE;
  const pageItems = visibleItems.slice(start, start + PAGE_SIZE);

  // Render tabel + pagination
  renderTable(container, pageItems, {
    onDetail: (id) => showDetail(container, id),
    onEdit: (id) => showEditForm(container, id),
    onDelete: (id) => confirmDelete(container, id),
  });

  // Render pagination di dalam table container
  const tableContainer = container.querySelector('#customer-table-container');
  if (tableContainer && visibleItems.length > PAGE_SIZE) {
    tableContainer.insertAdjacentHTML(
      'beforeend',
      renderPagination(state.currentPage, totalPages, visibleItems.length)
    );
  }
}

// ─── EVENT BINDING ───────────────────────────────────────────────

/**
 * Bind semua event listener ke elemen page.
 * @param {HTMLElement} container
 */
function bindEvents(container) {
  // Search
  const searchInput = container.querySelector('#search-customer');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      state.currentPage = 1;
      renderAll(container);
    });
  }

  // Filter status
  const filterStatus = container.querySelector('#filter-status');
  if (filterStatus) {
    filterStatus.addEventListener('change', (e) => {
      state.filterStatus = e.target.value;
      state.currentPage = 1;
      renderAll(container);
    });
  }

  // Sort
  const sortSelect = container.querySelector('#sort-customer');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      state.currentPage = 1;
      renderAll(container);
    });
  }

  // Pagination (delegated)
  container.addEventListener('click', (e) => {
    const pageBtn = e.target.closest('[data-page]');
    if (!pageBtn) return;

    const page = pageBtn.getAttribute('data-page');
    const visibleItems = getVisibleItems(state);
    const totalPages = getTotalPages(visibleItems.length, PAGE_SIZE);

    if (page === 'prev') {
      if (state.currentPage > 1) state.currentPage--;
    } else if (page === 'next') {
      if (state.currentPage < totalPages) state.currentPage++;
    } else {
      const num = parseInt(page, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        state.currentPage = num;
      }
    }

    renderAll(container);
  });
}

// ─── CRUD OPERATIONS ─────────────────────────────────────────────

/**
 * Tampilkan modal form tambah customer.
 * @param {HTMLElement} container
 */
function showAddForm(container) {
  const formHtml = `
    <form id="customer-form">
      <div class="form-group">
        <label for="cust-name">Nama *</label>
        <input type="text" id="cust-name" name="name" class="input-field" required minlength="2" placeholder="Nama pelanggan">
      </div>
      <div class="form-group">
        <label for="cust-phone">Phone</label>
        <input type="text" id="cust-phone" name="phone" class="input-field" placeholder="08xxxxxxxxxx">
      </div>
      <div class="form-group">
        <label for="cust-email">Email</label>
        <input type="email" id="cust-email" name="email" class="input-field" placeholder="email@example.com">
      </div>
      <div class="form-group">
        <label for="cust-address">Alamat</label>
        <textarea id="cust-address" name="address" class="input-field" rows="2" placeholder="Alamat pelanggan"></textarea>
      </div>
      <div class="form-group">
        <label for="cust-notes">Catatan</label>
        <textarea id="cust-notes" name="notes" class="input-field" rows="2" placeholder="Catatan tambahan"></textarea>
      </div>
      <div class="modal-actions">
        <button type="submit" class="btn btn-primary">Simpan</button>
        <button type="button" class="btn btn-secondary" id="customer-form-cancel">Batal</button>
      </div>
    </form>
  `;

  Modal.show({ title: 'Tambah Pelanggan', content: formHtml });

  // Event: submit form
  const form = document.getElementById('customer-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      try {
        await CustomerService.createCustomer({
          name: fd.get('name'),
          phone: fd.get('phone'),
          email: fd.get('email'),
          address: fd.get('address'),
          notes: fd.get('notes'),
        });
        Modal.close();
        Toast.show('Pelanggan berhasil ditambahkan', 'success');
        await refreshData(container);
      } catch (err) {
        Toast.show(err.message || 'Gagal menambahkan pelanggan', 'error');
      }
    });
  }

  // Event: batal
  const cancelBtn = document.getElementById('customer-form-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => Modal.close());
  }
}

/**
 * Tampilkan modal form edit customer.
 * @param {HTMLElement} container
 * @param {string} id
 */
async function showEditForm(container, id) {
  try {
    Loading.show();
    const customer = await CustomerService.getCustomerById(id);
    Loading.hide();

    if (!customer) {
      Toast.show('Pelanggan tidak ditemukan', 'error');
      return;
    }

    const formHtml = `
      <form id="customer-form">
        <div class="form-group">
          <label for="cust-name">Nama *</label>
          <input type="text" id="cust-name" name="name" class="input-field" required minlength="2"
            value="${escapeAttr(customer.name || '')}">
        </div>
        <div class="form-group">
          <label for="cust-phone">Phone</label>
          <input type="text" id="cust-phone" name="phone" class="input-field"
            value="${escapeAttr(customer.phone || '')}">
        </div>
        <div class="form-group">
          <label for="cust-email">Email</label>
          <input type="email" id="cust-email" name="email" class="input-field"
            value="${escapeAttr(customer.email || '')}">
        </div>
        <div class="form-group">
          <label for="cust-address">Alamat</label>
          <textarea id="cust-address" name="address" class="input-field" rows="2">${escapeHtml(customer.address || '')}</textarea>
        </div>
        <div class="form-group">
          <label for="cust-notes">Catatan</label>
          <textarea id="cust-notes" name="notes" class="input-field" rows="2">${escapeHtml(customer.notes || '')}</textarea>
        </div>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">Simpan</button>
          <button type="button" class="btn btn-secondary" id="customer-form-cancel">Batal</button>
        </div>
      </form>
    `;

    Modal.show({ title: `Edit Pelanggan — ${customer.customerCode}`, content: formHtml });

    // Event: submit form
    const form = document.getElementById('customer-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        try {
          await CustomerService.updateCustomer(id, {
            name: fd.get('name'),
            phone: fd.get('phone'),
            email: fd.get('email'),
            address: fd.get('address'),
            notes: fd.get('notes'),
          });
          Modal.close();
          Toast.show('Pelanggan berhasil diupdate', 'success');
          await refreshData(container);
        } catch (err) {
          Toast.show(err.message || 'Gagal mengupdate pelanggan', 'error');
        }
      });
    }

    // Event: batal
    const cancelBtn = document.getElementById('customer-form-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => Modal.close());
    }
  } catch {
    Loading.hide();
    Toast.show('Gagal memuat data pelanggan', 'error');
  }
}

/**
 * Tampilkan modal detail customer.
 * @param {HTMLElement} container
 * @param {string} id
 */
async function showDetail(container, id) {
  try {
    Loading.show();
    const c = await CustomerService.getCustomerById(id);
    Loading.hide();

    if (!c) {
      Toast.show('Pelanggan tidak ditemukan', 'error');
      return;
    }

    const detailHtml = `
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-label">Code</span><span class="detail-value">${escapeHtml(c.customerCode || '-')}</span></div>
        <div class="detail-row"><span class="detail-label">Nama</span><span class="detail-value">${escapeHtml(c.name || '-')}</span></div>
        <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${escapeHtml(c.phone || '-')}</span></div>
        <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${escapeHtml(c.email || '-')}</span></div>
        <div class="detail-row"><span class="detail-label">Alamat</span><span class="detail-value">${escapeHtml(c.address || '-')}</span></div>
        <div class="detail-row"><span class="detail-label">Catatan</span><span class="detail-value">${escapeHtml(c.notes || '-')}</span></div>
        <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${c.isActive ? 'Aktif' : 'Nonaktif'}</span></div>
        <div class="detail-row"><span class="detail-label">Terdaftar</span><span class="detail-value">${c.createdAt || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Diupdate</span><span class="detail-value">${c.updatedAt || '-'}</span></div>
      </div>
    `;

    Modal.show({ title: `Detail Pelanggan — ${c.customerCode}`, content: detailHtml });
  } catch {
    Loading.hide();
    Toast.show('Gagal memuat data pelanggan', 'error');
  }
}

/**
 * Konfirmasi hapus customer (soft delete).
 * @param {HTMLElement} container
 * @param {string} id
 */
function confirmDelete(container, id) {
  Modal.confirm({
    title: 'Hapus Pelanggan',
    content: 'Yakin hapus pelanggan ini? Data akan dinonaktifkan (tidak dihapus permanen).',
    onConfirm: async () => {
      try {
        await CustomerService.deleteCustomer(id);
        Toast.show('Pelanggan berhasil dinonaktifkan', 'success');
        await refreshData(container);
      } catch (err) {
        Toast.show(err.message || 'Gagal menghapus pelanggan', 'error');
      }
    },
  });
}

// ─── DATA REFRESH ────────────────────────────────────────────────

/**
 * Refresh data dari service → update state → re-render.
 * @param {HTMLElement} container
 */
async function refreshData(container) {
  try {
    const customers = await CustomerService.getAllCustomers();
    state.items = customers;
    renderAll(container);
  } catch (err) {
    console.error('Gagal refresh data customer:', err);
    Toast.show('Gagal memuat data pelanggan', 'error');
  }
}

// ─── HELPER ──────────────────────────────────────────────────────

/**
 * Escape string untuk atribut HTML (mencegah XSS di value="...").
 * @param {string} str
 * @returns {string}
 */
function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── MAIN PAGE RENDER ────────────────────────────────────────────

/**
 * Render halaman Customer (entry point).
 * @param {HTMLElement} container
 */
const renderCustomerPage = async (container) => {
  // 1. Render loading state
  container.innerHTML = renderLoadingState('Memuat data pelanggan...');

  try {
    // 2. Load data awal
    const customers = await CustomerService.getAllCustomers();
    state.items = customers;
    state.searchQuery = '';
    state.filterStatus = '';
    state.sortBy = 'name-asc';
    state.currentPage = 1;

    // 3. Build page shell
    container.innerHTML = buildPageShellHtml({
      onAdd: () => showAddForm(container),
      onExport: () => {
        // TODO: implement CSV export (Phase 2.6)
        Toast.show('Export CSV belum diimplementasi', 'info');
      },
      onImport: () => {
        // TODO: implement CSV import (Phase 2.6)
        Toast.show('Import CSV belum diimplementasi', 'info');
      },
    });

    // 4. Render stats + table
    renderAll(container);

    // 5. Bind events
    bindEvents(container);
  } catch (err) {
    console.error('Gagal memuat halaman customer:', err);
    container.innerHTML = renderErrorState('Gagal memuat data pelanggan. Silakan coba lagi.');
  }
};

// ─── EXPORT ──────────────────────────────────────────────────────

export const CustomerPage = { render: renderCustomerPage };
