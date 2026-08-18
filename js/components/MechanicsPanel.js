// ============================================================
// TruckPulse — NEARBY MECHANICS PANEL
// Shows a list of nearby mechanics with ratings, distance,
// contact info, and map markers on the fleet map.
// ============================================================

import { FLEET } from '../config.js';

// Simulated mechanics data near truck routes
const MECHANICS = [
  // Chennai route
  { id: 'mch-01', name: 'Chennai Auto Works', lat: 13.0950, lng: 80.2400, specialty: 'Engine & Transmission', rating: 4.8, phone: '+91 44 2345 6789', hours: '8AM - 8PM', priceRange: '$$', truckId: 'truck-01', status: 'open' },
  { id: 'mch-02', name: 'Express Fleet Services', lat: 13.1400, lng: 80.2000, specialty: 'Heavy Vehicle Repair', rating: 4.5, phone: '+91 44 3456 7890', hours: '24 Hours', priceRange: '$$$', truckId: 'truck-01', status: 'open' },
  { id: 'mch-03', name: 'Highway Diesel Mechanics', lat: 13.2000, lng: 80.1400, specialty: 'Diesel Engine & Fuel System', rating: 4.2, phone: '+91 44 4567 8901', hours: '7AM - 9PM', priceRange: '$$', truckId: 'truck-01', status: 'open' },
  // Bangalore route
  { id: 'mch-04', name: 'Bangalore Truck Care', lat: 12.9900, lng: 77.6200, specialty: 'Full Service Garage', rating: 4.6, phone: '+91 80 5678 9012', hours: '8AM - 7PM', priceRange: '$$$', truckId: 'truck-02', status: 'open' },
  { id: 'mch-05', name: 'Namma Auto Repair', lat: 13.0500, lng: 77.6800, specialty: 'Electrical & AC', rating: 4.3, phone: '+91 80 6789 0123', hours: '9AM - 6PM', priceRange: '$$', truckId: 'truck-02', status: 'open' },
  { id: 'mch-06', name: 'Mysore Road Mechanics', lat: 13.1300, lng: 77.7600, specialty: 'Tyre & Suspension', rating: 4.1, phone: '+91 80 7890 1234', hours: '8AM - 8PM', priceRange: '$', truckId: 'truck-02', status: 'open' },
  // Mumbai route
  { id: 'mch-07', name: 'Mumbai Heavy Repairs', lat: 19.0850, lng: 72.8900, specialty: 'Heavy Duty Engine', rating: 4.7, phone: '+91 22 8901 2345', hours: '24 Hours', priceRange: '$$$', truckId: 'truck-03', status: 'open' },
  { id: 'mch-08', name: 'Western Express Garage', lat: 19.1200, lng: 72.9300, specialty: 'Body & Paint', rating: 4.0, phone: '+91 22 9012 3456', hours: '9AM - 6PM', priceRange: '$$', truckId: 'truck-03', status: 'open' },
  { id: 'mch-09', name: 'Pune Highway Mechanics', lat: 19.1900, lng: 73.0000, specialty: 'Multi-brand Service', rating: 4.4, phone: '+91 22 0123 4567', hours: '7AM - 9PM', priceRange: '$$', truckId: 'truck-03', status: 'closed' },
  // Delhi route
  { id: 'mch-10', name: 'Delhi Truck Stop Garage', lat: 28.6250, lng: 77.2300, specialty: 'Engine & Brakes', rating: 4.3, phone: '+91 11 1234 5678', hours: '24 Hours', priceRange: '$$$', truckId: 'truck-04', status: 'open' },
  { id: 'mch-11', name: 'Rajasthan Road Repairs', lat: 28.6600, lng: 77.3000, specialty: 'Tyre & Wheel Alignment', rating: 3.9, phone: '+91 11 2345 6789', hours: '8AM - 7PM', priceRange: '$', truckId: 'truck-04', status: 'open' },
  { id: 'mch-12', name: 'Jaipur Express Mechanics', lat: 28.6900, lng: 77.3600, specialty: 'Full Service', rating: 4.5, phone: '+91 11 3456 7890', hours: '7AM - 8PM', priceRange: '$$', truckId: 'truck-04', status: 'open' },
  // Kolkata route
  { id: 'mch-13', name: 'Kolkata Fleet Services', lat: 22.5800, lng: 88.3800, specialty: 'Heavy Vehicle Repair', rating: 4.2, phone: '+91 33 4567 8901', hours: '8AM - 8PM', priceRange: '$$', truckId: 'truck-05', status: 'open' },
  { id: 'mch-14', name: 'Howrah Auto Works', lat: 22.6000, lng: 88.4200, specialty: 'Engine Rebuild', rating: 4.6, phone: '+91 33 5678 9012', hours: '9AM - 6PM', priceRange: '$$$', truckId: 'truck-05', status: 'open' },
  { id: 'mch-15', name: 'Bhubaneswar Mechanics', lat: 22.6400, lng: 88.5000, specialty: 'Electrical & Diagnostics', rating: 4.1, phone: '+91 33 6789 0123', hours: '8AM - 7PM', priceRange: '$$', truckId: 'truck-05', status: 'closed' },
  // Hyderabad route
  { id: 'mch-16', name: 'Hyderabad Truck Hub', lat: 17.3950, lng: 78.5050, specialty: 'Transmission & Drivetrain', rating: 4.4, phone: '+91 40 7890 1234', hours: '24 Hours', priceRange: '$$$', truckId: 'truck-06', status: 'open' },
  { id: 'mch-17', name: 'Secunderabad Garage', lat: 17.4300, lng: 78.5450, specialty: 'AC & Cooling System', rating: 4.0, phone: '+91 40 8901 2345', hours: '8AM - 7PM', priceRange: '$$', truckId: 'truck-06', status: 'open' },
  { id: 'mch-18', name: 'Vijayawada Roadside', lat: 17.5000, lng: 78.6150, specialty: 'Emergency Repair', rating: 3.8, phone: '+91 40 9012 3456', hours: '24 Hours', priceRange: '$', truckId: 'truck-06', status: 'open' },
];

// Route start positions for distance calculation
const ROUTE_STARTS = {
  'truck-01': [13.0827, 80.2707],
  'truck-02': [12.9716, 77.5946],
  'truck-03': [19.0760, 72.8777],
  'truck-04': [28.6139, 77.2090],
  'truck-05': [22.5726, 88.3639],
  'truck-06': [17.3850, 78.4867],
};

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function stars(r) {
  const full = Math.floor(r);
  const half = r - full >= 0.3;
  let s = '★'.repeat(full);
  if (half) s += '☆';
  return s;
}

export class MechanicsPanel {
  constructor(container, app) {
    this.el = container;
    this.app = app;
    this.visible = false;
    this.markers = {};
    this.render();
  }

  render() {
    this.el.innerHTML = `
      <div class="panel mechanics-panel">
        <div class="panel-head">
          <h2 class="panel-title">🔧 Nearby Mechanics</h2>
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="panel-sub" id="mech-count">0 found</span>
            <button class="map-toggle-btn" id="mech-toggle" title="Toggle mechanics list">
              <span id="mech-toggle-icon">▶</span>
            </button>
          </div>
        </div>
        <div class="mechanics-container" id="mechanics-container" style="display:none;">
          <div class="mech-list" id="mech-list"></div>
        </div>
      </div>
    `;

    this.el.querySelector('#mech-toggle').addEventListener('click', () => this.toggle());
  }

  toggle() {
    this.visible = !this.visible;
    const container = this.el.querySelector('#mechanics-container');
    const icon = this.el.querySelector('#mech-toggle-icon');

    if (this.visible) {
      container.style.display = 'block';
      icon.textContent = '▼';
      this.update();
    } else {
      container.style.display = 'none';
      icon.textContent = '▶';
    }
  }

  getNearbyMechanics(truckId) {
    const truck = this.app.trucks.find(t => t.id === truckId);
    if (!truck) return [];

    const route = TRUCK_ROUTES[truckId];
    const startIdx = this.app.fleetMap ? this.app.fleetMap.routeProgress[truckId] || 0 : 0;
    const idx = Math.floor(startIdx);
    const pos = route ? route[idx] : ROUTE_STARTS[truckId];

    return MECHANICS
      .filter(m => m.truckId === truckId)
      .map(m => ({
        ...m,
        distance: haversine(pos[0], pos[1], m.lat, m.lng),
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  update() {
    if (!this.visible) return;

    const truckId = this.app.activeTruckId;
    const nearby = this.getNearbyMechanics(truckId);

    const countEl = this.el.querySelector('#mech-count');
    if (countEl) countEl.textContent = `${nearby.length} found`;

    const listEl = this.el.querySelector('#mech-list');
    if (!listEl) return;

    listEl.innerHTML = nearby.map(m => `
      <div class="mech-card" data-id="${m.id}">
        <div class="mech-card-header">
          <span class="mech-icon">${m.status === 'open' ? '🟢' : '🔴'}</span>
          <div class="mech-info">
            <div class="mech-name">${m.name}</div>
            <div class="mech-specialty">${m.specialty}</div>
          </div>
          <div class="mech-dist">${m.distance.toFixed(1)} km</div>
        </div>
        <div class="mech-card-body">
          <div class="mech-rating">
            <span class="mech-stars">${stars(m.rating)}</span>
            <span class="mech-rating-val">${m.rating}</span>
          </div>
          <div class="mech-meta-row">
            <span>📞 ${m.phone}</span>
            <span>⏰ ${m.hours}</span>
          </div>
          <div class="mech-meta-row">
            <span class="mech-price">${m.priceRange}</span>
            <span class="mech-status ${m.status}">${m.status === 'open' ? 'Open Now' : 'Closed'}</span>
          </div>
        </div>
        <button class="mech-navigate-btn" data-lat="${m.lat}" data-lng="${m.lng}" data-name="${m.name}">
          📍 View on Map
        </button>
      </div>
    `).join('');

    // Add click handlers for map navigation
    listEl.querySelectorAll('.mech-navigate-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lat = parseFloat(btn.dataset.lat);
        const lng = parseFloat(btn.dataset.lng);
        const name = btn.dataset.name;
        this.app.fleetMap.panToMechanic(lat, lng, name);
      });
    });
  }
}
