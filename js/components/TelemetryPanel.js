// ============================================================
// TruckPulse — LIVE TELEMETRY PANEL
// Seven animated parameter cards fed by the vehicle state.
// Display values interpolate for smooth motion.
// ============================================================

import { vibrationLevel } from '../config.js';
import { easeToward, clamp } from '../utils/math.js';

const METRICS = [
  {
    key: 'rpm', label: 'RPM', icon: '⚙️', unit: '',
    barMax: 4000, warnFrom: 3000, badFrom: 3400,
    val: (s) => Math.round(s.rpm),
    norm: (s) => clamp(s.rpm / 4000, 0, 1),
  },
  {
    key: 'coolantTemp', label: 'Coolant Temp', icon: '🌡️', unit: '°C',
    barMax: 120, warnFrom: 97, badFrom: 105,
    val: (s) => `${s.coolantTemp.toFixed(1)}`,
    norm: (s) => clamp(s.coolantTemp / 120, 0, 1),
  },
  {
    key: 'voltage', label: 'Voltage', icon: '🔋', unit: 'V',
    barMax: 15.5, warnFrom: 12.7, badFrom: 12.4,
    val: (s) => s.voltage.toFixed(2),
    norm: (s) => clamp(s.voltage / 15.5, 0, 1),
  },
  {
    key: 'speed', label: 'Speed', icon: '🛣️', unit: 'km/h',
    barMax: 130, warnFrom: 110, badFrom: 125,
    val: (s) => Math.round(s.speed),
    norm: (s) => clamp(s.speed / 130, 0, 1),
  },
  {
    key: 'engineLoad', label: 'Engine Load', icon: '🔧', unit: '%',
    barMax: 100, warnFrom: 78, badFrom: 92,
    val: (s) => Math.round(s.engineLoad),
    norm: (s) => clamp(s.engineLoad / 100, 0, 1),
  },
  {
    key: 'vibration', label: 'Vibration', icon: '📳', unit: '',
    barMax: 100, warnFrom: 55, badFrom: 75,
    val: (s) => vibrationLevel(s.vibration),
    norm: (s) => clamp(s.vibration / 100, 0, 1),
  },
  {
    key: 'fuelEfficiency', label: 'Fuel Eff.', icon: '⛽', unit: '%',
    barMax: 100, warnFrom: 50, badFrom: 35,
    val: (s) => Math.round(s.fuelEfficiency),
    norm: (s) => clamp(s.fuelEfficiency / 100, 0, 1),
  },
];

export class TelemetryPanel {
  constructor(container, app) {
    this.el = container;
    this.app = app;
    this.disp = {};
    this.metricEls = {};
    this.render();
  }

  render() {
    this.el.innerHTML = `
      <div class="panel telemetry-panel">
        <div class="panel-head">
          <h2 class="panel-title">📡 Live Telemetry</h2>
          <span class="panel-sub mono" id="tel-ts">—</span>
        </div>
        <div class="metric-grid" id="metric-grid"></div>
      </div>
    `;

    const grid = this.el.querySelector('#metric-grid');
    for (const m of METRICS) {
      const card = document.createElement('div');
      card.className = 'metric-card';
      card.innerHTML = `
        <div class="metric-head">
          <span class="metric-icon">${m.icon}</span>
          <span class="metric-label">${m.label}</span>
        </div>
        <div class="metric-value mono" id="m-${m.key}">--</div>
        <div class="metric-bar"><div class="metric-fill" id="mf-${m.key}"></div></div>
        <div class="metric-foot">
          <span class="metric-state" id="ms-${m.key}">—</span>
          <span class="metric-unit">${m.unit}</span>
        </div>
      `;
      grid.appendChild(card);
      this.metricEls[m.key] = {
        value: card.querySelector(`#m-${m.key}`),
        fill: card.querySelector(`#mf-${m.key}`),
        state: card.querySelector(`#ms-${m.key}`),
      };
    }
    this.metricEls._ts = this.el.querySelector('#tel-ts');
  }

  update(vehicle) {
    const s = vehicle.sim.state;

    for (const m of METRICS) {
      // smooth the underlying value for the bar
      if (this.disp[m.key] === undefined) this.disp[m.key] = s[m.key];
      const cur = m.key === 'coolantTemp' || m.key === 'voltage'
        ? easeToward(this.disp[m.key], s[m.key], 0.22)
        : easeToward(this.disp[m.key], s[m.key], 0.25);
      this.disp[m.key] = cur;

      const el = this.metricEls[m.key];
      el.value.textContent = m.val({ ...s, [m.key]: cur });
      el.fill.style.width = `${m.norm({ ...s, [m.key]: cur }) * 100}%`;

      const color = cur >= m.badFrom ? 'var(--bad)' : cur >= m.warnFrom ? 'var(--warn)' : 'var(--ok)';
      el.fill.style.background = color;
      el.value.style.color = color;

      let stateText = 'OK';
      if (m.key === 'voltage' && cur >= 12.7) stateText = 'NORMAL';
      if (m.key === 'coolantTemp' && cur < 97) stateText = 'NORMAL';
      if (m.key === 'rpm' && cur >= 3000) stateText = 'HIGH';
      if (m.key === 'engineLoad' && cur >= 78) stateText = 'HIGH';
      if (m.key === 'speed' && cur >= 110) stateText = 'FAST';
      if (m.key === 'vibration') stateText = s.vibration > 55 ? 'ABNORMAL' : 'NORMAL';
      if (m.key === 'fuelEfficiency' && cur < 50) stateText = 'LOW';

      const isBad = cur >= m.badFrom || (m.key === 'vibration' && s.vibration > 74);
      el.state.textContent = isBad ? '⚠ ABNORMAL' : stateText;
      el.state.className = `metric-state ${isBad ? 'bad' : cur >= m.warnFrom ? 'warn' : 'ok'}`;
    }

    this.metricEls._ts.textContent = `T+ ${Math.round(vehicle.sim.timeMs / 1000)}s`;
  }
}
