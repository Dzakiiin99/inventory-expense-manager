// services/report.service.js
// Report Service — lapisan bisnis Report Module (Sprint 9, Phase 1).
// Mengambil data dari existing service (TIDAK akses localStorage).
// Prinsip:
//   - Tidak ada safeGet / safeSet / STORAGE_KEYS
//   - Tidak ada DOM / HTML / Router
//   - Read-only, tidak mutasi data
//   - Clone data sebelum proses jika diperlukan
//   - Helper internal TIDAK di-export

import { TransactionService } from './transaction.service.js';
import { InventoryService } from './inventory.service.js';
import { ExpenseService } from './expense.service.js';
import { CustomerService } from './customer.service.js';

// ── INTERNAL HELPERS ────────────────────────────────────────

/**
 * Filter array item berdasarkan date range.
 * Hanya ambil item yang createdAt/tanggal di antara start dan end.
 * @param {Array} items - array of objects dengan field tanggal
 * @param {{ start: string|null, end: string|null }} dateRange
 * @param {string} [dateField='createdAt'] - nama field tanggal
 * @returns {Array} filtered items (clone, tidak mutasi input)
 */
function filterByDateRange(items, dateRange, dateField = 'createdAt') {
  if (!Array.isArray(items)) return [];
  if (!dateRange || (!dateRange.start && !dateRange.end)) {
    return [...items];
  }

  const start = dateRange.start ? new Date(dateRange.start + 'T00:00:00') : null;
  const end = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : null;

  return items.filter((item) => {
    const raw = item[dateField];
    if (!raw) return false;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return false;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
}

/**
 * Hitung total revenue dari array transaksi.
 * Hanya transaksi yang !isDeleted.
 * @param {Array} transactions
 * @returns {number}
 */
function calculateRevenue(transactions) {
  if (!Array.isArray(transactions)) return 0;
  return transactions
    .filter((t) => !t.isDeleted)
    .reduce((sum, t) => sum + (Number(t.total) || 0), 0);
}

/**
 * Hitung total expenses dari array pengeluaran.
 * @param {Array} expenses
 * @returns {number}
 */
function calculateExpenses(expenses) {
  if (!Array.isArray(expenses)) return 0;
  return expenses.reduce((sum, e) => sum + (Number(e.jumlah) || 0), 0);
}

/**
 * Hitung net income: revenue - expenses.
 * @param {number} revenue
 * @param {number} expenses
 * @returns {number}
 */
function calculateNetIncome(revenue, expenses) {
  return revenue - expenses;
}

/**
 * Group transaksi by customer.
 * @param {Array} transactions - transaksi yang sudah difilter
 * @returns {Array<{ customerId, customerName, count, totalSpent }>}
 */
function groupByCustomer(transactions) {
  if (!Array.isArray(transactions)) return [];

  const active = transactions.filter((t) => !t.isDeleted);
  const map = new Map();

  for (const t of active) {
    const key = t.customerId || 'unknown';
    if (!map.has(key)) {
      map.set(key, {
        customerId: t.customerId || '',
        customerName: t.customerName || '',
        count: 0,
        totalSpent: 0
      });
    }
    const entry = map.get(key);
    entry.count += 1;
    entry.totalSpent += Number(t.total) || 0;
  }

  return [...map.values()].sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Group item penjualan by inventory item.
 * @param {Array} transactions - transaksi yang sudah difilter
 * @returns {Array<{ itemCode, itemName, qtySold, revenue }>}
 */
function groupByItem(transactions) {
  if (!Array.isArray(transactions)) return [];

  const active = transactions.filter((t) => !t.isDeleted);
  const map = new Map();

  for (const t of active) {
    for (const item of (t.items || [])) {
      const key = item.inventoryId || item.itemCode || 'unknown';
      if (!map.has(key)) {
        map.set(key, {
          itemCode: item.itemCode || '',
          itemName: item.itemName || item.name || '',
          qtySold: 0,
          revenue: 0
        });
      }
      const entry = map.get(key);
      entry.qtySold += Number(item.quantity) || 0;
      entry.revenue += Number(item.subtotal) || 0;
    }
  }

  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

/**
 * Group transaksi by payment method.
 * @param {Array} transactions - transaksi yang sudah difilter
 * @returns {{ cash: { count, total }, transfer: { count, total } }}
 */
function groupByPaymentMethod(transactions) {
  if (!Array.isArray(transactions)) {
    return { cash: { count: 0, total: 0 }, transfer: { count: 0, total: 0 } };
  }

  const active = transactions.filter((t) => !t.isDeleted);
  const result = {
    cash: { count: 0, total: 0 },
    transfer: { count: 0, total: 0 }
  };

  for (const t of active) {
    const method = t.paymentMethod === 'transfer' ? 'transfer' : 'cash';
    result[method].count += 1;
    result[method].total += Number(t.total) || 0;
  }

  return result;
}

/**
 * Group pengeluaran by kategori.
 * @param {Array} expenses - expenses yang sudah difilter
 * @returns {Array<{ category, total, count }>}
 */
function groupByCategory(expenses) {
  if (!Array.isArray(expenses)) return [];

  const map = new Map();

  for (const e of expenses) {
    const key = e.kategori || 'Lainnya';
    if (!map.has(key)) {
      map.set(key, {
        category: key,
        total: 0,
        count: 0
      });
    }
    const entry = map.get(key);
    entry.total += Number(e.jumlah) || 0;
    entry.count += 1;
  }

  return [...map.values()].sort((a, b) => b.total - a.total);
}

// ── PUBLIC API ──────────────────────────────────────────────

/**
 * Report Service — aggregate data dari existing service.
 * TIDAK akses localStorage. Read-only, tidak mutasi data.
 */
export const ReportService = {
  /**
   * Sales Report: ringkasan penjualan, per item, per pelanggan, per payment.
   * @param {{ start: string|null, end: string|null }} dateRange
   * @returns {Promise<{ summary: { totalSales, totalRevenue, avgValue }, byItem: Array, byCustomer: Array, byPayment: object }>}
   */
  async getSalesReport(dateRange) {
    const allTransactions = await TransactionService.getAllTransactions();
    const filtered = filterByDateRange(allTransactions, dateRange, 'createdAt');

    const active = filtered.filter((t) => !t.isDeleted);
    const totalSales = active.length;
    const totalRevenue = calculateRevenue(filtered);
    const avgValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      summary: { totalSales, totalRevenue, avgValue },
      byItem: groupByItem(filtered),
      byCustomer: groupByCustomer(filtered),
      byPayment: groupByPaymentMethod(filtered)
    };
  },

  /**
   * Inventory Report: ringkasan stok, stok rendah, per kategori.
   * @returns {Promise<{ summary: { totalItems, activeItems, totalValue, lowStockCount }, lowStock: Array, byCategory: Array }>}
   */
  async getInventoryReport() {
    const allItems = await InventoryService.getAllItems();
    const active = allItems.filter((i) => i.status === 'active');

    const totalItems = allItems.length;
    const activeItems = active.length;
    const totalValue = active.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.stock) || 0), 0);

    const LOW_STOCK_THRESHOLD = 5;
    const lowStock = active
      .filter((i) => (Number(i.stock) || 0) <= LOW_STOCK_THRESHOLD)
      .map((i) => ({
        code: i.code || '',
        name: i.name || '',
        stock: Number(i.stock) || 0,
        unit: i.unit || '',
        price: Number(i.price) || 0
      }))
      .sort((a, b) => a.stock - b.stock);

    const lowStockCount = lowStock.length;

    // Group by category
    const catMap = new Map();
    for (const i of active) {
      const key = i.category || 'Tanpa Kategori';
      if (!catMap.has(key)) {
        catMap.set(key, { category: key, count: 0, value: 0 });
      }
      const entry = catMap.get(key);
      entry.count += 1;
      entry.value += (Number(i.price) || 0) * (Number(i.stock) || 0);
    }
    const byCategory = [...catMap.values()].sort((a, b) => b.value - a.value);

    return {
      summary: { totalItems, activeItems, totalValue, lowStockCount },
      lowStock,
      byCategory
    };
  },

  /**
   * Expense Report: ringkasan pengeluaran, per kategori.
   * @param {{ start: string|null, end: string|null }} dateRange
   * @returns {Promise<{ summary: { totalExpenses, count, avgExpense }, byCategory: Array }>}
   */
  async getExpenseReport(dateRange) {
    const allExpenses = await ExpenseService.getAll();
    const filtered = filterByDateRange(allExpenses, dateRange, 'tanggal');

    const totalExpenses = calculateExpenses(filtered);
    const count = filtered.length;
    const avgExpense = count > 0 ? totalExpenses / count : 0;

    return {
      summary: { totalExpenses, count, avgExpense },
      byCategory: groupByCategory(filtered)
    };
  },

  /**
   * Customer Report: ringkasan pelanggan, top customers.
   * @returns {Promise<{ summary: { totalCustomers, active, inactive }, topCustomers: Array }>}
   */
  async getCustomerReport() {
    const allCustomers = await CustomerService.getAllCustomers();
    const allTransactions = await TransactionService.getAllTransactions();

    const totalCustomers = allCustomers.length;
    const active = allCustomers.filter((c) => c.isActive).length;
    const inactive = totalCustomers - active;

    // Top customers dari transaksi
    const customerStats = groupByCustomer(allTransactions);

    // Enrich dengan data customer (phone, email) jika ada
    const customerMap = new Map(allCustomers.map((c) => [c.id, c]));
    const topCustomers = customerStats.slice(0, 10).map((cs) => {
      const cust = customerMap.get(cs.customerId);
      return {
        customerId: cs.customerId,
        customerName: cs.customerName,
        phone: cust ? cust.phone : '',
        email: cust ? cust.email : '',
        count: cs.count,
        totalSpent: cs.totalSpent
      };
    });

    return {
      summary: { totalCustomers, active, inactive },
      topCustomers
    };
  },

  /**
   * Simple Profit Report: revenue, expenses, net income.
   * CATATAN: Bukan Gross Profit (tidak ada HPP/COGS).
   * Net Income = Revenue - Expenses.
   * @param {{ start: string|null, end: string|null }} dateRange
   * @returns {Promise<{ revenue: number, expenses: number, netIncome: number }>}
   */
  async getProfitReport(dateRange) {
    const [allTransactions, allExpenses] = await Promise.all([
      TransactionService.getAllTransactions(),
      ExpenseService.getAll()
    ]);

    const filteredTransactions = filterByDateRange(allTransactions, dateRange, 'createdAt');
    const filteredExpenses = filterByDateRange(allExpenses, dateRange, 'tanggal');

    const revenue = calculateRevenue(filteredTransactions);
    const expenses = calculateExpenses(filteredExpenses);
    const netIncome = calculateNetIncome(revenue, expenses);

    return { revenue, expenses, netIncome };
  }
};
