// ============================================================
// TruckPulse — VEHICLE HEALTH PANEL
// Animated health ring, status chip, risk, confidence and a
// per-component breakdown. Display values interpolate smoothly.
// ============================================================

import { easeToward, clamp } from '../utils/math.js';
import { PLACEHOLDER_REG_NUMBER } from '../config.js';

const RING_R = 54;
const CIRC = 2 * Math.PI * RING_R;

export class HealthScore {
  constructor(container, app) {
    this.el = container;
    this.app = app;
    this.display = 95;        // smoothed display health
    this.prevAnalysis = null;
    this.render();
  }

  render() {
    this.el.innerHTML = `
      <div class="panel health-panel">
        <div class="panel-head">
          <h2 class="panel-title">🩺 Vehicle Health</h2>
          <span class="panel-sub" id="hs-vehicle">—</span>
        </div>

        <div class="health-main">
          <div class="ring-wrap">
            <svg class="ring" width="150" height="150" viewBox="0 0 150 150">
              <circle class="ring-bg" cx="75" cy="75" r="${RING_R}" />
              <circle class="ring-fg" id="ring-fg" cx="75" cy="75" r="${RING_R}" />
            </svg>
            <div class="ring-center">
              <div class="ring-value" id="ring-value">--</div>
              <div class="ring-max">/ 100</div>
            </div>
          </div>

          <div class="health-meta">
            <div class="status-badge" id="status-badge"><span class="status-icon">🟢</span><span id="status-text">HEALTHY</span></div>
            <div class="meta-chips">
              <div class="chip">
                <span class="chip-label">RISK</span>
                <span class="chip-value" id="risk-value">LOW</span>
              </div>
              <div class="chip">
                <span class="chip-label">CONFIDENCE</span>
                <span class="chip-value" id="conf-value">--%</span>
              </div>
            </div>
            <div class="conf-bar"><div class="conf-fill" id="conf-fill"></div></div>
            <div class="veh-identity mono" id="hs-plate">—</div>
          </div>
        </div>

        <div class="component-breakdown" id="comp-break"></div>
      </div>
    `;

    this.ringFg = this.el.querySelector('#ring-fg');
    this.ringValue = this.el.querySelector('#ring-value');
    this.statusBadge = this.el.querySelector('#status-badge');
    this.statusText = this.el.querySelector('#status-text');
    this.riskValue = this.el.querySelector('#risk-value');
    this.confValue = this.el.querySelector('#conf-value');
    this.confFill = this.el.querySelector('#conf-fill');
    this.vehPlate = this.el.querySelector('#hs-plate');
    this.vehName = this.el.querySelector('#hs-vehicle');
    this.compBreak = this.el.querySelector('#comp-break');

    this.compLabels = {
      temperature: 'Coolant', voltage: 'Voltage', rpm: 'RPM',
      vibration: 'Vibration', engineLoad: 'Load', speed: 'Speed',
    };
    this.compRows = {};
    for (const key of Object.keys(this.compLabels)) {
      const row = document.createElement('div');
      row.className = 'comp-row';
      row.innerHTML = `
        <span class="comp-label">${this.compLabels[key]}</span>
        <div class="comp-bar"><div class="comp-fill"></div></div>
        <span class="comp-val mono">0</span>
      `;
      this.compBreak.appendChild(row);
      this.compRows[key] = {
        fill: row.querySelector('.comp-fill'),
        val: row.querySelector('.comp-val'),
      };
    }
  }

  update(vehicle) {
    const a = vehicle.analysis;
    if (!a) return;

    // smooth health display toward the computed value
    this.display = easeToward(this.display, a.healthScore, 0.16);
    if (Math.abs(this.display - a.healthScore) < 0.3) this.display = a.healthScore;

    const val = Math.round(this.display);
    this.ringValue.textContent = val;

    const offset = CIRC * (1 - val / 100);
    this.ringFg.style.strokeDashoffset = String(offset);
    this.ringFg.style.stroke = bandColor(a.band);

    this.statusBadge.className = `status-badge band-${a.band.toLowerCase()}`;
    this.statusText.textContent = a.band;
    this.statusBadge.querySelector('.status-icon').textContent = a.band === 'HEALTHY' ? '🟢' : a.band === 'ATTENTION' ? '🟡' : '🔴';

    this.riskValue.textContent = a.riskLevel;
    this.riskValue.className = `chip-value risk-${a.riskLevel.toLowerCase()}`;

    this.confValue.textContent = `${a.confidence}%`;
    this.confFill.style.width = `${a.confidence}%`;
    this.confFill.style.background = bandColor(a.band);

    const plate = vehicle.plate || PLACEHOLDER_REG_NUMBER;
    if (this.vehPlate.textContent !== plate) this.vehPlate.textContent = plate;
    if (this.vehName.textContent !== vehicle.name) this.vehName.textContent = vehicle.name;

    this.renderComponents(a);
  }

  renderComponents(a) {
    if (!a.components) return;
    for (const key of Object.keys(this.compLabels)) {
      const row = this.compRows[key];
      const v = clamp(Math.round(a.components[key] || 0), 0, 100);
      row.val.textContent = v;
      row.fill.style.width = `${v}%`;
      row.fill.style.background = v >= 90 ? 'var(--ok)' : v >= 60 ? 'var(--warn)' : 'var(--bad)';
    }
  }
}

export function bandColor(band) {
  if (band === 'CRITICAL') return 'var(--bad)';
  if (band === 'ATTENTION') return 'var(--warn)';
  return 'var(--ok)';
}
