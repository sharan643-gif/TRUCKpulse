// ============================================================
// TruckPulse — AUDIO SERVICE
// Subtle WebAudio alert tones. NEVER plays until the user
// explicitly enables sound (requires a user gesture anyway).
// ============================================================

export class AudioService {
  constructor() {
    this.enabled = false;
    this.ctx = null;
  }

  setEnabled(on) {
    this.enabled = on;
    if (on && !this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    if (!on && this.ctx) this.ctx.suspend().catch(() => {});
  }

  get isEnabled() {
    return this.enabled;
  }

  play(kind) {
    if (!this.enabled || !this.ctx) return;
    if (kind === 'warning') this.beep(660, 0.16, 0, 0.08, 2);
    else if (kind === 'critical') {
      this.beep(880, 0.18, 0, 0.06, 1);
      this.beep(620, 0.18, 0.22, 0.06, 1);
      this.beep(440, 0.3, 0.44, 0.07, 1);
    }
  }

  beep(freq, dur, delay, gain, times) {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    for (let i = 0; i < times; i++) {
      const t0 = now + delay + i * (dur + 0.05);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    }
  }
}
