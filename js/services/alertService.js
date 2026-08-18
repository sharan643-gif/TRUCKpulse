// ============================================================
// TruckPulse — ALERT SERVICE
// Owns the alert lifecycle. Alerts trigger only when the
// vehicle crosses a status band (HEALTHY -> ATTENTION ->
// CRITICAL -> recovery), then propagate to:
//   • dashboard banner    • notification center
//   • toast stack         • WhatsApp-style preview
// ============================================================

import { fmtTime } from '../utils/math.js';

let idCounter = 0;
const uid = () => `al-${Date.now()}-${idCounter++}`;

export class AlertService {
  constructor() {
    this.notifications = [];        // notification center (persistent)
    this.active = null;             // { level, title, message, health, risk, recommendation, time, vehicle }
    this.band = null;               // last seen band
    this.toastQueue = [];
    this.recovered = false;

    // renderer hooks — wired in main.js
    this.hooks = {
      onBanner: null,
      onToast: null,
      onNotification: null,
      onWhatsApp: null,
      onSound: null,
    };
  }

  update(analysis, meta = {}) {
    const { healthScore, riskLevel, band, recommendations } = analysis;
    const vehicle = meta.vehicleName || 'Active vehicle';
    const plate = meta.plate || '';

    const bandChanged = this.band !== null && this.band !== band;

    if (this.band === null) {
      // first analysis for this vehicle — surface its state if it
      // is already degraded (e.g. switching to a critical truck)
      this.band = band;
      if (band === 'ATTENTION') {
        this.raise({
          level: 'warning',
          title: 'Vehicle Health Warning',
          message: this.messageFor(analysis),
          health: healthScore,
          risk: riskLevel,
          recommendation: recommendations[0] || 'Inspect vehicle',
          vehicle,
          plate,
        });
      } else if (band === 'CRITICAL') {
        this.raise({
          level: 'critical',
          title: 'Critical Vehicle Alert',
          message: this.messageFor(analysis),
          health: healthScore,
          risk: riskLevel,
          recommendation: recommendations[0] || 'Stop vehicle when safe and inspect immediately',
          vehicle,
          plate,
        });
      }
      return;
    }

    // ---------- escalation into attention ----------
    // (only when coming from a healthier band — never during
    //  recovery, where ATTENTION is an intermediate step down)
    if (bandChanged && band === 'ATTENTION' && this.band !== 'CRITICAL') {
      this.raise({
        level: 'warning',
        title: 'Vehicle Health Warning',
        message: this.messageFor(analysis),
        health: healthScore,
        risk: riskLevel,
        recommendation: recommendations[0] || 'Inspect vehicle',
        vehicle,
        plate,
      });
    }

    // ---------- escalation into critical ----------
    if (bandChanged && band === 'CRITICAL') {
      this.raise({
        level: 'critical',
        title: 'Critical Vehicle Alert',
        message: this.messageFor(analysis),
        health: healthScore,
        risk: riskLevel,
        recommendation: recommendations[0] || 'Stop vehicle when safe and inspect immediately',
        vehicle,
        plate,
      });
    }

    // ---------- recovery ----------
    if (bandChanged && this.band === 'CRITICAL' && band !== 'CRITICAL') {
      this.recovered = true;
      this.addNotification({
        level: 'info',
        title: 'Vehicle Recovered',
        message: 'Health restored after maintenance — vehicle operating normally.',
        health: healthScore,
        risk: riskLevel,
        recommendation: 'Continue monitoring',
        time: fmtTime(),
        vehicle,
        plate,
      });
      this.active = null;
      this.band = band;
      this.hooks.onBanner?.(null);
      this.hooks.onWhatsApp?.(null);
      return;
    }

    // while an alert is active, keep the live preview current
    if (this.active) {
      this.active.health = healthScore;
      this.active.risk = riskLevel;
      this.active.time = fmtTime();
      this.hooks.onBanner?.(this.active);
      this.hooks.onWhatsApp?.(this.active);
    }

    this.band = band;
  }

  raise(alert) {
    this.active = { ...alert, time: fmtTime() };
    this.addNotification({ ...alert, time: fmtTime() });
    this.hooks.onBanner?.(this.active);
    this.hooks.onWhatsApp?.(this.active);
    this.hooks.onToast?.(this.active);
    this.hooks.onSound?.(alert.level);
  }

  messageFor(analysis) {
    const patterns = analysis.detectedPatterns.map((p) => p.label).filter(Boolean);
    if (patterns.length === 0) return 'Vehicle parameters are deviating from normal operating range.';
    return `${patterns.slice(0, 2).join('; ')}.`;
  }

  addNotification(n) {
    this.notifications.unshift({ ...n, id: uid() });
    if (this.notifications.length > 50) this.notifications.pop();
    this.hooks.onNotification?.(this.notifications);
  }

  dismissNotification(id) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.hooks.onNotification?.(this.notifications);
  }

  clear() {
    this.notifications = [];
    this.active = null;
    this.band = null;
    this.recovered = false;
    this.hooks.onBanner?.(null);
    this.hooks.onWhatsApp?.(null);
    this.hooks.onNotification?.(this.notifications);
  }
}
