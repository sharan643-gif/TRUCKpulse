// ============================================================
// TruckPulse — math & formatting utilities
// ============================================================

export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

export const lerp = (a, b, t) => a + (b - a) * t;

// Exponential easing of `current` toward `target`.
export const easeToward = (current, target, factor) =>
  current + (target - current) * factor;

export const rand = (min, max) => min + Math.random() * (max - min);

// Box-Muller standard normal
export function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export const round1 = (v) => Math.round(v * 10) / 10;
export const round2 = (v) => Math.round(v * 100) / 100;

// Piecewise-linear interpolation through control points [[x,y],...]
export function piecewise(points, x) {
  if (points.length === 0) return 0;
  if (x <= points[0][0]) return points[0][1];
  if (x >= points[points.length - 1][0]) return points[points.length - 1][1];
  for (let i = 1; i < points.length; i++) {
    if (x <= points[i][0]) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      const t = (x - x0) / (x1 - x0);
      return y0 + (y1 - y0) * t;
    }
  }
  return points[points.length - 1][1];
}

// Linear regression over a numeric series -> { slope, intercept, meanY }
export function linearRegression(ys) {
  const n = ys.length;
  if (n < 2) return { slope: 0, intercept: 0, meanY: ys[0] || 0 };
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += i; sy += ys[i]; sxx += i * i; sxy += i * ys[i];
  }
  const denom = n * sxx - sx * sx || 1;
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept, meanY: sy / n };
}

export function stddev(xs) {
  if (xs.length < 2) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sq = xs.reduce((a, b) => a + (b - mean) * (b - mean), 0);
  return Math.sqrt(sq / xs.length);
}

export function fmtTime(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

export function formatClock(date = new Date()) {
  return fmtTime(date);
}

// Nicely formatted value for a metric
export function formatValue(key, v) {
  switch (key) {
    case 'rpm': return Math.round(v);
    case 'coolantTemp': return `${round1(v)} °C`;
    case 'voltage': return `${round2(v)} V`;
    case 'speed': return `${Math.round(v)} km/h`;
    case 'engineLoad': return `${Math.round(v)} %`;
    case 'vibration': return Math.round(v);
    case 'fuelEfficiency': return `${Math.round(v)} %`;
    default: return String(Math.round(v));
  }
}
