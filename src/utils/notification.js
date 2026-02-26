// ========================================
// 应用内通知系统
// ========================================

let container = null;

function ensureContainer() {
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

export function toast(message, type = 'info', duration = 3000) {
    const c = ensureContainer();

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    };

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;
    toastEl.innerHTML = `
    <span style="font-size:1.1em;font-weight:700;">${icons[type] || 'ℹ'}</span>
    <span>${message}</span>
  `;

    c.appendChild(toastEl);

    setTimeout(() => {
        toastEl.classList.add('leaving');
        setTimeout(() => toastEl.remove(), 300);
    }, duration);
}

export function success(msg) { toast(msg, 'success'); }
export function error(msg) { toast(msg, 'error'); }
export function warning(msg) { toast(msg, 'warning'); }
export function info(msg) { toast(msg, 'info'); }
