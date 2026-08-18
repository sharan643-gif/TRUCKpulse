// ============================================================
// TruckPulse — AI EVENT TIMELINE
// Chronological log of AI detections, risk changes and alerts,
// updated dynamically from the AI service.
// ============================================================

export class EventTimeline {
  constructor(container, app) {
    this.el = container;
    this.app = app;
    this.render();
  }

  render() {
    this.el.innerHTML = `
      <div class="panel timeline-panel">
        <div class="panel-head">
          <h2 class="panel-title">📜 AI Event Timeline</h2>
          <span class="panel-sub">live</span>
        </div>
        <div class="timeline-list" id="timeline-list">
          <div class="timeline-empty">Awaiting simulation events…</div>
        </div>
      </div>
    `;
    this.list = this.el.querySelector('#timeline-list');
  }

  update() {
    const events = this.app.ai.timeline;
    if (events.length === 0) {
      if (this.list.innerHTML !== '<div class="timeline-empty">Awaiting simulation events…</div>') {
        this.list.innerHTML = '<div class="timeline-empty">Awaiting simulation events…</div>';
      }
      return;
    }

    let html = '';
    for (const e of events) {
      html += `
        <div class="timeline-entry lvl-${e.level}">
          <span class="timeline-time mono">${e.time}</span>
          <span class="timeline-icon">${e.icon}</span>
          <span class="timeline-text">${e.text}</span>
        </div>`;
    }
    if (this.list.innerHTML !== html) this.list.innerHTML = html;
  }
}
