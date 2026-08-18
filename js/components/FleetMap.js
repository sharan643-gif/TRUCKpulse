// ============================================================
// TruckPulse — FLEET MAP
// Interactive map using Leaflet.js + OpenStreetMap (FREE).
// Shows all truck positions with route trails, status popups
// and live movement simulation.
// ============================================================

import { FLEET } from '../config.js';

// Simulated truck route coordinates (Indian highways)
const TRUCK_ROUTES = {
  'truck-01': [
    [13.0827, 80.2707],  // Chennai
    [13.0850, 80.2600], [13.0900, 80.2500], [13.0950, 80.2400],
    [13.1000, 80.2300], [13.1100, 80.2200], [13.1200, 80.2100],
    [13.1400, 80.2000], [13.1600, 80.1800], [13.1800, 80.1600],
    [13.2000, 80.1400], [13.2200, 80.1200], [13.2400, 80.1000],
    [13.2600, 80.0800], [13.2800, 80.0600], [13.3000, 80.0400],
    [13.3200, 80.0200], [13.3400, 80.0000], [13.3600, 79.9800],
    [13.3800, 79.9600], [13.4000, 79.9400], [13.4200, 79.9200],
    [13.4400, 79.9000], [13.4600, 79.8800], [13.4800, 79.8600],
    [13.5000, 79.8400], [13.5200, 79.8200], [13.5400, 79.8000],
    [13.5600, 79.7800], [13.5800, 79.7600], [13.6000, 79.7400],
    [13.6200, 79.7200], [13.6400, 79.7000], [13.6600, 79.6800],
    [13.6800, 79.6600], [13.7000, 79.6400], [13.7200, 79.6200],
    [13.7400, 79.6000], [13.7600, 79.5800], [13.7800, 79.5600],
  ],
  'truck-02': [
    [12.9716, 77.5946],  // Bangalore
    [12.9750, 77.6000], [12.9800, 77.6050], [12.9850, 77.6100],
    [12.9900, 77.6200], [13.0000, 77.6300], [13.0100, 77.6400],
    [13.0200, 77.6500], [13.0300, 77.6600], [13.0400, 77.6700],
    [13.0500, 77.6800], [13.0600, 77.6900], [13.0700, 77.7000],
    [13.0800, 77.7100], [13.0900, 77.7200], [13.1000, 77.7300],
    [13.1100, 77.7400], [13.1200, 77.7500], [13.1300, 77.7600],
    [13.1400, 77.7700], [13.1500, 77.7800], [13.1600, 77.7900],
    [13.1700, 77.8000], [13.1800, 77.8100], [13.1900, 77.8200],
    [13.2000, 77.8300], [13.2100, 77.8400], [13.2200, 77.8500],
    [13.2300, 77.8600], [13.2400, 77.8700],
  ],
  'truck-03': [
    [19.0760, 72.8777],  // Mumbai
    [19.0800, 72.8800], [19.0850, 72.8900], [19.0900, 72.9000],
    [19.1000, 72.9100], [19.1100, 72.9200], [19.1200, 72.9300],
    [19.1300, 72.9400], [19.1400, 72.9500], [19.1500, 72.9600],
    [19.1600, 72.9700], [19.1700, 72.9800], [19.1800, 72.9900],
    [19.1900, 73.0000], [19.2000, 73.0100], [19.2100, 73.0200],
    [19.2200, 73.0300], [19.2300, 73.0400], [19.2400, 73.0500],
    [19.2500, 73.0600],
  ],
  'truck-04': [
    [28.6139, 77.2090],  // Delhi
    [28.6170, 77.2150], [28.6200, 77.2200], [28.6250, 77.2300],
    [28.6300, 77.2400], [28.6350, 77.2500], [28.6400, 77.2600],
    [28.6450, 77.2700], [28.6500, 77.2800], [28.6550, 77.2900],
    [28.6600, 77.3000], [28.6650, 77.3100], [28.6700, 77.3200],
    [28.6750, 77.3300], [28.6800, 77.3400], [28.6850, 77.3500],
    [28.6900, 77.3600], [28.6950, 77.3700], [28.7000, 77.3800],
    [28.7050, 77.3900],
  ],
  'truck-05': [
    [22.5726, 88.3639],  // Kolkata
    [22.5760, 88.3700], [22.5800, 88.3800], [22.5850, 88.3900],
    [22.5900, 88.4000], [22.5950, 88.4100], [22.6000, 88.4200],
    [22.6050, 88.4300], [22.6100, 88.4400], [22.6150, 88.4500],
    [22.6200, 88.4600], [22.6250, 88.4700], [22.6300, 88.4800],
    [22.6350, 88.4900], [22.6400, 88.5000], [22.6450, 88.5100],
    [22.6500, 88.5200], [22.6550, 88.5300], [22.6600, 88.5400],
    [22.6650, 88.5500],
  ],
  'truck-06': [
    [17.3850, 78.4867],  // Hyderabad
    [17.3900, 78.4950], [17.3950, 78.5050], [17.4000, 78.5150],
    [17.4100, 78.5250], [17.4200, 78.5350], [17.4300, 78.5450],
    [17.4400, 78.5550], [17.4500, 78.5650], [17.4600, 78.5750],
    [17.4700, 78.5850], [17.4800, 78.5950], [17.4900, 78.6050],
    [17.5000, 78.6150], [17.5100, 78.6250], [17.5200, 78.6350],
    [17.5300, 78.6450], [17.5400, 78.6550], [17.5500, 78.6650],
    [17.5600, 78.6750],
  ],
};

export class FleetMap {
  constructor(container, app) {
    this.el = container;
    this.app = app;
    this.map = null;
    this.markers = {};
    this.routeLines = {};
    this.routeProgress = {};
    this.tileLoaded = false;
    this.visible = false;
    this.render();
  }

  render() {
    this.el.innerHTML = `
      <div class="panel map-panel">
        <div class="panel-head">
          <h2 class="panel-title">🗺️ Fleet Map</h2>
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="panel-sub" id="map-count">5 vehicles tracked</span>
            <button class="map-toggle-btn" id="map-toggle" title="Toggle map view">
              <span id="map-toggle-icon">▶</span>
            </button>
          </div>
        </div>
        <div class="map-container" id="map-container" style="display:none;">
          <div id="fleet-map" style="width:100%; height:380px; border-radius:10px;"></div>
          <div class="map-legend">
            <span class="legend-item"><span class="legend-dot" style="background:#34d399;"></span> Healthy</span>
            <span class="legend-item"><span class="legend-dot" style="background:#fbbf24;"></span> Attention</span>
            <span class="legend-item"><span class="legend-dot" style="background:#f87171;"></span> Critical</span>
            <span class="legend-item"><span class="legend-dot" style="background:#22d3ee;"></span> Selected</span>
          </div>
        </div>
      </div>
    `;

    // Init route progress
    for (const t of FLEET) {
      this.routeProgress[t.id] = 0;
    }

    this.el.querySelector('#map-toggle').addEventListener('click', () => this.toggle());
  }

  toggle() {
    this.visible = !this.visible;
    const container = this.el.querySelector('#map-container');
    const icon = this.el.querySelector('#map-toggle-icon');

    if (this.visible) {
      container.style.display = 'block';
      icon.textContent = '▼';
      if (!this.map) this.initMap();
      setTimeout(() => this.map && this.map.invalidateSize(), 100);
    } else {
      container.style.display = 'none';
      icon.textContent = '▶';
    }
  }

  initMap() {
    // Wait for Leaflet to be available
    if (typeof L === 'undefined') {
      console.warn('Leaflet not loaded yet, retrying...');
      setTimeout(() => this.initMap(), 200);
      return;
    }

    // Dark-themed map
    this.map = L.map('fleet-map', {
      zoomControl: true,
      attributionControl: false,
    }).setView([20.5, 78.9], 5); // Center of India

    // Free OpenStreetMap tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(this.map);

    // Add attribution
    L.control.attribution({ position: 'bottomright', prefix: '' })
      .addAttribution('© <a href="https://carto.com/">CARTO</a>')
      .addTo(this.map);

    // Add truck markers
    for (const truck of this.app.trucks) {
      this.addTruckMarker(truck);
    }

    // Add mechanic markers
    this.addMechanicMarkers();

    this.tileLoaded = true;
  }

  addTruckMarker(truck) {
    const route = TRUCK_ROUTES[truck.id] || TRUCK_ROUTES['truck-01'];
    const startIdx = Math.floor(Math.random() * Math.max(1, route.length - 10));
    this.routeProgress[truck.id] = startIdx;

    const pos = route[startIdx];

    // Create custom icon
    const icon = L.divIcon({
      className: 'truck-marker',
      html: `<div class="marker-inner" data-id="${truck.id}">
        <span class="marker-emoji">🚛</span>
        <span class="marker-label">${truck.name}</span>
      </div>`,
      iconSize: [40, 32],
      iconAnchor: [20, 32],
    });

    const marker = L.marker(pos, { icon }).addTo(this.map);
    this.markers[truck.id] = marker;

    // Route trail
    const trailColor = truck.id === 'truck-04' ? '#f87171' :
                       truck.id === 'truck-03' ? '#fbbf24' : '#34d399';
    const trail = L.polyline([pos], {
      color: trailColor,
      weight: 2.5,
      opacity: 0.6,
      dashArray: '6 4',
    }).addTo(this.map);
    this.routeLines[truck.id] = { trail, visited: [pos] };

    // Popup
    const popupHtml = this.buildPopup(truck);
    marker.bindPopup(popupHtml, {
      className: 'truck-popup',
      maxWidth: 260,
      offset: [0, -10],
    });

    // Click to select truck
    marker.on('click', () => {
      this.app.selectTruck(truck.id);
    });
  }

  buildPopup(truck) {
    const a = truck.analysis;
    const health = a ? a.healthScore : '--';
    const band = a ? a.band : 'HEALTHY';
    const risk = a ? a.riskLevel : 'LOW';
    const scenario = truck.sim.scenarioKey.replace(/_/g, ' ');
    const speed = Math.round(truck.sim.state.speed);
    const temp = Math.round(truck.sim.state.coolantTemp);

    const bandColor = band === 'CRITICAL' ? '#f87171' : band === 'ATTENTION' ? '#fbbf24' : '#34d399';

    return `
      <div class="popup-content">
        <div class="popup-header">
          <span class="popup-icon">🚛</span>
          <div>
            <div class="popup-name">${truck.name}</div>
            <div class="popup-plate mono">${truck.plate}</div>
          </div>
        </div>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="popup-stat-label">Health</span>
            <span class="popup-stat-val" style="color:${bandColor}">${health}/100</span>
          </div>
          <div class="popup-stat">
            <span class="popup-stat-label">Status</span>
            <span class="popup-stat-val" style="color:${bandColor}">${band}</span>
          </div>
          <div class="popup-stat">
            <span class="popup-stat-label">Speed</span>
            <span class="popup-stat-val">${speed} km/h</span>
          </div>
          <div class="popup-stat">
            <span class="popup-stat-label">Temp</span>
            <span class="popup-stat-val">${temp}°C</span>
          </div>
        </div>
        <div class="popup-scenario">Scenario: ${scenario}</div>
      </div>
    `;
  }

  addMechanicMarkers() {
    if (!this.map || typeof L === 'undefined') return;

    // Remove old mechanic markers
    if (this.mechanicMarkers) {
      this.mechanicMarkers.forEach(m => this.map.removeLayer(m));
    }
    this.mechanicMarkers = [];

    const truckId = this.app.activeTruckId;
    const truck = this.app.trucks.find(t => t.id === truckId);
    if (!truck) return;

    const route = TRUCK_ROUTES[truckId] || TRUCK_ROUTES['truck-01'];
    const startIdx = this.routeProgress[truckId] || 0;
    const idx = Math.floor(startIdx);
    const pos = route[idx];

    // Mechanic data (subset for display)
    const mechanics = [
      { name: 'Chennai Auto Works', lat: 13.0950, lng: 80.2400, specialty: 'Engine & Transmission', rating: 4.8, phone: '+91 44 2345 6789' },
      { name: 'Express Fleet Services', lat: 13.1400, lng: 80.2000, specialty: 'Heavy Vehicle Repair', rating: 4.5, phone: '+91 44 3456 7890' },
      { name: 'Highway Diesel Mechanics', lat: 13.2000, lng: 80.1400, specialty: 'Diesel Engine & Fuel System', rating: 4.2, phone: '+91 44 4567 8901' },
      { name: 'Bangalore Truck Care', lat: 12.9900, lng: 77.6200, specialty: 'Full Service Garage', rating: 4.6, phone: '+91 80 5678 9012' },
      { name: 'Mumbai Heavy Repairs', lat: 19.0850, lng: 72.8900, specialty: 'Heavy Duty Engine', rating: 4.7, phone: '+91 22 8901 2345' },
      { name: 'Delhi Truck Stop Garage', lat: 28.6250, lng: 77.2300, specialty: 'Engine & Brakes', rating: 4.3, phone: '+91 11 1234 5678' },
      { name: 'Kolkata Fleet Services', lat: 22.5800, lng: 88.3800, specialty: 'Heavy Vehicle Repair', rating: 4.2, phone: '+91 33 4567 8901' },
      { name: 'Hyderabad Truck Hub', lat: 17.3950, lng: 78.5050, specialty: 'Transmission & Drivetrain', rating: 4.4, phone: '+91 40 7890 1234' },
    ];

    mechanics.forEach(m => {
      const icon = L.divIcon({
        className: 'mechanic-marker',
        html: `<div class="mechanic-marker-inner">
          <span class="mechanic-dot"></span>
          <span class="mechanic-emoji">🔧</span>
          <span class="mechanic-label">${m.name.split(' ')[0]}</span>
        </div>`,
        iconSize: [36, 28],
        iconAnchor: [18, 28],
      });

      const marker = L.marker([m.lat, m.lng], { icon }).addTo(this.map);

      const popupHtml = `
        <div class="popup-content">
          <div class="popup-header">
            <span class="popup-icon">🔧</span>
            <div>
              <div class="popup-name">${m.name}</div>
              <div class="popup-plate">${m.specialty}</div>
            </div>
          </div>
          <div class="popup-stats">
            <div class="popup-stat">
              <span class="popup-stat-label">Rating</span>
              <span class="popup-stat-val" style="color:#fbbf24">★ ${m.rating}</span>
            </div>
            <div class="popup-stat">
              <span class="popup-stat-label">Phone</span>
              <span class="popup-stat-val" style="font-size:11px">${m.phone}</span>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'truck-popup',
        maxWidth: 260,
        offset: [0, -10],
      });

      this.mechanicMarkers.push(marker);
    });
  }

  panToMechanic(lat, lng, name) {
    if (!this.visible) this.toggle();
    setTimeout(() => {
      if (this.map) {
        this.map.setView([lat, lng], 14, { animate: true });
        // Find and open the mechanic popup
        this.mechanicMarkers.forEach(m => {
          const ll = m.getLatLng();
          if (Math.abs(ll.lat - lat) < 0.001 && Math.abs(ll.lng - lng) < 0.001) {
            m.openPopup();
          }
        });
      }
    }, 200);
  }

  update() {
    if (!this.visible || !this.map) return;

    for (const truck of this.app.trucks) {
      const route = TRUCK_ROUTES[truck.id];
      if (!route) continue;

      // Advance along route
      this.routeProgress[truck.id] = (this.routeProgress[truck.id] + 0.15) % route.length;
      const idx = Math.floor(this.routeProgress[truck.id]);
      const frac = this.routeProgress[truck.id] - idx;
      const nextIdx = (idx + 1) % route.length;

      const lat = route[idx][0] + (route[nextIdx][0] - route[idx][0]) * frac;
      const lng = route[idx][1] + (route[nextIdx][1] - route[idx][1]) * frac;

      // Update marker position
      const marker = this.markers[truck.id];
      if (marker) {
        marker.setLatLng([lat, lng]);

        // Update popup content
        const popupHtml = this.buildPopup(truck);
        if (marker.getPopup() && marker.getPopup().isOpen()) {
          marker.getPopup().setContent(popupHtml);
        }

        // Update marker icon based on status
        const a = truck.analysis;
        const band = a ? a.band : 'HEALTHY';
        const isActive = truck.id === this.app.activeTruckId;
        const dotColor = isActive ? '#22d3ee' :
          band === 'CRITICAL' ? '#f87171' :
          band === 'ATTENTION' ? '#fbbf24' : '#34d399';

        const icon = L.divIcon({
          className: 'truck-marker',
          html: `<div class="marker-inner ${isActive ? 'marker-active' : ''}" data-id="${truck.id}">
            <span class="marker-dot" style="background:${dotColor};box-shadow:0 0 8px ${dotColor}"></span>
            <span class="marker-emoji">🚛</span>
            <span class="marker-label">${truck.name}</span>
          </div>`,
          iconSize: [40, 32],
          iconAnchor: [20, 32],
        });
        marker.setIcon(icon);
      }

      // Update route trail
      const rl = this.routeLines[truck.id];
      if (rl) {
        rl.visited.push([lat, lng]);
        if (rl.visited.length > 80) rl.visited.shift();
        rl.trail.setLatLngs(rl.visited);
      }
    }
  }
}
