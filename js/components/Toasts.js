// ============================================================
// TruckPulse — TOASTS
// Transient alert toasts rendered into #toast-stack.
// ============================================================

export class Toasts {
  constructor(stackEl) {
    this.stack = stackEl;
    this.count = 0;
  }

  show(alert) {
    this.count += 1;
    const id = `toast-${Date.now()}-${this.count}`;
    const el = document.createElement('div');
    el.className = `toast lvl-${alert.level}`;
    el.id = id;
    el.innerHTML = `
      <div class="toast-icon">${alert.level === 'critical' ? '🔴' : '⚠'}</div>
      <div class="toast-body">
        <div class="toast-title">${alert.level === 'critical' ? 'CRITICAL VEHICLE ALERT' : 'VEHICLE HEALTH WARNING'}</div>
        <div class="toast-msg">${alert.message}</div>
        <div class="toast-meta">
          <span>Health <b class="mono">${alert.health}/100</b></span>
          <span>Risk <b>${alert.risk}</b></span>
          <span>→ ${alert.recommendation}</span>
        </div>
      </div>
      <button class="toast-close" aria-label="Dismiss">✕</button>
    `;
    this.stack.appendChild(el);

    const remove = () => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 400);
    };
    el.querySelector('.toast-close').addEventListener('click', remove);
    setTimeout(remove, 7000);
  }

  showInfo(text, icon = 'ℹ') {
    this.count += 1;
    const el = document.createElement('div');
    el.className = 'toast lvl-info';
    el.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-body">
        <div class="toast-title">${text}</div>
      </div>
      <button class="toast-close">✕</button>
    `;
    this.stack.appendChild(el);
    const remove = () => { el.classList.add('out'); setTimeout(() => el.remove(), 400); };
    el.querySelector('.toast-close').addEventListener('click', remove);
    setTimeout(remove, 4500);
  }
}
