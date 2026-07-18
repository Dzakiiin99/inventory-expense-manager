// pages/report/report.page.js
// Orchestrator — menghubungkan ReportService, state, render, ExportService.
// TIDAK BOLEH: business logic, aggregate, filter, sort, localStorage.
// Semua business logic di ReportService.
// Semua summary di computeSummaryCards().
// Semua HTML di renderer.

import { ReportService } from '../../services/report.service.js';
import { ExportService } from '../../services/export.service.js';
import {
  getState,
  getReportType,
  getPreset,
  getCustomRange,
  getReportData,
  setReportType,
  setPreset,
  setCustomRange,
  setLoading,
  setData,
  setError,
  resolveDateRange,
  validateDateRange,
  computeSummaryCards
} from './report.state.js';
import {
  buildPageShellHtml,
  renderReportNav,
  renderDateFilter,
  renderSummaryCards,
  renderReportTable,
  renderErrorState
} from './report.render.js';
import { Loading } from '../../components/loading-state.js';
import { Toast } from '../../components/toast.js';
import { formatCurrency } from '../../utils/format.js';

// ── REQUEST PROTECTION ──────────────────────────────────────

let requestId = 0;

// ── COLUMN DEFINITIONS (constant, frozen, tidak dibuat setiap render) ──

const REPORT_COLUMNS = Object.freeze({
  sales: Object.freeze([
    Object.freeze({ key: 'itemCode', label: 'Kode', align: 'left' }),
    Object.freeze({ key: 'itemName', label: 'Nama Barang', align: 'left' }),
    Object.freeze({ key: 'qtySold', label: 'Qty Terjual', align: 'center' }),
    Object.freeze({ key: 'revenue', label: 'Revenue', align: 'right', format: formatCurrency })
  ]),
  inventory: Object.freeze([
    Object.freeze({ key: 'code', label: 'Kode', align: 'left' }),
    Object.freeze({ key: 'name', label: 'Nama', align: 'left' }),
    Object.freeze({ key: 'stock', label: 'Stok', align: 'center' }),
    Object.freeze({ key: 'unit', label: 'Satuan', align: 'left' }),
    Object.freeze({ key: 'price', label: 'Harga', align: 'right', format: formatCurrency })
  ]),
  expense: Object.freeze([
    Object.freeze({ key: 'category', label: 'Kategori', align: 'left' }),
    Object.freeze({ key: 'count', label: 'Jumlah', align: 'center' }),
    Object.freeze({ key: 'total', label: 'Total', align: 'right', format: formatCurrency })
  ]),
  customer: Object.freeze([
    Object.freeze({ key: 'customerName', label: 'Pelanggan', align: 'left' }),
    Object.freeze({ key: 'phone', label: 'Telepon', align: 'left' }),
    Object.freeze({ key: 'count', label: 'Transaksi', align: 'center' }),
    Object.freeze({ key: 'totalSpent', label: 'Total Belanja', align: 'right', format: formatCurrency })
  ]),
  profit: Object.freeze([
    Object.freeze({ key: 'label', label: 'Komponen', align: 'left' }),
    Object.freeze({ key: 'value', label: 'Nilai', align: 'right', format: formatCurrency })
  ])
});

// ── ROW RESOLVER (constant, frozen, mapping data → rows) ────

const REPORT_ROW_RESOLVER = Object.freeze({
  sales(data) { return data ? (data.byItem || []) : []; },
  inventory(data) { return data ? (data.lowStock || []) : []; },
  expense(data) { return data ? (data.byCategory || []) : []; },
  customer(data) { return data ? (data.topCustomers || []) : []; },
  profit(data) {
    if (!data) return [];
    return [
      { label: 'Revenue', value: data.revenue || 0 },
      { label: 'Expense', value: data.expenses || 0 },
      { label: 'Net Income', value: data.netIncome || 0 }
    ];
  }
});

// ── RENDER ALL ──────────────────────────────────────────────

/**
 * Re-render summary cards + table berdasarkan state saat ini.
 * Tidak ada business logic. Hanya mapping data → render.
 * @param {HTMLElement} container
 */
function renderAll(container) {
  const reportType = getReportType();
  const data = getReportData();

  // Summary cards
  const cards = computeSummaryCards(data, reportType);
  renderSummaryCards(container, cards);

  // Table: columns + rows dari constant + resolver
  const columns = REPORT_COLUMNS[reportType] || [];
  const rows = REPORT_ROW_RESOLVER[reportType]
    ? REPORT_ROW_RESOLVER[reportType](data)
    : [];
  renderReportTable(container, columns, rows);
}

// ── LOAD REPORT ─────────────────────────────────────────────

/**
 * Load report berdasarkan state.reportType dan state.preset.
 * @param {HTMLElement} container
 */
async function loadReport(container) {
  const currentRequest = ++requestId;

  try {
    setLoading(true);
    Loading.show();

    // Resolve date range
    const currentState = getState();
    const dateRange = resolveDateRange(currentState);

    // Validasi jika custom
    if (getPreset() === 'custom') {
      const validation = validateDateRange(dateRange.start, dateRange.end);
      if (!validation.valid) {
        Toast.error(validation.error);
        setLoading(false);
        Loading.hide();
        return;
      }
    }

    // Load data sesuai report type
    const reportType = getReportType();
    let result;
    switch (reportType) {
      case 'sales':
        result = await ReportService.getSalesReport(dateRange);
        break;
      case 'inventory':
        result = await ReportService.getInventoryReport();
        break;
      case 'expense':
        result = await ReportService.getExpenseReport(dateRange);
        break;
      case 'customer':
        result = await ReportService.getCustomerReport();
        break;
      case 'profit':
        result = await ReportService.getProfitReport(dateRange);
        break;
      default:
        result = null;
    }

    // Race condition check
    if (currentRequest !== requestId) return;

    setData(result);
    renderAll(container);
  } catch (err) {
    // Race condition check
    if (currentRequest !== requestId) return;

    const message = err?.message || 'Terjadi kesalahan saat memuat laporan.';
    setError(message);
    const tableContainer = container.querySelector('#report-table-container');
    if (tableContainer) {
      tableContainer.innerHTML = renderErrorState(message);
    }
    Toast.error(message);
  } finally {
    if (currentRequest === requestId) {
      setLoading(false);
      Loading.hide();
    }
  }
}

// ── EXPORT ──────────────────────────────────────────────────

/**
 * Handle export CSV via ExportService.
 * Menggunakan state.data yang sudah ada (tidak fetch ulang).
 */
async function handleExport() {
  try {
    Loading.show();

    // Validasi jika custom
    if (getPreset() === 'custom') {
      const dateRange = resolveDateRange(getState());
      const validation = validateDateRange(dateRange.start, dateRange.end);
      if (!validation.valid) {
        Toast.error(validation.error);
        return;
      }
    }

    // Gunakan state.data yang sudah ada
    const data = getReportData();
    if (!data) {
      Toast.error('Tidak ada data untuk di-export.');
      return;
    }

    // Mapping headers + rows dari state.data
    const reportType = getReportType();
    const columns = REPORT_COLUMNS[reportType] || [];
    const rows = REPORT_ROW_RESOLVER[reportType]
      ? REPORT_ROW_RESOLVER[reportType](data)
      : [];

    if (!rows || rows.length === 0) {
      Toast.error('Tidak ada data untuk di-export.');
      return;
    }

    const headers = columns.map((col) => col.label);
    const dataRows = rows.map((row) =>
      columns.map((col) => {
        const raw = row[col.key];
        if (typeof col.format === 'function') {
          try { return String(col.format(raw) ?? ''); }
          catch { return String(raw ?? ''); }
        }
        return String(raw ?? '');
      })
    );

    // Export via ExportService
    ExportService.exportReportCsv(dataRows, headers);
    Toast.success('Export berhasil!');
  } catch (err) {
    console.error('Export gagal:', err);
    Toast.error('Gagal export: ' + (err?.message || 'Unknown error'));
  } finally {
    Loading.hide();
  }
}

// ── MAIN PAGE RENDER ────────────────────────────────────────

/**
 * Render halaman Report (entry point / orchestrator).
 * @param {HTMLElement} container
 */
const renderReportPage = async (container) => {
  try {
    setLoading(true);
    Loading.show();

    // Build page shell
    container.innerHTML = buildPageShellHtml({
      onExport: () => handleExport()
    });

    // Render navigation
    renderReportNav(container, getReportType(), {
      onTypeChange: (type) => {
        setReportType(type);
        loadReport(container);
      }
    });

    // Render date filter
    renderDateFilter(container, getPreset(), getCustomRange(), {
      onPresetChange: (preset) => {
        setPreset(preset);
        loadReport(container);
      },
      onCustomApply: (start, end) => {
        setCustomRange(start, end);
        setPreset('custom');
        loadReport(container);
      }
    });

    // Load first report
    await loadReport(container);

    setLoading(false);
    Loading.hide();
  } catch (err) {
    console.error('Gagal memuat halaman laporan:', err);
    setLoading(false);
    Loading.hide();
    container.innerHTML = renderErrorState('Gagal memuat halaman laporan.');
  }
};

// ── EXPORT ──────────────────────────────────────────────────

export const ReportPage = { render: renderReportPage };
