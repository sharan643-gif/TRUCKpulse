// ============================================================
// TruckPulse — AI HEALTH ENGINE
// analyzeVehicleHealth(vehicleData) -> {
//   healthScore, riskLevel, confidence, status,
//   detectedPatterns, recommendations, summary, band
// }
// Multi-parameter weighted health with trend-aware penalties.
// ============================================================

import {
  HEALTH_THRESHOLDS, HEALTH_WEIGHTS, CURVES, CONFIDENCE,
  SUSTAINED, CATASTROPHE,
} from '../config.js';
import { piecewise, clamp } from '../utils/math.js';
import { detectTrends } from './trendDetection.js';

/**
 * Central health analysis entry point.
 * @param {object} vehicleData { state, history, scenarioKey }
 */
export function analyzeVehicleHealth(vehicleData) {
  const { state, history, scenarioKey } = vehicleData;
  const trends = detectTrends(history);
  const n = history.length;

  // ---- per-component health -------------------------------
  let tempH = piecewise(CURVES.temperature, state.coolantTemp);
  let voltH = piecewise(CURVES.voltage, state.voltage);
  let rpmH = rpmHealth(state, trends);
  let vibH = piecewise(CURVES.vibration, state.vibration);
  let loadH = piecewise(CURVES.engineLoad, state.engineLoad);
  const speedH = piecewise(CURVES.speed, state.speed);

  // ---- trend-aware penalties (health reacts to direction) ---
  if (trends.tempRising.active) {
    tempH = tempH * (1 - 0.14 * trends.tempRising.strength);
  }
  if (trends.voltageFalling.active) {
    voltH -= 9 * trends.voltageFalling.strength;
  }
  if (trends.vibrationRising.active) {
    vibH -= 8 * trends.vibrationRising.strength;
  }
  if (trends.rpmInstability.active) {
    rpmH -= 10 * trends.rpmInstability.strength;
  }
  if (trends.loadInstability.active) {
    loadH -= 6 * trends.loadInstability.strength;
  }

  // ---- sustained danger-zone erosion (persistent decline) --
  const sustained = sustainedSeconds(history, SUSTAINED.window);
  tempH -= clamp(sustained.overheatSec * SUSTAINED.tempPenaltyPerSec, 0, SUSTAINED.tempPenaltyCap);
  voltH -= clamp(sustained.lowVoltSec * SUSTAINED.voltPenaltyPerSec, 0, SUSTAINED.voltPenaltyCap);
  vibH -= clamp(sustained.highVibSec * SUSTAINED.vibPenaltyPerSec, 0, SUSTAINED.vibPenaltyCap);

  tempH = clamp(tempH, 0, 100);
  voltH = clamp(voltH, 0, 100);
  rpmH = clamp(rpmH, 0, 100);
  vibH = clamp(vibH, 0, 100);
  loadH = clamp(loadH, 0, 100);

  // ---- weighted aggregate ----------------------------------
  const weighted = {
    temperature: tempH, voltage: voltH, rpm: rpmH,
    vibration: vibH, engineLoad: loadH, speed: speedH,
  };
  let healthScore = 0;
  for (const key of Object.keys(HEALTH_WEIGHTS)) {
    healthScore += HEALTH_WEIGHTS[key] * weighted[key];
  }

  // ---- catastrophic-condition multiplier ---------------------
  // Continuous, multi-parameter aware: the worst extreme zone
  // drags the whole score down so critical scenarios can reach
  // the critical band without a single parameter dominating.
  let factor = 1;
  for (const c of CATASTROPHE) {
    if (c.cond(state)) {
      const f = Math.max(c.floor, c.factor(state));
      if (f < factor) factor = f;
    }
  }
  healthScore = clamp(Math.round(healthScore * factor), 0, 100);

  // ---- band / status / risk ---------------------------------
  const band = healthScore >= HEALTH_THRESHOLDS.healthy
    ? 'HEALTHY'
    : healthScore >= HEALTH_THRESHOLDS.attention
      ? 'ATTENTION'
      : 'CRITICAL';

  const status = band; // HEALTHY / ATTENTION / CRITICAL
  const riskLevel = band === 'HEALTHY' ? 'LOW' : band === 'ATTENTION' ? 'MEDIUM' : 'HIGH';

  // ---- confidence --------------------------------------------
  const abnormalCount =
    (state.coolantTemp > 99 ? 1 : 0) +
    (state.voltage < 12.8 ? 1 : 0) +
    (state.vibration > 55 ? 1 : 0) +
    (trends.rpmInstability.active ? 1 : 0);
  const rawConf =
    CONFIDENCE.base +
    Math.min(CONFIDENCE.maxPointsBonus, n * CONFIDENCE.perPoint) +
    (band === 'CRITICAL' ? CONFIDENCE.criticalBonus : 0) +
    (abnormalCount >= 3 ? 2 : 0);
  const confidence = Math.round(clamp(rawConf, CONFIDENCE.min, CONFIDENCE.max));

  // ---- detected patterns -------------------------------------
  const detectedPatterns = [];
  const push = (id, label, description, severity) =>
    detectedPatterns.push({ id, label, description, severity });

  if (trends.tempRising.active) {
    push(
      'temp-trend',
      'Continuous coolant temperature increase',
      'Coolant temperature is continuously increasing — potential overheating pattern detected.',
      band === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
    );
  } else if (state.coolantTemp > 100) {
    push(
      'temp-high',
      'High coolant temperature',
      'Coolant temperature is above normal operating range.',
      'HIGH',
    );
  }

  if (trends.voltageFalling.active) {
    push(
      'voltage-trend',
      'Abnormal voltage trend',
      'Voltage is gradually decreasing — charging system may be degrading.',
      'MEDIUM',
    );
  } else if (state.voltage < 12.7) {
    push('voltage-low', 'Low system voltage', 'Electrical system voltage is below normal range.', 'MEDIUM');
  }

  if (trends.vibrationRising.active || state.vibration > 55) {
    push(
      'vibration-pattern',
      'Potential abnormal vibration pattern',
      'Vibration levels are abnormal. This may indicate a mechanical issue — further inspection required.',
      state.vibration > 74 ? 'HIGH' : 'MEDIUM',
    );
  }

  if (trends.rpmInstability.active) {
    push(
      'rpm-instability',
      'Engine behaviour unstable',
      'RPM and engine behaviour are becoming unstable.',
      trends.rpmInstability.strength > 0.5 ? 'HIGH' : 'MEDIUM',
    );
  }

  if (abnormalCount >= 3 || (band === 'CRITICAL' && detectedPatterns.length >= 2)) {
    push(
      'multi-param',
      'High-risk abnormal vehicle pattern',
      'Multiple abnormal vehicle parameters detected simultaneously.',
      'HIGH',
    );
  }

  // ---- recommendations ---------------------------------------
  const recommendations = [];
  const add = (r) => !recommendations.includes(r) && recommendations.push(r);

  if (trends.tempRising.active || state.coolantTemp > 99) add('Inspect cooling system');
  if (trends.voltageFalling.active || state.voltage < 12.7) add('Inspect battery and charging system');
  if (trends.vibrationRising.active || state.vibration > 55) add('Inspect mechanical components');
  if (trends.rpmInstability.active) add('Check engine mounts and fuel supply');
  if (band === 'CRITICAL') add('Stop vehicle when safe and inspect immediately');

  if (recommendations.length === 0) {
    add('Continue monitoring');
    if (n > 40) add('Schedule routine maintenance');
  }

  // ---- narrative summary -------------------------------------
  const summary = buildSummary(detectedPatterns, band, scenarioKey);

  return {
    healthScore,
    riskLevel,
    confidence,
    status,
    band,
    detectedPatterns,
    recommendations,
    summary,
    components: weighted,
    trends,
    dataPoints: n,
  };
}

// -------------------------------------------------------------
function rpmHealth(state, trends) {
  const base = piecewise(CURVES.rpm, state.rpm);
  const stability = clamp(100 - trends.rpmInstability.std * 0.14, 0, 100);
  return 0.55 * base + 0.45 * stability;
}

/** Time (sim seconds) spent inside danger zones in recent history. */
function sustainedSeconds(history, windowPts) {
  const slice = history.slice(-windowPts);
  let overheatSec = 0;
  let lowVoltSec = 0;
  let highVibSec = 0;
  for (const p of slice) {
    if (p.coolantTemp > SUSTAINED.tempOver) overheatSec += 0.25;
    if (p.voltage < SUSTAINED.voltBelow) lowVoltSec += 0.25;
    if (p.vibration > SUSTAINED.vibOver) highVibSec += 0.25;
  }
  return { overheatSec, lowVoltSec, highVibSec };
}

function buildSummary(patterns, band, scenarioKey) {
  const lines = [];
  if (band === 'HEALTHY') {
    lines.push('Normal vehicle behaviour');
    lines.push('All monitored parameters within safe operating range.');
    return lines;
  }

  // narrative from the most severe pattern first
  const order = { HIGH: 0, MEDIUM: 1 };
  const sorted = [...patterns].sort((a, b) => order[a.severity] - order[b.severity]);

  if (sorted.length === 0) {
    lines.push('Vehicle parameters deviating from normal range.');
    return lines;
  }

  for (const p of sorted.slice(0, 2)) lines.push(p.description);

  if (band === 'CRITICAL') {
    lines.push('Stop vehicle when safe and inspect immediately.');
  }
  return lines;
}
