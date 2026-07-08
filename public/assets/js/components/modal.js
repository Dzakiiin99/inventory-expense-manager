// components/modal.js
// Modal component: show(content), close(), confirm({title, content, onConfirm})

let modalRoot = null;

function ensureRoot() {
  if (!modalRoot) {
    modalRoot = document.getElementById('modal');
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = 'modal';
      modalRoot.className = 'modal-overlay';
      modalRoot.style.display = 'none';
      document.body.appendChild(modalRoot);
    }
  }
  return modalRoot;
}

export const Modal = {
  show: ({ title = '', content = '', onClose = () => {} } = {}) => {
    const root = ensureRoot();
    root.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" aria-label="Tutup">&times;</button>
        </div>
        <div class="modal-body">${content}</div>
      </div>
    `;
    root.style.display = 'flex';
    root.querySelector('.modal-close').addEventListener('click', () => {
      Modal.close();
      onClose();
    });
    root.onclick = (e) => {
      if (e.target === root) {
        Modal.close();
        onClose();
      }
    };
  },
  close: () => {
    const root = ensureRoot();
    root.style.display = 'none';
    root.innerHTML = '';
  },
  confirm: ({ title = 'Konfirmasi', content = '', onConfirm = () => {} } = {}) => {
    Modal.show({
      title,
      content: `
        <p>${content}</p>
        <div class="modal-actions">
          <button class="btn btn-danger" id="modal-confirm-yes">Ya</button>
          <button class="btn btn-secondary" id="modal-confirm-no">Batal</button>
        </div>
      `,
      onClose: () => {}
    });
    const root = ensureRoot();
    root.querySelector('#modal-confirm-yes').addEventListener('click', () => {
      Modal.close();
      onConfirm();
    });
    root.querySelector('#modal-confirm-no').addEventListener('click', () => Modal.close());
  }
};
