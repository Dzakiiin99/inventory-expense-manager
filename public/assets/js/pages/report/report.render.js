// pages/report/report.render.js
// Render functions untuk halaman Report.
// Terima data → hasilkan HTML / update DOM.
// TIDAK BOLEH: akses service, state, storage, business logic.

import { escapeHtml } from '../../utils/sanitize.js';
import { escapeAttr } from '../../utils/sanitize.js';
import { Button } from '../../components/button.js';

// ── CONSTANTS ───────────────────────────────────────────────

const REPORT_TABS = [
  { id: 'sales', label: 'Penjualan', icon: 'fas fa-receipt' },
  { id: 'inventory', label: 'Inventory', icon: 'fas fa-boxes' },
  { id: 'expense', label: 'Pengeluaran', icon: 'fas fa-file-invoice-dollar' },
  { id: 'customer', label: 'Pelanggan', icon: 'fas fa-users' },
  { id: 'profit', label: 'Profit', icon: 'fas fa-wallet' }
];

const PRESET_BUTTONS = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'week', label: '7 Hari' },
  { id: 'month', label: 'Bulan Ini' },
  { id: 'year', label: 'Tahun Ini' },
  { id: 'all', label: 'Semua' },
  { id: 'custom', label: 'Custom' }
];

// ── WHITELISTS (internal, not exported) ─────────────────────

const VALID_CARD_COLORS = ['primary', 'success', 'danger', 'warning', 'info', 'secondary'];
const VALID_CARD_ICONS = [
  'fas fa-receipt', 'fas fa-money-bill-wave', 'fas fa-chart-line',
  'fas fa-boxes', 'fas fa-coins', 'fas fa-exclamation-triangle',
  'fas fa-file-invoice-dollar', 'fas fa-list', 'fas fa-chart-bar',
  'fas fa-users', 'fas fa-user-check', 'fas fa-user-times',
  'fas fa-arrow-up', 'fas fa-arrow-down', 'fas fa-wallet'
];
const DEFAULT_CARD_COLOR = 'primary';
const DEFAULT_CARD_ICON = 'fas fa-chart-bar';

// ── PAGE SHELL ──────────────────────────────────────────────

/**
 * Build page shell HTML (statik, tanpa listener).
 * @param {object} [handlers] - { onExport() }
 * @returns {string} HTML string
 */
export function buildPageShellHtml(handlers = {}) {
  const exportBtn = handlers.onExport
    ? Button.render({ text: 'Export CSV', icon: 'fas fa-download', variant: 'success', onClick: handlers.onExport })
    : '';

  return `
    <div class="report-page">
      <div class="page-header">
        <h1>Laporan</h1>
        <div class="header-actions">
          ${exportBtn}
        </div>
      </div>
      <div id="report-nav"></div>
      <div id="report-date-filter"></div>
      <div id="report-summary" class="dashboard-grid"></div>
      <div id="report-table-container"></div>
    </div>
  `;
}

// ── NAVIGATION TABS ─────────────────────────────────────────

/**
 * Render tab navigasi laporan.
 * @param {HTMLElement} container
 * @param {string} activeType - 'sales'|'inventory'|'expense'|'customer'|'profit'
 * @param {object} handlers - { onTypeChange(type) }
 */
export function renderReportNav(container, activeType, handlers = {}) {
  const el = container && container.querySelector('#report-nav');
  if (!el) return;

  const tabs = REPORT_TABS.map((tab) => {
    const isActive = tab.id === activeType;
    const cls = isActive ? 'report-tab active' : 'report-tab';
    return `<button class="${cls}" data-report-type="${tab.id}">
      <i class="${tab.icon}"></i> ${escapeHtml(tab.label)}
    </button>`;
  }).join('');

  el.innerHTML = `<div class="report-tabs">${tabs}</div>`;

  // Bind events
  if (typeof handlers.onTypeChange === 'function') {
    el.querySelectorAll('[data-report-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        handlers.onTypeChange(btn.getAttribute('data-report-type'));
      });
    });
  }
}

// ── DATE FILTER ─────────────────────────────────────────────

/**
 * Render date filter UI.
 * @param {HTMLElement} container
 * @param {string} preset - 'today'|'week'|'month'|'year'|'all'|'custom'
 * @param {object} customRange - { start, end }
 * @param {object} handlers - { onPresetChange(preset), onCustomApply(start, end) }
 */
export function renderDateFilter(container, preset, customRange = {}, handlers = {}) {
  const el = container && container.querySelector('#report-date-filter');
  if (!el) return;

  // Preset buttons
  const buttons = PRESET_BUTTONS.map((p) => {
    const isActive = p.id === preset;
    const cls = isActive ? 'btn btn-small btn-primary' : 'btn btn-small btn-secondary';
    return `<button class="${cls}" data-preset="${p.id}">${escapeHtml(p.label)}</button>`;
  }).join('');

  // Custom range inputs (hanya tampil jika preset = 'custom')
  const isCustom = preset === 'custom';
  const customHtml = isCustom
    ? `<div class="custom-range-row">
        <label>Dari:</label>
        <input type="date" id="custom-start" class="input-field" value="${escapeAttr(customRange.start || '')}">
        <label>Sampai:</label>
        <input type="date" id="custom-end" class="input-field" value="${escapeAttr(customRange.end || '')}">
        ${Button.render({ text: 'Terapkan', variant: 'primary', size: 'small', onClick: () => {
          const startEl = document.getElementById('custom-start');
          const endEl = document.getElementById('custom-end');
          if (startEl && endEl && typeof handlers.onCustomApply === 'function') {
            handlers.onCustomApply(startEl.value, endEl.value);
          }
        } })}
      </div>`
    : '';

  el.innerHTML = `
    <div class="report-date-filter">
      <div class="preset-buttons">${buttons}</div>
      ${customHtml}
    </div>
  `;

  // Bind preset button events
  if (typeof handlers.onPresetChange === 'function') {
    el.querySelectorAll('[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        handlers.onPresetChange(btn.getAttribute('data-preset'));
      });
    });
  }
}

// ── SUMMARY CARDS ───────────────────────────────────────────

/**
 * Render summary cards ke container.
 * @param {HTMLElement} container
 * @param {Array<{ label: string, value: string, icon: string, color: string }>} cards
 */
export function renderSummaryCards(container, cards = []) {
  const el = container && container.querySelector('#report-summary');
  if (!el) return;

  if (!Array.isArray(cards) || cards.length === 0) {
    el.innerHTML = '';
    return;
  }

  el.innerHTML = cards.map((card) => {
    const color = VALID_CARD_COLORS.includes(card.color) ? card.color : DEFAULT_CARD_COLOR;
    const icon = VALID_CARD_ICONS.includes(card.icon) ? card.icon : DEFAULT_CARD_ICON;
    return `
    <div class="stat-card stat-card-${color}">
      <div class="stat-card-icon">
        <i class="${icon}"></i>
      </div>
      <div class="stat-card-content">
        <div class="stat-card-value">${escapeHtml(String(card.value || '0'))}</div>
        <div class="stat-card-label">${escapeHtml(card.label || '')}</div>
      </div>
    </div>
  `;}).join('');
}

// ── REPORT TABLE ────────────────────────────────────────────

/**
 * Render data table generik.
 * @param {HTMLElement} container
 * @param {Array<{ key: string, label: string, align?: string, format?: function }>} columns
 * @param {Array<object>} rows
 */
export function renderReportTable(container, columns = [], rows = []) {
  const el = container && container.querySelector('#report-table-container');
  if (!el) return;

  if (!Array.isArray(rows) || rows.length === 0) {
    el.innerHTML = renderEmptyState();
    return;
  }

  if (!Array.isArray(columns) || columns.length === 0) {
    el.innerHTML = '';
    return;
  }

  // Build header
  const headers = columns.map((col) => {
    const align = col.align || 'left';
    const alignCls = align !== 'left' ? ` class="text-${align}"` : '';
    return `<th${alignCls}>${escapeHtml(col.label || '')}</th>`;
  }).join('');

  // Build rows
  const bodyRows = rows.map((row) => {
    const cells = columns.map((col) => {
      const align = col.align || 'left';
      const alignCls = align !== 'left' ? ` class="text-${align}"` : '';
      const rawValue = row[col.key];
      let displayValue;

      // Order: raw → formatter(value) → String() → escapeHtml() → innerHTML
      if (typeof col.format === 'function') {
        try {
          displayValue = String(col.format(rawValue) ?? '');
        } catch {
          displayValue = String(rawValue ?? '');
        }
      } else {
        displayValue = String(rawValue ?? '');
      }

      return `<td${alignCls}>${escapeHtml(displayValue)}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  el.innerHTML = `
    <div class="table-responsive">
      <table class="data-table">
        <thead><tr>${headers}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  `;
}

// ── EXPORT BUTTON ───────────────────────────────────────────

/**
 * Render tombol export CSV.
 * @param {object} handlers - { onExport() }
 * @returns {string} HTML string
 */
export function renderExportButton(handlers = {}) {
  if (typeof handlers.onExport !== 'function') return '';
  return Button.render({
    text: 'Export CSV',
    icon: 'fas fa-download',
    variant: 'success',
    onClick: handlers.onExport
  });
}

// ── LOADING STATE ───────────────────────────────────────────

/**
 * Render loading state.
 * @param {string} [message]
 * @returns {string} HTML string
 */
export function renderLoadingState(message) {
  const msg = escapeHtml(message || 'Memuat data laporan...');
  return `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <div class="loading-message">${msg}</div>
    </div>
  `;
}

// ── EMPTY STATE ─────────────────────────────────────────────

/**
 * Render empty state.
 * @param {string} [message]
 * @returns {string} HTML string
 */
export function renderEmptyState(message) {
  const msg = escapeHtml(message || 'Tidak ada data untuk ditampilkan.');
  return `
    <div class="empty-state">
      <div class="empty-state-icon">
        <i class="fas fa-chart-bar"></i>
      </div>
      <div class="empty-state-message">${msg}</div>
    </div>
  `;
}

// ── ERROR STATE ─────────────────────────────────────────────

/**
 * Render error state.
 * @param {string} [message]
 * @returns {string} HTML string
 */
export function renderErrorState(message) {
  const msg = escapeHtml(message || 'Terjadi kesalahan saat memuat data.');
  return `
    <div class="error-state">
      <div class="error-state-icon">
        <i class="fas fa-exclamation-circle"></i>
      </div>
      <div class="error-state-message">${msg}</div>
    </div>
  `;
}

