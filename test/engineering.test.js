'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const e = require('../src/shared/engineering');

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`);

test('Huebscher equivalent diameter', () => { near(e.equivalentDiameter(600, 300), 457, 2); near(e.equivalentDiameter(400, 400), 437, 2); });
test('velocity and friction for 1 m³/s in 400 mm round duct', () => {
  const s = e.analyseSegment({ shape: 'round', dMm: 400, qM3s: 1, lengthM: 10 });
  near(s.v, 7.96, 0.02); near(s.pv, 38.1, 0.5); assert.ok(s.frictionPerM > 1.4 && s.frictionPerM < 1.9, s.frictionPerM);
  near(s.frictionTotal, s.frictionPerM * 10, 1e-9);
});
test('friction factor regimes', () => {
  near(e.frictionFactor(1000, 0.09e-3, 0.3), 0.064, 1e-6);
  const f = e.frictionFactor(2e5, 0.09e-3, 0.4); assert.ok(f > 0.016 && f < 0.019, f);
});
test('leakage class conversion matches IP definition', () => {
  const cl = 6, area = 10, pa = 500;
  const inWg = pa / 249.089, cfmPer100 = cl * Math.pow(inWg, 0.65);
  const lps = cfmPer100 * 0.471947 / 9.2903 * area; // cfm/100ft² → L/s per m²
  near(e.leakageLps(cl, area, pa), lps, 0.05);
});
test('diameter for friction target is self-consistent', () => {
  const d = e.diameterForFriction(1, 1.0);
  const s = e.analyseSegment({ shape: 'round', dMm: d, qM3s: 1 });
  near(s.frictionPerM, 1.0, 0.02);
});
test('rectangular sizing honours De and aspect', () => {
  const r = e.rectangularForEquivalent(500, { maxAspect: 3 });
  assert.ok(r.de >= 500); assert.ok(r.aspect <= 3);
  const fixed = e.rectangularForEquivalent(500, { fixedHeightMm: 250 });
  assert.equal(fixed.b, 250); assert.ok(fixed.de >= 500);
});
test('fan operating point lies on both curves', () => {
  const op = e.operatingPoint({ dpShutoff: 1200, qFreeDelivery: 4 }, 300);
  near(op.dp, 300 * op.q * op.q, 1e-6); near(op.dp, 1200 * (1 - (op.q * op.q) / 16), 1e-6);
});
test('psychrometrics and heat transfer', () => {
  near(e.dewPoint(35, 60), 26.1, 0.2);
  near(e.ductUValue({ v: 6 }), 6.9, 0.3);
  const ins = e.ductUValue({ v: 6, insulationK: 0.04, insulationM: 0.025 }); assert.ok(ins > 1.1 && ins < 1.5, ins);
  const g = e.ductHeatGain({ tInC: 13, tAmbC: 45, qM3s: 1, surfaceM2: 20, U: 1.3 });
  assert.ok(g.tOut > 13 && g.tOut < 15, g.tOut); assert.ok(g.heatGainW > 0);
});
test('gauges, thickness tables and weight', () => {
  assert.equal(e.gaugeForThickness(0.7).gauge, 24);
  assert.equal(e.dw144Thickness(900, 'low'), 0.8);
  assert.equal(e.smacnaGauge2in(1000).gauge, 22);
  const w = e.ductWeightKg({ shape: 'rectangular', aMm: 600, bMm: 300, lengthM: 1.2, thicknessMm: 0.7 });
  near(w, 2 * 0.9 * 1.2 * 0.0007 * 7850 * 1.12, 1e-6);
});
test('unit conversions round trip', () => {
  near(e.UNITS.m3sToCfm(e.UNITS.cfmToM3s(1000)), 1000, 1e-6);
  near(e.UNITS.inWgToPa(1), 249.089, 1e-3);
  near(e.UNITS.paToInWg(e.UNITS.inWgToPa(2)), 2, 1e-9);
});
test('damper coefficient monotonic', () => {
  let prev = 0; for (let a = 0; a <= 90; a += 5) { const c = e.damperCoefficient(a); assert.ok(c >= prev); prev = c; }
});
