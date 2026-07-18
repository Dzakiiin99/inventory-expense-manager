// pages/report/report.state.js
// State + pure logic untuk halaman Report.
// DOM-free, service-free, storage-free.
// Hanya: state, setter, validator, pure helper, derived data helper.

// ── VALID VALUES ────────────────────────────────────────────

const VALID_REPORT_TYPES = ['sales', 'inventory', 'expense', 'customer', 'profit'];
const VALID_PRESETS = ['today', 'week', 'month', 'year', 'all', 'custom'];

// ── STATE (private, tidak di-export) ────────────────────────

const state = {
  reportType: 'sales',
  preset: 'all',
  customRange: {
    start: null,
    end: null
  },
  data: null,
  isLoading: false,
  error: null
};

// ── GETTERS (read-only, tidak ada side effect) ──────────────

/**
 * Dapatkan seluruh state (untuk passing ke pure functions).
 * @returns {object} state object
 */
export function getState() {
  return state;
}

/**
 * Dapatkan report type saat ini.
 * @returns {string}
 */
export function getReportType() {
  return state.reportType;
}

/**
 * Dapatkan preset saat ini.
 * @returns {string}
 */
export function getPreset() {
  return state.preset;
}

/**
 * Dapatkan custom range saat ini.
 * @returns {{ start: string|null, end: string|null }}
 */
export function getCustomRange() {
  return { ...state.customRange };
}

/**
 * Dapatkan data report saat ini.
 * @returns {any}
 */
export function getReportData() {
  return state.data;
}

/**
 * Dapatkan loading state.
 * @returns {boolean}
 */
export function getLoading() {
  return state.isLoading;
}

/**
 * Dapatkan error message.
 * @returns {string|null}
 */
export function getError() {
  return state.error;
}

// ── SETTERS ─────────────────────────────────────────────────

/**
 * Set report type.
 * @param {string} type - 'sales'|'inventory'|'expense'|'customer'|'profit'
 * @returns {boolean} true jika valid, false jika invalid
 */
export function setReportType(type) {
  if (!VALID_REPORT_TYPES.includes(type)) return false;
  state.reportType = type;
  return true;
}

/**
 * Set preset.
 * @param {string} preset - 'today'|'week'|'month'|'year'|'all'|'custom'
 * @returns {boolean} true jika valid, false jika invalid
 */
export function setPreset(preset) {
  if (!VALID_PRESETS.includes(preset)) return false;
  state.preset = preset;
  return true;
}

/**
 * Set custom date range. Tidak melakukan validasi.
 * @param {string|null} start - 'YYYY-MM-DD' atau null
 * @param {string|null} end - 'YYYY-MM-DD' atau null
 */
export function setCustomRange(start, end) {
  state.customRange.start = start;
  state.customRange.end = end;
}

/**
 * Set loading state.
 * @param {boolean} flag
 */
export function setLoading(flag) {
  state.isLoading = !!flag;
}

/**
 * Set data report. Reset error ke null.
 * @param {any} data
 */
export function setData(data) {
  state.data = data;
  state.error = null;
}

/**
 * Set error message. Auto-set isLoading ke false.
 * @param {string} message
 */
export function setError(message) {
  state.error = message || 'Terjadi kesalahan.';
  state.isLoading = false;
}

// ── PURE FUNCTIONS ──────────────────────────────────────────

/**
 * Resolve date range dari state berdasarkan preset.
 * Format: YYYY-MM-DD (bukan ISO lengkap).
 * @param {object} [s=state] - state object
 * @returns {{ start: string|null, end: string|null }}
 */
export function resolveDateRange(s = state) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  switch (s.preset) {
    case 'all':
      return { start: null, end: null };

    case 'today':
      return { start: todayStr, end: todayStr };

    case 'week': {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      const wYyyy = d.getFullYear();
      const wMm = String(d.getMonth() + 1).padStart(2, '0');
      const wDd = String(d.getDate()).padStart(2, '0');
      return { start: `${wYyyy}-${wMm}-${wDd}`, end: todayStr };
    }

    case 'month': {
      return { start: `${yyyy}-${mm}-01`, end: todayStr };
    }

    case 'year': {
      return { start: `${yyyy}-01-01`, end: todayStr };
    }

    case 'custom': {
      return {
        start: s.customRange.start || null,
        end: s.customRange.end || null
      };
    }

    default:
      return { start: null, end: null };
  }
}

/**
 * Validasi date range.
 * @param {string|null} start - 'YYYY-MM-DD'
 * @param {string|null} end - 'YYYY-MM-DD'
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateDateRange(start, end) {
  // Empty check
  if (!start || !start.toString().trim()) {
    return { valid: false, error: 'Tanggal mulai wajib diisi.' };
  }
  if (!end || !end.toString().trim()) {
    return { valid: false, error: 'Tanggal akhir wajib diisi.' };
  }

  // Format check (YYYY-MM-DD)
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRe.test(start)) {
    return { valid: false, error: 'Format tanggal mulai tidak valid (YYYY-MM-DD).' };
  }
  if (!dateRe.test(end)) {
    return { valid: false, error: 'Format tanggal akhir tidak valid (YYYY-MM-DD).' };
  }

  // Parse dates
  const startDate = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');

  if (isNaN(startDate.getTime())) {
    return { valid: false, error: 'Tanggal mulai tidak valid.' };
  }
  if (isNaN(endDate.getTime())) {
    return { valid: false, error: 'Tanggal akhir tidak valid.' };
  }

  // Start > End
  if (startDate > endDate) {
    return { valid: false, error: 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir.' };
  }

  // Future date check
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (startDate > today) {
    return { valid: false, error: 'Tanggal mulai tidak boleh di masa depan.' };
  }
  if (endDate > today) {
    return { valid: false, error: 'Tanggal akhir tidak boleh di masa depan.' };
  }

  return { valid: true, error: null };
}

// ── DERIVED DATA ────────────────────────────────────────────

/**
 * Compute summary cards dari data report.
 * TIDAK memanggil service. Hanya membaca object data.
 * @param {object|null} data - hasil ReportService
 * @param {string} reportType - 'sales'|'inventory'|'expense'|'customer'|'profit'
 * @returns {Array<{ label: string, value: string, icon: string, color: string }>}
 */
export function computeSummaryCards(data, reportType) {
  if (!data) return [];

  switch (reportType) {
    case 'sales': {
      const s = data.summary || {};
      return [
        { label: 'Total Penjualan', value: String(s.totalSales || 0), icon: 'fas fa-receipt', color: 'primary' },
        { label: 'Revenue', value: formatCurrencySafe(s.totalRevenue), icon: 'fas fa-money-bill-wave', color: 'success' },
        { label: 'Rata-rata', value: formatCurrencySafe(s.avgValue), icon: 'fas fa-chart-line', color: 'info' }
      ];
    }

    case 'inventory': {
      const s = data.summary || {};
      return [
        { label: 'Total Barang', value: String(s.totalItems || 0), icon: 'fas fa-boxes', color: 'primary' },
        { label: 'Nilai Inventory', value: formatCurrencySafe(s.totalValue), icon: 'fas fa-coins', color: 'success' },
        { label: 'Low Stock', value: String(s.lowStockCount || 0), icon: 'fas fa-exclamation-triangle', color: 'warning' }
      ];
    }

    case 'expense': {
      const s = data.summary || {};
      return [
        { label: 'Total Expense', value: formatCurrencySafe(s.totalExpenses), icon: 'fas fa-file-invoice-dollar', color: 'danger' },
        { label: 'Jumlah Transaksi', value: String(s.count || 0), icon: 'fas fa-list', color: 'primary' },
        { label: 'Average', value: formatCurrencySafe(s.avgExpense), icon: 'fas fa-chart-bar', color: 'info' }
      ];
    }

    case 'customer': {
      const s = data.summary || {};
      return [
        { label: 'Total Customer', value: String(s.totalCustomers || 0), icon: 'fas fa-users', color: 'primary' },
        { label: 'Active', value: String(s.active || 0), icon: 'fas fa-user-check', color: 'success' },
        { label: 'Inactive', value: String(s.inactive || 0), icon: 'fas fa-user-times', color: 'secondary' }
      ];
    }

    case 'profit': {
      return [
        { label: 'Revenue', value: formatCurrencySafe(data.revenue), icon: 'fas fa-arrow-up', color: 'success' },
        { label: 'Expense', value: formatCurrencySafe(data.expenses), icon: 'fas fa-arrow-down', color: 'danger' },
        { label: 'Net Income', value: formatCurrencySafe(data.netIncome), icon: 'fas fa-wallet', color: data.netIncome >= 0 ? 'primary' : 'warning' }
      ];
    }

    default:
      return [];
  }
}

// ── INTERNAL HELPER ─────────────────────────────────────────

/**
 * Format angka ke currency string (defensive).
 * Tidak import formatCurrency — state layer tidak boleh depend ke utils.
 * @param {number|string|null} value
 * @returns {string}
 */
function formatCurrencySafe(value) {
  const num = Number(value) || 0;
  try {
    return 'Rp ' + num.toLocaleString('id-ID');
  } catch {
    return 'Rp ' + String(num);
  }
}
