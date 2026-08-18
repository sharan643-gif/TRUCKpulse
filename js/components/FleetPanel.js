// ============================================================
// TruckPulse — FLEET PANEL
// Multiple simulated vehicles, each with its own live health.
// Selecting a vehicle loads its telemetry into the dashboard.
// ============================================================

export class FleetPanel {
  constructor(container, app) {
    this.el = container;
    this.app = app;
    this.cards = new Map();
    this.render();
  }

  render() {
    this.el.innerHTML = `
      <div class="panel fleet-panel">
        <div class="panel-head">
          <h2 class="panel-title">🚚 Fleet Overview</h2>
          <span class="panel-sub" id="fleet-count">${this.app.trucks.length} vehicles · live</span>
        </div>
        <div class="fleet-list" id="fleet-list"></div>
      </div>
    `;
    const list = this.el.querySelector('#fleet-list');
    for (const truck of this.app.trucks) {
      const card = document.createElement('button');
      card.className = 'fleet-card';
      card.dataset.id = truck.id;
      const routeInfo = truck.route || '';
      card.innerHTML = `
        <div class="fleet-card-top">
          <span class="fleet-name">${truck.name}</span>
          <span class="fleet-status-dot">●</span>
        </div>
        <div class="fleet-plate mono">${truck.plate}</div>
        ${routeInfo ? `<div class="fleet-route">📍 ${routeInfo}</div>` : ''}
        <div class="fleet-health-row">
          <span class="fleet-health-val">--</span><span class="fleet-health-max">/100</span>
          <span class="fleet-band-chip">—</span>
        </div>
        <div class="fleet-bar"><div class="fleet-bar-fill"></div></div>
      `;
      card.addEventListener('click', () => this.app.selectTruck(truck.id));
      list.appendChild(card);
      this.cards.set(truck.id, card);
    }
  }

  update() {
    for (const truck of this.app.trucks) {
      const card = this.cards.get(truck.id);
      if (!card) continue;
      const health = truck.analysis ? truck.analysis.healthScore : null;
      const band = truck.analysis ? truck.analysis.band : null;
      const isActive = truck.id === this.app.activeTruckId;

      card.classList.toggle('active', isActive);

      const dot = card.querySelector('.fleet-status-dot');
      dot.className = `fleet-status-dot band-${(band || 'HEALTHY').toLowerCase()}`;

      const val = card.querySelector('.fleet-health-val');
      const fill = card.querySelector('.fleet-bar-fill');
      const chip = card.querySelector('.fleet-band-chip');

      if (health !== null && health !== undefined) {
        val.textContent = health;
        chip.textContent = band === 'HEALTHY' ? '🟢' : band === 'ATTENTION' ? '🟡' : '🔴';
        chip.className = `fleet-band-chip band-${band.toLowerCase()}`;
        fill.style.width = `${health}%`;
        fill.className = `fleet-bar-fill band-${band.toLowerCase()}`;
      } else {
        val.textContent = '--';
        chip.textContent = '—';
        fill.style.width = '0%';
      }
    }
  }
}
