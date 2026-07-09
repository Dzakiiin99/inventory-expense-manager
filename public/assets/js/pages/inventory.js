// pages/inventory.js
// Halaman Daftar Barang dengan Loading, Empty State, dan Modal

import { InventoryService } from "../services/inventory.service.js";
import { InventoryTable } from "../components/inventory-table.js";
import { InventoryForm } from "../components/inventory-form.js";
import { Loading } from "../components/loading-state.js";
import { Modal } from "../components/modal.js";
import { Button } from "../components/button.js";
import { Toast } from "../components/toast.js";
import { formatCurrency, escapeHtml, getStockLevel } from "../utils/index.js";
import { createStatCard } from "../components/design-system/card.js";

let items = [];
let pageContainer = null;
let searchQuery = '';
let filterCategory = '';
let filterStock = '';
let sortBy = 'name-asc';
let currentPage = 1;
const PAGE_SIZE = 10;
const collator = new Intl.Collator('id', { sensitivity: 'base', numeric: false });

// Strategy map untuk sorting (Open/Closed: tambah opsi baru = tambah entry, bukan ubah logic)
const SORTERS = {
  'name-asc':     (a, b) => collator.compare(a.name || '', b.name || ''),
  'name-desc':    (a, b) => collator.compare(b.name || '', a.name || ''),
  'price-asc':    (a, b) => (a.price || 0) - (b.price || 0),
  'price-desc':   (a, b) => (b.price || 0) - (a.price || 0),
  'stock-asc':    (a, b) => (a.stock || 0) - (b.stock || 0),
  'stock-desc':   (a, b) => (b.stock || 0) - (a.stock || 0),
  'category-asc': (a, b) => collator.compare(a.category || '', b.category || ''),
};

// Pure filter pipeline: search → kategori → stok → sort
const getVisibleItems = () => {
  const q = (searchQuery || '').trim().toLowerCase();
  let result = items.filter((it) => {
    // Search: nama / SKU (code) / kategori, case-insensitive, substring
    if (q) {
      const match =
        (it.name || '').toLowerCase().includes(q) ||
        (it.code || '').toLowerCase().includes(q) ||
        (it.category || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    // Filter kategori
    if (filterCategory && it.category !== filterCategory) return false;
    // Filter stok
    if (filterStock && getStockLevel(it.stock) !== filterStock) return false;
    return true;
  });

  // Sort (pure, non-mutating via spread)
  const sorted = [...result];
  const sorter = SORTERS[sortBy];
  if (sorter) sorted.sort(sorter);
  return sorted;
};

// Derive kategori unik dari items (sorted, pure)
const getUniqueCategories = () => {
  const cats = [...new Set(items.map(i => i.category).filter(Boolean))];
  cats.sort((a, b) => a.localeCompare(b, 'id'));
  return cats;
};

// Render stat cards: Total Barang, Nilai Inventory, Stok Rendah, Stok Habis
const renderStats = () => {
  const statsContainer = pageContainer && pageContainer.querySelector('#inventory-stats');
  if (!statsContainer) return;

  const totalBarang = items.length;
  const nilaiInventory = items.reduce((sum, i) => sum + ((i.price || 0) * (i.stock || 0)), 0);
  const stokRendah = items.filter(i => getStockLevel(i.stock) === 'rendah').length;
  const stokHabis = items.filter(i => getStockLevel(i.stock) === 'habis').length;

  statsContainer.innerHTML = '';
  statsContainer.appendChild(createStatCard('Total Barang', totalBarang, 'fas fa-boxes', 'primary'));
  statsContainer.appendChild(createStatCard('Nilai Inventory', formatCurrency(nilaiInventory), 'fas fa-coins', 'success'));
  statsContainer.appendChild(createStatCard('Stok Rendah', stokRendah, 'fas fa-exclamation-triangle', 'warning'));
  statsContainer.appendChild(createStatCard('Stok Habis', stokHabis, 'fas fa-times-circle', 'danger'));
};

// Partial render: hanya update #inventory-table-container → tidak re-render seluruh page & tidak dobel listener (F9)
const renderTable = () => {
  const container = pageContainer && pageContainer.querySelector('#inventory-table-container');
  if (!container) return;

  const allItems = getVisibleItems();
  const totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
  // Clamp currentPage jika data berkurang
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = allItems.slice(start, start + PAGE_SIZE);

  container.innerHTML =
    InventoryTable.render(pageItems, editItem, deleteItem, detailItem) +
    renderPagination(allItems.length, totalPages);
};

// Pure: render pagination controls (hanya muncul jika > PAGE_SIZE)
const renderPagination = (totalItems, totalPages) => {
  if (totalItems <= PAGE_SIZE) return '';

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    const activeCls = i === currentPage ? ' btn-primary' : ' btn-secondary';
    pages.push(
      `<button class="btn btn-small${activeCls}" data-page="${i}">${i}</button>`
    );
  }
  return `
    <div class="inventory-pagination">
      <button class="btn btn-small btn-secondary" data-page="prev" ${currentPage <= 1 ? 'disabled' : ''}>&laquo;</button>
      ${pages.join('')}
      <button class="btn btn-small btn-secondary" data-page="next" ${currentPage >= totalPages ? 'disabled' : ''}>&raquo;</button>
      <span class="pagination-info">Hal ${currentPage}/${totalPages} · ${totalItems} barang</span>
    </div>
  `;
};

const renderInventoryPage = async (container) => {
  pageContainer = container || document.getElementById('app');
  if (!pageContainer) {
    console.error('Container tidak ditemukan');
    return;
  }
  searchQuery = ''; // reset tiap buka page → konsisten dengan input kosong
  filterCategory = '';
  filterStock = '';
  sortBy = 'name-asc';
  
  Loading.show();
  try {
    items = await InventoryService.getAllItems();
    
    // Build option kategori (derive dari data, XSS-safe)
    const categories = getUniqueCategories();
    const catOptions = categories
      .map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
      .join('');
    
    pageContainer.innerHTML = `
      <div class="inventory-page">
        <div class="page-header">
          <h1>Daftar Barang</h1>
          ${Button.render({
            text: "Tambah Barang",
            onClick: showAddForm,
            variant: "primary"
          })}
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
    
    // Listener search + filter + sort di-attach SEKALI (realtime). Hanya renderTable() yang dijalankan → no dup listener / no full re-render (F9)
    const searchInput = pageContainer.querySelector('#search-barang');
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      currentPage = 1;
      renderTable();
    });
    
    const filterKategori = pageContainer.querySelector('#filter-kategori');
    filterKategori.addEventListener('change', (e) => {
      filterCategory = e.target.value;
      currentPage = 1;
      renderTable();
    });
    
    const filterStok = pageContainer.querySelector('#filter-stok');
    filterStok.addEventListener('change', (e) => {
      filterStock = e.target.value;
      currentPage = 1;
      renderTable();
    });
    
    const sortBarang = pageContainer.querySelector('#sort-barang');
    sortBarang.addEventListener('change', (e) => {
      sortBy = e.target.value;
      currentPage = 1;
      renderTable();
    });
    
    // Pagination: delegated click (1 listener, tidak dobel tiap render)
    const tableContainer = pageContainer.querySelector('#inventory-table-container');
    tableContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-page]');
      if (!btn || btn.disabled) return;
      const page = btn.getAttribute('data-page');
      const allItems = getVisibleItems();
      const totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
      if (page === 'prev') {
        currentPage = Math.max(1, currentPage - 1);
      } else if (page === 'next') {
        currentPage = Math.min(totalPages, currentPage + 1);
      } else {
        currentPage = parseInt(page);
      }
      renderTable();
    });
    
    renderStats(); // render stats awal
    renderTable(); // render awal
  } catch (error) {
    console.error("Gagal memuat data barang:", error);
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
    title: "Tambah Barang",
    content: InventoryForm.render({}),
    onClose: () => {}
  });
  // Attach handler after modal content is in DOM
  setTimeout(attachFormHandler, 0);
};

const editItem = (id) => {
  const item = items.find(item => item.id === id);
  if (!item) return;
  
  Modal.show({
    title: "Edit Barang",
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
  const item = items.find(item => item.id === id);
  Modal.confirm({
    title: "Hapus Barang",
    content: `Apakah Anda yakin ingin menghapus <strong>${escapeHtml(item?.name || '')}</strong>?`,
    onConfirm: async () => {
      try {
        await InventoryService.deleteItem(id);
        Toast.show('Barang berhasil dihapus', 'success');
        await renderInventoryPage(pageContainer);
      } catch (error) {
        console.error("Gagal menghapus barang:", error);
        Toast.show("Gagal menghapus barang. Silakan coba lagi.", 'error');
      }
    }
  });
};

const detailItem = (id) => {
  const item = items.find(item => item.id === id);
  if (!item) return;
  
  Modal.show({
    title: "Detail Barang",
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
    Toast.show(Object.values(errors).join("\n"), 'error');
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
    console.error("Gagal menyimpan barang:", error);
    Toast.show("Gagal menyimpan barang. Silakan coba lagi.", 'error');
  }
};

export const InventoryPage = {
  render: renderInventoryPage
};