// Global Constants for UMKM CRM Lite

export const COLORS = {
    PRIMARY: '#3B82F6',
    PRIMARY_HOVER: '#2563EB',
    SECONDARY: '#6B7280',
    SECONDARY_HOVER: '#4B5563',
    SUCCESS: '#10B981',
    DANGER: '#EF4444',
    WARNING: '#F59E0B',
    INFO: '#06B6D4',
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
        { id: 'dashboard', icon: 'fas fa-home', label: 'Dashboard', path: '#dashboard' },
        { id: 'inventory', icon: 'fas fa-boxes', label: 'Inventory', path: '#inventory' },
        { id: 'expenses', icon: 'fas fa-file-invoice-dollar', label: 'Expenses', path: '#expenses' },
        { id: 'stock', icon: 'fas fa-exchange-alt', label: 'Stock Movement', path: '#stock' },
        { id: 'customer', icon: 'fas fa-users', label: 'Pelanggan', path: '#customer' }
    ]
};