// components/toast.js
// Lightweight toast notification for success/error feedback

let toastContainer = null;

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function show(message, type = 'success', duration = 3000) {
  const container = ensureContainer();
  const toast = document.createElement('div');
  
  const colors = {
    success: { bg: '#10B981', icon: '✓' },
    error: { bg: '#EF4444', icon: '✕' },
    info: { bg: '#3B82F6', icon: 'ℹ' }
  };
  
  const { bg, icon } = colors[type] || colors.success;
  
  toast.style.cssText = `
    background: ${bg};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: slideIn 0.3s ease-out;
    max-width: 350px;
  `;
  
  toast.innerHTML = `<span style="font-weight:bold">${icon}</span> <span class="toast-message"></span>`;
  toast.querySelector('.toast-message').textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

export const Toast = {
  show,
  success: (message, duration) => show(message, 'success', duration),
  error: (message, duration) => show(message, 'error', duration),
  info: (message, duration) => show(message, 'info', duration)
};