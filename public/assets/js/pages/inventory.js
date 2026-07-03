// pages/inventory.js
// Halaman Daftar Barang dengan Loading, Empty State, dan Modal

import { InventoryService } from "../services/inventory.service.js";
import { InventoryTable } from "../components/inventory-table.js";
import { InventoryForm } from "../components/inventory-form.js";
import { Loading } from "../components/loading-state.js";
import { Modal } from "../components/modal.js";
import { Button } from "../components/button.js";

let items = [];

const renderInventoryPage = async () => {
  Loading.show();
  try {
    items = await InventoryService.getAllItems();
    const inventoryTableHTML = InventoryTable.render(
      items,
      editItem,
      deleteItem,
      detailItem
    );
    
    document.getElementById('app').innerHTML = `
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
    document.getElementById('app').innerHTML = `
      <div class="error-state">
        <p>Gagal memuat data barang</p>
        <p>${error.message}</p>
      </div>
    `;
  } finally {
    Loading.hide();
  }
};

const showAddForm = () => {
  Modal.show({
    title: "Tambah Barang",
    content: InventoryForm.render({}, handleFormSubmit),
    onClose: () => {}
  });
};

const editItem = (id) => {
  const item = items.find(item => item.id === id);
  if (!item) return;
  
  Modal.show({
    title: "Edit Barang",
    content: InventoryForm.render(item, handleFormSubmit),
    onClose: () => {}
  });
};

const deleteItem = (id) => {
  Modal.confirm({
    title: "Hapus Barang",
    content: "Apakah Anda yakin ingin menghapus barang ini?",
    onConfirm: async () => {
      try {
        await InventoryService.deleteItem(id);
        await renderInventoryPage();
      } catch (error) {
        console.error("Gagal menghapus barang:", error);
        alert("Gagal menghapus barang. Silakan coba lagi.");
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
        <p><strong>Kode:</strong> ${item.code}</p>
        <p><strong>Nama:</strong> ${item.name}</p>
        <p><strong>Kategori:</strong> ${item.category}</p>
        <p><strong>Stok:</strong> ${item.stock} ${item.unit}</p>
        <p><strong>Harga:</strong> ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)}</p>
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
    alert(Object.values(errors).join("\n"));
    return;
  }
  
  try {
    const itemId = document.getElementById('inventory-form').dataset.itemId;
    if (itemId) {
      await InventoryService.updateItem(itemId, formData);
    } else {
      await InventoryService.addItem(formData);
    }
    Modal.close();
    await renderInventoryPage();
  } catch (error) {
    console.error("Gagal menyimpan barang:", error);
    alert("Gagal menyimpan barang. Silakan coba lagi.");
  }
};

// Event delegation untuk form submit
document.addEventListener('submit', (e) => {
  if (e.target && e.target.id === 'inventory-form') {
    handleFormSubmit(e);
  }
});

export const InventoryPage = {
  render: renderInventoryPage
};