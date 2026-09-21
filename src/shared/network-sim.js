'use strict';
/**
 * Steady-state duct network solver for the building digital twin.
 * Network: AHU fan → filter → coil → main duct → junctions → branches → terminals (diffusers / VAV).
 * Each element is modelled as Δp = k·Q² (k from geometry at the operating flow, 2 refinement passes);
 * parallel paths combine as 1/√k_eq = Σ 1/√k_i. The fan is a parabolic curve scaled by fan-law speed ratio.
 */
const E = require('./engineering');

/** Default network (flows in L/s at design). Shape sizes are computed by equal friction unless given. */
function defaultTopology() {
  return {
    fan: { dpShutoffPa: 1400, qFreeDeliveryLps: 3600, efficiency: 0.62, ratedKw: 3.0 },
    filter: { cleanDpPa: 80 }, coil: { dpPa: 120 },
    frictionRatePaPerM: 0.9, pressureClassPa: 500, supplyTempC: 13,
    main: { id: 'M0', ar: 'الدكت الرئيسي', en: 'Main duct', shape: 'rectangular', lengthM: 12, fittings: [{ id: 'elbow90_rect_radius', C: 0.21, qty: 1 }], location: 'roof' },
    junctions: [
      { id: 'J1', trunk: { id: 'M1', ar: 'الرئيسي – المقطع 2', en: 'Main – section 2', shape: 'rectangular', lengthM: 8, fittings: [{ id: 'tee_main', C: 0.15, qty: 1 }], location: 'ceiling' },
        branch: { id: 'B1', ar: 'فرع A – المكاتب', en: 'Branch A – offices', shape: 'rectangular', lengthM: 10, fittings: [{ id: 'tee_branch', C: 0.6, qty: 1 }, { id: 'elbow90_rect_mitre_vanes', C: 0.15, qty: 1 }], location: 'ceiling', terminals: [{ id: 'D1', qLps: 200 }, { id: 'D2', qLps: 200 }, { id: 'D3', qLps: 200 }] } },
      { id: 'J2', trunk: null,
        branch: { id: 'B2', ar: 'فرع B – قاعة الاجتماعات (VAV)', en: 'Branch B – meeting hall (VAV)', shape: 'round', lengthM: 12, fittings: [{ id: 'tee_branch', C: 0.6, qty: 1 }, { id: 'elbow90_round_r15', C: 0.15, qty: 2 }], location: 'ceiling', vav: true, terminals: [{ id: 'D4', qLps: 250 }, { id: 'D5', qLps: 250 }] },
        branch2: { id: 'B3', ar: 'فرع C – المعمل', en: 'Branch C – laboratory', shape: 'round', lengthM: 15, fittings: [{ id: 'tee_branch', C: 0.6, qty: 1 }, { id: 'elbow90_round_r15', C: 0.15, qty: 3 }], location: 'ceiling', terminals: [{ id: 'D6', qLps: 150 }, { id: 'D7', qLps: 150 }, { id: 'D8', qLps: 150 }] } },
    ],
    terminalDpPa: 25, // diffuser + flexible connection at design flow
  };
}

function branchDesignFlow(b) { return b.terminals.reduce((s, t) => s + t.qLps, 0); }

/** Sizes all segments with equal friction (Pa/m) at design flows. Returns segments map. */
function sizeNetwork(topo) {
  const segs = {};
  const flows = {};
  const bFlows = [];
  for (const j of topo.junctions) { for (const key of ['branch', 'branch2']) if (j[key]) bFlows.push(branchDesignFlow(j[key])); }
  const total = bFlows.reduce((a, b) => a + b, 0);
  flows.M0 = total;
  let remaining = total;
  for (const j of topo.junctions) {
    if (j.branch) flows[j.branch.id] = branchDesignFlow(j.branch);
    if (j.branch2) flows[j.branch2.id] = branchDesignFlow(j.branch2);
    remaining -= (j.branch ? flows[j.branch.id] : 0) + (j.branch2 ? flows[j.branch2.id] : 0);
    if (j.trunk) flows[j.trunk.id] = remaining;
  }
  const size = (seg, qLps) => {
    const q = qLps / 1000;
    const dMm = E.diameterForFriction(q, topo.frictionRatePaPerM);
    let dims;
    if (seg.shape === 'round') { const d = E.roundUpToStandard(dMm); dims = { dMm: d }; }
    else { const r = E.rectangularForEquivalent(dMm, { maxAspect: 3 }); dims = { aMm: r.a, bMm: r.b }; }
    segs[seg.id] = { ...seg, ...dims, designQLps: qLps };
  };
  size(topo.main, flows.M0);
  for (const j of topo.junctions) { if (j.trunk) size(j.trunk, flows[j.trunk.id]); if (j.branch) size(j.branch, flows[j.branch.id]); if (j.branch2) size(j.branch2, flows[j.branch2.id]); }
  return { segs, designTotalLps: total };
}

/** Resistance coefficient k (Pa/(m³/s)²) of a duct segment at flow q (m³/s), including fittings and terminal. */
function segmentK(seg, qM3s, topo, controls, env) {
  const q = Math.max(1e-4, qM3s);
  const a = E.analyseSegment({ shape: seg.shape === 'round' ? 'round' : 'rect', dMm: seg.dMm, aMm: seg.aMm, bMm: seg.bMm, qM3s: q, lengthM: seg.lengthM, roughness: controls.roughness, fittings: seg.fittings, tempC: env.tempC, altitudeM: env.altitudeM });
  let dp = a.totalPa;
  if (seg.terminals) {
    const damperC = E.damperCoefficient(controls.dampers[seg.id] ?? 0);
    const qDesign = seg.designQLps / 1000;
    dp += topo.terminalDpPa * Math.pow(q / qDesign, 2) + damperC * a.pv;
    if (seg.vav) dp += (controls.vavMinDpPa ?? 60) * Math.pow(q / qDesign, 2);
  }
  return { k: dp / (q * q), analysis: a };
}

function solve(topo, sized, controls, env) {
  const rho = E.airDensity(env.tempC, E.pressureAtAltitude(env.altitudeM));
  const segs = sized.segs;
  const filterDp = topo.filter.cleanDpPa * (1 + 3 * (controls.filterLoading ?? 0));
  const qDesignTotal = sized.designTotalLps / 1000;
  const kFilter = filterDp / (qDesignTotal * qDesignTotal), kCoil = topo.coil.dpPa / (qDesignTotal * qDesignTotal);
  // initial flows = design; iterate to update k with actual velocities
  const flows = {}; for (const id in segs) flows[id] = segs[id].designQLps / 1000;
  let result = null;
  for (let pass = 0; pass < 3; pass++) {
    const K = {}; const A = {};
    for (const id in segs) { const r = segmentK(segs[id], flows[id], topo, controls, env); K[id] = r.k; A[id] = r.analysis; }
    // combine from the last junction backwards
    const jn = topo.junctions;
    let kDown = null; // equivalent k downstream of the current junction (through trunk)
    const kEqAt = {};
    for (let i = jn.length - 1; i >= 0; i--) {
      const j = jn[i];
      const paths = [];
      if (j.branch) paths.push(K[j.branch.id]);
      if (j.branch2) paths.push(K[j.branch2.id]);
      if (j.trunk && kDown !== null) paths.push(K[j.trunk.id] + kDown);
      const invSum = paths.reduce((s, k) => s + 1 / Math.sqrt(k), 0);
      kEqAt[j.id] = 1 / (invSum * invSum);
      kDown = kEqAt[j.id];
    }
    const kSystem = kFilter + kCoil + K.M0 + kDown;
    const op = E.operatingPoint({ dpShutoff: topo.fan.dpShutoffPa, qFreeDelivery: topo.fan.qFreeDeliveryLps / 1000, speedRatio: (controls.fanSpeedPct ?? 100) / 100 }, kSystem);
    // distribute
    flows.M0 = op.q;
    let qIn = op.q;
    for (let i = 0; i < jn.length; i++) {
      const j = jn[i];
      const paths = [];
      if (j.branch) paths.push({ id: j.branch.id, k: K[j.branch.id] });
      if (j.branch2) paths.push({ id: j.branch2.id, k: K[j.branch2.id] });
      if (j.trunk) { const down = i + 1 < jn.length ? kEqAt[jn[i + 1].id] : 0; paths.push({ id: j.trunk.id, k: K[j.trunk.id] + down }); }
      const invSum = paths.reduce((s, p) => s + 1 / Math.sqrt(p.k), 0);
      for (const p of paths) flows[p.id] = qIn * (1 / Math.sqrt(p.k)) / invSum;
      if (j.trunk) qIn = flows[j.trunk.id];
    }
    result = { op, K, A, kSystem, filterDp };
  }
  // assemble outputs
  const { op, A, filterDp: fDp } = result;
  const fanPowerW = E.fanPowerW(op.q, op.dp, topo.fan.efficiency);
  let p = op.dp - fDp - topo.coil.dpPa; // static after coil (ignoring velocity head for the twin display)
  const out = { fan: { qLps: op.q * 1000, dpPa: op.dp, powerKw: fanPowerW / 1000, ratedKw: topo.fan.ratedKw, speedPct: controls.fanSpeedPct ?? 100 }, filterDpPa: fDp, coilDpPa: topo.coil.dpPa, segments: {}, terminals: [], alarms: [], totals: {} };
  const leakCL = E.LEAKAGE_CLASSES[controls.sealClass || 'B'];
  let leakTotalLps = 0, heatGainW = 0;
  const walk = (seg, pIn, tIn) => {
    const q = flows[seg.id]; const a = A[seg.id];
    const dpDuct = a.frictionTotal + a.fittingsTotal;
    const pMean = pIn - dpDuct / 2;
    const cl = seg.shape === 'round' ? leakCL.round : leakCL.rectangular;
    const leak = E.leakageLps(cl, a.surfaceM2, Math.max(0, pMean));
    leakTotalLps += leak;
    const ins = controls.insulation || { k: null, mm: 0 };
    const U = E.ductUValue({ v: a.v, insulationK: ins.k, insulationM: (ins.mm || 0) / 1000 });
    const ambient = seg.location === 'roof' ? env.tempC : env.plenumTempC;
    const hg = E.ductHeatGain({ tInC: tIn, tAmbC: ambient, qM3s: q, surfaceM2: a.surfaceM2, U, rho });
    heatGainW += hg.heatGainW;
    const condens = E.condensationRisk(hg.surfaceOutsideTempC, ambient, seg.location === 'roof' ? env.rhPct : Math.min(env.rhPct, 60));
    const pOut = pIn - dpDuct;
    out.segments[seg.id] = { id: seg.id, ar: seg.ar, en: seg.en, shape: seg.shape, dMm: seg.dMm, aMm: seg.aMm, bMm: seg.bMm, lengthM: seg.lengthM, qLps: q * 1000, designQLps: seg.designQLps, v: a.v, pv: a.pv, frictionPerM: a.frictionPerM, dpPa: dpDuct, pInPa: pIn, pOutPa: pOut, leakLps: leak, tInC: tIn, tOutC: hg.tOut, surfaceTempC: hg.surfaceOutsideTempC, condensation: condens, U, surfaceM2: a.surfaceM2, location: seg.location, vav: !!seg.vav, damperDeg: controls.dampers[seg.id] ?? 0 };
    if (seg.terminals) {
      const qDelivered = q * 1000 - leak;
      const per = qDelivered / seg.terminals.length;
      for (const t of seg.terminals) out.terminals.push({ id: t.id, branch: seg.id, qLps: per, designQLps: t.qLps, ratio: per / t.qLps, tempC: hg.tOut });
    }
    return { pOut, tOut: hg.tOut };
  };
  let node = walk(segs.M0, p, topo.supplyTempC);
  for (const j of topo.junctions) {
    if (j.branch) walk(segs[j.branch.id], node.pOut, node.tOut);
    if (j.branch2) walk(segs[j.branch2.id], node.pOut, node.tOut);
    if (j.trunk) node = walk(segs[j.trunk.id], node.pOut, node.tOut);
  }
  // main/trunk leakage is not carried by the flow solver: deduct it proportionally so delivered + leakage = fan flow
  const branchLeak = Object.values(out.segments).filter((s) => segs[s.id].terminals).reduce((s, x) => s + x.leakLps, 0);
  const rawDelivered = out.terminals.reduce((s, t) => s + t.qLps, 0);
  const scale = rawDelivered > 0 ? Math.max(0, op.q * 1000 - leakTotalLps) / rawDelivered : 1;
  for (const t of out.terminals) { t.qLps *= scale; t.ratio = t.qLps / t.designQLps; }
  const totalDelivered = out.terminals.reduce((s, t) => s + t.qLps, 0);
  out.totals = { designLps: sized.designTotalLps, deliveredLps: totalDelivered, leakLps: leakTotalLps, leakPct: (leakTotalLps / Math.max(1, op.q * 1000)) * 100, heatGainKw: heatGainW / 1000, fanKw: fanPowerW / 1000, maxStaticPa: p, coolingLossKwEquivalent: heatGainW / 1000 };
  // alarms
  const maxV = Math.max(...Object.values(out.segments).map((s) => s.v));
  if (p > topo.pressureClassPa) out.alarms.push({ level: 'crit', id: 'static_high', ar: `الضغط الاستاتيكي ${p.toFixed(0)} باسكال يتجاوز فئة الضغط ${topo.pressureClassPa}`, en: `Static pressure ${p.toFixed(0)} Pa exceeds pressure class ${topo.pressureClassPa} Pa` });
  if (fDp > topo.filter.cleanDpPa * 2.5) out.alarms.push({ level: 'warn', id: 'filter', ar: `فرق ضغط الفلتر ${fDp.toFixed(0)} باسكال — استبدال مطلوب`, en: `Filter ΔP ${fDp.toFixed(0)} Pa — replacement due` });
  if (maxV > 10) out.alarms.push({ level: 'warn', id: 'velocity', ar: `سرعة هواء عالية ${maxV.toFixed(1)} م/ث (ضجيج)`, en: `High air velocity ${maxV.toFixed(1)} m/s (noise)` });
  for (const t of out.terminals) if (t.ratio < 0.8) out.alarms.push({ level: 'warn', id: 'low_' + t.id, ar: `تدفق منخفض عند المخرج ${t.id}: ${(t.ratio * 100).toFixed(0)}% من التصميم`, en: `Low flow at outlet ${t.id}: ${(t.ratio * 100).toFixed(0)}% of design` });
  if (out.totals.leakPct > 5) out.alarms.push({ level: 'warn', id: 'leak', ar: `تسرب ${out.totals.leakPct.toFixed(1)}% من تدفق المروحة`, en: `Leakage ${out.totals.leakPct.toFixed(1)}% of fan flow` });
  if (Object.values(out.segments).some((s) => s.condensation)) out.alarms.push({ level: 'crit', id: 'condensation', ar: 'خطر تكاثف على سطح الدكت — زد العزل أو تحقق من حاجز البخار', en: 'Condensation risk on duct surface — increase insulation / check vapour barrier' });
  if (out.fan.powerKw > topo.fan.ratedKw) out.alarms.push({ level: 'crit', id: 'fan_overload', ar: `قدرة المروحة ${out.fan.powerKw.toFixed(2)} كW تتجاوز المقنن ${topo.fan.ratedKw} كW`, en: `Fan power ${out.fan.powerKw.toFixed(2)} kW exceeds rating ${topo.fan.ratedKw} kW` });
  return out;
}

function defaultControls() { return { fanSpeedPct: 100, filterLoading: 0.1, dampers: { B1: 0, B2: 0, B3: 0 }, sealClass: 'B', roughness: 'medium_smooth', insulation: { id: 'glass_wool', k: 0.04, mm: 25 }, vavMinDpPa: 60 }; }

/**
 * Selects a fan curve so that, at 100% speed with the given controls, the operating point is the design
 * total flow (a selected fan matched to the system). Mutates topo.fan and returns it.
 */
function calibrateFan(topo, sized, controls, env) {
  const probe = { ...topo, fan: { ...topo.fan, dpShutoffPa: 1e6, qFreeDeliveryLps: 1e7 } };
  // find k_system at design flow: run solve with a huge fan then compute k = dp/q²... simpler: iterate on shutoff/free delivery
  const qDesign = sized.designTotalLps / 1000;
  let kSystem = null;
  // Evaluate system k by solving once and reading back op point (k = dp / q²)
  const r0 = solve(probe, sized, controls, env);
  kSystem = r0.fan.dpPa / Math.pow(r0.fan.qLps / 1000, 2);
  // refine: k varies weakly with flow; re-evaluate near design flow with a provisional fan
  for (let i = 0; i < 3; i++) {
    const dpDesign = kSystem * qDesign * qDesign;
    topo.fan.dpShutoffPa = 1.35 * dpDesign;
    topo.fan.qFreeDeliveryLps = (qDesign / Math.sqrt(1 - 1 / 1.35)) * 1000;
    const r = solve(topo, sized, controls, env);
    kSystem = r.fan.dpPa / Math.pow(r.fan.qLps / 1000, 2);
  }
  const rFinal = solve(topo, sized, controls, env);
  topo.fan.ratedKw = Math.ceil(rFinal.fan.powerKw * 1.3 * 4) / 4;
  return topo.fan;
}

/**
 * Proportional balancing: the branch with the lowest flow ratio at full-open is the index (kept at 0°);
 * the other branches are throttled (bisection on damper angle) until their ratios match the index; finally the
 * fan speed is adjusted so the index branch reaches its design flow. Returns new controls.
 */
function autoBalance(topo, sized, controls, env) {
  const c = { ...controls, dampers: { ...controls.dampers } };
  const branchIds = []; for (const j of topo.junctions) { if (j.branch) branchIds.push(j.branch.id); if (j.branch2) branchIds.push(j.branch2.id); }
  for (const id of branchIds) c.dampers[id] = 0;
  const ratio = (r, id) => r.segments[id].qLps / r.segments[id].designQLps;
  let r = solve(topo, sized, c, env);
  const index = branchIds.reduce((b, id) => (ratio(r, id) < ratio(r, b) ? id : b), branchIds[0]);
  for (let outer = 0; outer < 5; outer++) {
    r = solve(topo, sized, c, env);
    const target = ratio(r, index);
    for (const id of branchIds) {
      if (id === index) continue;
      let lo = 0, hi = 70;
      for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2; c.dampers[id] = mid;
        const rr = solve(topo, sized, c, env);
        if (ratio(rr, id) > target) lo = mid; else hi = mid;
      }
      c.dampers[id] = (lo + hi) / 2;
    }
  }
  for (let i = 0; i < 6; i++) { r = solve(topo, sized, c, env); const k = ratio(r, index); if (Math.abs(k - 1) < 0.005) break; c.fanSpeedPct = Math.min(120, Math.max(30, c.fanSpeedPct / k)); }
  for (const id of branchIds) c.dampers[id] = Math.round(c.dampers[id]);
  c.fanSpeedPct = Math.round(c.fanSpeedPct);
  return c;
}

module.exports = { defaultTopology, sizeNetwork, solve, defaultControls, calibrateFan, autoBalance };
