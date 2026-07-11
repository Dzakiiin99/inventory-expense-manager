// pages/inventory/inventory.render.js
// Render functions (partial DOM update). Terima (container, state, callbacks).
import { InventoryTable } from '../../components/inventory-table.js';
import { createStatCard } from '../../components/design-system/card.js';
import { Button } from '../../components/button.js';
import { formatCurrency, escapeHtml } from '../../utils/index.js';
import {
  state,
  PAGE_SIZE,
  getVisibleItems,
  getUniqueCategories,
  computeStats,
  getTotalPages,
} from './inventory.state.js';

// Render stat cards: Total Barang, Nilai Inventory, Stok Rendah, Stok Habis
export function renderStats(container, s = state) {
  const statsContainer = container && container.querySelector('#inventory-stats');
  if (!statsContainer) return;

  const { totalBarang, nilaiInventory, stokRendah, stokHabis } = computeStats(s);

  statsContainer.innerHTML = '';
  statsContainer.appendChild(createStatCard('Total Barang', totalBarang, 'fas fa-boxes', 'primary'));
  statsContainer.appendChild(createStatCard('Nilai Inventory', formatCurrency(nilaiInventory), 'fas fa-coins', 'success'));
  statsContainer.appendChild(createStatCard('Stok Rendah', stokRendah, 'fas fa-exclamation-triangle', 'warning'));
  statsContainer.appendChild(createStatCard('Stok Habis', stokHabis, 'fas fa-times-circle', 'danger'));
}

// Partial render: hanya update #inventory-table-container → tidak re-render seluruh page & tidak dobel listener
export function renderTable(container, s = state, handlers = {}) {
  const el = container && container.querySelector('#inventory-table-container');
  if (!el) return;

  const allItems = getVisibleItems(s);
  const totalPages = getTotalPages(allItems.length, PAGE_SIZE);
  // Clamp currentPage jika data berkurang
  if (s.currentPage > totalPages) s.currentPage = totalPages;

  const start = (s.currentPage - 1) * PAGE_SIZE;
  const pageItems = allItems.slice(start, start + PAGE_SIZE);

  el.innerHTML =
    InventoryTable.render(pageItems, handlers.onEdit, handlers.onDelete, handlers.onDetail) +
    renderPagination(s, allItems.length, totalPages);
}

// Pure: render pagination controls (hanya muncul jika > PAGE_SIZE)
export function renderPagination(s, totalItems, totalPages) {
  if (totalItems <= PAGE_SIZE) return '';

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    const activeCls = i === s.currentPage ? ' btn-primary' : ' btn-secondary';
    pages.push(`<button class="btn btn-small${activeCls}" data-page="${i}">${i}</button>`);
  }
  return `
    <div class="inventory-pagination">
      <button class="btn btn-small btn-secondary" data-page="prev" ${s.currentPage <= 1 ? 'disabled' : ''}>&laquo;</button>
      ${pages.join('')}
      <button class="btn btn-small btn-secondary" data-page="next" ${s.currentPage >= totalPages ? 'disabled' : ''}>&raquo;</button>
      <span class="pagination-info">Hal ${s.currentPage}/${totalPages} · ${totalItems} barang</span>
    </div>
  `;
}

// Build page shell HTML (tanpa listener). categories di-derive dari data, XSS-safe.
export function buildPageShellHtml(s = state, handlers = {}) {
  const categories = getUniqueCategories(s);
  const catOptions = categories
    .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
    .join('');

  return `
    <div class="inventory-page">
      <div class="page-header">
        <h1>Daftar Barang</h1>
        <div class="header-actions">
          ${Button.render({ text: 'Tambah Barang', onClick: handlers.onAdd, variant: 'primary' })}
          ${Button.render({ text: 'Export CSV', onClick: handlers.onExport, variant: 'secondary', icon: 'fas fa-download' })}
          ${Button.render({ text: 'Import CSV', onClick: handlers.onImport, variant: 'secondary', icon: 'fas fa-upload' })}
        </div>
      </div>
      <div id="inventory-stats" class="dashboard-grid"></div>
      <div class="inventory-toolbar">
        <input type="text" id="search-barang" class="input-field" placeholder="Cari nama, SKU, atau kategori...">
        <select id="filter-kategori" class="input-field-select" aria-label="Filter kategori">
          <option value="">Semua Kategori</option>
          ${catOptions}
        </select>
        <select id="filter-stok" class="input-field-select" aria-label="Filter stok">
          <option value="">Semua Stok</option>
          <option value="habis">Habis (0)</option>
          <option value="rendah">Rendah (1–5)</option>
          <option value="aman">Aman (&gt;5)</option>
        </select>
        <select id="sort-barang" class="input-field-select" aria-label="Urutkan">
          <option value="name-asc">Nama A–Z</option>
          <option value="name-desc">Nama Z–A</option>
          <option value="price-asc">Harga ↑</option>
          <option value="price-desc">Harga ↓</option>
          <option value="stock-asc">Stok ↑</option>
          <option value="stock-desc">Stok ↓</option>
          <option value="category-asc">Kategori A–Z</option>
        </select>
      </div>
      <div id="inventory-table-container"></div>
    </div>
  `;
}
