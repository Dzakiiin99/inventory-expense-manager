// pages/customer/customer.render.js
// Render functions (partial DOM update). Terima (container, data, callbacks).
// Prinsip: Render hanya menerima data → menghasilkan tampilan.
// TIDAK BOLEH: akses storage, ubah state, business logic, event listener.

import { createStatCard } from '../../components/design-system/card.js';
import { Badge } from '../../components/badge.js';
import { Button } from '../../components/button.js';
import { escapeHtml, formatDate } from '../../utils/index.js';
import { PAGE_SIZE } from './customer.state.js';

// ─── HELPER ──────────────────────────────────────────────────────

/**
 * Render status badge untuk customer.
 * @param {boolean} isActive
 * @returns {string} HTML string
 */
function renderStatusBadge(isActive) {
  return isActive
    ? Badge.render({ text: 'Active', variant: 'success' })
    : Badge.render({ text: 'Inactive', variant: 'danger' });
}

/**
 * Render action buttons untuk satu baris customer.
 * @param {object} customer
 * @param {object} handlers - { onEdit, onDelete, onDetail }
 * @returns {string} HTML string
 */
function renderActionButtons(customer, handlers = {}) {
  const detailBtn = handlers.onDetail
    ? Button.render({ text: '', icon: 'fas fa-eye', variant: 'info', size: 'small', onClick: () => handlers.onDetail(customer.id) })
    : '';
  const editBtn = handlers.onEdit
    ? Button.render({ text: '', icon: 'fas fa-edit', variant: 'primary', size: 'small', onClick: () => handlers.onEdit(customer.id) })
    : '';
  const deleteBtn = handlers.onDelete
    ? Button.render({ text: '', icon: 'fas fa-trash', variant: 'danger', size: 'small', onClick: () => handlers.onDelete(customer.id) })
    : '';

  return `<div class="action-buttons">${detailBtn}${editBtn}${deleteBtn}</div>`;
}

/**
 * Render satu baris tabel customer.
 * @param {object} customer
 * @param {object} handlers
 * @returns {string} HTML string
 */
function renderTableRow(customer, handlers = {}) {
  return `
    <tr>
      <td><code>${escapeHtml(customer.customerCode || '-')}</code></td>
      <td>${escapeHtml(customer.name || '-')}</td>
      <td>${escapeHtml(customer.phone || '-')}</td>
      <td>${escapeHtml(customer.email || '-')}</td>
      <td>${renderStatusBadge(customer.isActive)}</td>
      <td>${customer.createdAt ? formatDate(customer.createdAt) : '-'}</td>
      <td>${renderActionButtons(customer, handlers)}</td>
    </tr>
  `;
}

// ─── MAIN RENDER FUNCTIONS ───────────────────────────────────────

/**
 * Render tabel customer ke container.
 * @param {HTMLElement} container - elemen page container
 * @param {Array} customers - array customer yang sudah terfilter & terurut
 * @param {object} handlers - { onEdit, onDelete, onDetail }
 */
export function renderTable(container, customers, handlers = {}) {
  const el = container && container.querySelector('#customer-table-container');
  if (!el) return;

  if (!customers || customers.length === 0) {
    el.innerHTML = renderEmptyState();
    return;
  }

  const rows = customers.map((c) => renderTableRow(c, handlers)).join('');

  el.innerHTML = `
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Nama</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Status</th>
            <th>Terdaftar</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Render stat cards ke container.
 * Statistik berasal dari computeStats() — render TIDAK menghitung ulang.
 * @param {HTMLElement} container
 * @param {object} stats - { totalCustomers, activeCustomers, inactiveCustomers, noEmail, noPhone }
 */
export function renderStats(container, stats = {}) {
  const statsContainer = container && container.querySelector('#customer-stats');
  if (!statsContainer) return;

  statsContainer.innerHTML = '';
  statsContainer.appendChild(createStatCard('Total Pelanggan', stats.totalCustomers || 0, 'fas fa-users', 'primary'));
  statsContainer.appendChild(createStatCard('Aktif', stats.activeCustomers || 0, 'fas fa-user-check', 'success'));
  statsContainer.appendChild(createStatCard('Nonaktif', stats.inactiveCustomers || 0, 'fas fa-user-times', 'danger'));
  statsContainer.appendChild(createStatCard('Tanpa Email', stats.noEmailCustomers || 0, 'fas fa-envelope', 'warning'));
  statsContainer.appendChild(createStatCard('Tanpa Phone', stats.noPhoneCustomers || 0, 'fas fa-phone', 'info'));
}

/**
 * Render pagination controls (hanya HTML, tidak mengubah page).
 * @param {number} currentPage
 * @param {number} totalPages
 * @param {number} totalItems
 * @returns {string} HTML string
 */
export function renderPagination(currentPage, totalPages, totalItems) {
  if (totalItems <= PAGE_SIZE) return '';

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    const activeCls = i === currentPage ? ' btn-primary' : ' btn-secondary';
    pages.push(`<button class="btn btn-small${activeCls}" data-page="${i}">${i}</button>`);
  }

  return `
    <div class="customer-pagination">
      <button class="btn btn-small btn-secondary" data-page="prev" ${currentPage <= 1 ? 'disabled' : ''}>&laquo;</button>
      ${pages.join('')}
      <button class="btn btn-small btn-secondary" data-page="next" ${currentPage >= totalPages ? 'disabled' : ''}>&raquo;</button>
      <span class="pagination-info">Hal ${currentPage}/${totalPages} · ${totalItems} pelanggan</span>
    </div>
  `;
}

/**
 * Render empty state (ketika data kosong).
 * @param {string} [message]
 * @returns {string} HTML string
 */
export function renderEmptyState(message) {
  const msg = message || 'Belum ada data pelanggan. Klik "Tambah Pelanggan" untuk menambahkan.';
  return `
    <div class="empty-state">
      <div class="empty-state-icon">
        <i class="fas fa-users"></i>
      </div>
      <div class="empty-state-message">${escapeHtml(msg)}</div>
    </div>
  `;
}

/**
 * Render loading state (untuk kompatibilitas REST API masa depan).
 * @param {string} [message]
 * @returns {string} HTML string
 */
export function renderLoadingState(message) {
  const msg = message || 'Memuat data pelanggan...';
  return `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <div class="loading-message">${escapeHtml(msg)}</div>
    </div>
  `;
}

/**
 * Render error state.
 * @param {string} message
 * @returns {string} HTML string
 */
export function renderErrorState(message) {
  return `
    <div class="error-state">
      <div class="error-state-icon">
        <i class="fas fa-exclamation-circle"></i>
      </div>
      <div class="error-state-message">${escapeHtml(message || 'Terjadi kesalahan.')}</div>
    </div>
  `;
}

/**
 * Build page shell HTML (tanpa listener). Dipanggil sekali saat mount.
 * @param {object} handlers - { onAdd, onExport, onImport }
 * @returns {string} HTML string
 */
export function buildPageShellHtml(handlers = {}) {
  return `
    <div class="customer-page">
      <div class="page-header">
        <h1>Daftar Pelanggan</h1>
        <div class="header-actions">
          ${Button.render({ text: 'Tambah Pelanggan', onClick: handlers.onAdd, variant: 'primary', icon: 'fas fa-user-plus' })}
          ${Button.render({ text: 'Export CSV', onClick: handlers.onExport, variant: 'secondary', icon: 'fas fa-download' })}
          ${Button.render({ text: 'Import CSV', onClick: handlers.onImport, variant: 'secondary', icon: 'fas fa-upload' })}
        </div>
      </div>
      <div id="customer-stats" class="dashboard-grid"></div>
      <div class="customer-toolbar">
        <input type="text" id="search-customer" class="input-field" placeholder="Cari nama, kode, telepon, atau alamat...">
        <select id="filter-status" class="input-field-select" aria-label="Filter status">
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
        <select id="sort-customer" class="input-field-select" aria-label="Urutkan">
          <option value="name-asc">Nama A–Z</option>
          <option value="name-desc">Nama Z–A</option>
          <option value="date-desc">Terbaru</option>
          <option value="date-asc">Terlama</option>
        </select>
      </div>
      <div id="customer-table-container"></div>
    </div>
  `;
}
