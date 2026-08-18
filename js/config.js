// ============================================================
// TruckPulse — CONFIG
// Single source of truth for simulation parameters, health
// thresholds, scenario profiles and fleet definitions.
// ============================================================

export const APP_NAME = 'TruckPulse';

// ---- Simulation timing -------------------------------------
export const TICK_MS = 250;          // one simulation step (sim ms)
export const HISTORY_LIMIT = 100;    // rolling data points kept per vehicle
export const TREND_WINDOW = 24;      // points used for trend detection

// ---- Health score bands / status thresholds (configurable) --
export const HEALTH_THRESHOLDS = {
  healthy: 90,   // >= healthy  -> HEALTHY / LOW risk
  attention: 60, // >= attention-> ATTENTION / MEDIUM risk
  critical: 0,   // below       -> CRITICAL / HIGH risk
};

// Component weights for the health score (must sum to 1)
export const HEALTH_WEIGHTS = {
  temperature: 0.26,
  voltage: 0.20,
  rpm: 0.15,
  vibration: 0.19,
  engineLoad: 0.12,
  speed: 0.08,
};

// ---- Scenario profiles -------------------------------------
// Targets the engine smoothly chases. `rpmRange` drives natural
// wandering; `instability` (0..1) drives oscillation amplitude.
export const SCENARIOS = {
  NORMAL: {
    label: 'Normal',
    tagline: 'Steady highway operation',
    targets: {
      coolantTemp: 89, voltage: 13.8, engineLoad: 52, vibration: 12,
      fuelEfficiency: 78, rpmBase: 2200, rpmRange: 220, speedBase: 55,
      speedRange: 26, instability: 0.14, vibSpike: 0,
    },
  },
  OVERHEATING: {
    label: 'Overheating',
    tagline: 'Coolant temperature climbing',
    targets: {
      coolantTemp: 112, voltage: 13.2, engineLoad: 74, vibration: 35,
      fuelEfficiency: 58, rpmBase: 2320, rpmRange: 300, speedBase: 46,
      speedRange: 20, instability: 0.5, vibSpike: 5,
    },
  },
  LOW_VOLTAGE: {
    label: 'Low Voltage',
    tagline: 'Charging system degrading',
    targets: {
      coolantTemp: 88, voltage: 12.2, engineLoad: 50, vibration: 10,
      fuelEfficiency: 70, rpmBase: 2120, rpmRange: 200, speedBase: 50,
      speedRange: 24, instability: 0.10, vibSpike: 0,
    },
  },
  HIGH_VIBRATION: {
    label: 'High Vibration',
    tagline: 'Mechanical vibration rising',
    targets: {
      coolantTemp: 90, voltage: 13.7, engineLoad: 58, vibration: 84,
      fuelEfficiency: 68, rpmBase: 2220, rpmRange: 330, speedBase: 52,
      speedRange: 22, instability: 0.42, vibSpike: 15,
    },
  },
  ENGINE_INSTABILITY: {
    label: 'Engine Instability',
    tagline: 'RPM / load fluctuations',
    targets: {
      coolantTemp: 91, voltage: 13.6, engineLoad: 64, vibration: 55,
      fuelEfficiency: 58, rpmBase: 2200, rpmRange: 720, speedBase: 50,
      speedRange: 16, instability: 0.85, vibSpike: 8,
    },
  },
  CRITICAL_FAILURE: {
    label: 'Critical Failure',
    tagline: 'Multi-parameter failure',
    targets: {
      coolantTemp: 109, voltage: 12.05, engineLoad: 87, vibration: 89,
      fuelEfficiency: 34, rpmBase: 2300, rpmRange: 820, speedBase: 45,
      speedRange: 12, instability: 0.9, vibSpike: 16,
    },
  },
  RECOVERY: {
    label: 'Recovery',
    tagline: 'Post-maintenance return to normal',
    targets: {
      coolantTemp: 89, voltage: 13.8, engineLoad: 50, vibration: 11,
      fuelEfficiency: 76, rpmBase: 2180, rpmRange: 210, speedBase: 54,
      speedRange: 24, instability: 0.12, vibSpike: 0,
    },
  },
};

// ---- Parameter movement -------------------------------------
// `PARAM_RATES` (per sim second): slow physical parameters creep
// toward their scenario target at a constant rate — a steady,
// near-linear climb (e.g. 89 °C → 92 → 95 → …) that matches real
// OBD telemetry and keeps trend detection active for the whole
// ramp. `PARAM_TAUS` (time constant, sim ms) stays for the fast
// parameters whose natural wandering should track instantly.
export const PARAM_RATES = {
  coolantTemp: 0.55,      // °C / s
  voltage: 0.045,         // V / s
  engineLoad: 0.9,        // % / s
  vibration: 2.2,         // 0-100 / s
  fuelEfficiency: 0.5,    // % / s
};

export const PARAM_TAUS = {
  rpm: 2600,
  speed: 6000,
};

// ---- Trend detection thresholds ----------------------------
// Thresholds are aligned with the ramp rates above so a steady
// climb stays detectable for its entire duration (direction),
// while absolute thresholds catch plateaued extremes (level).
export const TREND = {
  temp:        { slopePerPoint: 0.1, minTotalRise: 1.3 },   // °C
  voltage:     { slopePerPoint: 0.008, minTotalFall: 0.12 }, // V
  vibration:   { slopePerPoint: 0.35, minTotalRise: 4.5, minLevel: 25 },   // 0-100
  rpmStd:      { unstable: 85, heavy: 240 },                // RPM
  loadInstability: { unstable: 8 },                         // %
  minPoints: 8,
};

// ---- Vibration level bands (0-100) -------------------------
export const VIBRATION_BANDS = [
  { max: 26,  label: 'Low',     icon: '▁' },
  { max: 50,  label: 'Medium',  icon: '▃' },
  { max: 74,  label: 'High',    icon: '▅' },
  { max: 101, label: 'Critical', icon: '▇' },
];

export function vibrationLevel(v) {
  const band = VIBRATION_BANDS.find((b) => v < b.max) || VIBRATION_BANDS[3];
  return band.label.toUpperCase();
}

// ---- Component health curves (piecewise linear control points)
// x -> health. Used by the health engine.
export const CURVES = {
  temperature: [[55, 60], [70, 82], [80, 95], [88, 100], [95, 96], [98, 84], [101, 64], [104, 44], [107, 26], [110, 12], [116, 4]],
  voltage:     [[10.5, 5], [11.5, 20], [12.2, 42], [12.6, 60], [13.0, 80], [13.4, 94], [13.8, 100], [14.4, 97], [15.0, 78], [15.6, 55]],
  rpm:         [[700, 35], [1200, 75], [1500, 92], [1900, 100], [2600, 96], [3000, 68], [3400, 42], [4000, 18]],
  vibration:   [[0, 100], [20, 92], [40, 74], [60, 50], [80, 28], [100, 6]],
  engineLoad:  [[0, 58], [20, 90], [40, 100], [65, 98], [80, 84], [90, 58], [100, 28]],
  speed:       [[0, 65], [18, 90], [40, 100], [90, 97], [115, 78], [140, 45]],
};

// ---- Confidence --------------------------------------------
export const CONFIDENCE = {
  base: 90,
  perPoint: 0.35,
  maxPointsBonus: 6,
  criticalBonus: 3,
  max: 97,
  min: 70,
};

// ---- Sustained-condition penalties (per sim second) --------
// Erodes component health while a parameter stays in a danger
// zone, making health decline feel persistent, not just spiky.
export const SUSTAINED = {
  tempOver: 100,     tempPenaltyPerSec: 0.8,  tempPenaltyCap: 22,
  voltBelow: 12.7,   voltPenaltyPerSec: 0.8,  voltPenaltyCap: 18,
  vibOver: 55,       vibPenaltyPerSec: 0.8,   vibPenaltyCap: 18,
  window: 60,        // history points examined
};

// ---- Catastrophic-condition multiplier ---------------------
// A smooth, continuous factor applied when a parameter reaches
// extreme danger, so multi-parameter failures can push health
// into the critical band without a single hard cutoff. The
// temperature band starts at 101 °C so the health curve keeps
// declining smoothly through the overheating demo rather than
// flat-lining while other components still read healthy.
export const CATASTROPHE = [
  { cond: (s) => s.coolantTemp > 101, factor: (s) => 1 - (s.coolantTemp - 101) * 0.07, floor: 0.62 },
  { cond: (s) => s.voltage < 12.3, factor: (s) => 1 - (12.3 - s.voltage) * 0.15, floor: 0.8 },
  { cond: (s) => s.vibration > 78, factor: (s) => 1 - (s.vibration - 78) * 0.03, floor: 0.8 },
  { cond: (s) => s.rpm > 3200, factor: (s) => 1 - (s.rpm - 3200) * 0.002, floor: 0.7 },
];

// ---- Fleet definition --------------------------------------
// Scenarios chosen so the overview shows a realistic spread:
// three healthy trucks, one electrical attention, one critical.
export const FLEET = [
  { id: 'truck-01', name: 'Chennai Express', plate: 'TN 34 AB 1234', scenario: 'NORMAL', route: 'Chennai → Bangalore' },
  { id: 'truck-02', name: 'Bangalore Star', plate: 'TN 78 CD 2091', scenario: 'NORMAL', route: 'Bangalore → Mysore' },
  { id: 'truck-03', name: 'Mumbai Runner', plate: 'MH 12 EF 8832', scenario: 'LOW_VOLTAGE', route: 'Mumbai → Pune' },
  { id: 'truck-04', name: 'Delhi Heavy', plate: 'DL 55 GH 4471', scenario: 'CRITICAL_FAILURE', route: 'Delhi → Jaipur' },
  { id: 'truck-05', name: 'Kolkata Cruiser', plate: 'WB 90 JK 6650', scenario: 'NORMAL', route: 'Kolkata → Bhubaneswar' },
  { id: 'truck-06', name: 'Hyderabad Hauler', plate: 'TS 22 KL 7788', scenario: 'HIGH_VIBRATION', route: 'Hyderabad → Vijayawada' },
];

// ---- Vehicle identity used in alerts ------------------------
export const PLACEHOLDER_REG_NUMBER = 'TN 42 TR 2026';
