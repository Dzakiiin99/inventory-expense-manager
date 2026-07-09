// Dashboard Page for UMKM CRM Lite
import { createStatCard } from '../components/design-system/card.js';
import { InventoryService } from '../services/inventory.service.js';
import { ExpenseService } from '../services/expense.service.js';
import { Loading } from '../components/loading-state.js';
import { formatCurrency } from '../utils/index.js';

export async function renderDashboard(container) {
  Loading.show();
  try {
    const [items, expenses] = await Promise.all([
      InventoryService.getAllItems(),
      ExpenseService.getAll()
    ]);
    const totalBarang = items.length;
    const nilaiStok = items.reduce((t, i) => t + (i.price * i.stock), 0);
    const totalPengeluaran = expenses.reduce((t, e) => t + e.jumlah, 0);

    container.innerHTML = '<h1 class="page-title">Dashboard</h1>';
    const grid = document.createElement('div');
    grid.className = 'dashboard-grid';
    grid.appendChild(createStatCard('Total Barang', totalBarang, 'fas fa-boxes', 'primary'));
    grid.appendChild(createStatCard('Nilai Stok', formatCurrency(nilaiStok), 'fas fa-coins', 'success'));
    grid.appendChild(createStatCard('Total Pengeluaran', formatCurrency(totalPengeluaran), 'fas fa-wallet', 'warning'));
    container.appendChild(grid);
  } catch (e) {
    console.error(e);
    container.innerHTML = '<div class="error-state"><p>Gagal memuat dashboard</p></div>';
  } finally {
    Loading.hide();
  }
}