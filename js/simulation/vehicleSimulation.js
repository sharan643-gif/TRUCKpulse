// ============================================================
// TruckPulse — VEHICLE SIMULATION ENGINE
// One state machine per vehicle. Values chase scenario targets
// smoothly (exponential approach + bounded noise + oscillation),
// producing realistic telemetry instead of random jumps.
//
// ONE SOURCE OF TRUTH: charts, dashboard, AI and health score
// all consume the same `history` / `state` produced here.
// ============================================================

import { SCENARIOS, PARAM_TAUS, PARAM_RATES, TICK_MS, HISTORY_LIMIT } from '../config.js';
import { clamp, easeToward, randn, rand } from '../utils/math.js';

export class VehicleSimulation {
  /**
   * @param {string} scenarioKey initial scenario
   * @param {object} opts { seedJitter: bool }
   */
  constructor(scenarioKey = 'NORMAL', opts = {}) {
    this.scenarioKey = scenarioKey;
    this.history = [];
    this.timeMs = 0;
    this.phase = rand(0, Math.PI * 2);   // rpm oscillation phase
    this.vibPhase = rand(0, Math.PI * 2);
    this.spike = 0;                       // decaying vibration spike
    this.spikeTimer = 0;

    // physical state
    const t = this.targets();
    this.state = {
      rpm: t.rpmBase,
      coolantTemp: t.coolantTemp,
      voltage: t.voltage,
      speed: t.speedBase,
      engineLoad: t.engineLoad,
      vibration: t.vibration,
      fuelEfficiency: t.fuelEfficiency,
    };

    // A little natural spread so each vehicle isn't identical
    if (opts.seedJitter) {
      this.state.coolantTemp += rand(-1.5, 1.5);
      this.state.voltage += rand(-0.05, 0.05);
      this.state.rpm += rand(-60, 60);
      this.state.vibration += rand(-4, 6);
    }

    this.pushHistory();
  }

  targets() {
    return SCENARIOS[this.scenarioKey]?.targets || SCENARIOS.NORMAL.targets;
  }

  setScenario(key) {
    this.scenarioKey = key;
  }

  reset(scenarioKey = 'NORMAL') {
    this.scenarioKey = scenarioKey;
    this.history = [];
    this.timeMs = 0;
    this.phase = rand(0, Math.PI * 2);
    this.spike = 0;
    this.spikeTimer = 0;
    const t = this.targets();
    this.state = {
      rpm: t.rpmBase,
      coolantTemp: t.coolantTemp,
      voltage: t.voltage,
      speed: t.speedBase,
      engineLoad: t.engineLoad,
      vibration: t.vibration,
      fuelEfficiency: t.fuelEfficiency,
    };
    this.pushHistory();
  }

  /**
   * Advance the simulation by one tick of `dtMs` sim time.
   */
  tick(dtMs) {
    this.timeMs += dtMs;
    const t = this.targets();
    const s = this.state;
    const dt = dtMs;
    const exp = (tau) => 1 - Math.exp(-dt / tau);
    // constant-rate approach toward a target (units / sim second)
    const moveRate = (current, target, rate) =>
      current + clamp(target - current, -rate * (dt / 1000), rate * (dt / 1000));

    // --- RPM: base + noise + oscillation ----------------------
    // Instability oscillation is added directly to the value (not
    // chased through the slow response time-constant) so high-
    // instability scenarios show real, visible RPM fluctuation.
    this.phase += (0.5 + t.instability * 0.9) * (dt / 1000) * Math.PI * 2;
    const oscAmp = t.rpmRange * t.instability * 0.62;
    const rpmNoise = randn() * (12 + t.instability * 40);
    s.rpm = clamp(
      easeToward(s.rpm, t.rpmBase, exp(PARAM_TAUS.rpm))
      + Math.sin(this.phase) * oscAmp + rpmNoise,
      600, 4200,
    );

    // --- coolant temperature: steady climb/fall -----------------
    s.coolantTemp = clamp(
      moveRate(s.coolantTemp, t.coolantTemp, PARAM_RATES.coolantTemp) + randn() * 0.08,
      40, 118,
    );

    // --- voltage ------------------------------------------------
    s.voltage = clamp(
      moveRate(s.voltage, t.voltage, PARAM_RATES.voltage) + randn() * 0.012,
      10.5, 15.6,
    );

    // --- speed: wandering around base ---------------------------
    const speedOsc = Math.sin(this.phase * 0.31) * t.speedRange * 0.5;
    s.speed = clamp(
      easeToward(s.speed, t.speedBase + speedOsc, exp(PARAM_TAUS.speed)) + randn() * 2.4,
      0, 130,
    );

    // --- engine load ----------------------------------------------
    // Scenario level ramps smoothly; instability adds direct
    // fluctuation on top so load visibly pulses when unstable.
    const loadOsc = Math.sin(this.phase * 0.9) * (2 + t.instability * 12);
    s.engineLoad = clamp(
      moveRate(s.engineLoad, t.engineLoad, PARAM_RATES.engineLoad)
      + loadOsc + randn() * 1.2,
      0, 100,
    );

    // --- vibration: target + slow modulation + random spikes ------
    this.vibPhase += 0.5 * (dt / 1000) * Math.PI * 2;
    // small modulation the rate-limited follower can track smoothly
    const vibMod = Math.sin(this.vibPhase) * (1.2 + t.vibration * 0.015);
    this.spikeTimer -= dtMs;
    if (this.spikeTimer <= 0) {
      // spikes scale with the scenario's vibration character
      this.spike = t.vibSpike > 0 && Math.random() < 0.32 ? rand(t.vibSpike * 0.35, t.vibSpike) : 0;
      this.spikeTimer = rand(4000, 9000);
    }
    this.spike = Math.max(0, this.spike - dtMs * 0.004);
    s.vibration = clamp(
      moveRate(s.vibration, t.vibration + vibMod, PARAM_RATES.vibration)
      + randn() * (0.3 + s.vibration * 0.012) + this.spike,
      0, 100,
    );

    // --- fuel efficiency: derived from load -----------------------
    const fuelTarget = t.fuelEfficiency * (1 - Math.max(0, s.engineLoad - 42) * 0.008);
    s.fuelEfficiency = clamp(
      moveRate(s.fuelEfficiency, fuelTarget, PARAM_RATES.fuelEfficiency) + randn() * 0.8,
      0, 100,
    );

    this.pushHistory();
  }

  pushHistory() {
    const s = this.state;
    this.history.push({
      t: this.timeMs,
      rpm: s.rpm,
      coolantTemp: s.coolantTemp,
      voltage: s.voltage,
      speed: s.speed,
      engineLoad: s.engineLoad,
      vibration: s.vibration,
      fuelEfficiency: s.fuelEfficiency,
    });
    if (this.history.length > HISTORY_LIMIT) {
      this.history.shift();
    }
  }

  // Convenience snapshot for UI
  snapshot() {
    return {
      state: { ...this.state },
      history: this.history,
      scenarioKey: this.scenarioKey,
      timeMs: this.timeMs,
    };
  }
}

// Number of sim-ms per tick at a given speed multiplier
export const tickMsAtSpeed = (speed) => TICK_MS * speed;
