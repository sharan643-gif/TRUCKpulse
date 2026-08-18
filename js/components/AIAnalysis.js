// ============================================================
// TruckPulse — AI VEHICLE ANALYSIS
// Premium AI engine visual: glowing core, rotating rings and
// drifting data particles, plus live verdict, detected
// patterns and recommended actions.
// ============================================================

import { clamp } from '../utils/math.js';

export class AIAnalysis {
  constructor(container, app) {
    this.el = container;
    this.app = app;
    this.particles = [];
    this.angle = 0;
    this.analyzing = false;
    this.render();
    this.initCoreCanvas();
  }

  render() {
    this.el.innerHTML = `
      <div class="panel ai-panel">
        <div class="panel-head">
          <h2 class="panel-title">🧠 AI Vehicle Analysis</h2>
          <span class="ai-state-chip"><span class="ai-state-dot"></span>AI ENGINE ACTIVE</span>
        </div>

        <div class="ai-body">
          <div class="ai-core-wrap">
            <canvas class="ai-core" id="ai-core-canvas" width="170" height="170"></canvas>
            <div class="ai-core-center">
              <div class="ai-core-icon">🧠</div>
              <div class="ai-core-health mono" id="ai-core-health">--</div>
            </div>
          </div>
          <div class="ai-verdict" id="ai-verdict">Initializing AI engine…</div>
        </div>

        <div class="ai-section">
          <div class="ai-section-title">DETECTED PATTERNS</div>
          <div class="ai-patterns" id="ai-patterns">
            <div class="ai-empty">No abnormal patterns detected</div>
          </div>
        </div>

        <div class="ai-section">
          <div class="ai-section-title">RECOMMENDED ACTION</div>
          <div class="ai-actions" id="ai-actions"></div>
        </div>
      </div>
    `;

    this.coreCanvas = this.el.querySelector('#ai-core-canvas');
    this.coreHealth = this.el.querySelector('#ai-core-health');
    this.verdictEl = this.el.querySelector('#ai-verdict');
    this.patternsEl = this.el.querySelector('#ai-patterns');
    this.actionsEl = this.el.querySelector('#ai-actions');
  }

  initCoreCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.coreCanvas.width = 170 * dpr;
    this.coreCanvas.height = 170 * dpr;
    this.coreCanvas._dpr = dpr;
    for (let i = 0; i < 26; i++) {
      this.particles.push({
        a: Math.random() * Math.PI * 2,
        r: 30 + Math.random() * 60,
        speed: 0.15 + Math.random() * 0.4,
        size: 0.6 + Math.random() * 1.6,
      });
    }
  }

  drawCore(now, band) {
    const ctx = this.coreCanvas.getContext('2d');
    const dpr = this.coreCanvas._dpr || 1;
    const W = 170, H = 170;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;

    const color = band === 'critical' ? '#f87171' : band === 'attention' ? '#fbbf24' : '#22d3ee';
    this.angle += 0.006;

    // outer glow
    const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, 80);
    glow.addColorStop(0, hexA(color, 0.28));
    glow.addColorStop(1, hexA(color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.fill();

    // rotating rings
    for (let i = 0; i < 2; i++) {
      ctx.strokeStyle = hexA(color, 0.35 - i * 0.12);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 58 - i * 14, 58 - i * 14, this.angle * (i % 2 === 0 ? 1 : -0.7) + i * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      // arc segment
      ctx.strokeStyle = hexA(color, 0.8);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 58 - i * 14, 58 - i * 14, this.angle * (i % 2 === 0 ? 1 : -0.7) + i * 0.6, -0.6, 0.5);
      ctx.stroke();
    }

    // core
    const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22);
    coreGrad.addColorStop(0, '#eaffff');
    coreGrad.addColorStop(0.35, color);
    coreGrad.addColorStop(1, hexA(color, 0.1));
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 22 + Math.sin(now / 600) * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // particles
    ctx.fillStyle = hexA(color, 0.7);
    for (const p of this.particles) {
      p.a += p.speed * 0.016;
      const x = cx + Math.cos(p.a) * p.r;
      const y = cy + Math.sin(p.a) * p.r * 0.8;
      ctx.globalAlpha = 0.35 + 0.5 * Math.sin(now / 400 + p.a * 3);
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  update(vehicle, now) {
    const a = vehicle.analysis;
    const band = a ? a.band : 'HEALTHY';
    this.drawCore(now, band);

    if (!a) {
      this.coreHealth.textContent = '--';
      return;
    }
    this.coreHealth.textContent = a.healthScore;

    // verdict
    const summary = a.summary || [];
    const verdict = summary.length ? summary.join(' ') : 'Normal vehicle behaviour';
    if (this.verdictEl.textContent !== verdict) {
      this.verdictEl.innerHTML = '';
      this.verdictEl.textContent = verdict;
    }

    // patterns
    let pHtml;
    if (a.detectedPatterns.length === 0) {
      pHtml = '<div class="ai-empty">✓ No abnormal patterns detected</div>';
    } else {
      pHtml = a.detectedPatterns.map((p) => `
        <div class="ai-pattern sev-${(p.severity || 'medium').toLowerCase()}">
          <span class="ai-pattern-icon">${p.severity === 'HIGH' ? '🔴' : '⚠'}</span>
          <span>${p.label}</span>
        </div>`).join('');
    }
    if (this.patternsEl.innerHTML !== pHtml) this.patternsEl.innerHTML = pHtml;

    // actions
    const aHtml = (a.recommendations || []).map((r, i) => `
      <div class="ai-action">${i === 0 ? '→' : '·'} ${r}</div>`).join('');
    if (this.actionsEl.innerHTML !== aHtml) this.actionsEl.innerHTML = aHtml;
  }
}

function hexA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
