// pages/transaction/transaction.page.js
// Orchestrator — menghubungkan TransactionService, CustomerService,
// InventoryService, transaction.state, transaction.render.
// TIDAK BOLEH: akses storage langsung, filter/sort/stats manual,
// business logic di render. Semua integrasi lintas-modul ada di sini.

import { TransactionService, PAYMENT_METHODS } from '../../services/transaction.service.js';
import { CustomerService } from '../../services/customer.service.js';
import { InventoryService } from '../../services/inventory.service.js';
import { StockMovementService } from '../../services/stock-movement.service.js';
import { Loading } from '../../components/loading-state.js';
import { Modal } from '../../components/modal.js';
import { Toast } from '../../components/toast.js';
import { escapeHtml, formatCurrency, formatDate } from '../../utils/index.js';
import {
  state,
  PAGE_SIZE,
  getVisibleItems,
  computeStats,
  getTotalPages,
} from './transaction.state.js';
import {
  buildPageShellHtml,
  renderStats,
  renderTable,
  renderPagination,
  renderLoadingState,
  renderErrorState,
} from './transaction.render.js';

// Cache data hasil load (bukan storage — hanya variabel JS di memori).
// Dipakai untuk populate dropdown & validasi FK/stok tanpa refetch tiap aksi.
let cachedCustomers = [];
let cachedInventory = [];

// ─── RENDER ALL ──────────────────────────────────────────────────

/**
 * Re-render seluruh tampilan (stats + table + pagination).
 * Dipanggil setelah setiap perubahan state. Tidak hitung ulang manual.
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

  // Render pagination di dalam table container (via Button.onClick, bukan data-page)
  const tableContainer = container.querySelector('#transaction-table-container');
  if (tableContainer) {
    tableContainer.insertAdjacentHTML(
      'beforeend',
      renderPagination(state.currentPage, totalPages, visibleItems.length, {
        onPage: (value) => handlePageChange(container, value),
      })
    );
  }
}

// ─── EVENT BINDING ───────────────────────────────────────────────

/**
 * Bind semua event listener ke elemen page (shell statis, di-bind sekali).
 * @param {HTMLElement} container
 */
function bindEvents(container) {
  const searchInput = container.querySelector('#search-transaction');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      state.currentPage = 1;
      renderAll(container);
    });
  }

  const filterPayment = container.querySelector('#filter-payment-method');
  if (filterPayment) {
    filterPayment.addEventListener('change', (e) => {
      state.filterPaymentMethod = e.target.value;
      state.currentPage = 1;
      renderAll(container);
    });
  }

  const filterCustomer = container.querySelector('#filter-customer');
  if (filterCustomer) {
    filterCustomer.addEventListener('change', (e) => {
      state.filterCustomer = e.target.value;
      state.currentPage = 1;
      renderAll(container);
    });
  }

  const sortSelect = container.querySelector('#sort-transaction');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      state.currentPage = 1;
      renderAll(container);
    });
  }
}

/**
 * Handler perubahan halaman (dipanggil dari Button.onClick pagination).
 * @param {HTMLElement} container
 * @param {string|number} value - 'prev' | 'next' | nomor halaman
 */
function handlePageChange(container, value) {
  const visibleItems = getVisibleItems(state);
  const totalPages = getTotalPages(visibleItems.length, PAGE_SIZE);

  if (value === 'prev') {
    if (state.currentPage > 1) state.currentPage--;
  } else if (value === 'next') {
    if (state.currentPage < totalPages) state.currentPage++;
  } else {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      state.currentPage = num;
    }
  }

  renderAll(container);
}

// ─── FORM HELPERS ────────────────────────────────────────────────

/**
 * Build HTML form transaksi (tambah/edit).
 * @param {object|null} transaction - null = tambah, object = edit (prefill)
 * @returns {string} HTML string
 */
function buildFormHtml(transaction) {
  const selectedCustomerId = transaction ? transaction.customerId : '';
  const discount = transaction ? (transaction.discount || 0) : 0;
  const notes = transaction ? (transaction.notes || '') : '';

  const customerOptions = cachedCustomers
    .map((c) =>
      `<option value="${c.id}" ${c.id === selectedCustomerId ? 'selected' : ''}>${escapeHtml(c.name)} (${escapeHtml(c.customerCode || '')})</option>`
    )
    .join('');

  return `
    <form id="trx-form">
      <div class="form-group">
        <label for="trx-customer">Pelanggan *</label>
        <select id="trx-customer" class="input-field" required>
          <option value="">Pilih Pelanggan</option>
          ${customerOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Barang *</label>
        <div id="trx-items"></div>
        <button type="button" class="btn btn-secondary" id="trx-add-item">+ Tambah Barang</button>
      </div>
      <div class="form-group">
        <label for="trx-discount">Discount</label>
        <input type="number" id="trx-discount" class="input-field" min="0" step="0.01" value="${discount}">
      </div>
      <div class="form-group">
        <label for="trx-payment">Metode Pembayaran *</label>
        <select id="trx-payment" class="input-field" required>
          <option value="cash" ${transaction && transaction.paymentMethod === 'transfer' ? '' : 'selected'}>Cash</option>
          <option value="transfer" ${transaction && transaction.paymentMethod === 'transfer' ? 'selected' : ''}>Transfer</option>
        </select>
      </div>
      <div class="form-group">
        <label for="trx-notes">Catatan</label>
        <textarea id="trx-notes" class="input-field" rows="2">${escapeHtml(notes)}</textarea>
      </div>
      <div id="trx-total-preview" class="trx-total-preview" style="font-weight:bold;margin:8px 0;"></div>
      <div class="modal-actions">
        <button type="submit" class="btn btn-primary">Simpan</button>
        <button type="button" class="btn btn-secondary" id="trx-cancel">Batal</button>
      </div>
    </form>
  `;
}

/**
 * Buat elemen baris item (select inventory + qty + price + remove).
 * @param {object} [prefill] - { inventoryId, quantity, unitPrice }
 * @returns {HTMLElement}
 */
function createItemRowElement(prefill = {}) {
  const div = document.createElement('div');
  div.className = 'trx-item-row';
  div.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;';

  const options = cachedInventory
    .map((i) =>
      `<option value="${i.id}" data-price="${i.price}" data-name="${escapeAttr(i.name)}" data-code="${escapeAttr(i.code)}" data-unit="${escapeAttr(i.unit)}" ${i.id === prefill.inventoryId ? 'selected' : ''}>${escapeHtml(i.name)} (${escapeHtml(i.code)}) · stok ${i.stock}</option>`
    )
    .join('');

  div.innerHTML = `
    <select class="trx-item-select input-field" style="flex:2" required>
      <option value="">Pilih Barang</option>
      ${options}
    </select>
    <input type="number" class="trx-item-qty input-field" min="1" value="${prefill.quantity ?? 1}" style="width:80px" required>
    <input type="number" class="trx-item-price input-field" min="0" step="0.01" value="${prefill.unitPrice ?? 0}" style="width:120px" required>
    <button type="button" class="btn btn-secondary trx-item-remove">×</button>
  `;
  return div;
}

/**
 * Wire listener untuk satu baris item (pilih barang → isi harga, tombol hapus).
 * @param {HTMLElement} row
 */
function attachRowListeners(row) {
  const sel = row.querySelector('.trx-item-select');
  const priceInput = row.querySelector('.trx-item-price');
  sel.addEventListener('change', () => {
    const opt = sel.selectedOptions[0];
    if (opt && opt.dataset.price) priceInput.value = opt.dataset.price;
    updateTotalPreview(row.closest('#trx-form'));
  });
  const removeBtn = row.querySelector('.trx-item-remove');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      row.remove();
      updateTotalPreview(row.closest('#trx-form'));
    });
  }
}

/**
 * Preview total (UI only — total otoritatif dihitung service).
 * @param {HTMLElement|null} form
 */
function updateTotalPreview(form) {
  if (!form) return;
  let subtotal = 0;
  form.querySelectorAll('#trx-items .trx-item-row').forEach((row) => {
    const qty = Number(row.querySelector('.trx-item-qty').value) || 0;
    const price = Number(row.querySelector('.trx-item-price').value) || 0;
    subtotal += qty * price;
  });
  const discount = Number(form.querySelector('#trx-discount').value) || 0;
  const total = Math.max(0, subtotal - discount);
  const preview = form.querySelector('#trx-total-preview');
  if (preview) {
    preview.textContent = `Subtotal: ${formatCurrency(subtotal)} · Total: ${formatCurrency(total)}`;
  }
}

/**
 * Buka modal form (tambah/edit).
 * @param {HTMLElement} container
 * @param {string} title
 * @param {object|null} transaction
 */
function openForm(container, title, transaction) {
  const isEdit = !!transaction;
  Modal.show({ title, content: buildFormHtml(transaction) });

  const form = document.getElementById('trx-form');
  if (!form) return;

  const itemsContainer = form.querySelector('#trx-items');
  const prefillItems = transaction ? (transaction.items || []) : [];
  if (prefillItems.length === 0) {
    const row = createItemRowElement({});
    itemsContainer.appendChild(row);
    attachRowListeners(row);
  } else {
    prefillItems.forEach((it) => {
      const row = createItemRowElement({
        inventoryId: it.inventoryId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      });
      itemsContainer.appendChild(row);
      attachRowListeners(row);
    });
  }

  form.querySelector('#trx-add-item').addEventListener('click', () => {
    const row = createItemRowElement({});
    itemsContainer.appendChild(row);
    attachRowListeners(row);
    updateTotalPreview(form);
  });

  form.querySelector('#trx-cancel').addEventListener('click', () => Modal.close());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isEdit) await handleUpdate(container, transaction.id);
    else await handleCreate(container);
  });

  updateTotalPreview(form);
}

/**
 * Baca nilai form → struktur data mentah (belum tervalidasi).
 * @param {HTMLElement} form
 * @returns {object}
 */
function readForm(form) {
  const customerId = form.querySelector('#trx-customer').value;
  const paymentMethod = form.querySelector('#trx-payment').value;
  const discount = Number(form.querySelector('#trx-discount').value) || 0;
  const notes = form.querySelector('#trx-notes').value;

  const items = [...form.querySelectorAll('#trx-items .trx-item-row')].map((row) => {
    const sel = row.querySelector('.trx-item-select');
    const opt = sel.selectedOptions[0];
    return {
      inventoryId: sel.value,
      itemCode: opt ? (opt.dataset.code || '') : '',
      itemName: opt ? (opt.dataset.name || '') : '',
      name: opt ? (opt.dataset.name || '') : '',
      unit: opt ? (opt.dataset.unit || '') : '',
      quantity: Number(row.querySelector('.trx-item-qty').value),
      unitPrice: Number(row.querySelector('.trx-item-price').value),
    };
  });

  return { customerId, paymentMethod, discount, notes, items };
}

/**
 * Validasi lintas-modul SEBELUM memanggil service.
 * @param {object} data - hasil readForm
 * @returns {string|null} pesan error, atau null bila valid
 */
function validateBeforeService(data) {
  if (!data.customerId) return 'Pelanggan wajib dipilih';
  const customer = cachedCustomers.find((c) => c.id === data.customerId);
  if (!customer) return 'Pelanggan tidak ditemukan';

  if (data.items.length < 1) return 'Minimal 1 item diperlukan';
  if (data.items.some((it) => !it.inventoryId)) return 'Setiap item harus memilih barang';

  // Validasi quantity harus integer (karena addStockOut menolak desimal)
  for (const it of data.items) {
    if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
      return 'Quantity harus berupa bilangan bulat';
    }
  }

  // Agregasi per inventoryId → cek stok total (bukan per baris)
  const perItem = {};
  for (const it of data.items) {
    perItem[it.inventoryId] = (perItem[it.inventoryId] || 0) + it.quantity;
  }
  for (const invId of Object.keys(perItem)) {
    const inv = cachedInventory.find((i) => i.id === invId);
    if (!inv) return 'Barang tidak ditemukan';
    if (!Number.isFinite(perItem[invId]) || perItem[invId] <= 0) {
      return `Quantity untuk ${inv.name} harus > 0`;
    }
    if (inv.stock < perItem[invId]) {
      return `Stok tidak cukup untuk ${inv.name} (tersedia ${inv.stock}, diminta ${perItem[invId]})`;
    }
  }

  for (const it of data.items) {
    if (!Number.isFinite(it.unitPrice) || it.unitPrice < 0) {
      return 'Harga satuan harus angka >= 0';
    }
  }

  if (data.discount < 0) return 'Discount harus >= 0';
  if (!PAYMENT_METHODS.includes(data.paymentMethod)) return 'Metode pembayaran tidak valid';

  return null; // valid
}

// ─── CRUD OPERATIONS ─────────────────────────────────────────────

/**
 * Tampilkan modal tambah transaksi.
 * @param {HTMLElement} container
 */
function showAddForm(container) {
  openForm(container, 'Tambah Transaksi', null);
}

/**
 * Tampilkan modal edit transaksi.
 * @param {HTMLElement} container
 * @param {string} id
 */
async function showEditForm(container, id) {
  try {
    Loading.show();
    const tx = await TransactionService.getTransactionById(id);
    if (!tx) {
      Toast.show('Transaksi tidak ditemukan', 'error');
      return;
    }
    openForm(container, `Edit Transaksi — ${tx.transactionCode}`, tx);
  } catch {
    Toast.show('Gagal memuat transaksi', 'error');
  } finally {
    Loading.hide();
  }
}

/**
 * Tampilkan modal detail transaksi (read-only).
 * @param {HTMLElement} container
 * @param {string} id
 */
async function showDetail(container, id) {
  try {
    Loading.show();
    const tx = await TransactionService.getTransactionById(id);
    if (!tx) {
      Toast.show('Transaksi tidak ditemukan', 'error');
      return;
    }

    const rows = (tx.items || [])
      .map((it) =>
        `<tr>
          <td><code>${escapeHtml(it.itemCode || '-')}</code></td>
          <td>${escapeHtml(it.itemName || '-')}</td>
          <td class="text-center">${it.quantity}</td>
          <td class="text-right">${formatCurrency(it.unitPrice)}</td>
          <td class="text-right">${formatCurrency(it.subtotal)}</td>
        </tr>`
      )
      .join('');

    const detailHtml = `
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-label">Kode</span><span class="detail-value"><code>${escapeHtml(tx.transactionCode || '-')}</code></span></div>
        <div class="detail-row"><span class="detail-label">Pelanggan</span><span class="detail-value">${escapeHtml(tx.customerName || '-')}</span></div>
        <div class="detail-row"><span class="detail-label">Tanggal</span><span class="detail-value">${tx.createdAt ? formatDate(tx.createdAt, true) : '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Pembayaran</span><span class="detail-value">${tx.paymentMethod === 'cash' ? 'Cash' : 'Transfer'}</span></div>
        <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${tx.isDeleted ? 'Deleted' : 'Active'}</span></div>
        <div class="detail-row"><span class="detail-label">Discount</span><span class="detail-value">${formatCurrency(tx.discount || 0)}</span></div>
        <div class="detail-row"><span class="detail-label">Total</span><span class="detail-value">${formatCurrency(tx.total || 0)}</span></div>
        <div class="detail-row"><span class="detail-label">Catatan</span><span class="detail-value">${escapeHtml(tx.notes || '-')}</span></div>
      </div>
      <h4>Item</h4>
      <div class="table-responsive">
        <table class="data-table">
          <thead><tr><th>Kode</th><th>Nama</th><th class="text-center">Qty</th><th class="text-right">Harga</th><th class="text-right">Subtotal</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    Modal.show({ title: `Detail Transaksi — ${tx.transactionCode}`, content: detailHtml });
  } catch {
    Toast.show('Gagal memuat transaksi', 'error');
  } finally {
    Loading.hide();
  }
}

/**
 * Konfirmasi hapus transaksi (soft delete).
 * @param {HTMLElement} container
 * @param {string} id
 */
function confirmDelete(container, id) {
  Modal.confirm({
    title: 'Hapus Transaksi',
    content: 'Yakin hapus transaksi ini? Data akan dinonaktifkan (soft delete, tidak dihapus permanen).',
    onConfirm: async () => {
      try {
        Loading.show();
        const ok = await TransactionService.deleteTransaction(id);
        if (!ok) {
          Toast.show('Transaksi tidak ditemukan', 'error');
          return;
        }
        Toast.show('Transaksi berhasil dihapus (soft delete)', 'success');
        await refreshData(container);
      } catch (err) {
        Toast.show(err.message || 'Gagal menghapus transaksi', 'error');
      } finally {
        Loading.hide();
      }
    },
  });
}

// ─── CREATE / UPDATE ─────────────────────────────────────────────

/**
 * Handler submit form tambah.
 * @param {HTMLElement} container
 */
async function handleCreate(container) {
  const form = document.getElementById('trx-form');
  if (!form) return;

  const data = readForm(form);
  const errMsg = validateBeforeService(data);
  if (errMsg) {
    Toast.show(errMsg, 'error');
    return;
  }

  const customer = cachedCustomers.find((c) => c.id === data.customerId);
  const payload = {
    customerId: data.customerId,
    customerName: customer.name,
    items: data.items,
    discount: data.discount,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
  };

  try {
    Loading.show();
    // 1. Buat transaksi
    await TransactionService.createTransaction(payload);
    // 2+3. Untuk SETIAP item: kurangi stok + buat audit trail Stock Movement.
    //     StockMovementService.addStockOut() SUDAH melakukan BOTH:
    //       - InventoryService.adjustStock(-qty)  → pengurangan stok
    //       - pushHistory(STOCK_OUT)              → audit trail
    //     Oleh karena itu adjustStock() TIDAK dipanggil terpisah — memanggil
    //     keduanya akan DOUBLE-REDUCE stok (data corruption).
    //     (Lihat temuan review: spec menulis createStockOut + adjustStock
    //      terpisah, tapi implementasi addStockOut sudah menjadi keduanya.)
    for (const it of data.items) {
      await StockMovementService.addStockOut(it.inventoryId, it.quantity);
    }
    Modal.close();
    Toast.show('Transaksi berhasil dibuat', 'success');
    // 4. Reload (transaksi + inventory agar validasi stok berikutnya akurat)
    await refreshData(container);
  } catch (err) {
    // Jika addStockOut (createStockOut) gagal: tampilkan error + log,
    // JANGAN rollback transaction (sesuai aturan spec).
    console.error('Gagal membuat stock movement:', err);
    Toast.show(err.message || 'Gagal membuat transaksi', 'error');
  } finally {
    Loading.hide();
  }
}

/**
 * Handler submit form edit.
 * NOTE: edit saat ini TIDAK merekonsiliasi stok (lihat temuan review).
 * @param {HTMLElement} container
 * @param {string} id
 */
async function handleUpdate(container, id) {
  const form = document.getElementById('trx-form');
  if (!form) return;

  const data = readForm(form);
  const errMsg = validateBeforeService(data);
  if (errMsg) {
    Toast.show(errMsg, 'error');
    return;
  }

  const customer = cachedCustomers.find((c) => c.id === data.customerId);
  const payload = {
    customerId: data.customerId,
    customerName: customer.name,
    items: data.items,
    discount: data.discount,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
  };

  try {
    Loading.show();
    await TransactionService.updateTransaction(id, payload);
    Modal.close();
    Toast.show('Transaksi berhasil diupdate', 'success');
    await refreshData(container);
  } catch (err) {
    Toast.show(err.message || 'Gagal mengupdate transaksi', 'error');
  } finally {
    Loading.hide();
  }
}

// ─── DATA REFRESH ────────────────────────────────────────────────

/**
 * Refresh data dari service → update cache + state → re-render.
 * @param {HTMLElement} container
 */
async function refreshData(container) {
  try {
    const [transactions, customers, inventory] = await Promise.all([
      TransactionService.getAllTransactions(),
      CustomerService.getAllCustomers(),
      InventoryService.getAllItems(),
    ]);
    cachedCustomers = customers;
    cachedInventory = inventory;
    state.items = transactions;
    renderAll(container);
    populateCustomerFilter(container);
  } catch (err) {
    console.error('Gagal refresh data transaksi:', err);
    Toast.show('Gagal memuat data transaksi', 'error');
  }
}

// ─── HELPER ──────────────────────────────────────────────────────

/**
 * Isi dropdown filter customer dari cache.
 * @param {HTMLElement} container
 */
function populateCustomerFilter(container) {
  const sel = container.querySelector('#filter-customer');
  if (!sel) return;
  sel.innerHTML =
    '<option value="">Semua Pelanggan</option>' +
    cachedCustomers
      .map((c) => `<option value="${c.id}">${escapeHtml(c.name)} (${escapeHtml(c.customerCode || '')})</option>`)
      .join('');
}

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

/**
 * Reset filter bawaan saat load.
 */
function resetStateFilters() {
  state.searchQuery = '';
  state.filterPaymentMethod = '';
  state.filterCustomer = '';
  state.sortBy = 'date-desc';
  state.currentPage = 1;
}

// ─── MAIN PAGE RENDER ────────────────────────────────────────────

/**
 * Render halaman Transaksi (entry point / orchestrator).
 * @param {HTMLElement} container
 */
const renderTransactionPage = async (container) => {
  // 1. Loading state
  container.innerHTML = renderLoadingState('Memuat data transaksi...');

  try {
    Loading.show();
    // 2-4. Load Customer, Inventory, Transaction (parallel)
    const [transactions, customers, inventory] = await Promise.all([
      TransactionService.getAllTransactions(),
      CustomerService.getAllCustomers(),
      InventoryService.getAllItems(),
    ]);
    cachedCustomers = customers;
    cachedInventory = inventory;

    // 5. Update state.items
    state.items = transactions;
    resetStateFilters();

    // 6. Render page shell
    container.innerHTML = buildPageShellHtml({
      onAdd: () => showAddForm(container),
    });

    // 7. Isi dropdown customer
    populateCustomerFilter(container);

    // 8-9. Render stats + table (+ pagination)
    renderAll(container);

    // 10. Bind events
    bindEvents(container);

    Loading.hide();
  } catch (err) {
    console.error('Gagal memuat halaman transaksi:', err);
    Loading.hide();
    container.innerHTML = renderErrorState('Gagal memuat data transaksi. Silakan coba lagi.');
  }
};

// ─── EXPORT ──────────────────────────────────────────────────────

export const TransactionPage = { render: renderTransactionPage };
