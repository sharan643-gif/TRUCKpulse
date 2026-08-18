// ============================================================
// TruckPulse — TREND DETECTION
// Detects gradual drifts and instability from the rolling
// history, not just absolute threshold crossings.
// ============================================================

import { TREND, TREND_WINDOW } from '../config.js';
import { linearRegression, stddev } from '../utils/math.js';

/**
 * Analyze the last N points of history for trends.
 * history: array of data points with numeric fields.
 * Returns a plain object of trend signals.
 */
export function detectTrends(history) {
  const N = Math.min(TREND_WINDOW, history.length);
  const min = TREND.minPoints;
  const out = {
    tempRising: { active: false, strength: 0, slope: 0 },
    voltageFalling: { active: false, strength: 0, slope: 0 },
    vibrationRising: { active: false, strength: 0, slope: 0 },
    rpmInstability: { active: false, std: 0, strength: 0 },
    loadInstability: { active: false, std: 0, strength: 0 },
    dataPoints: history.length,
  };

  if (history.length < min || N < min) return out;

  const slice = history.slice(-N);

  // --- temperature rising ---
  {
    const reg = linearRegression(slice.map((p) => p.coolantTemp));
    const total = reg.slope * (N - 1);
    if (reg.slope >= TREND.temp.slopePerPoint && total >= TREND.temp.minTotalRise) {
      out.tempRising = {
        active: true,
        slope: reg.slope,
        strength: clamp01(reg.slope / (TREND.temp.slopePerPoint * 2.2)),
      };
    }
  }

  // --- voltage falling ---
  {
    const reg = linearRegression(slice.map((p) => p.voltage));
    const total = reg.slope * (N - 1); // negative when falling
    if (reg.slope <= -TREND.voltage.slopePerPoint && total <= -TREND.voltage.minTotalFall) {
      out.voltageFalling = {
        active: true,
        slope: reg.slope,
        strength: clamp01(-reg.slope / (TREND.voltage.slopePerPoint * 2.4)),
      };
    }
  }

  // --- vibration rising ---
  // Also require the vibration level itself to be meaningfully
  // abnormal — small oscillations around a low baseline (e.g. a
  // sawtooth from rate-limited tracking) must not read as a trend.
  {
    const reg = linearRegression(slice.map((p) => p.vibration));
    const total = reg.slope * (N - 1);
    const mean = slice.reduce((a, p) => a + p.vibration, 0) / slice.length;
    if (
      reg.slope >= TREND.vibration.slopePerPoint &&
      total >= TREND.vibration.minTotalRise &&
      mean >= TREND.vibration.minLevel
    ) {
      out.vibrationRising = {
        active: true,
        slope: reg.slope,
        strength: clamp01(reg.slope / (TREND.vibration.slopePerPoint * 2.2)),
      };
    }
  }

  // --- RPM instability ---
  {
    const s = stddev(slice.map((p) => p.rpm));
    out.rpmInstability = {
      active: s >= TREND.rpmStd.unstable,
      std: s,
      strength: clamp01((s - TREND.rpmStd.unstable) / (TREND.rpmStd.heavy - TREND.rpmStd.unstable)),
    };
  }

  // --- engine load instability ---
  {
    const s = stddev(slice.map((p) => p.engineLoad));
    out.loadInstability = {
      active: s >= TREND.loadInstability.unstable,
      std: s,
      strength: clamp01((s - TREND.loadInstability.unstable) / 14),
    };
  }

  return out;
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
