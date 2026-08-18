// ============================================================
// TruckPulse — SIMULATION CONTROL CENTER
// Start / Pause / Reset · Scenario selector · Speed (1x/2x/5x/10x)
// · SIMULATE MAINTENANCE
// ============================================================

import { SCENARIOS } from '../config.js';

export class SimulationControls {
  constructor(container, app) {
    this.el = container;
    this.app = app;
    this.render();
  }

  render() {
    const el = this.el;
    el.innerHTML = `
      <div class="panel sim-controls">
        <div class="panel-head">
          <h2 class="panel-title">🎛 Simulation Control</h2>
          <span class="live-chip" id="sim-state-chip">IDLE</span>
        </div>

        <div class="btn-row transport">
          <button class="btn btn-start" id="btn-start">
            <span class="btn-icon">▶</span><span class="btn-label">START SIMULATION</span>
          </button>
          <button class="btn btn-reset" id="btn-reset" title="Reset to normal">
            <span class="btn-icon">↻</span><span class="btn-label">RESET</span>
          </button>
        </div>

        <div class="ctrl-group">
          <div class="ctrl-label">SCENARIO</div>
          <div class="scenario-grid" id="scenario-grid"></div>
        </div>

        <div class="ctrl-group">
          <div class="ctrl-label">SIMULATION SPEED</div>
          <div class="segmented" id="speed-seg">
            ${[1, 2, 5, 10].map((s) => `<button class="seg-btn" data-speed="${s}">${s}x</button>`).join('')}
          </div>
        </div>

        <button class="btn btn-maintenance" id="btn-maintenance">
          <span class="btn-icon">🔧</span><span class="btn-label">SIMULATE MAINTENANCE</span>
        </button>
        <div class="maintenance-hint" id="maint-hint">Performs service on the active vehicle and gradually restores it to normal.</div>
      </div>
    `;

    // ---- scenario buttons ----
    const grid = el.querySelector('#scenario-grid');
    const order = ['NORMAL', 'OVERHEATING', 'LOW_VOLTAGE', 'HIGH_VIBRATION', 'ENGINE_INSTABILITY', 'CRITICAL_FAILURE', 'RECOVERY'];
    this.scenarioBtns = {};
    for (const key of order) {
      const sc = SCENARIOS[key];
      const b = document.createElement('button');
      b.className = 'scenario-btn';
      b.dataset.scenario = key;
      b.innerHTML = `<span class="scn-dot"></span>${sc.label}`;
      b.addEventListener('click', () => this.app.selectScenario(key));
      grid.appendChild(b);
      this.scenarioBtns[key] = b;
    }

    // ---- transport ----
    el.querySelector('#btn-start').addEventListener('click', () => this.app.toggleRun());
    el.querySelector('#btn-reset').addEventListener('click', () => this.app.resetSimulation());

    // ---- speed ----
    this.speedBtns = [...el.querySelectorAll('.seg-btn')];
    el.querySelector('#speed-seg').addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (btn) this.app.setSpeed(Number(btn.dataset.speed));
    });

    // ---- maintenance ----
    el.querySelector('#btn-maintenance').addEventListener('click', () => this.app.simulateMaintenance());

    this.sync(this.app);
  }

  /** Reflect app state (called on change and every frame-ish tick) */
  sync(app) {
    const chip = this.el.querySelector('#sim-state-chip');
    if (app.running) {
      chip.textContent = '● RUNNING';
      chip.className = 'live-chip running';
    } else {
      chip.textContent = '⏸ PAUSED';
      chip.className = 'live-chip paused';
    }

    const startBtn = this.el.querySelector('#btn-start');
    startBtn.querySelector('.btn-icon').textContent = app.running ? '⏸' : '▶';
    startBtn.querySelector('.btn-label').textContent = app.running ? 'PAUSE' : 'START SIMULATION';
    startBtn.classList.toggle('is-paused', app.running);

    for (const key of Object.keys(this.scenarioBtns)) {
      this.scenarioBtns[key].classList.toggle('active', app.activeScenario === key);
    }

    this.speedBtns.forEach((b) => b.classList.toggle('active', Number(b.dataset.speed) === app.speed));

    const maint = this.el.querySelector('#btn-maintenance');
    const needMaint = app.activeVehicle && app.activeVehicle.analysis && app.activeVehicle.analysis.band !== 'HEALTHY';
    maint.classList.toggle('pulse', !!needMaint);
    const hint = this.el.querySelector('#maint-hint');
    hint.textContent = needMaint
      ? '⚠ Active vehicle needs attention — run maintenance to restore it.'
      : 'Performs service on the active vehicle and gradually restores it to normal.';
  }
}
