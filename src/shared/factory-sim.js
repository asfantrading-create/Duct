'use strict';
/**
 * Discrete-time production simulation of a rectangular-duct fabrication line.
 * One tick = one simulated minute. Pieces flow through STATIONS in order; each station has a nominal
 * rate (pieces/hour) scaled by operators and machine speed; random breakdowns (MTBF/MTTR) reduce availability.
 * KPIs follow the standard OEE definition: OEE = Availability × Performance × Quality.
 */
const { STATIONS } = require('./data/machines');
const { ductWeightKg, ductSurfaceM2 } = require('./engineering');

const DEFAULT_PIECE = { aMm: 600, bMm: 400, lengthM: 1.2, thicknessMm: 0.7 };

function mulberry32(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

class FactorySim {
  constructor(opts = {}) {
    this.rand = mulberry32(opts.seed || 12345);
    this.piece = { ...DEFAULT_PIECE, ...(opts.piece || {}) };
    this.controls = { speedPct: 100, operatorsPct: 100, insulationShare: 0.3, scrapRatePct: 4, breakdowns: true, shiftHours: 8, tariffUSDkWh: 0.08, coilCostUSDkg: 1.25, targetPiecesPerShift: 120, ...(opts.controls || {}) };
    this.stations = STATIONS.map((s) => ({ ...s, queue: 0, busy: 0, down: 0, downMinutes: 0, runMinutes: 0, produced: 0, scrapped: 0, energyKwh: 0, progress: 0, status: 'idle' }));
    this.minute = 0; this.produced = 0; this.scrapped = 0; this.energyKwh = 0; this.coilKg = 0; this.areaM2 = 0; this.released = 0;
    this.history = []; this.events = [];
    this.weightPerPiece = ductWeightKg({ shape: 'rectangular', ...this.piece }); this.areaPerPiece = ductSurfaceM2({ shape: 'rectangular', ...this.piece });
  }
  setControl(k, v) { this.controls[k] = v; }
  /** Effective rate (pieces / minute) of a station under current controls. */
  rateOf(st) {
    let r = st.ratePiecesPerHour / 60;
    r *= this.controls.speedPct / 100;
    r *= Math.min(1.3, Math.max(0.3, this.controls.operatorsPct / 100));
    if (st.id === 'insulation') r /= Math.max(0.05, this.controls.insulationShare); // only a share of pieces need insulation, so effective capacity is higher
    return r;
  }
  step(minutes = 1) {
    for (let i = 0; i < minutes; i++) this._tick();
    return this.kpis();
  }
  _tick() {
    this.minute++;
    const c = this.controls;
    // release raw blanks into the first station at the target pace (plus 10% buffer)
    const releaseRate = (c.targetPiecesPerShift / (c.shiftHours * 60)) * 1.1;
    this.releaseAcc = (this.releaseAcc || 0) + releaseRate;
    while (this.releaseAcc >= 1) { this.stations[0].queue++; this.releaseAcc--; this.released++; this.coilKg += this.weightPerPiece * 1.06; }
    for (let i = 0; i < this.stations.length; i++) {
      const st = this.stations[i];
      // breakdowns: MTBF ≈ 6 h, MTTR ≈ 20 min (per station, scaled by speed: faster → more wear)
      if (st.down > 0) { st.down--; st.downMinutes++; st.status = 'down'; continue; }
      if (c.breakdowns && this.rand() < (1 / 360) * (0.6 + 0.4 * (c.speedPct / 100)) && st.machineIds.length) { st.down = 10 + Math.floor(this.rand() * 25); this.events.push({ minute: this.minute, station: st.id, type: 'breakdown', minutes: st.down }); if (this.events.length > 200) this.events.shift(); continue; }
      const rate = this.rateOf(st);
      if (st.queue <= 0 && st.progress <= 0) { st.status = 'idle'; continue; }
      st.status = 'running'; st.runMinutes++;
      st.progress += rate;
      while (st.progress >= 1 && (st.queue > 0)) {
        st.progress -= 1; st.queue--; st.produced++;
        st.energyKwh += st.kwhPerPiece * (0.8 + 0.4 * (c.speedPct / 100)); this.energyKwh += st.kwhPerPiece * (0.8 + 0.4 * (c.speedPct / 100));
        // scrap at cutting/forming/assembly proportional to configured rate (spread over stations)
        const scrapP = (c.scrapRatePct / 100) / 3;
        if (['cutting', 'forming', 'assembly'].includes(st.id) && this.rand() < scrapP) { st.scrapped++; this.scrapped++; continue; }
        if (st.id === 'insulation' || i === this.stations.length - 1) { /* handled below */ }
        const next = this.stations[i + 1];
        if (!next) { this.produced++; this.areaM2 += this.areaPerPiece; }
        else if (next.id === 'insulation' && this.rand() >= c.insulationShare) { this.stations[i + 2].queue++; } // skip insulation
        else next.queue++;
      }
      if (st.queue <= 0) st.progress = Math.min(st.progress, 0.999);
      // base load energy while running (utilities: compressor/fume extraction share)
      this.energyKwh += 0.02;
    }
    if (this.minute % 5 === 0) { this.history.push({ minute: this.minute, produced: this.produced, wip: this.wip(), energyKwh: this.energyKwh, oee: this.kpis().oee }); if (this.history.length > 288) this.history.shift(); }
  }
  wip() { return this.stations.reduce((s, st) => s + st.queue, 0); }
  bottleneck() { return this.stations.reduce((b, st) => (st.queue > (b ? b.queue : -1) ? st : b), null); }
  kpis() {
    const c = this.controls; const minutes = Math.max(1, this.minute);
    const plannedMinutes = minutes;
    const downMinutes = this.stations.reduce((s, st) => s + st.downMinutes, 0) / this.stations.length;
    const availability = Math.max(0, Math.min(1, 1 - downMinutes / plannedMinutes));
    const idealRate = Math.min(...this.stations.map((st) => st.ratePiecesPerHour / 60)); // bottleneck ideal rate
    const targetRate = c.targetPiecesPerShift / (c.shiftHours * 60);
    const performance = Math.max(0, Math.min(1, (this.produced + this.scrapped) / (Math.min(idealRate, targetRate) * plannedMinutes * availability || 1)));
    const quality = this.produced + this.scrapped > 0 ? this.produced / (this.produced + this.scrapped) : 1;
    const oee = availability * performance * quality;
    const hours = minutes / 60;
    const piecesPerHour = this.produced / hours;
    const shiftProjection = piecesPerHour * c.shiftHours;
    const tonsPerMonth = (shiftProjection * this.weightPerPiece * 26) / 1000; // 26 working days, one shift
    const bn = this.bottleneck();
    return {
      minute: this.minute, produced: this.produced, scrapped: this.scrapped, released: this.released, wip: this.wip(),
      availability, performance, quality, oee, piecesPerHour, shiftProjection, targetPiecesPerShift: c.targetPiecesPerShift,
      energyKwh: this.energyKwh, kwhPerPiece: this.produced ? this.energyKwh / this.produced : 0, energyCostUSD: this.energyKwh * c.tariffUSDkWh,
      coilKg: this.coilKg, coilCostUSD: this.coilKg * c.coilCostUSDkg, areaM2: this.areaM2, tonsPerMonth, weightPerPiece: this.weightPerPiece, areaPerPiece: this.areaPerPiece,
      bottleneck: bn ? bn.id : null, stations: this.stations.map((st) => ({ id: st.id, queue: st.queue, status: st.status, produced: st.produced, scrapped: st.scrapped, downMinutes: st.downMinutes, runMinutes: st.runMinutes, utilization: st.runMinutes / Math.max(1, this.minute), energyKwh: st.energyKwh, rate: this.rateOf(st) * 60 })),
      events: this.events.slice(-8),
    };
  }
}

module.exports = { FactorySim, DEFAULT_PIECE };
