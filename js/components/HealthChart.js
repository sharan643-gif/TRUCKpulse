// ============================================================
// TruckPulse — LIVE CHARTS
// Five real-time canvas charts fed by the SAME rolling history
// as the dashboard and AI (single source of truth).
// ============================================================

import { clamp } from '../utils/math.js';

const CHART_DEFS = [
  { key: 'rpm', label: 'RPM', unit: 'rpm', min: 0, max: 4000, warn: [3000, 3400], color: '#22d3ee', fmt: (v) => Math.round(v) },
  { key: 'coolantTemp', label: 'Coolant Temp', unit: '°C', min: 60, max: 115, warn: [97, 105], color: '#fb923c', fmt: (v) => `${Math.round(v)}°` },
  { key: 'voltage', label: 'Voltage', unit: 'V', min: 11.5, max: 15, warn: [12.7, 12.4], color: '#34d399', fmt: (v) => v.toFixed(1) },
  { key: 'engineLoad', label: 'Engine Load', unit: '%', min: 0, max: 100, warn: [78, 92], color: '#a78bfa', fmt: (v) => `${Math.round(v)}%` },
  { key: 'vibration', label: 'Vibration', unit: '0-100', min: 0, max: 100, warn: [55, 75], color: '#f472b6', fmt: (v) => Math.round(v) },
];

export class HealthChart {
  constructor(container, app) {
    this.el = container;
    this.app = app;
    this.canvases = {};
    this.render();
  }

  render() {
    this.el.innerHTML = `
      <div class="panel charts-panel">
        <div class="panel-head">
          <h2 class="panel-title">📈 Live History</h2>
          <span class="panel-sub">last 100 data points · single simulation source</span>
        </div>
        <div class="chart-grid" id="chart-grid"></div>
      </div>
    `;

    const grid = this.el.querySelector('#chart-grid');
    for (const def of CHART_DEFS) {
      const wrap = document.createElement('div');
      wrap.className = 'chart-card';
      wrap.innerHTML = `
        <div class="chart-head">
          <span class="chart-label">${def.label}</span>
          <span class="chart-now mono" id="cv-${def.key}">--</span>
        </div>
        <canvas id="chart-${def.key}" height="120"></canvas>
      `;
      grid.appendChild(wrap);
      const canvas = wrap.querySelector(`#chart-${def.key}`);
      this.sizeCanvas(canvas);
      this.canvases[def.key] = canvas;
      this.nowEls = this.nowEls || {};
      this.nowEls[def.key] = wrap.querySelector(`#cv-${def.key}`);
    }
  }

  sizeCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.parentElement.clientWidth || 300;
    canvas.width = Math.max(50, Math.floor(w * dpr));
    canvas.height = Math.floor(120 * dpr);
    canvas.style.height = '120px';
    canvas._dpr = dpr;
    canvas._w = w;
  }

  update(vehicle) {
    const hist = vehicle.sim.history;
    for (const def of CHART_DEFS) {
      const canvas = this.canvases[def.key];
      if (!canvas) continue;
      const dpr = canvas._dpr || 1;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = canvas._w || W / dpr;
      const h = 120;
      ctx.clearRect(0, 0, w, h);

      const series = hist.map((p) => p[def.key]);
      const latest = series.length ? series[series.length - 1] : 0;
      if (this.nowEls[def.key]) this.nowEls[def.key].textContent = def.fmt(latest);

      // background + grid
      ctx.fillStyle = 'rgba(10,18,34,0.55)';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(80,110,160,0.16)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const y = (h / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const xFor = (i) => (i / (series.length - 1 || 1)) * w;
      const yFor = (v) => h - ((clamp(v, def.min, def.max) - def.min) / (def.max - def.min)) * h;

      // warning band
      const [w1, w2] = def.warn;
      const bandY = Math.min(yFor(Math.max(w1, w2)), yFor(Math.min(w1, w2)));
      const bandH = Math.abs(yFor(w1) - yFor(w2));
      ctx.fillStyle = 'rgba(251,191,36,0.10)';
      ctx.fillRect(0, bandY, w, Math.max(bandH, 2));

      // line
      if (series.length > 1) {
        // area gradient
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, hexToRgba(def.color, 0.32));
        grad.addColorStop(1, hexToRgba(def.color, 0.02));
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let i = 0; i < series.length; i++) ctx.lineTo(xFor(i), yFor(series[i]));
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        for (let i = 0; i < series.length; i++) {
          const x = xFor(i), y = yFor(series[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = def.color;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = def.color;
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // current value dot
      if (series.length) {
        const x = xFor(series.length - 1);
        const y = yFor(latest);
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(def.color, 0.25);
        ctx.fill();
      }

      // labels
      ctx.fillStyle = 'rgba(139,163,199,0.75)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${def.max}`, 4, 10);
      ctx.fillText(`${def.min}`, 4, h - 4);
    }
  }
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
