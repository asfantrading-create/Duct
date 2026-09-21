// 3D digital twin of a building duct network — a single-storey office/lab building on a landscaped site with an
// analytic sky driven by the hour of day. The ductwork is assembled from the real component library (duct-parts.js):
// flanged rectangular straights, radius elbows, tee take-off, transitions, VAV box with square-to-round transition,
// spiral round branches with round dampers, flexible drops into 4-way diffusers, trapeze hangers and roof stands.
// Duct colours, airflow particles, damper blades and the callout values follow the live solver results.
import { THREE, createBase, textSprite, mat, box, cylinder, contactShadow, worker, rampGYR, rampBR, sunForHour } from './common.js';
import { buildTerrain, buildSite, buildClouds } from './terrain.js';
import * as DP from './duct-parts.js';
import * as TX from './textures.js';

const CEILING_Y = 3.0, ROOF_Y = 4.2; const BW = 24, BD = 15, BX = 1; // building footprint centred at x=1
const PAD = { x: 27, z: 20 };
const Y_MAIN = ROOF_Y + 0.12 + 1.4; // AHU fan centreline on the roof
const Y_VOID = 3.6;                 // duct centreline in the ceiling void
// terminals: id → [branch, x of branch, z, side of the branch the diffuser sits on]
const TERMINALS = { D1: ['B1', 0, 2.0, -1], D2: ['B1', 0, 3.6, 1], D3: ['B1', 0, 5.4, -1], D4: ['B2', 8, 3.6, -1], D5: ['B2', 8, 5.4, 1], D6: ['B3', 8, -2.0, -1], D7: ['B3', 8, -3.6, 1], D8: ['B3', 8, -5.4, -1] };
const Z = new THREE.Vector3(0, 0, 1);
const quatTo = (dir) => new THREE.Quaternion().setFromUnitVectors(Z, dir.clone().normalize());

export function createBuildingScene(container, { onSelect = () => {}, lang = 'ar', labels = {}, hour = 15 } = {}) {
  const base = createBase(container, { camPos: [21, 13, 26], target: [2, 2.4, 0], sunPos: [30, 50, 35], shadowSize: 42, skyShader: true, hour, fog: true, fogDensity: 0.0016, quality: 'high' });
  const { scene, tickers } = base; const rtl = lang === 'ar';
  const pickables = []; const segMeshes = {}; const callouts = {}; const diffuserCones = {}; const particles = {}; const dampers = {}; const sensorLamps = {}; const terminalPos = {};
  let colorMode = 'pressure'; let lastResult = null; let lastLabels = labels;
  const galvTex = TX.galvanized(2, 1);
  const M = {
    galv: new THREE.MeshStandardMaterial({ map: galvTex.map, roughnessMap: galvTex.roughnessMap, color: 0xffffff, metalness: 0.85, roughness: 0.42 }),
    spiral: new THREE.MeshStandardMaterial({ map: TX.spiralSeam(1, 3), metalness: 0.85, roughness: 0.4 }),
    flange: new THREE.MeshStandardMaterial({ color: 0x7d8790, metalness: 0.8, roughness: 0.5 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.5, metalness: 0.1 }),
    grey: new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.6, metalness: 0.3 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2d333b, roughness: 0.6, metalness: 0.3 }),
    ahu: new THREE.MeshStandardMaterial({ map: TX.paintedSteel('#d9dde2'), roughness: 0.4, metalness: 0.45 }),
    ahuFrame: new THREE.MeshStandardMaterial({ map: TX.paintedSteel('#3b4b6b'), roughness: 0.5, metalness: 0.4 }),
    wood: new THREE.MeshStandardMaterial({ map: TX.wood(), roughness: 0.85 }),
    desk: new THREE.MeshStandardMaterial({ color: 0xe9e4d8, roughness: 0.7 }),
    chair: new THREE.MeshStandardMaterial({ color: 0x2b4b8c, roughness: 0.8 }),
    plant: new THREE.MeshStandardMaterial({ color: 0x3f8a4a, roughness: 0.9 }),
    actuator: new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5, metalness: 0.3 }),
  };

  // ---- site & building
  buildTerrain(scene, { size: 460, padHalfX: PAD.x, padHalfZ: PAD.z, amplitude: 10, seed: 3 });
  buildSite(scene, { padHalfX: PAD.x, padHalfZ: PAD.z, palms: 12, cars: 4 });
  const clouds = buildClouds(scene, { seed: 5, coverage: 0.4, y: 220 }); tickers.push(clouds.tick);
  const paving = new THREE.Mesh(new THREE.PlaneGeometry(BW + 8, BD + 8), new THREE.MeshStandardMaterial({ map: TX.concreteFloor(8, 6), roughness: 0.95 })); paving.rotation.x = -Math.PI / 2; paving.position.set(BX, -0.028, 0); paving.receiveShadow = true; scene.add(paving);
  buildBuilding(scene, M);
  const ahu = buildAHU(scene, M); pickables.push(ahu.group);
  callouts.AHU = base.addLabel(labels.AHU || 'AHU', new THREE.Vector3(-11.5, ROOF_Y + 0.12 + 3.6, 0), { rtl, scale: 0.95, sub: '—', stemFrom: new THREE.Vector3(-11.5, ROOF_Y + 0.12 + 2.35, 0) });
  let fanSpeed = 1; tickers.push((dt) => { ahu.fan.rotation.x += dt * 16 * fanSpeed; });
  // room lights for the evening/night (intensity follows the hour)
  const roomLights = [[-4, 2.6, 0], [8.5, 2.6, 3.5], [8.5, 2.6, -3.5]].map((p) => { const l = new THREE.PointLight(0xfff1dc, 0, 16, 2); l.position.set(...p); scene.add(l); return l; });
  function setHour(h) { base.setHour(h); const d = sunForHour(h).daylight; for (const l of roomLights) l.intensity = 22 * (1 - d); }
  setHour(hour);

  // ---------------------------------------------------------------- duct construction helpers
  const dimsOf = (s) => (s.shape === 'round' ? { round: true, d: (s.dMm || 315) / 1000, w: (s.dMm || 315) / 1000, h: (s.dMm || 315) / 1000 } : { round: false, w: (s.aMm || 600) / 1000, h: (s.bMm || 400) / 1000 });
  const roofUnderside = ROOF_Y - 0.125, roofTop = ROOF_Y + 0.125;
  function place(obj, pos, dir) { obj.position.copy(pos); if (dir) obj.quaternion.copy(quatTo(dir)); return obj; }
  /** Straight run from a to b filled with standard pieces (1.2 m rect / 3 m spiral) + a cut piece; hangers / roof stands. */
  function straightRun(group, a, b, D, bodyMat, { hangers = true } = {}) {
    const dir = b.clone().sub(a); const len = dir.length(); if (len < 0.05) return; dir.normalize();
    const std = D.round ? 3.0 : 1.2; let off = 0;
    while (off < len - 0.02) { const L = Math.min(std, len - off); if (L < 0.12) break; const piece = D.round ? DP.spiralRound({ d: D.d, len: L }) : DP.straightRect({ w: D.w, h: D.h, len: L, beading: L > 0.6 }); DP.setBodyMaterial(piece, bodyMat); place(piece, a.clone().add(dir.clone().multiplyScalar(off + L / 2)), dir); group.add(piece); off += L; }
    if (!hangers || Math.abs(dir.y) > 0.1) return;
    for (let s = 0.9; s < len - 0.3; s += 2.4) { const p = a.clone().add(dir.clone().multiplyScalar(s));
      if (p.y < ROOF_Y) { const drop = roofUnderside - p.y + D.h / 2 + 0.03; group.add(place(DP.hanger({ w: D.w, h: D.h, drop }), p, dir)); }
      else { const st = new THREE.Group(); const hh = p.y - D.h / 2 - roofTop; for (const sx of [-1, 1]) st.add(box(0.06, hh, 0.06, M.grey, [sx * (D.w / 2 + 0.08), -D.h / 2 - hh / 2, 0])); st.add(box(D.w + 0.32, 0.05, 0.08, M.grey, [0, -D.h / 2 - 0.03, 0])); st.add(box(D.w + 0.4, 0.04, 0.3, M.dark, [0, -D.h / 2 - hh - 0.02, 0])); group.add(place(st, p, dir)); } }
  }
  /** Rectangular radius elbow at `corner` turning from direction din to dout (perpendicular). Returns the centreline radius used. */
  function rectElbow(group, corner, din, dout, D, bodyMat) {
    const vertical = Math.abs(din.y) > 0.5 || Math.abs(dout.y) > 0.5; const we = vertical ? D.h : D.w, he = vertical ? D.w : D.h; const r = we / 2; const R = r + we / 2;
    const el = DP.elbowRect({ w: we, h: he, radius: r, angleDeg: 90 }); DP.setBodyMaterial(el, bodyMat);
    const X = dout.clone().normalize(), Zd = din.clone().normalize(), Y = Zd.clone().cross(X); const mtx = new THREE.Matrix4().makeBasis(X, Y, Zd); el.quaternion.setFromRotationMatrix(mtx);
    el.position.copy(corner).sub(Zd.clone().multiplyScalar(R)); group.add(el); return R;
  }
  function roundElbow(group, corner, din, dout, D, bodyMat) {
    const el = DP.elbowRound({ d: D.d, radius: D.d, angleDeg: 90, gores: 5 }); DP.setBodyMaterial(el, bodyMat); const R = 1.5 * D.d;
    const X = dout.clone().normalize(), Zd = din.clone().normalize(), Y = Zd.clone().cross(X); el.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Zd)); el.position.copy(corner).sub(Zd.clone().multiplyScalar(R)); group.add(el); return R;
  }
  /** Polyline route → pieces & elbows; returns nothing, fills `group`. */
  function route(group, pts, D, bodyMat, opts) {
    const dirs = []; for (let i = 0; i < pts.length - 1; i++) dirs.push(pts[i + 1].clone().sub(pts[i]).normalize());
    let start = pts[0].clone();
    for (let i = 0; i < dirs.length; i++) { let end = pts[i + 1].clone(); let Rnext = 0;
      if (i < dirs.length - 1) { Rnext = D.round ? roundElbow(group, pts[i + 1], dirs[i], dirs[i + 1], D, bodyMat) : rectElbow(group, pts[i + 1], dirs[i], dirs[i + 1], D, bodyMat); end.sub(dirs[i].clone().multiplyScalar(Rnext)); }
      straightRun(group, start, end, D, bodyMat, opts); start = pts[i + 1].clone().add(i < dirs.length - 1 ? dirs[i + 1].clone().multiplyScalar(Rnext) : new THREE.Vector3()); }
  }
  function newSegmentGroup(id, D) { const g = new THREE.Group(); g.userData.pickId = id; const bodyMat = (D.round ? M.spiral : M.galv).clone(); scene.add(g); pickables.push(g); segMeshes[id] = { group: g, bodyMat, D }; return { g, bodyMat }; }
  function particlesAlong(id, pts) { const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.0); const n = 44; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); const cloud = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.14, transparent: true, opacity: 0.9, depthWrite: false })); scene.add(cloud); particles[id] = { curve, cloud, ts: Array.from({ length: n }, (_, i) => i / n), speed: 0.15, count: n, len: curve.getLength() }; }
  function sensorLamp(id, pos) { const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.5 })); lamp.position.copy(pos); scene.add(lamp); sensorLamps[id] = lamp; }
  function callout(id, text, at, from) { callouts[id] = base.addLabel(text, at, { rtl, scale: 0.85, sub: '—', stemFrom: from }); }

  // ---------------------------------------------------------------- network geometry
  function buildNetwork(sized) {
    const S = sized.segs; const M0 = dimsOf(S.M0), M1 = dimsOf(S.M1), B1 = dimsOf(S.B1), B2 = dimsOf(S.B2), B3 = dimsOf(S.B3);
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    // --- M0: AHU discharge → roof run → drop through the roof → junction
    { const { g, bodyMat } = newSegmentGroup('M0', M0);
      const tr = DP.transitionRect({ w1: 0.75, h1: 0.75, w2: M0.w, h2: M0.h, len: 0.5 }); DP.setBodyMaterial(tr, bodyMat); place(tr, V(-8.3, Y_MAIN, 0), V(1, 0, 0)); g.add(tr);
      route(g, [V(-8.05, Y_MAIN, 0), V(-2.5, Y_MAIN, 0), V(-2.5, Y_VOID, 0), V(-0.4, Y_VOID, 0)], M0, bodyMat);
      // roof curb around the penetration
      g.add(box(M0.w + 0.5, 0.45, M0.h + 0.5, M.grey, [-2.5, roofTop + 0.2, 0])); g.add(box(M0.w + 0.62, 0.06, M0.h + 0.62, M.dark, [-2.5, roofTop + 0.44, 0]));
      particlesAlong('M0', [V(-8.5, Y_MAIN, 0), V(-2.5, Y_MAIN, 0), V(-2.5, Y_VOID, 0), V(-0.4, Y_VOID, 0)]);
      callout('M0', labels.M0 || 'M0', V(-5.3, Y_MAIN + M0.h / 2 + 1.1, 0), V(-5.3, Y_MAIN + M0.h / 2, 0)); }
    // --- junction: tee (branch to B1 on +z) + transition to M1
    const zB1 = M0.w / 2 + 0.3; // B1 starts at the tee branch flange
    { const sm = segMeshes.M0; const tee = B1.round ? DP.straightRect({ w: M0.w, h: M0.h, len: 0.8, beading: false }) : DP.teeRect({ w: M0.w, h: M0.h, len: 0.8, bw: B1.w, bh: B1.h, blen: 0.3, side: -1 }); DP.setBodyMaterial(tee, sm.bodyMat); place(tee, V(0, Y_VOID, 0), V(1, 0, 0)); sm.group.add(tee);
      if (B1.round) { const tap = cylinder(B1.d / 2 + 0.02, 0.3, M.flange, [0, Y_VOID, M0.w / 2 + 0.15], [Math.PI / 2, 0, 0], 32, B1.d / 2); sm.group.add(tap); }
      const tr = DP.transitionRect({ w1: M0.w, h1: M0.h, w2: M1.w, h2: M1.h, len: 0.5 }); DP.setBodyMaterial(tr, segMeshes.M0.bodyMat); place(tr, V(0.65, Y_VOID, 0), V(1, 0, 0)); sm.group.add(tr); }
    // --- M1: trunk to the bull-head end box feeding B2 / B3
    { const { g, bodyMat } = newSegmentGroup('M1', M1);
      route(g, [V(0.9, Y_VOID, 0), V(7.6, Y_VOID, 0)], M1, bodyMat);
      const endBox = DP.straightRect({ w: M1.w, h: M1.h, len: 0.8, beading: false }); DP.setBodyMaterial(endBox, bodyMat); place(endBox, V(8.0, Y_VOID, 0), V(1, 0, 0)); g.add(endBox);
      g.add(box(M1.w + 0.06, M1.h + 0.06, 0.03, M.flange, [8.415, Y_VOID, 0])); // end cap
      particlesAlong('M1', [V(0.4, Y_VOID, 0), V(8.0, Y_VOID, 0)]);
      callout('M1', labels.M1 || 'M1', V(4.2, Y_VOID + M1.h / 2 + 0.9, 0), V(4.2, Y_VOID + M1.h / 2, 0)); }
    // --- B1: rectangular branch with a VCD at the take-off (+z)
    { const { g, bodyMat } = newSegmentGroup('B1', B1); const zEnd = 6.2;
      if (B1.round) { const dm = DP.damperRound({ d: B1.d, angleDeg: 0 }); place(dm, V(0, Y_VOID, zB1 + 0.125), V(0, 0, 1)); g.add(dm); dampers.B1 = dm; route(g, [V(0, Y_VOID, zB1 + 0.25), V(0, Y_VOID, zEnd)], B1, bodyMat); }
      else { const dm = DP.damperVCD({ w: B1.w, h: B1.h, angleDeg: 0 }); place(dm, V(0, Y_VOID, zB1 + 0.15), V(0, 0, 1)); g.add(dm); dampers.B1 = dm; route(g, [V(0, Y_VOID, zB1 + 0.3), V(0, Y_VOID, zEnd)], B1, bodyMat); }
      g.add(box(0.16, 0.22, 0.16, M.actuator, [0, Y_VOID + B1.h / 2 + 0.11, zB1 + 0.15])); sensorLamp('B1', V(0, Y_VOID + B1.h / 2 + 0.3, zB1 + 0.15));
      particlesAlong('B1', [V(0, Y_VOID, 0.2), V(0, Y_VOID, zEnd)]);
      callout('B1', labels.B1 || 'B1', V(0, Y_VOID + B1.h / 2 + 0.75, 3.4), V(0, Y_VOID + B1.h / 2, 3.4)); }
    // --- B2 (+z, VAV) and B3 (−z) off the end box
    for (const [id, D, sgn, vav] of [['B2', B2, 1, !!S.B2.vav], ['B3', B3, -1, !!S.B3.vav]]) {
      const { g, bodyMat } = newSegmentGroup(id, D); const dir = V(0, 0, sgn); let z = sgn * (M1.w / 2); const zEnd = sgn * 6.2;
      if (D.round) { const tap = cylinder(D.d / 2 + 0.05, 0.16, M.flange, [8, Y_VOID, z + sgn * 0.08], [Math.PI / 2, 0, 0], 32, D.d / 2 + 0.006); g.add(tap); z += sgn * 0.16; }
      else { const shoe = DP.straightRect({ w: D.w, h: D.h, len: 0.2, flanges: false, beading: false, seam: false }); DP.setBodyMaterial(shoe, bodyMat); place(shoe, V(8, Y_VOID, z + sgn * 0.1), dir); g.add(shoe); z += sgn * 0.2; }
      if (vav) { // VAV terminal: round inlet with damper blade, DDC controller, rectangular discharge, then back to round
        const vb = DP.vavBox({ w: 0.5, h: 0.35, len: 0.9, inlet: D.round ? D.d : Math.min(D.w, 0.4) }); place(vb, V(8, Y_VOID, z + sgn * (0.25 + 0.45)), dir); g.add(vb); dampers[id] = vb; z += sgn * (0.25 + 0.9);
        sensorLamp(id, V(8, Y_VOID + 0.35 / 2 + 0.3, z - sgn * 0.45));
        if (D.round) { const r2r = DP.rectToRound({ w: 0.5, h: 0.35, d: D.d, len: 0.4 }); DP.setBodyMaterial(r2r, bodyMat); place(r2r, V(8, Y_VOID, z + sgn * 0.2), dir); g.add(r2r); z += sgn * 0.4; }
        else { const tr = DP.transitionRect({ w1: 0.5, h1: 0.35, w2: D.w, h2: D.h, len: 0.4 }); DP.setBodyMaterial(tr, bodyMat); place(tr, V(8, Y_VOID, z + sgn * 0.2), dir); g.add(tr); z += sgn * 0.4; }
      } else if (D.round) { const dm = DP.damperRound({ d: D.d, angleDeg: 0 }); place(dm, V(8, Y_VOID, z + sgn * 0.125), dir); g.add(dm); dampers[id] = dm; z += sgn * 0.25; g.add(box(0.14, 0.2, 0.14, M.actuator, [8, Y_VOID + D.d / 2 + 0.1, z - sgn * 0.125])); sensorLamp(id, V(8, Y_VOID + D.d / 2 + 0.28, z - sgn * 0.125)); }
      else { const dm = DP.damperVCD({ w: D.w, h: D.h, angleDeg: 0 }); place(dm, V(8, Y_VOID, z + sgn * 0.15), dir); g.add(dm); dampers[id] = dm; z += sgn * 0.3; sensorLamp(id, V(8, Y_VOID + D.h / 2 + 0.28, z - sgn * 0.15)); }
      route(g, [V(8, Y_VOID, z), V(8, Y_VOID, zEnd)], D, bodyMat);
      particlesAlong(id, [V(8, Y_VOID, sgn * 0.2), V(8, Y_VOID, zEnd)]);
      callout(id, labels[id] || id, V(8, Y_VOID + D.h / 2 + 0.75, sgn * 3.6), V(8, Y_VOID + D.h / 2, sgn * 3.6));
    }
    // --- terminals: spin-in collar on the branch → insulated flex → 4-way diffuser flush with the ceiling
    for (const [id, [branch, xb, z, side]] of Object.entries(TERMINALS)) {
      const D = segMeshes[branch].D; const g = new THREE.Group(); g.userData.pickId = branch; const xd = xb + side * 1.3;
      const collar = cylinder(0.1, 0.14, M.flange, [xb + side * (D.w / 2 + 0.06), Y_VOID - 0.03, z], [0, 0, Math.PI / 2], 24); g.add(collar);
      const dif = DP.diffuser4way({ size: 0.6, neck: 0.2 }); dif.position.set(xd, CEILING_Y - 0.012, z); g.add(dif);
      const neckTop = V(xd, CEILING_Y - 0.012 + 0.36, z);
      const flex = DP.flexAlong([V(xb + side * (D.w / 2 + 0.13), Y_VOID - 0.03, z), V(xb + side * (D.w / 2 + 0.55), Y_VOID - 0.1, z), V(xd, CEILING_Y + 0.8, z), neckTop], { d: 0.2, insulated: true }); g.add(flex);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.7, 28, 1, true), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false })); cone.position.set(xd, CEILING_Y - 0.95, z); cone.rotation.x = Math.PI; g.add(cone); diffuserCones[id] = cone;
      terminalPos[id] = V(xd, CEILING_Y, z); callouts[id] = base.addLabel(id, V(xd, CEILING_Y - 0.62, z), { rtl: false, scale: 0.7, sub: '—', stemFrom: V(xd, CEILING_Y - 0.14, z) });
      scene.add(g); pickables.push(g);
    }
  }
  tickers.push((dt) => { for (const p of Object.values(particles)) { const arr = p.cloud.geometry.attributes.position.array; for (let i = 0; i < p.count; i++) { p.ts[i] = (p.ts[i] + (dt * p.speed) / Math.max(0.5, p.len)) % 1; const v = p.curve.getPointAt(p.ts[i]); arr[i * 3] = v.x + (Math.random() - 0.5) * 0.05; arr[i * 3 + 1] = v.y + (Math.random() - 0.5) * 0.05; arr[i * 3 + 2] = v.z + (Math.random() - 0.5) * 0.05; } p.cloud.geometry.attributes.position.needsUpdate = true; } });

  let hovered = null;
  base.renderer.domElement.addEventListener('click', (e) => { const id = base.pick(e, pickables); if (id) onSelect(id); });
  base.renderer.domElement.addEventListener('pointermove', (e) => { const id = base.pick(e, pickables); if (id !== hovered) { hovered = id; base.renderer.domElement.style.cursor = id ? 'pointer' : 'grab'; } });
  const VIEWS = { overview: [[21, 13, 26], [2, 2.4, 0]], site: [[-48, 26, 62], [1, 1, 4]], ahu: [[-17, 9, 9], [-9, 5.2, 0]], branchA: [[-5, 6.5, 12], [0, 3.4, 3]], branchBC: [[17, 7, 0], [8, 3.4, 0]], inside: [[-7, 1.6, 4.5], [8, 2.8, 0]], top: [[1, 34, 0.1], [1, 0, 0]] };

  const fmt = (v, d = 0) => (Number.isFinite(v) ? v.toFixed(d) : '—');
  const RAMP = { pressure: (s, r) => rampBR(Math.max(0, s.pInPa) / Math.max(200, r.totals.maxStaticPa)), velocity: (s) => rampGYR((s.v - 3) / 8), temperature: (s) => rampBR((s.tOutC - 12) / 10) };
  function applyColors(result) {
    if (!result) return; const segs = result.segments;
    for (const [id, s] of Object.entries(segs)) {
      const sm = segMeshes[id]; if (!sm) continue;
      const c = RAMP[colorMode](s, result); sm.bodyMat.color.copy(c).lerp(new THREE.Color(0xffffff), 0.55); sm.bodyMat.emissive = c.clone().multiplyScalar(0.08);
      const p = particles[id]; if (p) { p.speed = 0.05 + s.v * 0.06; p.cloud.material.opacity = Math.min(0.95, 0.15 + s.qLps / 800); p.cloud.material.color.copy(rampBR((s.tOutC - 12) / 10)); }
      const d = dampers[id]; if (d && d.userData.setAngle) d.userData.setAngle(s.damperDeg || 0);
      const lamp = sensorLamps[id]; if (lamp) { const bad = result.terminals.filter((t) => t.branch === id).some((t) => t.ratio < 0.8); const col = bad ? 0xf59e0b : 0x22c55e; lamp.material.color.setHex(col); lamp.material.emissive.setHex(col); }
      const c2 = callouts[id]; if (c2) c2.set(lastLabels[id] || id, `${fmt(s.qLps)} L/s · ${fmt(s.v, 1)} m/s · ${fmt(s.pInPa)} Pa${s.damperDeg ? ` · ${s.damperDeg}°` : ''}${s.condensation ? ' · ⚠' : ''}`);
    }
    for (const t of result.terminals) { const cone = diffuserCones[t.id]; if (cone) { const k = Math.max(0.15, Math.min(1.6, t.ratio)); cone.scale.set(k, k, k); cone.material.opacity = 0.07 + 0.14 * k; cone.material.color.set(t.ratio < 0.8 ? 0xf59e0b : 0x38bdf8); } const c3 = callouts[t.id]; if (c3) c3.set(t.id, `${fmt(t.qLps)} L/s · ${fmt(t.ratio * 100)}% · ${fmt(t.tempC, 1)} °C`); }
    fanSpeed = (result.fan.speedPct || 100) / 100;
    ahu.setFilter(result.filterDpPa);
    callouts.AHU.set(lastLabels.AHU || 'AHU', `${fmt(result.fan.qLps)} L/s · ${fmt(result.fan.dpPa)} Pa · ${fmt(result.fan.powerKw, 2)} kW · VFD ${result.fan.speedPct}%`);
  }
  return {
    build(sized) { buildNetwork(sized); },
    update(result) { lastResult = result; applyColors(result); },
    setColorMode(m) { colorMode = m; applyColors(lastResult); },
    setLabels(newLabels) { lastLabels = newLabels; applyColors(lastResult); },
    highlight(id) { for (const [sid, sm] of Object.entries(segMeshes)) sm.bodyMat.emissive = sid === id ? new THREE.Color(0x6d5ce7) : new THREE.Color(0x000000); },
    setView(name) { const v = VIEWS[name] || VIEWS.overview; base.flyTo(v[0], v[1]); },
    setHour, setLabelsVisible: base.setLabelsVisible, setQuality: base.setQuality, getQuality: base.getQuality, setAutoRotate: base.setAutoRotate, screenshot: base.screenshot,
    set onQualityChange(fn) { base.onQualityChange = fn; },
    dispose: base.dispose,
  };
}

function buildBuilding(scene, M) {
  // floor slab + carpet, external walls (back-side so the camera always sees inside), glazing band, roof slab + parapet
  scene.add(box(BW, 0.3, BD, new THREE.MeshStandardMaterial({ color: 0xb8b6ae, roughness: 0.9 }), [BX, -0.15, 0]));
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(BW, BD), new THREE.MeshStandardMaterial({ map: TX.carpet(24, 15, '#6f7b8d'), roughness: 0.95 })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(BX, 0.005, 0); carpet.receiveShadow = true; scene.add(carpet);
  // lab floor (vinyl) under branch C
  const vinyl = new THREE.Mesh(new THREE.PlaneGeometry(9, 7.4), new THREE.MeshStandardMaterial({ color: 0xd8dcd6, roughness: 0.6 })); vinyl.rotation.x = -Math.PI / 2; vinyl.position.set(8.5, 0.01, -3.7); scene.add(vinyl);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xeceff3, roughness: 0.8, side: THREE.BackSide });
  for (const [w, x, z, ry] of [[BW, BX, -BD / 2, 0], [BW, BX, BD / 2, Math.PI], [BD, BX - BW / 2, 0, Math.PI / 2], [BD, BX + BW / 2, 0, -Math.PI / 2]]) { const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, ROOF_Y), wallMat); wall.position.set(x, ROOF_Y / 2, z); wall.rotation.y = ry; wall.receiveShadow = true; scene.add(wall); }
  // windows (back-side glass) on the long walls
  const glass = TX.glassMaterial(0x9fc9ea, 0.35); glass.side = THREE.BackSide;
  for (let i = 0; i < 7; i++) for (const [z, ry] of [[-BD / 2 + 0.02, 0], [BD / 2 - 0.02, Math.PI]]) { const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5), glass); win.position.set(BX - 9.5 + i * 3.2, 1.9, z); win.rotation.y = ry; scene.add(win); }
  // internal partitions (glass) between zones A | B/C and between B and C
  const partGlass = TX.glassMaterial(0xcfe6f7, 0.25);
  const p1 = new THREE.Mesh(new THREE.PlaneGeometry(BD, CEILING_Y), partGlass); p1.position.set(4, CEILING_Y / 2, 0); p1.rotation.y = Math.PI / 2; scene.add(p1); scene.add(box(0.08, CEILING_Y, BD, M.grey, [4, CEILING_Y / 2, 0]));
  const p2 = new THREE.Mesh(new THREE.PlaneGeometry(9, CEILING_Y), partGlass); p2.position.set(8.5, CEILING_Y / 2, 0); scene.add(p2); scene.add(box(9, 0.08, 0.08, M.grey, [8.5, CEILING_Y - 0.04, 0]));
  // suspended ceiling: tiles seen from below, semi-transparent from above
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(BW, BD), new THREE.MeshStandardMaterial({ map: TX.ceilingTiles(10, 6), transparent: true, opacity: 0.26, roughness: 0.7, side: THREE.DoubleSide, depthWrite: false, color: 0xc4c9d1 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(BX, CEILING_Y, 0); scene.add(ceil);
  for (let x = -9; x <= 11; x += 4) for (const z of [-4.5, 4.5]) { const lp = box(1.2, 0.05, 0.3, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff7e6, emissiveIntensity: 1.2 }), [x, CEILING_Y - 0.03, z]); scene.add(lp); }
  // roof slab (transparent from above) + parapet + curb for the AHU
  const roof = new THREE.Mesh(new THREE.BoxGeometry(BW, 0.25, BD), new THREE.MeshStandardMaterial({ color: 0xc9cdd2, roughness: 0.8, transparent: true, opacity: 0.12, depthWrite: false })); roof.position.set(BX, ROOF_Y, 0); scene.add(roof);
  for (const [w, d, x, z] of [[BW, 0.2, BX, -BD / 2 + 0.1], [BW, 0.2, BX, BD / 2 - 0.1], [0.2, BD, BX - BW / 2 + 0.1, 0], [0.2, BD, BX + BW / 2 - 0.1, 0]]) scene.add(box(w, 0.6, d, new THREE.MeshStandardMaterial({ color: 0xd5d9de, roughness: 0.8 }), [x, ROOF_Y + 0.4, z]));
  for (const x of [-9.5, -3, 4.5, 12.5]) for (const z of [-BD / 2 + 0.5, BD / 2 - 0.5]) scene.add(box(0.4, ROOF_Y, 0.4, new THREE.MeshStandardMaterial({ color: 0xd8dbe0, roughness: 0.7 }), [x, ROOF_Y / 2, z]));
  // furniture: offices (zone A) desks + chairs + monitors, meeting hall (zone B) long table, lab (zone C) benches
  const desk = (x, z, ry = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.add(box(1.6, 0.05, 0.8, M.desk, [0, 0.74, 0])); for (const [dx, dz] of [[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.3], [0.7, 0.3]]) g.add(box(0.05, 0.72, 0.05, M.grey, [dx, 0.36, dz])); g.add(box(0.5, 0.32, 0.03, M.dark, [0, 1.0, -0.2])); g.add(box(0.1, 0.2, 0.1, M.dark, [0, 0.85, -0.2])); g.add(box(0.5, 0.06, 0.5, M.chair, [0, 0.45, 0.7])); g.add(box(0.5, 0.5, 0.06, M.chair, [0, 0.73, 0.95])); g.add(cylinder(0.03, 0.4, M.grey, [0, 0.22, 0.7])); return g; };
  for (const [x, z] of [[-8, -4.5], [-5.5, -4.5], [-8, -1.5], [-5.5, -1.5], [-2.5, -4.5], [-2.5, -1.5], [-8, 2.5], [-5.5, 2.5], [-2.5, 2.5], [-8, 5.2], [-5.5, 5.2], [-2.5, 5.2], [1.5, -4.5], [1.5, -1.5], [1.5, 2.5], [1.5, 5.2]]) scene.add(desk(x, z));
  for (const [x, z] of [[-9.5, -6.2], [2.8, 6.2]]) { scene.add(cylinder(0.18, 0.5, new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.8 }), [x, 0.25, z])); const pl = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), M.plant); pl.position.set(x, 0.95, z); scene.add(pl); }
  scene.add(box(4.6, 0.06, 1.6, M.wood, [8.5, 0.75, 4.0])); for (const [dx, dz] of [[-2, -0.6], [2, -0.6], [-2, 0.6], [2, 0.6]]) scene.add(box(0.08, 0.72, 0.08, M.grey, [8.5 + dx, 0.36, 4.0 + dz]));
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) scene.add(box(0.5, 0.45, 0.5, M.chair, [6.7 + i * 0.9, 0.45, 4.0 + s * 1.3]));
  scene.add(box(2.4, 1.4, 0.06, M.dark, [12.9, 1.6, 4.0]).rotateY(Math.PI / 2)); // presentation screen
  for (const z of [-2.0, -4.5]) { scene.add(box(6, 0.06, 0.9, new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3 }), [8.5, 0.9, z])); scene.add(box(5.8, 0.85, 0.8, new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.6 }), [8.5, 0.45, z])); for (let i = 0; i < 4; i++) scene.add(cylinder(0.08, 0.35, TX.glassMaterial(0xa8d5f2, 0.6), [6.2 + i * 1.4, 1.1, z])); }
  scene.add(box(1.2, 2.2, 0.8, new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.5 }), [12.3, 1.1, -6.6])); // fume hood
  scene.add(worker([-4, 0, 0.5], Math.PI / 2, { vest: 0x3b82f6, helmet: 0x3b82f6 })); scene.add(worker([9.6, 0, -3.2], Math.PI, { vest: 0xffffff, helmet: 0xffffff }));
  // zone name plates on the floor
  for (const [x, z, text] of [[-4, 6.9, 'A'], [8.5, 6.9, 'B'], [8.5, -6.9, 'C']]) { const sp = textSprite(text, { scale: 0.9, bg: 'rgba(43,75,140,0.92)', color: '#fff', border: 'rgba(255,255,255,0.35)' }); sp.position.set(x, 0.4, z); scene.add(sp); }
}
function buildAHU(scene, M) {
  const g = new THREE.Group(); g.position.set(-11.5, ROOF_Y + 0.12, 0); g.userData.pickId = 'AHU';
  g.add(box(5.2, 0.35, 2.8, M.ahuFrame, [0, 0.18, 0])); // curb / base frame
  const sections = [['mixing', 1.2], ['filter', 1.0], ['coil', 1.3], ['fan', 1.7]]; let x = -2.6;
  for (const [name, len] of sections) { g.add(box(len - 0.03, 2.1, 2.4, M.ahu, [x + len / 2, 1.4, 0])); for (const ex of [x, x + len]) g.add(box(0.06, 2.2, 2.5, M.ahuFrame, [ex, 1.4, 0]));
    if (name !== 'fan') { g.add(box(len * 0.6, 1.4, 0.04, new THREE.MeshStandardMaterial({ color: 0xc7ccd2, roughness: 0.4, metalness: 0.5 }), [x + len / 2, 1.3, 1.22])); g.add(box(0.05, 0.25, 0.05, M.dark, [x + len / 2 + len * 0.22, 1.3, 1.26])); }
    x += len; }
  const fan = new THREE.Group(); for (let i = 0; i < 8; i++) { const blade = box(0.06, 0.62, 0.2, M.dark, [0, 0.38, 0]); const pivot = new THREE.Group(); pivot.rotation.z = (i / 8) * Math.PI * 2; pivot.add(blade); fan.add(pivot); } fan.add(cylinder(0.15, 0.2, M.grey, [0, 0, 0], [0, 0, Math.PI / 2], 16));
  fan.position.set(2.62, 1.4, 0); fan.rotation.y = Math.PI / 2; g.add(fan);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.05, 10, 40), M.ahuFrame); ring.position.set(2.62, 1.4, 0); ring.rotation.y = Math.PI / 2; g.add(ring);
  // inlet louvre (fresh air) on the mixing section, vibration isolators, flexible connection to the supply duct
  for (let i = 0; i < 6; i++) g.add(box(0.9, 0.05, 0.03, M.grey, [-2.1, 0.7 + i * 0.22, -1.22]));
  for (const [ix, iz] of [[-2.3, 1.1], [2.3, 1.1], [-2.3, -1.1], [2.3, -1.1]]) g.add(cylinder(0.08, 0.12, new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 }), [ix, 0.4, iz]));
  g.add(box(0.35, 0.75, 0.75, new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.95 }), [2.75, 1.4, 0])); // canvas flexible connection
  g.add(box(0.5, 0.8, 0.5, M.grey, [-1.3, 2.6, 0.7])); g.add(box(0.5, 0.8, 0.5, M.grey, [-1.3, 2.6, -0.7])); // electrical panel / VFD boxes on top
  g.add(cylinder(0.03, 1.2, M.grey, [0.4, 0.6, 1.5])); g.add(cylinder(0.03, 0.6, M.grey, [0.4, 0.0, 1.8], [Math.PI / 2, 0, 0])); // condensate drain
  const filterLamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.5 })); filterLamp.position.set(-1.0, 2.6, 1.0); g.add(filterLamp);
  scene.add(g); scene.add(contactShadow(5.6, 3.2, [-11.5, ROOF_Y + 0.13, 0], 0.35));
  return { group: g, fan, setFilter(dp) { const bad = dp > 200; const c = bad ? 0xef4444 : dp > 150 ? 0xf59e0b : 0x22c55e; filterLamp.material.color.setHex(c); filterLamp.material.emissive.setHex(c); } };
}
