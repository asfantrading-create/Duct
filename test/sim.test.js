'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const NS = require('../src/shared/network-sim');
const { FactorySim } = require('../src/shared/factory-sim');
const QB = require('../src/shared/quiz-bank');
const { LESSONS } = require('../src/shared/content/lessons');
const { MODULES, isModuleLicensed } = require('../src/shared/modules');
const FACTORIES = require('../src/shared/data/factories.json');
const { CITIES } = require('../src/shared/data/climate');

const env = { tempC: 45, plenumTempC: 35, rhPct: 40, altitudeM: 600 };

test('network sizing gives standard sizes and design flows', () => {
  const topo = NS.defaultTopology(); const sized = NS.sizeNetwork(topo);
  assert.equal(sized.designTotalLps, 1550);
  for (const s of Object.values(sized.segs)) { assert.ok(s.designQLps > 0); if (s.shape === 'round') assert.ok(s.dMm >= 100); else { assert.equal(s.aMm % 50, 0); assert.equal(s.bMm % 50, 0); } }
});
test('calibrated fan delivers design flow; dampers and speed behave physically', () => {
  const topo = NS.defaultTopology(); const sized = NS.sizeNetwork(topo); const c = NS.defaultControls();
  NS.calibrateFan(topo, sized, c, env);
  const r = NS.solve(topo, sized, c, env);
  assert.ok(Math.abs(r.fan.qLps - 1550) < 20, r.fan.qLps);
  const c2 = { ...c, dampers: { ...c.dampers, B1: 45 } }; const r2 = NS.solve(topo, sized, c2, env);
  assert.ok(r2.segments.B1.qLps < r.segments.B1.qLps); assert.ok(r2.segments.B2.qLps > r.segments.B2.qLps);
  const c3 = { ...c, fanSpeedPct: 70 }; const r3 = NS.solve(topo, sized, c3, env);
  assert.ok(r3.fan.qLps < r.fan.qLps * 0.75); assert.ok(r3.fan.powerKw < r.fan.powerKw * 0.5);
  const c4 = { ...c, sealClass: 'unsealed' }; const r4 = NS.solve(topo, sized, c4, env);
  assert.ok(r4.totals.leakPct > r.totals.leakPct * 3);
  const c5 = { ...c, insulation: { id: 'none', k: null, mm: 0 } }; const r5 = NS.solve(topo, sized, c5, env);
  assert.ok(r5.totals.heatGainKw > r.totals.heatGainKw * 2);
  // mass balance: delivered + leakage ≈ fan flow
  const sum = r.totals.deliveredLps + r.totals.leakLps; assert.ok(Math.abs(sum - r.fan.qLps) < 1, `${sum} vs ${r.fan.qLps}`);
});
test('auto-balance brings all outlets within 5% of design', () => {
  const topo = NS.defaultTopology(); const sized = NS.sizeNetwork(topo); const c = NS.defaultControls(); NS.calibrateFan(topo, sized, c, env);
  const cb = NS.autoBalance(topo, sized, c, env); const r = NS.solve(topo, sized, cb, env);
  for (const t of r.terminals) assert.ok(Math.abs(t.ratio - 1) < 0.05, `${t.id} ${t.ratio}`);
});
test('factory simulation produces pieces and coherent KPIs', () => {
  const sim = new FactorySim({ seed: 42 }); const k = sim.step(480);
  assert.ok(k.produced > 60 && k.produced < 200, k.produced); assert.ok(k.oee > 0.3 && k.oee <= 1); assert.ok(k.quality <= 1 && k.quality > 0.85);
  assert.ok(k.energyKwh > 0); assert.ok(k.coilKg > k.produced * k.weightPerPiece * 0.9); assert.ok(k.stations.length === 7);
  const slow = new FactorySim({ seed: 42, controls: { speedPct: 60 } }); const ks = slow.step(480); assert.ok(ks.produced < k.produced);
  const noBreak = new FactorySim({ seed: 42, controls: { breakdowns: false } }); const kn = noBreak.step(480); assert.equal(kn.availability, 1);
});
test('quiz bank integrity and grading', () => {
  assert.ok(QB.QUESTIONS.length >= 60);
  const ids = new Set(); for (const q of QB.QUESTIONS) { assert.ok(!ids.has(q.id)); ids.add(q.id); assert.ok(MODULES.some((m) => m.id === q.moduleId), q.moduleId); assert.ok(q.text.ar && q.text.en); assert.ok([1, 2, 3].includes(q.difficulty));
    if (q.type === 'mcq') { assert.ok(q.options.length >= 3); assert.ok(q.answer >= 0 && q.answer < q.options.length); } if (q.type === 'numeric') { const g = q.generate(); assert.ok(isFinite(g.answer)); assert.equal(QB.grade({ ...q, answer: g.answer }, g.answer * 1.001).correct, true); } }
  const exam = QB.buildExam({ count: 12, moduleIds: ['DESIGN_LAB'] }); assert.equal(exam.length, 12); for (const q of exam) assert.equal(q.moduleId, 'DESIGN_LAB');
  const mcq = exam.find((q) => q.type === 'mcq'); assert.equal(QB.grade(mcq, mcq.answer).correct, true); assert.equal(QB.grade(mcq, (mcq.answer + 1) % mcq.options.length).correct, false); assert.equal(QB.grade(mcq, null).points, 0);
  assert.equal(QB.fillTemplate('a {x} b {y}', { x: 1, y: 'z' }), 'a 1 b z');
});
test('lessons and data integrity', () => {
  assert.equal(LESSONS.length, 14); for (const l of LESSONS) { assert.ok(l.body.ar.length > 800 && l.body.en.length > 800, l.id); assert.ok(l.title.ar && l.title.en); }
  assert.ok(FACTORIES.length >= 80); const ids = new Set(); for (const f of FACTORIES) { assert.ok(!ids.has(f.id), f.id); ids.add(f.id); assert.equal(typeof f.lat, 'number'); assert.ok(f.sources.length >= 1); assert.ok(['high', 'medium'].includes(f.confidence)); }
  assert.ok(CITIES.length >= 24); for (const c of CITIES) assert.ok(c.cooling_db_0_4 > 25 && c.cooling_db_0_4 < 52, c.id);
  assert.equal(isModuleLicensed({ modules: ['LEARN'] }, 'LEARN'), true); assert.equal(isModuleLicensed({ modules: ['LEARN'] }, 'DESIGN_LAB'), false); assert.equal(isModuleLicensed({}, 'DESIGN_LAB'), true); assert.equal(isModuleLicensed(null, 'LEARN'), false);
});
