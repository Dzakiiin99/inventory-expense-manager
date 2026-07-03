// services/inventory.service.js
// Inventory Service dengan data dummy dan simulasi loading 500ms

const dummyItems = [
  {
    id: "1",
    code: "INV-001",
    name: "Beras Premium",
    category: "Bahan Pokok",
    stock: 50,
    unit: "Kg",
    price: 12000,
    status: "active"
  },
  {
    id: "2",
    code: "INV-002",
    name: "Minyak Goreng",
    category: "Bahan Pokok",
    stock: 30,
    unit: "Liter",
    price: 15000,
    status: "active"
  },
  {
    id: "3",
    code: "INV-003",
    name: "Gula Pasir",
    category: "Bahan Pokok",
    stock: 5,
    unit: "Kg",
    price: 10000,
    status: "inactive"
  },
  {
    id: "4",
    code: "INV-004",
    name: "Sabun Mandi",
    category: "Kebutuhan Rumah Tangga",
    stock: 25,
    unit: "Pcs",
    price: 5000,
    status: "active"
  },
  {
    id: "5",
    code: "INV-005",
    name: "Shampo",
    category: "Kebutuhan Rumah Tangga",
    stock: 20,
    unit: "Pcs",
    price: 8000,
    status: "active"
  },
  {
    id: "6",
    code: "INV-006",
    name: "Tepung Terigu",
    category: "Bahan Pokok",
    stock: 40,
    unit: "Kg",
    price: 9000,
    status: "active"
  },
  {
    id: "7",
    code: "INV-007",
    name: "Deterjen",
    category: "Kebutuhan Rumah Tangga",
    stock: 15,
    unit: "Pcs",
    price: 7000,
    status: "active"
  },
  {
    id: "8",
    code: "INV-008",
    name: "Kopi Bubuk",
    category: "Minuman",
    stock: 10,
    unit: "Pcs",
    price: 12000,
    status: "active"
  },
  {
    id: "9",
    code: "INV-009",
    name: "Susu Bubuk",
    category: "Minuman",
    stock: 3,
    unit: "Pcs",
    price: 20000,
    status: "inactive"
  },
  {
    id: "10",
    code: "INV-010",
    name: "Mie Instan",
    category: "Makanan",
    stock: 100,
    unit: "Pcs",
    price: 3000,
    status: "active"
  }
];

let items = [...dummyItems];

// Auto-generate kode barang
const generateItemCode = (id) => {
  return `INV-${String(id).padStart(3, "0")}`;
};

export const InventoryService = {
  getAllItems: () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...items]), 500); // Simulasi loading
    });
  },
  getItemById: (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const item = items.find((item) => item.id === id);
        resolve(item ? { ...item } : null);
      }, 500);
    });
  },
  addItem: (newItem) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const id = (items.length + 1).toString();
        const code = generateItemCode(id);
        const item = { id, code, ...newItem };
        items.push(item);
        resolve(item);
      }, 500);
    });
  },
  updateItem: (id, updatedItem) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = items.findIndex((item) => item.id === id);
        if (index === -1) {
          resolve(null);
          return;
        }
        items[index] = { ...items[index], ...updatedItem };
        resolve(items[index]);
      }, 500);
    });
  },
  deleteItem: (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = items.findIndex((item) => item.id === id);
        if (index === -1) {
          resolve(false);
          return;
        }
        items.splice(index, 1);
        resolve(true);
      }, 500);
    });
  }
};