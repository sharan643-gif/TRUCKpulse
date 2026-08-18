// ============================================================
// TruckPulse — APPLICATION ENTRY
// Owns ONE requestAnimationFrame simulation loop. Each frame:
//   1. advance every vehicle simulation (scaled by speed)
//   2. run the AI health engine on the active vehicle
//   3. update all UI components from that single state
// ============================================================

import { FLEET, PLACEHOLDER_REG_NUMBER, SCENARIOS } from './config.js';
import { VehicleSimulation, tickMsAtSpeed } from './simulation/vehicleSimulation.js';
import { analyzeVehicleHealth } from './simulation/healthEngine.js';
import { AIService } from './services/aiService.js';
import { AlertService } from './services/alertService.js';
import { AudioService } from './services/audioService.js';
import { fmtTime } from './utils/math.js';

import { SimulationControls } from './components/SimulationControls.js';
import { FleetPanel } from './components/FleetPanel.js';
import { HealthScore } from './components/HealthScore.js';
import { VehicleVisualization } from './components/VehicleVisualization.js';
import { TelemetryPanel } from './components/TelemetryPanel.js';
import { HealthChart } from './components/HealthChart.js';
import { AIAnalysis } from './components/AIAnalysis.js';
import { EventTimeline } from './components/EventTimeline.js';
import { AlertCenter } from './components/AlertCenter.js';
import { WhatsAppPreview } from './components/WhatsAppPreview.js';
import { Toasts } from './components/Toasts.js';
import { FleetMap } from './components/FleetMap.js';
import { AnalysisDashboard } from './components/AnalysisDashboard.js';

class App {
  constructor() {
    // Auth check
    this.session = null;
    this.checkAuth();

    this.running = false;
    this.speed = 1;
    this.activeTruckId = FLEET[0].id;

    // services
    this.alertService = new AlertService();
    this.audioService = new AudioService();
    this.ai = new AIService(this.alertService, this.audioService);

    // vehicles — each is a full independent simulation
    this.trucks = FLEET.map((t, i) => ({
      id: t.id,
      name: t.name,
      plate: t.plate,
      route: t.route || '',
      sim: new VehicleSimulation(t.scenario, { seedJitter: true }),
      analysis: null,
      recovered: false,
    }));

    this.pendingSwitch = null;
    this.pendingMaintenance = false;
  }

  get activeVehicle() {
    return this.trucks.find((t) => t.id === this.activeTruckId);
  }

  get activeScenario() {
    const v = this.activeVehicle;
    return v ? v.sim.scenarioKey : 'NORMAL';
  }

  // ================= SIMULATION CONTROL =====================
  toggleRun() {
    this.running = !this.running;
    if (this.running) {
      this.ai.addTimelineEvent('Simulation started — live telemetry streaming', '▶', 'info');
      this.toasts.showInfo('Simulation started — live telemetry streaming', '▶');
    } else {
      this.ai.addTimelineEvent('Simulation paused', '⏸', 'info');
      this.toasts.showInfo('Simulation paused', '⏸');
    }
    this.controls.sync(this);
  }

  setSpeed(s) {
    this.speed = s;
    this.toasts.showInfo(`Simulation speed set to ${s}x`, '⚡');
    this.controls.sync(this);
  }

  selectScenario(key) {
    const v = this.activeVehicle;
    if (!v) return;
    if (v.sim.scenarioKey === key && key !== 'RECOVERY') return;
    v.sim.setScenario(key);
    if (key !== 'RECOVERY') v.recovered = false;
    this.showTransition(`Switching simulation scenario… <b>${SCENARIOS[key].label}</b>`);
    this.ai.addTimelineEvent(`Scenario switched to ${SCENARIOS[key].label}`, '🎛', 'info');
    this.controls.sync(this);
  }

  resetSimulation() {
    const v = this.activeVehicle;
    if (!v) return;
    v.sim.reset('NORMAL');
    v.recovered = false;
    this.alertService.clear();
    this.ai.resetTimeline();
    this.ai.addTimelineEvent('Simulation reset — vehicle restored to normal', '↻', 'info');
    this.toasts.showInfo('Simulation reset — vehicle restored to normal', '↻');
    this.controls.sync(this);
  }

  simulateMaintenance() {
    const v = this.activeVehicle;
    if (!v) return;
    v.sim.setScenario('RECOVERY');
    v.recovered = false;
    this.pendingMaintenance = true;
    this.toasts.showInfo('🔧 Maintenance simulated — vehicle recovering', '🔧');
    this.controls.sync(this);
  }

  selectTruck(id) {
    if (id === this.activeTruckId) return;
    this.activeTruckId = id;
    this.ai.vehicleSwitched();
    this.pendingSwitch = this.activeVehicle;
    this.controls.sync(this);
  }

  // ================= ALERT BANNER / TOASTS ===================
  showTransition(html) {
    const el = document.getElementById('transition-toast');
    el.innerHTML = html;
    el.classList.remove('hidden');
    el.classList.add('show');
    clearTimeout(this._transitionTimer);
    this._transitionTimer = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.classList.add('hidden'), 500);
    }, 1600);
  }

  renderBanner(alert) {
    const banner = document.getElementById('alert-banner');
    if (!alert) {
      banner.classList.add('hidden');
      banner.innerHTML = '';
      return;
    }
    const critical = alert.level === 'critical';
    banner.className = `alert-banner ${critical ? 'critical' : 'warning'}`;
    banner.innerHTML = `
      <div class="banner-icon">${critical ? '🔴' : '⚠'}</div>
      <div class="banner-main">
        <div class="banner-title">${critical ? 'CRITICAL VEHICLE ALERT' : 'VEHICLE HEALTH WARNING'}</div>
        <div class="banner-msg">${alert.message}</div>
      </div>
      <div class="banner-meta">
        <span>Health <b class="mono">${alert.health}/100</b></span>
        <span>Risk <b>${alert.risk}</b></span>
        <span class="banner-reco">→ ${alert.recommendation}</span>
      </div>
      <button class="banner-x" id="banner-x">✕</button>
    `;
    banner.querySelector('#banner-x').addEventListener('click', () => {
      this.alertService.active = null;
      this.renderBanner(null);
    });
  }

  // ================= BOOT =====================================
  checkAuth() {
    const gate = document.getElementById('auth-gate');
    try {
      const raw = sessionStorage.getItem('truckpulse_session');
      if (!raw) throw new Error('no session');
      const s = JSON.parse(raw);
      if (!s.expiresAt || s.expiresAt < Date.now()) {
        sessionStorage.removeItem('truckpulse_session');
        throw new Error('expired');
      }
      this.session = s;
      if (gate) gate.classList.add('hidden');
      // Update UI with user info
      setTimeout(() => {
        const nameEl = document.getElementById('user-name');
        const roleEl = document.getElementById('user-role');
        if (nameEl) nameEl.textContent = s.name || s.username;
        if (roleEl) roleEl.textContent = s.role;
      }, 50);
    } catch {
      // No valid session — show demo mode
      if (gate) {
        gate.classList.remove('hidden');
        gate.style.display = 'flex';
      }
      setTimeout(() => {
        if (gate) {
          gate.innerHTML = `
            <div class="auth-gate-card">
              <div class="auth-gate-icon">👋</div>
              <div class="auth-gate-title">Demo Mode</div>
              <div class="auth-gate-msg">Running in demo mode. Some features may be limited.</div>
              <a href="login.html" class="auth-gate-btn">Login for Full Access</a>
              <button class="auth-gate-btn" style="margin-top:8px;background:rgba(24,40,70,0.6);border-color:var(--border);color:var(--muted);" onclick="this.closest('.auth-gate').style.display='none'">Continue as Guest</button>
              <a href="home.html" style="display:block;margin-top:12px;font-size:11px;color:var(--faint);text-decoration:none;letter-spacing:0.5px;">← Back to Home</a>
            </div>
          `;
          gate.classList.remove('hidden');
        }
      }, 2000);
    }
  }

  mount() {
    // containers
    const $ = (id) => document.getElementById(id);

    try { this.controls = new SimulationControls($('sim-controls'), this); } catch(e) { console.error('Failed to init SimulationControls:', e); }
    try { this.fleet = new FleetPanel($('fleet-panel'), this); } catch(e) { console.error('Failed to init FleetPanel:', e); }
    try { this.healthScore = new HealthScore($('health-score'), this); } catch(e) { console.error('Failed to init HealthScore:', e); }
    try { this.vehicleVis = new VehicleVisualization($('vehicle-visual'), this); } catch(e) { console.error('Failed to init VehicleVisualization:', e); }
    try { this.telemetry = new TelemetryPanel($('telemetry'), this); } catch(e) { console.error('Failed to init TelemetryPanel:', e); }
    try { this.charts = new HealthChart($('charts'), this); } catch(e) { console.error('Failed to init HealthChart:', e); }
    try { this.aiPanel = new AIAnalysis($('ai-analysis'), this); } catch(e) { console.error('Failed to init AIAnalysis:', e); }
    try { this.timeline = new EventTimeline($('event-timeline'), this); } catch(e) { console.error('Failed to init EventTimeline:', e); }
    try { this.alertCenter = new AlertCenter($('alert-center'), this); } catch(e) { console.error('Failed to init AlertCenter:', e); }
    try { this.whatsapp = new WhatsAppPreview($('whatsapp-preview'), this); } catch(e) { console.error('Failed to init WhatsAppPreview:', e); }
    try { this.toasts = new Toasts($('toast-stack')); } catch(e) { console.error('Failed to init Toasts:', e); }
    try { this.fleetMap = new FleetMap($('fleet-map-section'), this); } catch(e) { console.error('Failed to init FleetMap:', e); }
    try { this.analysisDash = new AnalysisDashboard($('analysis-dashboard'), this); } catch(e) { console.error('Failed to init AnalysisDashboard:', e); }

    // service -> UI hooks
    this.alertService.hooks.onBanner = (a) => this.renderBanner(a);
    this.alertService.hooks.onToast = (a) => this.toasts.show(a);
    this.alertService.hooks.onSound = (level) => this.audioService.play(level);
    this.alertService.hooks.onWhatsApp = () => { /* whatsapp panel reads active alert live */ };

    // sound toggle
    const soundBtn = $('sound-toggle');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        this.audioService.setEnabled(!this.audioService.enabled);
        soundBtn.classList.toggle('on', this.audioService.enabled);
        this.toasts.showInfo(
          this.audioService.enabled ? 'Alert sound enabled' : 'Alert sound muted',
          this.audioService.enabled ? '🔊' : '🔇',
        );
      });
    }

    // logout button
    const logoutBtn = $('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('truckpulse_session');
        this.toasts.showInfo('Logged out successfully', '👋');
        setTimeout(() => { window.location.href = 'home.html'; }, 800);
      });
    }

    // initial analysis so the UI is populated before START
    try { this.runAnalysis(); } catch(e) { console.error('Failed to run initial analysis:', e); }

    // single simulation loop
    this.lastFrame = performance.now();
    this.simAccum = 0;
    this.frameId = requestAnimationFrame((t) => this.frame(t));
    this.clockTimer = setInterval(() => {
      const c = document.getElementById('clock');
      const f = document.getElementById('footer-clock');
      const t = fmtTime();
      if (c) c.textContent = t;
      if (f) f.textContent = t;
    }, 1000);

    // responsive chart sizing
    window.addEventListener('resize', () => {
      if (this.charts && this.charts.canvases) {
        Object.values(this.charts.canvases).forEach((c) => this.charts.sizeCanvas(c));
      }
    });
    window.addEventListener('beforeunload', () => this.destroy());
    document.addEventListener('visibilitychange', () => {
      this.lastFrame = performance.now();
    });
  }

  destroy() {
    cancelAnimationFrame(this.frameId);
    clearInterval(this.clockTimer);
  }

  // ================= THE ONE LOOP ============================
  frame(now) {
    this.frameId = requestAnimationFrame((t) => this.frame(t));

    const realDt = Math.min(now - this.lastFrame, 250);
    this.lastFrame = now;

    // advance the simulation (speed-scaled)
    if (this.running) {
      this.simAccum += realDt * this.speed;
      while (this.simAccum >= tickMsAtSpeed(1)) {
        for (const t of this.trucks) t.sim.tick(250);
        this.simAccum -= 250;
      }
    }

    this.runAnalysis();
    this.renderAll(now);
  }

  runAnalysis() {
    const active = this.activeVehicle;
    // active vehicle through the AI service (events + alerts)
    const snapshot = active.sim.snapshot();
    active.analysis = this.ai.analyze(snapshot, {
      vehicleName: active.name,
      plate: active.plate,
    });

    if (this.pendingSwitch) {
      this.ai.addTimelineEvent(`Switched to ${this.pendingSwitch.name} — telemetry loaded`, '🔀', 'info');
      this.pendingSwitch = null;
    }

    // recovery completion detection
    if (
      this.pendingMaintenance &&
      active.analysis.band === 'HEALTHY' &&
      active.sim.scenarioKey === 'RECOVERY'
    ) {
      active.recovered = true;
      this.pendingMaintenance = false;
      this.ai.addTimelineEvent('Maintenance complete — vehicle recovered', '✅', 'info');
      this.toasts.showInfo('Vehicle recovered — operating normally', '✅');
    }
    if (active.sim.scenarioKey === 'RECOVERY' && active.analysis.band === 'HEALTHY') {
      active.recovered = true;
    }

    // fleet vehicles: plain health analysis (no events)
    for (const t of this.trucks) {
      if (t.id === active.id) continue;
      t.analysis = analyzeVehicleHealth(t.sim.snapshot());
    }
  }

  renderAll(now) {
    const v = this.activeVehicle;
    try { this.healthScore.update(v); } catch(e) {}
    try { this.vehicleVis.update(v); } catch(e) {}
    try { this.telemetry.update(v); } catch(e) {}
    try { this.charts.update(v); } catch(e) {}
    try { this.aiPanel.update(v, now); } catch(e) {}
    try { this.timeline.update(); } catch(e) {}
    try { this.alertCenter.update(); } catch(e) {}
    try { this.fleet.update(); } catch(e) {}
    try { this.whatsapp.update(v); } catch(e) {}
    try { this.controls.sync(this); } catch(e) {}

    // Map and analysis updates (throttled)
    if (!this._mapFrame || now - this._mapFrame > 500) {
      try { this.fleetMap.update(); } catch(e) {}
      try { this.analysisDash.updateAnalysis(); } catch(e) {}
      this._mapFrame = now;
    }

    // header vehicle status chip
    const chip = document.getElementById('vehicle-status-chip');
    const running = this.running;
    const band = v.analysis ? v.analysis.band : 'HEALTHY';
    if (chip) {
      chip.innerHTML = `
        <span class="hdr-status">
          <span class="hdr-dot ${running ? 'pulse' : ''}"></span>
          <span class="hdr-text">${running ? 'SIMULATION ACTIVE' : 'PAUSED'}</span>
        </span>
        <span class="hdr-band band-${band.toLowerCase()}">${band === 'HEALTHY' ? '🟢' : band === 'ATTENTION' ? '🟡' : '🔴'} ${band}</span>
      `;
    }
  }
}

// ---- boot ----------------------------------------------------
const app = new App();
window.truckPulseApp = app; // exposed for console inspection during demos
app.mount();
