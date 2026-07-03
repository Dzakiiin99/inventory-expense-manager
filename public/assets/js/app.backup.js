// Main Application Module (Backup from Sprint 1)
class UMKMCRMApp {
    constructor() {
        this.sidebar = document.querySelector('.sidebar');
        this.toggleSidebarBtn = document.querySelector('.toggle-sidebar-btn');
        this.contentArea = document.getElementById('content-area');
        this.navLinks = document.querySelectorAll('.sidebar-nav a');
        
        this.initEventListeners();
        this.loadInitialPage();
    }

    initEventListeners() {
        // Toggle sidebar on mobile
        this.toggleSidebarBtn.addEventListener('click', () => {
            this.sidebar.classList.toggle('open');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                !this.sidebar.contains(e.target) &&
                !this.toggleSidebarBtn.contains(e.target)) {
                this.sidebar.classList.remove('open');
            }
        });
        
        // Handle navigation
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all links
                this.navLinks.forEach(l => l.classList.remove('active'));
                
                // Add active class to clicked link
                link.classList.add('active');
                
                // Load the corresponding page
                const page = link.getAttribute('href').substring(1);
                this.loadPage(page);
                
                // Update breadcrumb
                this.updateBreadcrumb(page);
                
                // Close sidebar on mobile
                if (window.innerWidth <= 768) {
                    this.sidebar.classList.remove('open');
                }
            });
        });
    }

    loadInitialPage() {
        // Load dashboard by default
        const activeLink = document.querySelector('.sidebar-nav a.active');
        if (activeLink) {
            const page = activeLink.getAttribute('href').substring(1);
            this.loadPage(page);
            this.updateBreadcrumb(page);
        }
    }

    loadPage(page) {
        // Clear content area
        this.contentArea.innerHTML = '';
        
        // Load the appropriate page
        switch(page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'pelanggan':
                this.loadPelangganPage();
                break;
            case 'transaksi':
                this.loadTransaksiPage();
                break;
            case 'pengingat':
                this.loadPengingatPage();
                break;
            case 'laporan':
                this.loadLaporanPage();
                break;
            case 'pengaturan':
                this.loadPengaturanPage();
                break;
            default:
                this.loadDashboard();
        }
    }

    updateBreadcrumb(page) {
        const breadcrumb = document.querySelector('.breadcrumb');
        if (!breadcrumb) return;
        
        const pageNames = {
            'dashboard': 'Dashboard',
            'pelanggan': 'Pelanggan',
            'transaksi': 'Transaksi',
            'pengingat': 'Pengingat',
            'laporan': 'Laporan',
            'pengaturan': 'Pengaturan'
        };
        
        breadcrumb.innerHTML = `<span>${pageNames[page] || 'Dashboard'}</span>`;
    }

    // Page Loaders
    loadDashboard() {
        this.contentArea.innerHTML = `
            <h1>Dashboard</h1>
            <div class="dashboard-grid">
                <div class="stat-card">
                    <div class="stat-card-header">
                        <div class="stat-card-icon primary">
                            <i class="fas fa-users"></i>
                        </div>
                    </div>
                    <div class="stat-card-title">Total Pelanggan</div>
                    <div class="stat-card-value">45</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <div class="stat-card-icon success">
                            <i class="fas fa-exchange-alt"></i>
                        </div>
                    </div>
                    <div class="stat-card-title">Transaksi Bulan Ini</div>
                    <div class="stat-card-value">128</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <div class="stat-card-icon warning">
                            <i class="fas fa-bell"></i>
                        </div>
                    </div>
                    <div class="stat-card-title">Pengingat Hari Ini</div>
                    <div class="stat-card-value">3</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <div class="stat-card-icon danger">
                            <i class="fas fa-chart-line"></i>
                        </div>
                    </div>
                    <div class="stat-card-title">Pendapatan Bulan Ini</div>
                    <div class="stat-card-value">Rp 5.200.000</div>
                </div>
            </div>
        `;
    }

    loadPelangganPage() {
        this.contentArea.innerHTML = `
            <div class="placeholder-page">
                <i class="fas fa-users"></i>
                <h2>Manajemen Pelanggan</h2>
                <p>Kelola data pelanggan, tambah pelanggan baru, dan lihat riwayat transaksi pelanggan.</p>
            </div>
        `;
    }

    loadTransaksiPage() {
        this.contentArea.innerHTML = `
            <div class="placeholder-page">
                <i class="fas fa-exchange-alt"></i>
                <h2>Manajemen Transaksi</h2>
                <p>Catat transaksi penjualan, lacak pembayaran, dan kelola riwayat transaksi.</p>
            </div>
        `;
    }

    loadPengingatPage() {
        this.contentArea.innerHTML = `
            <div class="placeholder-page">
                <i class="fas fa-bell"></i>
                <h2>Pengingat Otomatis</h2>
                <p>Atur pengingat untuk follow-up pelanggan, ulang tahun, dan tagihan jatuh tempo.</p>
            </div>
        `;
    }

    loadLaporanPage() {
        this.contentArea.innerHTML = `
            <div class="placeholder-page">
                <i class="fas fa-chart-bar"></i>
                <h2>Laporan & Analitik</h2>
                <p>Lihat laporan penjualan, pelanggan terbaik, dan analisis bisnis Anda.</p>
            </div>
        `;
    }

    loadPengaturanPage() {
        this.contentArea.innerHTML = `
            <div class="placeholder-page">
                <i class="fas fa-cog"></i>
                <h2>Pengaturan Aplikasi</h2>
                <p>Atur profil usaha, kelola pengguna, dan konfigurasi integrasi.</p>
            </div>
        `;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UMKMCRMApp();
});