// ============================================================
// TruckPulse — ANALYSIS DASHBOARD
// Fleet-wide statistics, comparative analysis, fuel tracking,
// maintenance predictions, and exportable reports.
// ============================================================

import { round1, round2, fmtTime } from '../utils/math.js';

export class AnalysisDashboard {
  constructor(container, app) {
    this.el = container;
    this.app = app;
    this.visible = false;
    this.fuelHistory = {};  // per truck fuel consumption history
    this.maintPredictions = {};
    this.render();
    this.initFuelHistory();
  }

  initFuelHistory() {
    for (const t of this.app.trucks) {
      this.fuelHistory[t.id] = [];
    }
  }

  render() {
    this.el.innerHTML = `
      <div class="panel analysis-panel">
        <div class="panel-head">
          <h2 class="panel-title">📊 Fleet Analytics</h2>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="map-toggle-btn" id="analysis-toggle" title="Toggle analysis">
              <span id="analysis-toggle-icon">▶</span>
            </button>
          </div>
        </div>
        <div class="analysis-container" id="analysis-container" style="display:none;">
          <!-- Fleet Summary -->
          <div class="analysis-section">
            <div class="analysis-section-title">FLEET SUMMARY</div>
            <div class="fleet-summary-grid" id="fleet-summary-grid"></div>
          </div>

          <!-- Per-Truck Analysis Table -->
          <div class="analysis-section">
            <div class="analysis-section-title">VEHICLE COMPARISON</div>
            <div class="table-wrap">
              <table class="analysis-table" id="truck-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Health</th>
                    <th>Status</th>
                    <th>Speed</th>
                    <th>Temp</th>
                    <th>Volt</th>
                    <th>Vib</th>
                    <th>Fuel</th>
                  </tr>
                </thead>
                <tbody id="truck-table-body"></tbody>
              </table>
            </div>
          </div>

          <!-- Fuel Consumption Chart -->
          <div class="analysis-section">
            <div class="analysis-section-title">FUEL CONSUMPTION TRACKER</div>
            <div class="fuel-chart-wrap">
              <canvas id="fuel-chart" height="140"></canvas>
            </div>
            <div class="fuel-stats" id="fuel-stats"></div>
          </div>

          <!-- Maintenance Predictions -->
          <div class="analysis-section">
            <div class="analysis-section-title">MAINTENANCE PREDICTIONS</div>
            <div class="maint-grid" id="maint-grid"></div>
          </div>

          <!-- Health Distribution -->
          <div class="analysis-section">
            <div class="analysis-section-title">HEALTH DISTRIBUTION</div>
            <div class="health-dist-wrap">
              <canvas id="health-dist-chart" height="120"></canvas>
            </div>
          </div>

          <!-- Export Button -->
          <div class="analysis-section" style="text-align:center;">
            <button class="export-btn" id="export-report">
              <span>📥</span> Export Report (CSV)
            </button>
          </div>
        </div>
      </div>
    `;

    this.el.querySelector('#analysis-toggle').addEventListener('click', () => this.toggle());
    this.el.querySelector('#export-report').addEventListener('click', () => this.exportReport());
  }

  toggle() {
    this.visible = !this.visible;
    const container = this.el.querySelector('#analysis-container');
    const icon = this.el.querySelector('#analysis-toggle-icon');

    if (this.visible) {
      container.style.display = 'block';
      icon.textContent = '▼';
      this.updateAnalysis();
    } else {
      container.style.display = 'none';
      icon.textContent = '▶';
    }
  }

  updateAnalysis() {
    if (!this.visible) return;

    this.updateSummary();
    this.updateTable();
    this.updateFuelChart();
    this.updateMaintPredictions();
    this.updateHealthDistChart();
  }

  updateSummary() {
    const trucks = this.app.trucks;
    let totalHealth = 0, healthy = 0, attention = 0, critical = 0;
    let avgSpeed = 0, avgTemp = 0;

    for (const t of trucks) {
      const a = t.analysis;
      if (a) {
        totalHealth += a.healthScore;
        if (a.band === 'HEALTHY') healthy++;
        else if (a.band === 'ATTENTION') attention++;
        else critical++;
      }
      avgSpeed += t.sim.state.speed;
      avgTemp += t.sim.state.coolantTemp;
    }

    const n = trucks.length;
    const avgHealth = n ? Math.round(totalHealth / n) : 0;
    avgSpeed = n ? Math.round(avgSpeed / n) : 0;
    avgTemp = n ? round1(avgTemp / n) : 0;

    const grid = this.el.querySelector('#fleet-summary-grid');
    grid.innerHTML = `
      <div class="summary-card">
        <div class="summary-icon">🚛</div>
        <div class="summary-val">${n}</div>
        <div class="summary-label">Total Vehicles</div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">💚</div>
        <div class="summary-val" style="color:var(--ok)">${healthy}</div>
        <div class="summary-label">Healthy</div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">💛</div>
        <div class="summary-val" style="color:var(--warn)">${attention}</div>
        <div class="summary-label">Attention</div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">❤️</div>
        <div class="summary-val" style="color:var(--bad)">${critical}</div>
        <div class="summary-label">Critical</div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">📊</div>
        <div class="summary-val">${avgHealth}</div>
        <div class="summary-label">Avg Health</div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">⚡</div>
        <div class="summary-val">${avgSpeed}</div>
        <div class="summary-label">Avg Speed km/h</div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">🌡️</div>
        <div class="summary-val">${avgTemp}°</div>
        <div class="summary-label">Avg Temp</div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">⚠️</div>
        <div class="summary-val" style="color:${critical > 0 ? 'var(--bad)' : 'var(--ok)'}">${critical > 0 ? 'YES' : 'NO'}</div>
        <div class="summary-label">Risk Alert</div>
      </div>
    `;
  }

  updateTable() {
    const tbody = this.el.querySelector('#truck-table-body');
    let html = '';

    for (const t of this.app.trucks) {
      const a = t.analysis;
      const s = t.sim.state;
      const isActive = t.id === this.app.activeTruckId;
      const band = a ? a.band : 'HEALTHY';
      const bandColor = band === 'CRITICAL' ? 'var(--bad)' : band === 'ATTENTION' ? 'var(--warn)' : 'var(--ok)';

      html += `
        <tr class="${isActive ? 'row-active' : ''}">
          <td><span class="table-vehicle">${t.name}</span><span class="table-plate mono">${t.plate}</span></td>
          <td><span class="mono" style="color:${bandColor}">${a ? a.healthScore : '--'}</span></td>
          <td><span class="band-badge band-${band.toLowerCase()}">${band === 'HEALTHY' ? '🟢' : band === 'ATTENTION' ? '🟡' : '🔴'} ${band}</span></td>
          <td class="mono">${Math.round(s.speed)}</td>
          <td class="mono">${Math.round(s.coolantTemp)}°C</td>
          <td class="mono">${s.voltage.toFixed(1)}V</td>
          <td class="mono">${Math.round(s.vibration)}</td>
          <td class="mono">${Math.round(s.fuelEfficiency)}%</td>
        </tr>
      `;
    }

    tbody.innerHTML = html;
  }

  updateFuelChart() {
    // Track fuel for each truck
    for (const t of this.app.trucks) {
      const history = this.fuelHistory[t.id];
      const currentFuel = t.sim.state.fuelEfficiency;
      history.push(currentFuel);
      if (history.length > 50) history.shift();
    }

    const canvas = this.el.querySelector('#fuel-chart');
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.parentElement.clientWidth || 400;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(140 * dpr);
    canvas.style.height = '140px';

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const h = 140;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(10,18,34,0.55)';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(80,110,160,0.16)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const colors = ['#22d3ee', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];

    this.app.trucks.forEach((truck, ti) => {
      const data = this.fuelHistory[truck.id];
      if (data.length < 2) return;

      const color = colors[ti % colors.length];
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, hexToRgba(color, 0.2));
      grad.addColorStop(1, hexToRgba(color, 0.01));

      ctx.beginPath();
      ctx.moveTo(0, h);
      data.forEach((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - (v / 100) * h;
        ctx.lineTo(x, y);
      });
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      data.forEach((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - (v / 100) * h;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = color;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(truck.name, 10, 14 + ti * 14);
    });

    // Update stats
    let html = '';
    for (const t of this.app.trucks) {
      const fuel = Math.round(t.sim.state.fuelEfficiency);
      const color = fuel < 50 ? 'var(--bad)' : fuel < 70 ? 'var(--warn)' : 'var(--ok)';
      html += `<div class="fuel-stat-item">
        <span class="fuel-stat-name">${t.name}</span>
        <span class="fuel-stat-val mono" style="color:${color}">${fuel}%</span>
      </div>`;
    }
    this.el.querySelector('#fuel-stats').innerHTML = html;
  }

  updateMaintPredictions() {
    const grid = this.el.querySelector('#maint-grid');
    let html = '';

    for (const t of this.app.trucks) {
      const a = t.analysis;
      const s = t.sim.state;
      if (!a) continue;

      // Simple prediction logic based on current state
      let daysUntilMaint = 30;
      let urgency = 'LOW';
      let color = 'var(--ok)';

      if (a.band === 'CRITICAL') {
        daysUntilMaint = 0;
        urgency = 'IMMEDIATE';
        color = 'var(--bad)';
      } else if (a.band === 'ATTENTION') {
        daysUntilMaint = 3 + Math.round(Math.random() * 7);
        urgency = 'SOON';
        color = 'var(--warn)';
      } else {
        // Estimate based on trends
        if (a.trends && a.trends.tempRising && a.trends.tempRising.active) daysUntilMaint -= 5;
        if (a.trends && a.trends.vibrationRising && a.trends.vibrationRising.active) daysUntilMaint -= 7;
        if (a.trends && a.trends.voltageFalling && a.trends.voltageFalling.active) daysUntilMaint -= 4;
        daysUntilMaint = Math.max(1, daysUntilMaint);
        if (daysUntilMaint < 10) { urgency = 'MODERATE'; color = 'var(--warn)'; }
      }

      html += `
        <div class="maint-card" style="border-left-color:${color}">
          <div class="maint-vehicle">${t.name}</div>
          <div class="maint-prediction">
            <span class="maint-days mono" style="color:${color}">${daysUntilMaint === 0 ? 'NOW' : daysUntilMaint + 'd'}</span>
            <span class="maint-urgency" style="color:${color}">${urgency}</span>
          </div>
        </div>
      `;
    }

    grid.innerHTML = html;
  }

  updateHealthDistChart() {
    const canvas = this.el.querySelector('#health-dist-chart');
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.parentElement.clientWidth || 400;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(120 * dpr);
    canvas.style.height = '120px';

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const h = 120;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(10,18,34,0.55)';
    ctx.fillRect(0, 0, w, h);

    const barWidth = Math.min(60, (w - 60) / this.app.trucks.length - 12);
    const startX = (w - (barWidth + 12) * this.app.trucks.length) / 2;

    this.app.trucks.forEach((truck, i) => {
      const a = truck.analysis;
      const health = a ? a.healthScore : 0;
      const band = a ? a.band : 'HEALTHY';
      const color = band === 'CRITICAL' ? '#f87171' : band === 'ATTENTION' ? '#fbbf24' : '#34d399';
      const x = startX + i * (barWidth + 12);
      const barH = (health / 100) * (h - 30);

      // Bar
      const grad = ctx.createLinearGradient(x, h - 20 - barH, x, h - 20);
      grad.addColorStop(0, hexToRgba(color, 0.9));
      grad.addColorStop(1, hexToRgba(color, 0.3));
      ctx.fillStyle = grad;

      // Rounded bar
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(x + radius, h - 20 - barH);
      ctx.lineTo(x + barWidth - radius, h - 20 - barH);
      ctx.quadraticCurveTo(x + barWidth, h - 20 - barH, x + barWidth, h - 20 - barH + radius);
      ctx.lineTo(x + barWidth, h - 20);
      ctx.lineTo(x, h - 20);
      ctx.lineTo(x, h - 20 - barH + radius);
      ctx.quadraticCurveTo(x, h - 20 - barH, x + radius, h - 20 - barH);
      ctx.fill();

      // Health value
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(health, x + barWidth / 2, h - 20 - barH - 6);

      // Truck name
      ctx.fillStyle = 'rgba(139,163,199,0.75)';
      ctx.font = '9px "Space Grotesk", sans-serif';
      ctx.fillText(truck.name, x + barWidth / 2, h - 6);
    });
  }

  exportReport() {
    const rows = [['Vehicle', 'Plate', 'Health', 'Status', 'Risk', 'Speed', 'Temp', 'Voltage', 'Vibration', 'Engine Load', 'Fuel Eff', 'Scenario', 'Time']];

    for (const t of this.app.trucks) {
      const a = t.analysis;
      const s = t.sim.state;
      rows.push([
        t.name, t.plate,
        a ? a.healthScore : '', a ? a.band : '', a ? a.riskLevel : '',
        Math.round(s.speed), round1(s.coolantTemp), round2(s.voltage),
        Math.round(s.vibration), Math.round(s.engineLoad),
        Math.round(s.fuelEfficiency), t.sim.scenarioKey,
        fmtTime(),
      ]);
    }

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `truckpulse-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    // Show toast
    if (this.app.toasts) {
      this.app.toasts.showInfo('Report exported successfully', '📥');
    }
  }
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
