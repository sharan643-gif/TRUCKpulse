# TruckPulse — AI Vehicle Simulation

A full interactive commercial-vehicle simulation: simulated OBD-II telemetry →
data processing → AI health analysis → health score → risk detection →
early warning → user alert → recommended action.

**Zero dependencies.** Pure HTML/CSS/JS (ES modules) + Canvas/SVG. No build step.

## Run it

Serve the folder with any static server, e.g.:

```bash
cd similation
python -m http.server 8080
# or: npx serve .
# or: npm i -g http-server && http-server -p 8080
```

Then open http://localhost:8080

> Note: ES modules require an http server (not `file://`).

## Demo flow

1. Open the app — Truck 01 shows ~95/100 🟢 HEALTHY.
2. Click **▶ START SIMULATION** — live telemetry streams.
3. Watch RPM / Coolant / Voltage / Vibration / Engine Load change smoothly.
4. Select **OVERHEATING** — temperature climbs gradually, health falls,
   status moves 🟢 → 🟡 → 🔴, AI detects the trend, alerts fire.
5. See the WhatsApp-style alert preview + notification center + toasts.
6. Click **🔧 SIMULATE MAINTENANCE** — the vehicle gradually recovers.
7. Try **CRITICAL FAILURE**, **RECOVERY**, **RESET**, and speeds **1x–10x**.
8. Switch between the 5 fleet trucks to load each one's telemetry.

## Architecture

```
index.html                     layout shell
css/styles.css                 design system
js/config.js                   thresholds · scenarios · weights (single source)
js/utils/math.js               lerp · regression · formatting
js/simulation/
  vehicleSimulation.js         one simulation engine per vehicle
  trendDetection.js            slope/stddev trend detection
  healthEngine.js              analyzeVehicleHealth()
js/services/
  aiService.js                 AI wrapper + event timeline
  alertService.js              alerts · notifications · toasts
  audioService.js              optional gated sounds (default off)
js/components/                 one module per UI panel
js/main.js                     single rAF loop wiring everything
```

**One simulation loop.** A single `requestAnimationFrame` loop advances every
vehicle (speed-scaled), runs the AI engine on the active vehicle, and updates
all UI panels from that same state — charts, dashboard, AI and alerts share
one source of truth.

**Simulation controls**

- ▶ START / ⏸ PAUSE / ↻ RESET
- Scenarios: NORMAL · OVERHEATING · LOW VOLTAGE · HIGH VIBRATION ·
  ENGINE INSTABILITY · CRITICAL FAILURE · RECOVERY
- Speed: 1x / 2x / 5x / 10x
- 🔧 SIMULATE MAINTENANCE

**Design notes**

- Health score = weighted multi-parameter score (temperature, voltage, RPM
  stability, vibration, load, speed) with trend-aware penalties, sustained
  danger-zone erosion and a continuous catastrophic-condition multiplier.
- Alerts fire only on real status-band transitions (no per-tick spam).
- Sound is opt-in and never autoplays.
