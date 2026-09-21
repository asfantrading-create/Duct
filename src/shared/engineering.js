'use strict';
/**
 * Duct engineering core — pure functions, SI units unless stated.
 * References: ASHRAE Handbook—Fundamentals (Duct Design chapter: Altshul–Tsal friction factor,
 * Huebscher equivalent diameter, roughness classes), SMACNA HVAC Duct Construction Standards & Air
 * Duct Leakage Test Manual (leakage classes, seal classes, gauges), DW/144 (sheet thickness classes).
 * Values marked "typical" are industry rules of thumb for educational simulation.
 */

const R_AIR = 287.055; // J/(kg·K)
const G = 9.80665;

/** Standard air at 20 °C, 101.325 kPa. */
const STD_AIR = Object.freeze({ tempC: 20, pressurePa: 101325, rho: 1.204, mu: 1.825e-5, nu: 1.516e-5, cp: 1006 });

/** Absolute roughness ε (m) — ASHRAE duct roughness classes. */
const ROUGHNESS = Object.freeze({
  smooth:        { eps: 0.03e-3, ar: 'أملس (ألمنيوم، PVC، فولاذ غير مطلي)', en: 'Smooth (aluminium, PVC, uncoated carbon steel)' },
  medium_smooth: { eps: 0.09e-3, ar: 'متوسط الملاسة (فولاذ مجلفن، وصلات كل 1.2 م)', en: 'Medium smooth (galvanized steel, 1.2 m joints)' },
  average:       { eps: 0.15e-3, ar: 'متوسط (مجلفن حلزوني، وصلات كل 3 م)', en: 'Average (galvanized spiral, 3 m joints)' },
  medium_rough:  { eps: 0.9e-3,  ar: 'متوسط الخشونة (بطانة صوف زجاجي، دكت مرن مشدود)', en: 'Medium rough (fibrous glass liner, flexible duct fully extended)' },
  rough:         { eps: 3.0e-3,  ar: 'خشن (دكت مرن معدني، دكت مرن غير مشدود)', en: 'Rough (flexible metal duct, flexible duct partially compressed)' },
});

/** Galvanized steel sheet gauges used for HVAC ducts (SMACNA nominal). */
const GAUGES = Object.freeze([
  { gauge: 28, mm: 0.48, inch: 0.0187 },
  { gauge: 26, mm: 0.55, inch: 0.0217 },
  { gauge: 24, mm: 0.70, inch: 0.0276 },
  { gauge: 22, mm: 0.85, inch: 0.0336 },
  { gauge: 20, mm: 1.00, inch: 0.0396 },
  { gauge: 18, mm: 1.31, inch: 0.0516 },
  { gauge: 16, mm: 1.61, inch: 0.0635 },
]);

/** SMACNA pressure classes (static pressure) in Pa with the traditional in. w.g. label. */
const PRESSURE_CLASSES = Object.freeze([
  { label: '½" w.g.', pa: 125 }, { label: '1" w.g.', pa: 250 }, { label: '2" w.g.', pa: 500 },
  { label: '3" w.g.', pa: 750 }, { label: '4" w.g.', pa: 1000 }, { label: '6" w.g.', pa: 1500 }, { label: '10" w.g.', pa: 2500 },
]);

/** DW/144 style sheet thickness for rectangular galvanized duct by longest side (typical, mm). */
const DW144_THICKNESS = Object.freeze([
  { maxSide: 400,  low: 0.6, medium: 0.6, high: 0.8 },
  { maxSide: 600,  low: 0.6, medium: 0.8, high: 0.8 },
  { maxSide: 800,  low: 0.8, medium: 0.8, high: 1.0 },
  { maxSide: 1000, low: 0.8, medium: 1.0, high: 1.0 },
  { maxSide: 1250, low: 1.0, medium: 1.0, high: 1.2 },
  { maxSide: 2000, low: 1.0, medium: 1.2, high: 1.2 },
  { maxSide: 2500, low: 1.2, medium: 1.2, high: 1.6 },
  { maxSide: 3000, low: 1.2, medium: 1.6, high: 1.6 },
]);

/** Simplified SMACNA gauge selection for rectangular duct at 500 Pa (2" w.g.) positive — typical, educational. */
const SMACNA_GAUGE_2IN = Object.freeze([
  { maxSideMm: 305, maxSideIn: 12, gauge: 26, reinforcement: 'none' },
  { maxSideMm: 762, maxSideIn: 30, gauge: 24, reinforcement: 'none up to ~450 mm; tie rods / angles @ 1.5 m above' },
  { maxSideMm: 1372, maxSideIn: 54, gauge: 22, reinforcement: 'angles / tie rods @ 1.2 m' },
  { maxSideMm: 2134, maxSideIn: 84, gauge: 20, reinforcement: 'angles @ 1.2 m + tie rods' },
  { maxSideMm: 2438, maxSideIn: 96, gauge: 18, reinforcement: 'angles @ 0.6–1.2 m + tie rods' },
  { maxSideMm: 4000, maxSideIn: 158, gauge: 16, reinforcement: 'heavy reinforcement' },
]);

/** SMACNA leakage classes (cfm/100 ft² at 1 in. w.g.) by seal class. */
const LEAKAGE_CLASSES = Object.freeze({
  unsealed: { round: 30, rectangular: 48, ar: 'بدون إحكام', en: 'Unsealed' },
  C:        { round: 12, rectangular: 24, ar: 'فئة الإحكام C (الوصلات العرضية فقط)', en: 'Seal Class C (transverse joints only)' },
  B:        { round: 6,  rectangular: 12, ar: 'فئة الإحكام B (الوصلات العرضية والطولية)', en: 'Seal Class B (transverse joints + longitudinal seams)' },
  A:        { round: 3,  rectangular: 6,  ar: 'فئة الإحكام A (كل الوصلات والاختراقات)', en: 'Seal Class A (all joints, seams and wall penetrations)' },
});

/** Typical fitting loss coefficients C (Δp = C·Pv) — approximate ASHRAE Duct Fitting Database values. */
const FITTINGS = Object.freeze([
  { id: 'elbow90_round_r15', C: 0.15, ar: 'كوع 90° دائري أملس r/D=1.5', en: '90° smooth round elbow r/D = 1.5' },
  { id: 'elbow90_round_r10', C: 0.22, ar: 'كوع 90° دائري أملس r/D=1.0', en: '90° smooth round elbow r/D = 1.0' },
  { id: 'elbow90_round_mitre', C: 1.20, ar: 'كوع 90° دائري حاد (بدون قوس)', en: '90° mitred round elbow, no vanes' },
  { id: 'elbow45_round_r15', C: 0.09, ar: 'كوع 45° دائري أملس', en: '45° smooth round elbow' },
  { id: 'elbow90_rect_radius', C: 0.21, ar: 'كوع 90° مستطيل بقوس r/W=1.0', en: '90° radius rectangular elbow r/W = 1.0' },
  { id: 'elbow90_rect_mitre_vanes', C: 0.15, ar: 'كوع 90° مستطيل حاد مع ريش توجيه', en: '90° mitred rectangular elbow with turning vanes' },
  { id: 'elbow90_rect_mitre', C: 1.20, ar: 'كوع 90° مستطيل حاد بدون ريش', en: '90° mitred rectangular elbow, no vanes' },
  { id: 'transition_gradual', C: 0.05, ar: 'انتقال تدريجي (≤ 20°)', en: 'Gradual transition (≤ 20°)' },
  { id: 'transition_abrupt', C: 0.35, ar: 'انتقال مفاجئ', en: 'Abrupt transition' },
  { id: 'tee_branch', C: 0.60, ar: 'تفرّع (T) – خط الفرع', en: 'Tee – branch path' },
  { id: 'tee_main', C: 0.15, ar: 'تفرّع (T) – الخط الرئيسي', en: 'Tee – straight-through path' },
  { id: 'damper_open', C: 0.20, ar: 'دامبر فراشة مفتوح كلياً', en: 'Butterfly damper fully open' },
  { id: 'fire_damper', C: 0.25, ar: 'دامبر حريق (ستارة) مفتوح', en: 'Curtain fire damper, open' },
  { id: 'entry_bellmouth', C: 0.03, ar: 'مدخل مخروطي (Bellmouth)', en: 'Bellmouth entry' },
  { id: 'entry_plain', C: 0.50, ar: 'مدخل حاد مستوٍ', en: 'Plain sharp entry' },
  { id: 'exit', C: 1.00, ar: 'مخرج إلى الغرفة (فقد ضغط السرعة كلياً)', en: 'Exit to room (all velocity pressure lost)' },
]);

/** Butterfly damper C vs blade angle (typical). */
const DAMPER_CURVE = Object.freeze([[0, 0.2], [10, 0.52], [20, 1.5], [30, 4.5], [40, 11], [50, 29], [60, 108], [70, 750], [80, 5000], [90, 1e5]]);

/** Recommended velocities (m/s) — typical design guidance. */
const VELOCITY_GUIDE = Object.freeze([
  { application: 'residential', ar: 'مساكن', en: 'Residences', main: [3.5, 5.0], branch: [3.0, 4.0] },
  { application: 'schools_offices', ar: 'مدارس ومكاتب ومباني عامة', en: 'Schools, offices, public buildings', main: [5.0, 6.5], branch: [4.0, 5.0] },
  { application: 'industrial', ar: 'مباني صناعية', en: 'Industrial buildings', main: [6.0, 9.0], branch: [5.0, 6.0] },
  { application: 'high_velocity', ar: 'أنظمة عالية السرعة', en: 'High-velocity systems', main: [10.0, 20.0], branch: [8.0, 12.0] },
]);

/** EN 1506 / common spiral round duct nominal diameters (mm). */
const ROUND_SIZES_MM = Object.freeze([80, 100, 125, 150, 160, 180, 200, 224, 250, 280, 315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 1120, 1250, 1400, 1600]);

/** Insulation materials (typical). k in W/m·K. */
const INSULATION = Object.freeze([
  { id: 'none', k: null, ar: 'بدون عزل', en: 'No insulation', thicknesses: [0] },
  { id: 'glass_wool', k: 0.040, ar: 'صوف زجاجي (Duct wrap)', en: 'Glass wool duct wrap', thicknesses: [25, 50, 75] },
  { id: 'rockwool', k: 0.038, ar: 'صوف صخري', en: 'Rock wool', thicknesses: [25, 50] },
  { id: 'nitrile_rubber', k: 0.036, ar: 'مطاط نيتريل خلايا مغلقة', en: 'Closed-cell nitrile rubber', thicknesses: [13, 19, 25, 32] },
  { id: 'pir_panel', k: 0.022, ar: 'لوح PIR مسبق العزل', en: 'PIR pre-insulated panel', thicknesses: [20, 30] },
  { id: 'phenolic_panel', k: 0.021, ar: 'لوح فينولي مسبق العزل', en: 'Phenolic pre-insulated panel', thicknesses: [22, 30] },
]);

// ---------- Air properties ----------
function airDensity(tempC = 20, pressurePa = 101325) { return pressurePa / (R_AIR * (tempC + 273.15)); }
function airViscosity(tempC = 20) { // Sutherland
  const T = tempC + 273.15;
  return 1.716e-5 * Math.pow(T / 273.15, 1.5) * (273.15 + 110.4) / (T + 110.4);
}
function airKinematicViscosity(tempC = 20, pressurePa = 101325) { return airViscosity(tempC) / airDensity(tempC, pressurePa); }
/** Pressure at altitude (m) — barometric formula, ISA. */
function pressureAtAltitude(altM = 0) { return 101325 * Math.pow(1 - 2.25577e-5 * altM, 5.25588); }
/** Dew point (°C) — Magnus formula. */
function dewPoint(tempC, rhPercent) {
  const rh = Math.min(100, Math.max(0.1, rhPercent));
  const g = Math.log(rh / 100) + (17.62 * tempC) / (243.12 + tempC);
  return (243.12 * g) / (17.62 - g);
}

// ---------- Geometry ----------
const roundArea = (dM) => (Math.PI * dM * dM) / 4;
const rectArea = (aM, bM) => aM * bM;
const rectPerimeter = (aM, bM) => 2 * (aM + bM);
const roundPerimeter = (dM) => Math.PI * dM;
/** Huebscher equivalent diameter (same unit as inputs). */
function equivalentDiameter(a, b) { return (1.30 * Math.pow(a * b, 0.625)) / Math.pow(a + b, 0.25); }
function hydraulicDiameter(a, b) { return (2 * a * b) / (a + b); }
/** Flat oval equivalent diameter (major a, minor b). */
function flatOvalEquivalentDiameter(a, b) {
  const A = (Math.PI * b * b) / 4 + b * (a - b);
  const P = Math.PI * b + 2 * (a - b);
  return (1.55 * Math.pow(A, 0.625)) / Math.pow(P, 0.25);
}

// ---------- Flow ----------
const velocity = (qM3s, areaM2) => qM3s / areaM2;
const velocityPressure = (v, rho = STD_AIR.rho) => 0.5 * rho * v * v;
const velocityFromPv = (pv, rho = STD_AIR.rho) => Math.sqrt((2 * pv) / rho);
const reynolds = (v, dM, nu = STD_AIR.nu) => (v * dM) / nu;

/** Altshul–Tsal friction factor (ASHRAE). Laminar fallback f = 64/Re. */
function frictionFactor(re, epsM, dM) {
  if (re <= 0) return 0;
  if (re < 2300) return 64 / re;
  const f1 = 0.11 * Math.pow(epsM / dM + 68 / re, 0.25);
  return f1 >= 0.018 ? f1 : 0.85 * f1 + 0.0028;
}
/** Friction loss per metre (Pa/m) for a round duct or an equivalent diameter. */
function frictionLossPerMeter(v, dM, { rho = STD_AIR.rho, nu = STD_AIR.nu, epsM = ROUGHNESS.medium_smooth.eps } = {}) {
  if (v <= 0 || dM <= 0) return 0;
  const re = reynolds(v, dM, nu);
  const f = frictionFactor(re, epsM, dM);
  return (f / dM) * 0.5 * rho * v * v;
}
const fittingLoss = (C, pv) => C * pv;
function damperCoefficient(angleDeg) {
  const a = Math.min(90, Math.max(0, angleDeg));
  for (let i = 1; i < DAMPER_CURVE.length; i++) {
    const [a0, c0] = DAMPER_CURVE[i - 1], [a1, c1] = DAMPER_CURVE[i];
    if (a <= a1) { // log-linear interpolation
      const t = (a - a0) / (a1 - a0);
      return Math.exp(Math.log(c0) + t * (Math.log(c1) - Math.log(c0)));
    }
  }
  return DAMPER_CURVE[DAMPER_CURVE.length - 1][1];
}

// ---------- Fans ----------
/** Fan shaft power (W). */
const fanPowerW = (qM3s, dpPa, efficiency = 0.65) => (qM3s * dpPa) / Math.max(0.05, efficiency);
/** Fan laws: scale Q, Δp, P for speed ratio n = N2/N1. */
const fanLaws = (q, dp, p, n) => ({ q: q * n, dp: dp * n * n, p: p * n * n * n });
/**
 * Operating point of a simple parabolic fan curve (Δp = dp0·(1 − (Q/Qmax)²)) with a system curve Δp = k·Q².
 * @param fan { dpShutoff (Pa), qFreeDelivery (m³/s), speedRatio }
 */
function operatingPoint(fan, kSystem) {
  const n = fan.speedRatio ?? 1;
  const dp0 = fan.dpShutoff * n * n;
  const qmax = fan.qFreeDelivery * n;
  if (dp0 <= 0 || qmax <= 0) return { q: 0, dp: 0 };
  // dp0 (1 - Q²/qmax²) = k Q²  =>  Q² (k + dp0/qmax²) = dp0
  const q = Math.sqrt(dp0 / (kSystem + dp0 / (qmax * qmax)));
  return { q, dp: kSystem * q * q };
}

// ---------- Sizing ----------
function roundUpToStandard(dMm, sizes = ROUND_SIZES_MM) {
  for (const s of sizes) if (s >= dMm - 1e-9) return s;
  return Math.ceil(dMm / 50) * 50;
}
/** Diameter (mm) for a given flow and velocity. */
function diameterForVelocity(qM3s, v) { return Math.sqrt((4 * qM3s) / (Math.PI * v)) * 1000; }
/** Diameter (mm) for a target friction rate (Pa/m) — bisection. */
function diameterForFriction(qM3s, paPerM, opts = {}) {
  let lo = 0.05, hi = 3.0;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const v = velocity(qM3s, roundArea(mid));
    const loss = frictionLossPerMeter(v, mid, opts);
    if (loss > paPerM) lo = mid; else hi = mid;
  }
  return ((lo + hi) / 2) * 1000;
}
/**
 * Rectangular size (mm) for a target equivalent diameter with an optional fixed height and max aspect ratio.
 * Returns { a (width), b (height), de, aspect }.
 */
function rectangularForEquivalent(deMm, { fixedHeightMm = null, maxAspect = 4, step = 50 } = {}) {
  if (fixedHeightMm) {
    let a = step;
    while (equivalentDiameter(a, fixedHeightMm) < deMm && a < 5000) a += step;
    return { a, b: fixedHeightMm, de: equivalentDiameter(a, fixedHeightMm), aspect: a / fixedHeightMm };
  }
  // find the most square section (aspect as low as possible but ≤ maxAspect) that meets De
  let best = null;
  for (let b = step; b <= 2500; b += step) {
    let a = b;
    while (equivalentDiameter(a, b) < deMm && a / b <= maxAspect) a += step;
    if (equivalentDiameter(a, b) >= deMm && a / b <= maxAspect) {
      const cand = { a, b, de: equivalentDiameter(a, b), aspect: a / b };
      if (!best || cand.a * cand.b < best.a * best.b || (cand.a * cand.b === best.a * best.b && cand.aspect < best.aspect)) best = cand;
    }
  }
  return best || { a: Math.round(deMm / step) * step, b: Math.round(deMm / step) * step, de: deMm, aspect: 1 };
}

/** Full sizing result for one duct segment. Flow in m³/s; dims in mm; length m. */
function analyseSegment({ shape = 'round', dMm = 0, aMm = 0, bMm = 0, qM3s, lengthM = 1, roughness = 'medium_smooth', fittings = [], tempC = 20, altitudeM = 0 }) {
  const pressurePa = pressureAtAltitude(altitudeM);
  const rho = airDensity(tempC, pressurePa);
  const nu = airKinematicViscosity(tempC, pressurePa);
  const epsM = (ROUGHNESS[roughness] || ROUGHNESS.medium_smooth).eps;
  let areaM2, deM, perimeterM;
  if (shape === 'round') { areaM2 = roundArea(dMm / 1000); deM = dMm / 1000; perimeterM = roundPerimeter(dMm / 1000); }
  else { areaM2 = rectArea(aMm / 1000, bMm / 1000); deM = equivalentDiameter(aMm, bMm) / 1000; perimeterM = rectPerimeter(aMm / 1000, bMm / 1000); }
  const v = areaM2 > 0 ? velocity(qM3s, areaM2) : 0;
  const pv = velocityPressure(v, rho);
  // For rectangular ducts ASHRAE uses the velocity of the actual section with De in the friction chart
  const re = reynolds(v, deM, nu);
  const f = frictionFactor(re, epsM, deM);
  const frictionPerM = deM > 0 ? (f / deM) * pv : 0;
  const frictionTotal = frictionPerM * lengthM;
  const fittingsTotal = fittings.reduce((s, fit) => s + (fit.C ?? 0) * (fit.qty ?? 1) * pv, 0);
  const total = frictionTotal + fittingsTotal;
  return { rho, nu, areaM2, deMm: deM * 1000, perimeterM, surfaceM2: perimeterM * lengthM, v, pv, re, f, frictionPerM, frictionTotal, fittingsTotal, totalPa: total };
}

// ---------- Leakage ----------
/** Leakage flow (L/s) for a duct surface area (m²) at static pressure (Pa) given SMACNA leakage class. */
function leakageLps(leakageClass, surfaceM2, staticPa) {
  // F [cfm/100ft²] = CL · P[in wg]^0.65  →  L/s per m² = 0.001407 · CL · P[Pa]^0.65
  return 0.001407 * leakageClass * Math.pow(Math.max(0, staticPa), 0.65) * surfaceM2;
}

// ---------- Heat transfer ----------
/** Inside convective coefficient (W/m²K), empirical for air in ducts. */
function insideFilmCoefficient(v) { return Math.max(6, 10.45 - v + 10 * Math.sqrt(Math.max(0, v))); }
/** Overall U (W/m²K) for a duct wall with optional insulation (thickness m, k). */
function ductUValue({ v = 5, insulationK = null, insulationM = 0, outsideH = 9 }) {
  const rIn = 1 / insideFilmCoefficient(v);
  const rWall = 0.0007 / 50; // ~0.7 mm steel, k≈50 — negligible
  const rIns = insulationK && insulationM > 0 ? insulationM / insulationK : 0;
  const rOut = 1 / outsideH;
  return 1 / (rIn + rWall + rIns + rOut);
}
/**
 * Temperature change of air along a duct (°C): T_out = T_amb + (T_in − T_amb)·exp(−U·A/(ṁ·cp)).
 * Returns { tOut, heatGainW, surfaceOutsideTempC }.
 */
function ductHeatGain({ tInC, tAmbC, qM3s, surfaceM2, U, rho = STD_AIR.rho, cp = STD_AIR.cp, outsideH = 9 }) {
  const mDot = qM3s * rho;
  if (mDot <= 0) return { tOut: tInC, heatGainW: 0, surfaceOutsideTempC: tAmbC };
  const tOut = tAmbC + (tInC - tAmbC) * Math.exp((-U * surfaceM2) / (mDot * cp));
  const heatGainW = mDot * cp * (tOut - tInC);
  const tMean = (tInC + tOut) / 2;
  const surfaceOutsideTempC = tAmbC - (U * (tAmbC - tMean)) / outsideH;
  return { tOut, heatGainW, surfaceOutsideTempC };
}
/** Condensation risk on the outside surface: true when surface temp ≤ ambient dew point. */
function condensationRisk(surfaceTempC, tAmbC, rhPercent) { return surfaceTempC <= dewPoint(tAmbC, rhPercent); }

// ---------- Sheet metal & costing ----------
function gaugeForThickness(mm) {
  let best = GAUGES[0];
  for (const g of GAUGES) if (Math.abs(g.mm - mm) < Math.abs(best.mm - mm)) best = g;
  return best;
}
/** DW/144 typical thickness (mm) for a pressure class 'low'|'medium'|'high' by longest side (mm). */
function dw144Thickness(longestSideMm, pressureClass = 'low') {
  for (const row of DW144_THICKNESS) if (longestSideMm <= row.maxSide) return row[pressureClass];
  return 1.6;
}
function smacnaGauge2in(longestSideMm) {
  for (const row of SMACNA_GAUGE_2IN) if (longestSideMm <= row.maxSideMm) return row;
  return SMACNA_GAUGE_2IN[SMACNA_GAUGE_2IN.length - 1];
}
/** Sheet weight (kg) of a duct piece. wasteFactor covers seams/laps/flanges. */
function ductWeightKg({ shape = 'rectangular', aMm = 0, bMm = 0, dMm = 0, lengthM = 1, thicknessMm = 0.7, density = 7850, allowance = 1.12 }) {
  const per = shape === 'round' ? Math.PI * (dMm / 1000) : 2 * ((aMm + bMm) / 1000);
  return per * lengthM * (thicknessMm / 1000) * density * allowance;
}
function ductSurfaceM2({ shape = 'rectangular', aMm = 0, bMm = 0, dMm = 0, lengthM = 1 }) {
  const per = shape === 'round' ? Math.PI * (dMm / 1000) : 2 * ((aMm + bMm) / 1000);
  return per * lengthM;
}

// ---------- Unit conversions ----------
const UNITS = Object.freeze({
  lpsToM3s: (x) => x / 1000, m3sToLps: (x) => x * 1000,
  m3hToM3s: (x) => x / 3600, m3sToM3h: (x) => x * 3600,
  cfmToM3s: (x) => x * 0.000471947, m3sToCfm: (x) => x / 0.000471947,
  paToInWg: (x) => x / 249.089, inWgToPa: (x) => x * 249.089,
  msToFpm: (x) => x * 196.85, fpmToMs: (x) => x / 196.85,
  mmToIn: (x) => x / 25.4, inToMm: (x) => x * 25.4,
  kgToLb: (x) => x * 2.20462, wToBtuh: (x) => x * 3.41214, kwToTR: (x) => x / 3.51685,
});

module.exports = {
  R_AIR, G, STD_AIR, ROUGHNESS, GAUGES, PRESSURE_CLASSES, DW144_THICKNESS, SMACNA_GAUGE_2IN, LEAKAGE_CLASSES, FITTINGS, DAMPER_CURVE, VELOCITY_GUIDE, ROUND_SIZES_MM, INSULATION,
  airDensity, airViscosity, airKinematicViscosity, pressureAtAltitude, dewPoint,
  roundArea, rectArea, rectPerimeter, roundPerimeter, equivalentDiameter, hydraulicDiameter, flatOvalEquivalentDiameter,
  velocity, velocityPressure, velocityFromPv, reynolds, frictionFactor, frictionLossPerMeter, fittingLoss, damperCoefficient,
  fanPowerW, fanLaws, operatingPoint,
  roundUpToStandard, diameterForVelocity, diameterForFriction, rectangularForEquivalent, analyseSegment,
  leakageLps, insideFilmCoefficient, ductUValue, ductHeatGain, condensationRisk,
  gaugeForThickness, dw144Thickness, smacnaGauge2in, ductWeightKg, ductSurfaceM2, UNITS,
};
