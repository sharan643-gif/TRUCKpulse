// ============================================================
// TruckPulse — VEHICLE VISUALIZATION
// SVG truck with animated data-flow connection lines from
// live mini-gauges. The vehicle body subtly glows by status.
// ============================================================

import { vibrationLevel } from '../config.js';
import { easeToward } from '../utils/math.js';

export class VehicleVisualization {
  constructor(container, app) {
    this.el = container;
    this.app = app;
    this.disp = { rpm: 2200, temp: 89, voltage: 13.8, vib: 12 };
    this.render();
  }

  render() {
    this.el.innerHTML = `
      <div class="panel vehicle-panel">
        <div class="panel-head">
          <h2 class="panel-title">🚛 Vehicle</h2>
          <div class="status-pulse" id="veh-status">
            <span class="pulse-dot"></span><span id="veh-status-text">SIMULATION IDLE</span>
          </div>
        </div>

        <div class="vehicle-stage">
          <div class="gauge g-rpm"><span class="gauge-label">RPM</span><span class="gauge-val mono" id="g-rpm-val">--</span></div>
          <div class="gauge g-temp"><span class="gauge-label">TEMP</span><span class="gauge-val mono" id="g-temp-val">--</span></div>
          <div class="gauge g-volt"><span class="gauge-label">VOLT</span><span class="gauge-val mono" id="g-volt-val">--</span></div>
          <div class="gauge g-vib"><span class="gauge-label">VIB</span><span class="gauge-val mono" id="g-vib-val">--</span></div>

          <svg class="truck-svg" viewBox="0 0 520 240" role="img" aria-label="Simulated truck">
            <defs>
              <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#1d2c47"/>
                <stop offset="100%" stop-color="#0e1830"/>
              </linearGradient>
              <linearGradient id="trailGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#23355a"/>
                <stop offset="100%" stop-color="#111f3d"/>
              </linearGradient>
              <radialGradient id="underglow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.5"/>
                <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
              </radialGradient>
            </defs>

            <!-- road -->
            <rect class="road" x="0" y="196" width="520" height="26" rx="4" fill="#0b1526"/>
            <line class="road-line" x1="0" y1="209" x2="520" y2="209" stroke="#1d3a5f" stroke-width="2" stroke-dasharray="18 14"/>

            <!-- glow -->
            <ellipse class="veh-glow" id="veh-glow" cx="260" cy="180" rx="240" ry="30" fill="url(#underglow)"/>

            <!-- trailer -->
            <rect x="252" y="52" width="248" height="132" rx="8" fill="url(#trailGrad)" stroke="#2c4270" stroke-width="2"/>
            <rect x="252" y="52" width="248" height="132" rx="8" fill="none" stroke="url(#underglow)" stroke-width="0"/>
            <g class="trailer-lines" stroke="#2c4270" stroke-width="2">
              <line x1="300" y1="52" x2="300" y2="184"/>
              <line x1="348" y1="52" x2="348" y2="184"/>
              <line x1="396" y1="52" x2="396" y2="184"/>
              <line x1="444" y1="52" x2="444" y2="184"/>
              <line x1="252" y1="118" x2="500" y2="118"/>
            </g>
            <rect x="446" y="152" width="38" height="20" rx="4" fill="#1d3a5f" stroke="#33507f"/>

            <!-- cab -->
            <path d="M120 150 L120 96 Q120 88 128 88 L200 88 Q212 88 218 98 L236 128 Q240 136 240 150 Z"
                  fill="url(#bodyGrad)" stroke="#2c4270" stroke-width="2"/>
            <path class="cab-window" d="M140 100 Q138 92 150 92 L196 92 Q206 92 210 102 L214 122 L150 122 Z"
                  fill="#0d1830" stroke="#33507f" stroke-width="1.5"/>
            <rect x="126" y="150" width="110" height="8" rx="3" fill="#22345a"/>

            <!-- chassis -->
            <rect x="120" y="166" width="380" height="10" rx="4" fill="#1a2b4e"/>
            <!-- front bumper / grille -->
            <rect x="112" y="140" width="12" height="20" rx="3" fill="#24375f"/>

            <!-- wheels -->
            <g class="wheels">
              <circle class="wheel" cx="176" cy="196" r="17" fill="#0a1222" stroke="#33507f" stroke-width="3"/>
              <circle class="wheel-cap" cx="176" cy="196" r="6" fill="#2c4270"/>
              <circle class="wheel" cx="296" cy="196" r="17" fill="#0a1222" stroke="#33507f" stroke-width="3"/>
              <circle class="wheel-cap" cx="296" cy="196" r="6" fill="#2c4270"/>
              <circle class="wheel" cx="348" cy="196" r="17" fill="#0a1222" stroke="#33507f" stroke-width="3"/>
              <circle class="wheel-cap" cx="348" cy="196" r="6" fill="#2c4270"/>
              <circle class="wheel" cx="434" cy="196" r="17" fill="#0a1222" stroke="#33507f" stroke-width="3"/>
              <circle class="wheel-cap" cx="434" cy="196" r="6" fill="#2c4270"/>
            </g>

            <!-- headlight -->
            <rect x="114" y="128" width="8" height="7" rx="2" class="headlight" fill="#fde68a"/>

            <!-- data pulse from engine -->
            <circle class="data-pulse" cx="180" cy="110" r="3" fill="#22d3ee"/>
            <circle class="data-pulse p2" cx="214" cy="120" r="2.5" fill="#34d399"/>
          </svg>

          <!-- animated connection lines -->
          <svg class="conn-svg" viewBox="0 0 520 240" preserveAspectRatio="none" aria-hidden="true">
            <path class="conn-line" data-conn="rpm"   d="M30 58 C 130 60, 170 90, 190 108" />
            <path class="conn-line" data-conn="temp"  d="M30 140 C 120 130, 160 140, 175 146" />
            <path class="conn-line" data-conn="volt"  d="M490 52 C 400 70, 320 96, 268 120" />
            <path class="conn-line" data-conn="vib"   d="M492 156 C 420 140, 330 150, 262 152" />
          </svg>
        </div>

        <div class="vehicle-footer">
          <span class="veh-tag mono" id="veh-scenario">SCENARIO: NORMAL</span>
          <span class="veh-tag" id="veh-state-text">Vehicle ready</span>
        </div>
      </div>
    `;

    this.vehStatus = this.el.querySelector('#veh-status');
    this.vehStatusText = this.el.querySelector('#veh-status-text');
    this.vehGlow = this.el.querySelector('#veh-glow');
    this.vehScenario = this.el.querySelector('#veh-scenario');
    this.vehStateText = this.el.querySelector('#veh-state-text');
    this.gaugeEls = {
      rpm: this.el.querySelector('#g-rpm-val'),
      temp: this.el.querySelector('#g-temp-val'),
      volt: this.el.querySelector('#g-volt-val'),
      vib: this.el.querySelector('#g-vib-val'),
    };
  }

  update(vehicle) {
    const s = vehicle.sim.state;
    const a = vehicle.analysis;

    // smooth gauge display
    this.disp.rpm = easeToward(this.disp.rpm, s.rpm, 0.25);
    this.disp.temp = easeToward(this.disp.temp, s.coolantTemp, 0.22);
    this.disp.voltage = easeToward(this.disp.voltage, s.voltage, 0.25);
    this.disp.vib = easeToward(this.disp.vib, s.vibration, 0.25);

    this.gaugeEls.rpm.textContent = Math.round(this.disp.rpm);
    this.gaugeEls.temp.textContent = `${Math.round(this.disp.temp)}°`;
    this.gaugeEls.volt.textContent = this.disp.voltage.toFixed(1);
    this.gaugeEls.vib.textContent = `${Math.round(this.disp.vib)} · ${vibrationLevel(s.vibration)}`;

    // status pulse
    if (a) {
      const band = a.band.toLowerCase();
      this.vehStatus.className = `status-pulse band-${band}`;
      this.vehStatusText.textContent = this.app.running ? 'SIMULATION ACTIVE' : 'PAUSED';
      this.vehGlow.style.opacity = band === 'critical' ? '1' : band === 'attention' ? '0.7' : '0.45';
      const color = band === 'critical' ? '#f87171' : band === 'attention' ? '#fbbf24' : '#22d3ee';
      this.vehGlow.querySelector('stop') && this.vehGlow.setAttribute('fill', `url(#underglow)`);
      // tint glow stops
      const stops = this.vehGlow.ownerSVGElement.querySelectorAll('#underglow stop');
      stops[0].setAttribute('stop-color', color);
      stops[1].setAttribute('stop-color', color);
      this.el.querySelector('.data-pulse').style.fill = color;
    }

    const scKey = vehicle.sim.scenarioKey;
    this.vehScenario.textContent = `SCENARIO: ${scKey.replace(/_/g, ' ')}`;

    if (vehicle.recovered) {
      this.vehStateText.textContent = '🟢 Vehicle recovered';
      this.vehStateText.className = 'veh-tag ok-text';
    } else if (a && a.band === 'CRITICAL') {
      this.vehStateText.textContent = '🔴 Critical state — action required';
      this.vehStateText.className = 'veh-tag bad-text';
    } else if (a && a.band === 'ATTENTION') {
      this.vehStateText.textContent = '🟡 Attention — monitor closely';
      this.vehStateText.className = 'veh-tag warn-text';
    } else {
      this.vehStateText.textContent = '🟢 Operating normally';
      this.vehStateText.className = 'veh-tag ok-text';
    }
  }
}
