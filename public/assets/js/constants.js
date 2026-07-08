// Global Constants for UMKM CRM Lite

export const COLORS = {
    PRIMARY: '#3B82F6',
    PRIMARY_HOVER: '#2563EB',
    SECONDARY: '#6B7280',
    SECONDARY_HOVER: '#4B5563',
    SUCCESS: '#10B981',
    DANGER: '#EF4444',
    WARNING: '#F59E0B',
    BACKGROUND: '#F9FAFB',
    SURFACE: '#FFFFFF',
    TEXT: '#111827',
    TEXT_SECONDARY: '#6B7280',
    BORDER: '#E5E7EB'
};

export const BREAKPOINTS = {
    MOBILE: '768px',
    TABLET: '1024px',
    DESKTOP: '1280px'
};

export const TEXT = {
    APP_NAME: 'UMKM CRM Lite',
    DEFAULT_ERROR: 'Terjadi kesalahan. Silakan coba lagi.',
    LOADING: 'Memuat...',
    EMPTY_STATE: 'Tidak ada data yang ditemukan'
};

export const NAVIGATION = {
    MENU: [
        { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt', route: '#dashboard' },
        { id: 'inventory', label: 'Barang', icon: 'fas fa-boxes', route: '#inventory' },
        { id: 'stock', label: 'Stok Masuk/Keluar', icon: 'fas fa-exchange-alt', route: '#stock' },
        { id: 'expenses', label: 'Pengeluaran', icon: 'fas fa-wallet', route: '#expenses' }
    ]
};

export const DASHBOARD_STATS = [
    {
        title: 'Total Pelanggan',
        value: '45',
        icon: 'fas fa-users',
        variant: 'primary'
    },
    {
        title: 'Transaksi Bulan Ini',
        value: '128',
        icon: 'fas fa-exchange-alt',
        variant: 'success'
    },
    {
        title: 'Pengingat Hari Ini',
        value: '3',
        icon: 'fas fa-bell',
        variant: 'warning'
    },
    {
        title: 'Pendapatan Bulan Ini',
        value: 'Rp 5.200.000',
        icon: 'fas fa-chart-line',
        variant: 'danger'
    }
];