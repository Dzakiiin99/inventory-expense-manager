# Design System Documentation

## Components

### 1. Button
**Fungsi**: Tombol dengan berbagai varian dan ukuran.

**Parameter**:
- `text` (string): Teks tombol
- `variant` (string): Varian tombol (`primary`, `secondary`, `danger`, `success`, `outline`)
- `size` (string): Ukuran tombol (`small`, `medium`, `large`)
- `disabled` (boolean): Nonaktifkan tombol
- `loading` (boolean): Tampilkan state loading
- `icon` (string): Kelas ikon (contoh: `'fas fa-plus'`)
- `onClick` (function): Handler klik

**Contoh Penggunaan**:
```javascript
import { createButton } from './components/design-system/button.js';

const button = createButton({
  text: 'Simpan',
  variant: 'primary',
  size: 'medium',
  onClick: () => console.log('Clicked')
});
document.body.appendChild(button);
```

---

### 2. Card
**Fungsi**: Komponen kartu dengan header, konten, dan footer.

**Parameter**:
- `title` (string): Judul kartu
- `content` (string): Konten kartu
- `footer` (string): Footer kartu
- `variant` (string): Varian kartu (`default`, `stat`, `section`)

**Contoh Penggunaan**:
```javascript
import { createCard } from './components/design-system/card.js';

const card = createCard({
  title: 'Informasi Pelanggan',
  content: '<p>Data pelanggan akan ditampilkan di sini.</p>',
  variant: 'section'
});
```

---

### 3. Input
**Fungsi**: Input field dengan berbagai tipe dan state.

**Parameter**:
- `type` (string): Tipe input (`text`, `number`, `currency`, `date`, `search`, `textarea`)
- `label` (string): Label input
- `name` (string): Nama input
- `value` (string): Nilai input
- `placeholder` (string): Placeholder
- `error` (string): Pesan error
- `disabled` (boolean): Nonaktifkan input
- `onChange` (function): Handler perubahan

**Contoh Penggunaan**:
```javascript
import { createInput } from './components/design-system/input.js';

const input = createInput({
  type: 'text',
  label: 'Nama Lengkap',
  name: 'fullname',
  placeholder: 'Masukkan nama lengkap'
});
```

---

### 4. Table
**Fungsi**: Tabel dengan dukungan untuk empty state dan responsif.

**Parameter**:
- `columns` (array): Daftar kolom `[{ key, label, sortable }]`
- `data` (array): Data tabel
- `zebra` (boolean): Aktifkan zebra striping
- `hover` (boolean): Aktifkan efek hover

**Contoh Penggunaan**:
```javascript
import { createTable } from './components/design-system/table.js';

const table = createTable({
  columns: [
    { key: 'name', label: 'Nama' },
    { key: 'email', label: 'Email' }
  ],
  data: [
    { name: 'Budi', email: 'budi@example.com' }
  ]
});
```

---

### 5. Alert
**Fungsi**: Pesan alert dengan berbagai varian.

**Parameter**:
- `message` (string): Pesan alert
- `variant` (string): Varian alert (`info`, `success`, `warning`, `danger`)
- `dismissible` (boolean): Tampilkan tombol tutup
- `onDismiss` (function): Handler saat ditutup

**Contoh Penggunaan**:
```javascript
import { createAlert } from './components/design-system/alert.js';

const alert = createAlert({
  message: 'Data berhasil disimpan!',
  variant: 'success'
});
```

---

### 6. Loading
**Fungsi**: Komponen loading (spinner, skeleton).

**Contoh Penggunaan**:
```javascript
import { createSpinner, createSkeletonCard } from './components/design-system/loading.js';

// Spinner
const spinner = createSpinner('medium');

// Skeleton Card
const skeleton = createSkeletonCard(3);
```

---

### 7. Empty State
**Fungsi**: Tampilan saat tidak ada data.

**Parameter**:
- `message` (string): Pesan
- `icon` (string): Kelas ikon
- `actionText` (string): Teks tombol aksi
- `onAction` (function): Handler tombol aksi

**Contoh Penggunaan**:
```javascript
import { createEmptyState } from './components/design-system/empty-state.js';

const emptyState = createEmptyState({
  message: 'Belum ada pelanggan',
  actionText: 'Tambah Pelanggan',
  onAction: () => console.log('Tambah pelanggan')
});
```

---

### 8. Confirmation Dialog
**Fungsi**: Dialog konfirmasi untuk aksi penting.

**Parameter**:
- `title` (string): Judul dialog
- `message` (string): Pesan dialog
- `type` (string): Tipe dialog (`delete`, `cancel`, `save`)
- `onConfirm` (function): Handler konfirmasi
- `onCancel` (function): Handler batal

**Contoh Penggunaan**:
```javascript
import { createConfirmationDialog } from './components/design-system/modal.js';

const dialog = createConfirmationDialog({
  title: 'Hapus Pelanggan',
  message: 'Apakah Anda yakin ingin menghapus pelanggan ini?',
  type: 'delete',
  onConfirm: () => console.log('Dihapus'),
  onCancel: () => console.log('Dibatalkan')
});
document.body.appendChild(dialog);
```