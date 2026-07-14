// pages/transaction/transaction.render.js
// Render functions (partial DOM update). Terima (container, data, callbacks).
// Prinsip: Render hanya menerima data → menghasilkan tampilan.
// TIDAK BOLEH: akses storage, service, business logic, filter, sort,
// pagination logic, event listener langsung, maupun state mutation.

import { createStatCard } from '../../components/design-system/card.js';
import { Badge } from '../../components/badge.js';
import { Button } from '../../components/button.js';
import { escapeHtml, formatCurrency, formatDate } from '../../utils/index.js';
import { PAGE_SIZE } from './transaction.state.js';

// ─── HELPER ──────────────────────────────────────────────────────

/**
 * Render payment method badge.
 * @param {string} method - 'cash' | 'transfer'
 * @returns {string} HTML string
 */
function renderPaymentMethodBadge(method) {
  if (method === 'cash') {
    return Badge.render({ text: 'Cash', variant: 'success' });
  }
  if (method === 'transfer') {
    return Badge.render({ text: 'Transfer', variant: 'info' });
  }
  return Badge.render({ text: escapeHtml(method || '-'), variant: 'default' });
}

/**
 * Render status badge berdasarkan soft-delete state.
 * Catatan: service Phase 2.1 hanya punya isDeleted (belum ada field
 * status completed/cancelled dari Design Freeze v2). Status kolom
 * merefleksikan soft-delete: Active / Deleted.
 * @param {object} t - transaction record
 * @returns {string} HTML string
 */
function renderStatusBadge(t) {
  return t && t.isDeleted
    ? Badge.render({ text: 'Deleted', variant: 'danger' })
    : Badge.render({ text: 'Active', variant: 'success' });
}

/**
 * Render action buttons untuk satu baris transaksi.
 * @param {object} t - transaction record
 * @param {object} handlers - { onDetail, onEdit, onDelete }
 * @returns {string} HTML string
 */
function renderActionButtons(t, handlers = {}) {
  const detailBtn = handlers.onDetail
    ? Button.render({ text: '', icon: 'fas fa-eye', variant: 'info', size: 'small', onClick: () => handlers.onDetail(t.id) })
    : '';
  const editBtn = handlers.onEdit
    ? Button.render({ text: '', icon: 'fas fa-edit', variant: 'primary', size: 'small', onClick: () => handlers.onEdit(t.id) })
    : '';
  const deleteBtn = handlers.onDelete
    ? Button.render({ text: '', icon: 'fas fa-trash', variant: 'danger', size: 'small', onClick: () => handlers.onDelete(t.id) })
    : '';

  return `<div class="action-buttons">${detailBtn}${editBtn}${deleteBtn}</div>`;
}

/**
 * Render satu baris tabel transaksi.
 * @param {object} t - transaction record
 * @param {object} handlers
 * @returns {string} HTML string
 */
function renderTableRow(t, handlers = {}) {
  const itemsCount = (t.items || []).length;
  return `
    <tr>
      <td><code>${escapeHtml(t.transactionCode || '-')}</code></td>
      <td>${t.createdAt ? formatDate(t.createdAt, true) : '-'}</td>
      <td>${escapeHtml(t.customerName || '-')}</td>
      <td class="text-center">${itemsCount}</td>
      <td class="text-right">${formatCurrency(t.total || 0)}</td>
      <td>${renderPaymentMethodBadge(t.paymentMethod)}</td>
      <td>${renderStatusBadge(t)}</td>
      <td>${renderActionButtons(t, handlers)}</td>
    </tr>
  `;
}

// ─── MAIN RENDER FUNCTIONS ───────────────────────────────────────

/**
 * Render tabel transaksi ke container.
 * Menerima data yang SUDAH difilter & terurut & terpotong pagination
 * dari page layer. Tidak ada logic filter/sort/pagination di sini.
 * @param {HTMLElement} container - elemen page container
 * @param {Array} transactions - array transaction (sudah siap tampil)
 * @param {object} handlers - { onDetail, onEdit, onDelete }
 */
export function renderTable(container, transactions, handlers = {}) {
  const el = container && container.querySelector('#transaction-table-container');
  if (!el) return;

  if (!transactions || transactions.length === 0) {
    el.innerHTML = renderEmptyState();
    return;
  }

  const rows = transactions.map((t) => renderTableRow(t, handlers)).join('');

  el.innerHTML = `
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Transaction Code</th>
            <th>Date</th>
            <th>Customer</th>
            <th class="text-center">Items</th>
            <th class="text-right">Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Action</th>
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
 * @param {object} stats - { totalTransactions, totalRevenue, cashTransactions, transferTransactions, averageTransactionValue }
 */
export function renderStats(container, stats = {}) {
  const statsContainer = container && container.querySelector('#transaction-stats');
  if (!statsContainer) return;

  statsContainer.innerHTML = '';
  statsContainer.appendChild(createStatCard('Total Transactions', stats.totalTransactions || 0, 'fas fa-receipt', 'primary'));
  statsContainer.appendChild(createStatCard('Total Revenue', formatCurrency(stats.totalRevenue || 0), 'fas fa-money-bill-wave', 'success'));
  statsContainer.appendChild(createStatCard('Cash', stats.cashTransactions || 0, 'fas fa-cash-register', 'info'));
  statsContainer.appendChild(createStatCard('Transfer', stats.transferTransactions || 0, 'fas fa-university', 'warning'));
  statsContainer.appendChild(createStatCard('Average Transaction', formatCurrency(stats.averageTransactionValue || 0), 'fas fa-chart-line', 'secondary'));
}

/**
 * Render pagination controls (hanya HTML, tidak mengubah page).
 * SEMUA tombol via Button component (tidak ada <button> manual).
 * Interaksi diwiring lewat handlers.onPage (delegasi milik Button),
 * BUKAN atribut data-page.
 * @param {number} currentPage
 * @param {number} totalPages
 * @param {number} totalItems
 * @param {object} [handlers] - { onPage(pageValue) }
 * @returns {string} HTML string
 */
export function renderPagination(currentPage, totalPages, totalItems, handlers = {}) {
  if (totalItems <= PAGE_SIZE) return '';

  const onPage = typeof handlers.onPage === 'function' ? handlers.onPage : () => {};

  // Bungkus Button.render; sisipkan atribut disabled secara minimal
  // (Button component tidak punya prop disabled) tanpa menulis <button> manual.
  const renderPageBtn = (label, value, opts = {}) => {
    const btn = Button.render({
      text: String(label),
      variant: opts.active ? 'primary' : 'secondary',
      size: 'small',
      onClick: () => onPage(value)
    });
    return opts.disabled ? btn.replace('<button', '<button disabled') : btn;
  };

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(renderPageBtn(i, i, { active: i === currentPage }));
  }

  const prevBtn = renderPageBtn('«', 'prev', { disabled: currentPage <= 1 });
  const nextBtn = renderPageBtn('»', 'next', { disabled: currentPage >= totalPages });

  return `
    <div class="transaction-pagination">
      ${prevBtn}
      ${pages.join('')}
      ${nextBtn}
      <span class="pagination-info">Hal ${currentPage}/${totalPages} · ${totalItems} transaksi</span>
    </div>
  `;
}

/**
 * Render empty state (ketika data kosong).
 * @param {string} [message]
 * @returns {string} HTML string
 */
export function renderEmptyState(message) {
  const msg = message || 'Belum ada transaksi. Klik "Tambah Transaksi" untuk mencatat penjualan.';
  return `
    <div class="empty-state">
      <div class="empty-state-icon">
        <i class="fas fa-receipt"></i>
      </div>
      <div class="empty-state-message">${escapeHtml(msg)}</div>
    </div>
  `;
}

/**
 * Render loading state (untuk kompatibilitas async/service masa depan).
 * @param {string} [message]
 * @returns {string} HTML string
 */
export function renderLoadingState(message) {
  const msg = message || 'Memuat data transaksi...';
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
 * Dropdown filter-customer sengaja kosong — page layer akan mengisinya
 * dari CustomerService (render TIDAK boleh panggil service).
 * @param {object} handlers - { onAdd }
 * @returns {string} HTML string
 */
export function buildPageShellHtml(handlers = {}) {
  return `
    <div class="transaction-page">
      <div class="page-header">
        <h1>Penjualan</h1>
        <div class="header-actions">
          ${Button.render({ text: 'Tambah Transaksi', onClick: handlers.onAdd, variant: 'primary', icon: 'fas fa-plus' })}
        </div>
      </div>
      <div id="transaction-stats" class="dashboard-grid"></div>
      <div class="transaction-toolbar">
        <input type="text" id="search-transaction" class="input-field" placeholder="Cari kode, pelanggan, atau nama barang...">
        <select id="filter-payment-method" class="input-field-select" aria-label="Filter metode bayar">
          <option value="">Semua Pembayaran</option>
          <option value="cash">Cash</option>
          <option value="transfer">Transfer</option>
        </select>
        <select id="filter-customer" class="input-field-select" aria-label="Filter pelanggan">
          <option value="">Semua Pelanggan</option>
        </select>
        <select id="sort-transaction" class="input-field-select" aria-label="Urutkan">
          <option value="date-desc">Terbaru</option>
          <option value="date-asc">Terlama</option>
          <option value="amount-desc">Total Tertinggi</option>
          <option value="amount-asc">Total Terendah</option>
          <option value="customer-asc">Pelanggan A–Z</option>
          <option value="customer-desc">Pelanggan Z–A</option>
        </select>
      </div>
      <div id="transaction-table-container"></div>
    </div>
  `;
}
