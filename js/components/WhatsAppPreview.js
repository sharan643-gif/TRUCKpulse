// ============================================================
// TruckPulse — WHATSAPP-STYLE PREVIEW
// A realistic chat-style alert message. UI simulation only —
// no external messaging API is used.
// ============================================================

import { fmtTime } from '../utils/math.js';

export class WhatsAppPreview {
  constructor(container, app) {
    this.el = container;
    this.app = app;
    this.render();
  }

  render() {
    this.el.innerHTML = `
      <div class="panel wa-panel">
        <div class="panel-head">
          <h2 class="panel-title">💬 Alert Preview</h2>
          <span class="panel-sub">WhatsApp-style · simulated</span>
        </div>
        <div class="wa-phone">
          <div class="wa-header">
            <div class="wa-avatar">🚛</div>
            <div class="wa-header-text">
              <span class="wa-contact">TRUCKPULSE</span>
              <span class="wa-status">online</span>
            </div>
            <span class="wa-more">⋮</span>
          </div>
          <div class="wa-chat">
            <div class="wa-date">SIMULATED ALERT</div>
            <div class="wa-bubble" id="wa-bubble">
              <div class="wa-bubble-title" id="wa-title">⚠ Vehicle Health Alert</div>
              <div class="wa-row">Vehicle: <b class="mono" id="wa-vehicle">—</b></div>
              <div class="wa-row">Health: <b class="mono" id="wa-health">--/100</b></div>
              <div class="wa-row">Issue: <span id="wa-issue">—</span></div>
              <div class="wa-row">Risk: <b id="wa-risk">—</b></div>
              <div class="wa-row">Recommendation: <span id="wa-reco">—</span></div>
              <div class="wa-time mono" id="wa-time">--:--:--</div>
            </div>
            <div class="wa-note">No active alert — the fleet is healthy.</div>
          </div>
          <div class="wa-input-bar"><span>Type a message</span><span class="wa-send">➤</span></div>
        </div>
      </div>
    `;

    this.bubble = this.el.querySelector('#wa-bubble');
    this.title = this.el.querySelector('#wa-title');
    this.vehicle = this.el.querySelector('#wa-vehicle');
    this.health = this.el.querySelector('#wa-health');
    this.issue = this.el.querySelector('#wa-issue');
    this.risk = this.el.querySelector('#wa-risk');
    this.reco = this.el.querySelector('#wa-reco');
    this.time = this.el.querySelector('#wa-time');
    this.note = this.el.querySelector('.wa-note');
  }

  update(vehicle) {
    const alert = this.app.alertService.active;
    const a = vehicle.analysis;

    if (alert) {
      this.bubble.classList.remove('idle');
      this.bubble.classList.add(`lvl-${alert.level}`);
      this.title.textContent = alert.level === 'critical' ? '🔴 Critical Vehicle Alert' : '⚠ Vehicle Health Alert';
      this.vehicle.textContent = vehicle.name + ' · ' + (vehicle.plate || '');
      this.health.textContent = `${alert.health}/100`;
      this.issue.textContent = alert.message;
      this.risk.textContent = alert.risk;
      this.reco.textContent = alert.recommendation;
      this.time.textContent = alert.time;
      this.note.style.display = 'none';
    } else {
      this.bubble.classList.add('idle');
      this.bubble.classList.remove('lvl-critical', 'lvl-warning');
      this.title.textContent = '✅ Vehicle Health OK';
      this.vehicle.textContent = vehicle.name + ' · ' + (vehicle.plate || '');
      this.health.textContent = `${a ? a.healthScore : '--'}/100`;
      this.issue.textContent = 'No abnormal patterns detected.';
      this.risk.textContent = a ? a.riskLevel : '—';
      this.reco.textContent = 'Continue monitoring';
      this.time.textContent = fmtTime();
      this.note.style.display = '';
    }
  }
}
