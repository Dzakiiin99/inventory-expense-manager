// Entry Point for UMKM CRM Lite
import { initLayout } from './layout.js';
import { setupNavigation } from './navigation.js';
import { initRouter } from './router.js';
import { Toast } from './components/toast.js';

/**
 * Global error boundary — hindari halaman putih saat terjadi JS error.
 * Strategi: coba Toast (jika DOM siap); jika gagal, tampilkan banner fallback
 * langsung ke body agar user tetap melihat feedback, bukan layar kosong.
 */
function showFatalError(message) {
  const safeMsg = String(message || 'Terjadi kesalahan tak dikenal');
  try {
    Toast.show(safeMsg, 'error', 8000);
  } catch {
    // Fallback: banner langsung ke body (XSS-safe via textContent)
    try {
      const banner = document.createElement('div');
      banner.setAttribute('role', 'alert');
      banner.style.cssText =
        'position:fixed;top:0;left:0;right:0;z-index:10000;background:#c0392b;color:#fff;' +
        'padding:12px 16px;font-family:sans-serif;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,.3)';
      banner.textContent = 'Terjadi kesalahan: ' + safeMsg;
      (document.body || document.documentElement).appendChild(banner);
    } catch (fallbackErr) {
      console.error('[GlobalError] Gagal menampilkan fallback banner:', fallbackErr);
    }
  }
}

function reportError(err) {
  const msg = err && err.message
    ? err.message
    : (typeof err === 'string' ? err : 'JavaScript error');
  console.error('[GlobalError]', err);
  showFatalError(msg);
}

// Tangkap error runtime (sync + kegagalan load resource)
window.addEventListener('error', (e) => {
  // e.error berisi Error object untuk script error; pesan generik untuk cross-origin
  reportError(e.error || e.message || 'JavaScript error');
}, true);

// Tangkap promise rejection yang tidak tertangani (mis. render halaman async)
window.addEventListener('unhandledrejection', (e) => {
  const reason = e.reason;
  reportError(reason && reason.message ? reason : (reason || 'Unhandled promise rejection'));
});

/**
 * Initialize the application
 */
export function initApp() {
  try {
    initLayout();
    setupNavigation();
    initRouter();
  } catch (err) {
    reportError(err);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
