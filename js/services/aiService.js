// ============================================================
// TruckPulse — AI SERVICE
// Wraps the health engine. Tracks when the vehicle's status or
// detected patterns CHANGE so the event timeline and alert
// system only fire on real transitions (no per-tick spam).
// ============================================================

import { analyzeVehicleHealth } from '../simulation/healthEngine.js';
import { fmtTime } from '../utils/math.js';

export class AIService {
  constructor(alertService, audioService) {
    this.alertService = alertService;
    this.audioService = audioService;
    this.timeline = [];
    this.previous = null; // { band, patternIds:Set }
    this.lastAnalysis = null;

    // band hysteresis — a status change is only committed once it
    // persists for a few consecutive analyses (prevents alert spam
    // from brief noise spikes)
    this.stableCandidate = null;
    this.stableCount = 0;
    this.committedBand = null;
    this.BAND_STABLE_REQUIRED = 3;
  }

  addTimelineEvent(text, icon = 'ℹ', level = 'info') {
    const entry = { time: fmtTime(), text, icon, level, id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
    this.timeline.unshift(entry);
    if (this.timeline.length > 40) this.timeline.pop();
    return entry;
  }

  /**
   * Run analysis for a vehicle snapshot; fires timeline events
   * and alert transitions when state changes.
   */
  analyze(vehicleData, meta = {}) {
    const analysis = analyzeVehicleHealth(vehicleData);
    this.lastAnalysis = analysis;

    // ---- band hysteresis -------------------------------------
    const rawBand = analysis.band;
    if (this.stableCandidate === rawBand) this.stableCount += 1;
    else {
      this.stableCandidate = rawBand;
      this.stableCount = 1;
    }
    const bandCommitted =
      this.stableCount >= this.BAND_STABLE_REQUIRED || this.committedBand === null;
    if (bandCommitted) this.committedBand = rawBand;
    analysis.band = this.committedBand || rawBand;

    const patternIds = new Set(analysis.detectedPatterns.map((p) => p.id));
    const prev = this.previous;
    const firstRun = !prev;

    // ---- status / risk band transitions -----------------------
    if (firstRun) {
      if (analysis.band === 'HEALTHY') {
        this.addTimelineEvent('Vehicle operating normally — AI engine active', '✓', 'info');
      } else {
        this.addTimelineEvent(`Telemetry loaded — ${analysis.band} state detected`, analysis.band === 'CRITICAL' ? '🔴' : '⚠', analysis.band === 'CRITICAL' ? 'critical' : 'warn');
      }
    } else if (prev.band !== analysis.band) {
      if (analysis.band === 'ATTENTION') {
        this.addTimelineEvent('Attention level reached — vehicle health degrading', '⚠', 'warn');
      } else if (analysis.band === 'CRITICAL') {
        this.addTimelineEvent('Critical level reached — high-risk pattern', '🔴', 'critical');
      } else {
        this.addTimelineEvent('Vehicle recovered — back to healthy operation', '✅', 'info');
      }
    }

    // ---- new pattern detections --------------------------------
    if (!firstRun) {
      for (const p of analysis.detectedPatterns) {
        if (!prev.patternIds.has(p.id)) {
          const icon = p.severity === 'HIGH' ? '🔴' : p.severity === 'MEDIUM' ? '⚠' : 'ℹ';
          this.addTimelineEvent(`${p.label} — ${shorten(p.description)}`, icon, p.severity === 'HIGH' ? 'critical' : 'warn');
        }
      }
    }

    // ---- maintenance recommended --------------------------------
    if (!firstRun && prev.band !== 'HEALTHY' && analysis.band === 'HEALTHY' && analysis.recommendations.some((r) => r.startsWith('Inspect') || r.startsWith('Schedule'))) {
      // placeholder, kept for narrative completeness
    }

    // ---- alert system --------------------------------------------
    if (this.alertService) {
      this.alertService.update(analysis, meta);
    }

    // ---- sound ---------------------------------------------------
    if (this.audioService && !firstRun && prev && prev.band !== analysis.band) {
      if (analysis.band === 'CRITICAL') this.audioService.play('critical');
      else if (analysis.band === 'ATTENTION') this.audioService.play('warning');
    }

    this.previous = { band: analysis.band, patternIds };
    return analysis;
  }

  resetTimeline() {
    this.timeline = [];
    this.previous = null;
    this.lastAnalysis = null;
    this.stableCandidate = null;
    this.stableCount = 0;
    this.committedBand = null;
  }

  /** Called when switching to another vehicle — start fresh
   *  transition detection without wiping the shared timeline. */
  vehicleSwitched() {
    this.previous = null;
    this.lastAnalysis = null;
    this.stableCandidate = null;
    this.stableCount = 0;
    this.committedBand = null;
  }
}

function shorten(text) {
  return text.length > 72 ? text.slice(0, 72) + '…' : text;
}
