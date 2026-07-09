// pages/inventory.js
// Halaman Daftar Barang dengan Loading, Empty State, dan Modal

import { InventoryService } from "../services/inventory.service.js";
import { InventoryTable } from "../components/inventory-table.js";
import { InventoryForm } from "../components/inventory-form.js";
import { Loading } from "../components/loading-state.js";
import { Modal } from "../components/modal.js";
import { Button } from "../components/button.js";
import { Toast } from "../components/toast.js";
import { formatCurrency, escapeHtml } from "../utils/index.js";

let items = [];
let pageContainer = null;

const renderInventoryPage = async (container) => {
  pageContainer = container || document.getElementById('app');
  if (!pageContainer) {
    console.error('Container tidak ditemukan');
    return;
  }
  
  Loading.show();
  try {
    items = await InventoryService.getAllItems();
    const inventoryTableHTML = InventoryTable.render(
      items,
      editItem,
      deleteItem,
      detailItem
    );
    
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
        <div id="inventory-table-container">
          ${inventoryTableHTML}
        </div>
      </div>
    `;
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