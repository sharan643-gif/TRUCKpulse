// ============================================================
// TruckPulse — ALERT CENTER (notification center)
// Persistent list of vehicle alerts from the alert service.
// ============================================================

export class AlertCenter {
  constructor(container, app) {
    this.el = container;
    this.app = app;
    this.render();
  }

  render() {
    this.el.innerHTML = `
      <div class="panel alert-center-panel">
        <div class="panel-head">
          <h2 class="panel-title">🔔 Notification Center</h2>
          <span class="panel-sub" id="ac-count">0 alerts</span>
        </div>
        <div class="ac-list" id="ac-list">
          <div class="ac-empty">No alerts yet — all vehicles operating normally</div>
        </div>
      </div>
    `;
    this.list = this.el.querySelector('#ac-list');
    this.count = this.el.querySelector('#ac-count');
  }

  update() {
    const notifs = this.app.alertService.notifications;
    this.count.textContent = `${notifs.length} alert${notifs.length === 1 ? '' : 's'}`;

    if (notifs.length === 0) {
      if (this.list.innerHTML !== '<div class="ac-empty">No alerts yet — all vehicles operating normally</div>') {
        this.list.innerHTML = '<div class="ac-empty">No alerts yet — all vehicles operating normally</div>';
      }
      return;
    }

    let html = '';
    for (const n of notifs) {
      html += `
        <div class="ac-entry lvl-${n.level}">
          <div class="ac-head">
            <span class="ac-title">${n.level === 'critical' ? '🔴' : n.level === 'warning' ? '⚠' : '✅'} ${n.title}</span>
            <span class="ac-time mono">${n.time}</span>
          </div>
          <div class="ac-body">${n.message}</div>
          <div class="ac-foot">
            <span class="ac-kv">Health <b class="mono">${n.health}/100</b></span>
            <span class="ac-kv">Risk <b class="mono">${n.risk}</b></span>
            <span class="ac-kv">→ ${n.recommendation}</span>
          </div>
        </div>`;
    }
    if (this.list.innerHTML !== html) this.list.innerHTML = html;
  }
}
