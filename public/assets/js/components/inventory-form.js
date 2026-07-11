// components/inventory-form.js
// Form Barang menggunakan reusable Input dan Button components

import { Input } from "./input.js";
import { Button } from "./button.js";

export const InventoryForm = {
  render: (item = {}, _onSubmit) => {
    const isEdit = !!item.id;
    const title = isEdit ? "Edit Barang" : "Tambah Barang";

    return `
      <form id="inventory-form" class="form">
        <h3>${title}</h3>
        <div class="form-group">
          ${Input.render({
            label: "Nama Barang",
            name: "name",
            value: item.name || "",
            required: true,
            placeholder: "Contoh: Beras Premium"
          })}
        </div>
        <div class="form-group">
          ${Input.render({
            label: "Kategori",
            name: "category",
            value: item.category || "",
            placeholder: "Contoh: Bahan Pokok"
          })}
        </div>
        <div class="form-group">
          ${Input.render({
            label: "Harga (Rp)",
            name: "price",
            type: "number",
            value: item.price || "",
            min: 1,
            required: true
          })}
        </div>
        <div class="form-group">
          ${Input.render({
            label: "Stok",
            name: "stock",
            type: "number",
            value: item.stock || "",
            min: 0,
            required: true
          })}
        </div>
        <div class="form-group">
          ${Input.render({
            label: "Satuan",
            name: "unit",
            value: item.unit || "",
            placeholder: "Contoh: Kg, Pcs, Liter",
            required: true
          })}
        </div>
        <div class="form-actions">
          ${Button.render({
            text: isEdit ? "Update" : "Simpan",
            type: "submit",
            variant: "primary"
          })}
          ${Button.render({
            text: "Batal",
            type: "button",
            variant: "secondary",
            onClick: () => document.getElementById('modal').style.display = 'none'
          })}
        </div>
      </form>
    `;
  },
  validate: (formData) => {
    const errors = {};
    if (!formData.name || formData.name.trim() === "") {
      errors.name = "Nama barang wajib diisi";
    }
    if (formData.price <= 0) {
      errors.price = "Harga harus lebih dari 0";
    }
    if (formData.stock < 0) {
      errors.stock = "Stok tidak boleh negatif";
    }
    if (!formData.unit || formData.unit.trim() === "") {
      errors.unit = "Satuan wajib diisi";
    }
    return errors;
  },
  getFormData: () => {
    const form = document.getElementById('inventory-form');
    const formData = new FormData(form);
    return {
      name: formData.get('name'),
      category: formData.get('category') || "",
      price: parseFloat(formData.get('price')),
      stock: parseInt(formData.get('stock')),
      unit: formData.get('unit')
    };
  }
};