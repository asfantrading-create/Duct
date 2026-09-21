// 3D digital twin of a building duct network — daylight cut-away of a single-storey office building:
// carpeted rooms with furniture, suspended ceiling (transparent from above), galvanized ducts with TDF flanges,
// spiral round branches, 4-way diffusers, VAV box, damper actuators, and a detailed rooftop AHU. Colours of the
// ducts and airflow particles follow the live solver results.
import { THREE, createBase, textSprite, updateSprite, mat, box, cylinder, contactShadow, worker } from './common.js';
import * as TX from './textures.js';

const ROUTES = {
  M0: [[-9.4, 5.1, 0], [-2.5, 5.1, 0], [-2.5, 3.6, 0], [-0.4, 3.6, 0]],
  B1: [[0, 3.6, 0.4], [0, 3.6, 6.2]],
  M1: [[0.4, 3.6, 0], [7.6, 3.6, 0]],
  B2: [[8, 3.6, 0.4], [8, 3.6, 6.2]],
  B3: [[8, 3.6, -0.4], [8, 3.6, -6.2]],
};
const TERMINALS = { D1: ['B1', [0, 2.0]], D2: ['B1', [0, 3.6]], D3: ['B1', [0, 5.4]], D4: ['B2', [8, 3.6]], D5: ['B2', [8, 5.4]], D6: ['B3', [8, -2.0]], D7: ['B3', [8, -3.6]], D8: ['B3', [8, -5.4]] };
const CEILING_Y = 3.0, ROOF_Y = 4.2; const BW = 24, BD = 15, BX = 1; // building footprint centred at x=1

export function createBuildingScene(container, { onSelect = () => {}, lang = 'ar', labels = {} } = {}) {
  const base = createBase(container, { camPos: [17, 12, 21], target: [2, 2.4, 0], sunPos: [30, 50, 35], shadowSize: 40 });
  const { scene, tickers } = base; const rtl = lang === 'ar';
  const pickables = []; const segMeshes = {}; const segLabels = {}; const diffuserCones = {}; const particles = {}; const damperDiscs = {}; const sensorLamps = {};
  let colorMode = 'pressure'; let lastResult = null;
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

  buildSite(scene, M); buildBuilding(scene, M);
  const ahu = buildAHU(scene, M, labels, rtl); pickables.push(ahu.group); segLabels.AHU = ahu.label;
  let fanSpeed = 1; tickers.push((dt) => { ahu.fan.rotation.x += dt * 16 * fanSpeed; });

  function buildSegment(id, seg) {
    const pts = ROUTES[id].map((p) => new THREE.Vector3(...p)); const g = new THREE.Group(); g.userData.pickId = id;
    const isRound = seg.shape === 'round'; const w = (seg.aMm || seg.dMm) / 1000, hgt = (seg.bMm || seg.dMm) / 1000;
    const bodyMat = (isRound ? M.spiral : M.galv).clone(); const meshes = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1]; const len = a.distanceTo(b); const mid = a.clone().add(b).multiplyScalar(0.5); const dir = b.clone().sub(a).normalize();
      let mesh;
      if (isRound) { mesh = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, len + (i < pts.length - 2 ? hgt : 0), 32), bodyMat); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); }
      else { mesh = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, len + (i < pts.length - 2 ? hgt : 0)), bodyMat); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir); }
      mesh.position.copy(mid); mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); meshes.push(mesh);
      // TDF flanges every 1.2 m on rectangular duct, couplings every 3 m on spiral
      const pitch = isRound ? 3 : 1.2; for (let s = pitch / 2; s < len; s += pitch) { const fl = isRound ? new THREE.Mesh(new THREE.CylinderGeometry(w / 2 + 0.02, w / 2 + 0.02, 0.06, 32), M.flange) : new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, hgt + 0.06, 0.04), M.flange); const p = a.clone().add(dir.clone().multiplyScalar(s)); fl.position.copy(p); if (isRound) fl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); else fl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir); g.add(fl); }
      // hangers from the slab every 2.4 m for horizontal runs in the ceiling void
      if (Math.abs(dir.y) < 0.1 && a.y < 4) for (let s = 1.2; s < len; s += 2.4) { const p = a.clone().add(dir.clone().multiplyScalar(s)); const rodH = ROOF_Y - (p.y + hgt / 2); for (const side of [-1, 1]) { const off = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(side * (w / 2 + 0.05)); g.add(cylinder(0.012, rodH, M.grey, [p.x + off.x, p.y + hgt / 2 + rodH / 2, p.z + off.z])); } const tr = new THREE.Mesh(new THREE.BoxGeometry(isRound ? 0.06 : w + 0.2, 0.04, 0.06), M.grey); tr.position.set(p.x, p.y - hgt / 2 - 0.03, p.z); tr.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir); if (!isRound) g.add(tr); }
    }
    const midIdx = Math.floor((pts.length - 1) / 2); const mid = pts[midIdx].clone().add(pts[midIdx + 1]).multiplyScalar(0.5);
    const lbl = textSprite(labels[id] || id, { rtl, scale: 0.6 }); lbl.position.copy(mid).add(new THREE.Vector3(0, Math.max(hgt, 0.5) + 0.45, 0)); g.add(lbl); segLabels[id] = lbl;
    if (seg.terminals) { // damper blade + actuator at the branch entry
      const p0 = pts[0], p1 = pts[1]; const d = p1.clone().sub(p0).normalize(); const pos = p0.clone().add(d.clone().multiplyScalar(0.7));
      const pivot = new THREE.Group(); pivot.position.copy(pos); pivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d);
      const disc = new THREE.Mesh(isRound ? new THREE.CylinderGeometry((w / 2) * 0.95, (w / 2) * 0.95, 0.03, 24) : new THREE.BoxGeometry(w * 0.95, hgt * 0.95, 0.03), new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.5, roughness: 0.5 })); if (isRound) disc.rotation.x = Math.PI / 2; pivot.add(disc); g.add(pivot); damperDiscs[id] = { pivot, base: pivot.quaternion.clone() };
      const act = box(0.16, 0.22, 0.16, M.actuator, [pos.x, pos.y + hgt / 2 + 0.11, pos.z]); g.add(act); g.add(cylinder(0.02, 0.2, M.grey, [pos.x, pos.y + hgt / 2 + 0.02, pos.z]));
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.5 })); lamp.position.set(pos.x, pos.y + hgt / 2 + 0.28, pos.z); g.add(lamp); sensorLamps[id] = lamp;
    }
    if (seg.vav) { const p0 = pts[0]; const vb = box(0.9, 0.5, 0.75, M.ahu, [p0.x, p0.y, p0.z + 1.6]); g.add(vb); g.add(box(0.25, 0.3, 0.15, M.actuator, [p0.x + 0.5, p0.y + 0.3, p0.z + 1.6])); const vl = textSprite('VAV', { scale: 0.55 }); vl.position.set(p0.x, p0.y + 0.65, p0.z + 1.6); g.add(vl); }
    scene.add(g); pickables.push(g); segMeshes[id] = { group: g, meshes, pts, isRound, bodyMat };
    // airflow particles
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.0); const n = 44; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const cloud = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.14, transparent: true, opacity: 0.9, depthWrite: false })); scene.add(cloud);
    particles[id] = { curve, cloud, ts: Array.from({ length: n }, (_, i) => i / n), speed: 0.15, count: n, len: curve.getLength() };
  }
  function buildTerminals() {
    for (const [id, [branch, [x, z]]] of Object.entries(TERMINALS)) {
      const g = new THREE.Group(); g.userData.pickId = branch;
      // 4-way square diffuser: frame + concentric cones
      g.add(box(0.6, 0.02, 0.6, M.white, [x, CEILING_Y - 0.01, z])); for (const s of [0.46, 0.32, 0.18]) g.add(box(s, 0.02, s, new THREE.MeshStandardMaterial({ color: 0xe6e9ec, roughness: 0.5 }), [x, CEILING_Y - 0.03 - (0.46 - s) * 0.12, z]));
      g.add(box(0.36, 0.3, 0.36, M.galv, [x, CEILING_Y + 0.15, z])); g.add(cylinder(0.11, 0.3, M.grey, [x, CEILING_Y + 0.45, z])); // neck + flex connection
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.7, 28, 1, true), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false })); cone.position.set(x, CEILING_Y - 0.95, z); cone.rotation.x = Math.PI; g.add(cone); diffuserCones[id] = cone;
      const lbl = textSprite(id, { scale: 0.4 }); lbl.position.set(x, CEILING_Y - 0.28, z + 0.55); g.add(lbl); segLabels[id] = lbl;
      scene.add(g); pickables.push(g);
    }
  }
  buildTerminals();
  tickers.push((dt) => { for (const p of Object.values(particles)) { const arr = p.cloud.geometry.attributes.position.array; for (let i = 0; i < p.count; i++) { p.ts[i] = (p.ts[i] + (dt * p.speed) / Math.max(0.5, p.len)) % 1; const v = p.curve.getPointAt(p.ts[i]); arr[i * 3] = v.x + (Math.random() - 0.5) * 0.05; arr[i * 3 + 1] = v.y + (Math.random() - 0.5) * 0.05; arr[i * 3 + 2] = v.z + (Math.random() - 0.5) * 0.05; } p.cloud.geometry.attributes.position.needsUpdate = true; } });

  let hovered = null;
  base.renderer.domElement.addEventListener('click', (e) => { const id = base.pick(e, pickables); if (id) onSelect(id); });
  base.renderer.domElement.addEventListener('pointermove', (e) => { const id = base.pick(e, pickables); if (id !== hovered) { hovered = id; base.renderer.domElement.style.cursor = id ? 'pointer' : 'grab'; } });
  const VIEWS = { overview: [[17, 12, 21], [2, 2.4, 0]], ahu: [[-17, 9, 9], [-11, 5, 0]], branchA: [[-5, 6.5, 12], [0, 3, 3]], branchBC: [[17, 7, 0], [8, 3, 0]], inside: [[-7, 1.6, 4.5], [8, 2.8, 0]], top: [[1, 34, 0.1], [1, 0, 0]] };

  const RAMP = { pressure: (s, r) => rampBR(Math.max(0, s.pInPa) / Math.max(200, r.totals.maxStaticPa)), velocity: (s) => rampGYR((s.v - 3) / 8), temperature: (s) => rampBR((s.tOutC - 12) / 10) };
  function applyColors(result) {
    if (!result) return; const segs = result.segments;
    for (const [id, s] of Object.entries(segs)) {
      const sm = segMeshes[id]; if (!sm) continue;
      const c = RAMP[colorMode](s, result); sm.bodyMat.color.copy(c).lerp(new THREE.Color(0xffffff), 0.5); sm.bodyMat.emissive = c.clone().multiplyScalar(0.08);
      const p = particles[id]; if (p) { p.speed = 0.05 + s.v * 0.06; p.cloud.material.opacity = Math.min(0.95, 0.15 + s.qLps / 800); p.cloud.material.color.copy(rampBR((s.tOutC - 12) / 10)); }
      const d = damperDiscs[id]; if (d) { d.pivot.quaternion.copy(d.base); d.pivot.rotateOnAxis(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(90 - (s.damperDeg || 0))); }
      const lamp = sensorLamps[id]; if (lamp) { const bad = result.terminals.filter((t) => t.branch === id).some((t) => t.ratio < 0.8); const col = bad ? 0xf59e0b : 0x22c55e; lamp.material.color.setHex(col); lamp.material.emissive.setHex(col); }
    }
    for (const t of result.terminals) { const cone = diffuserCones[t.id]; if (cone) { const k = Math.max(0.15, Math.min(1.6, t.ratio)); cone.scale.set(k, k, k); cone.material.opacity = 0.07 + 0.14 * k; cone.material.color.set(t.ratio < 0.8 ? 0xf59e0b : 0x38bdf8); } }
    fanSpeed = (result.fan.speedPct || 100) / 100;
    ahu.setFilter(result.filterDpPa);
  }
  return {
    build(sized) { for (const [id, seg] of Object.entries(sized.segs)) if (ROUTES[id]) buildSegment(id, seg); },
    update(result) { lastResult = result; applyColors(result); },
    setColorMode(m) { colorMode = m; applyColors(lastResult); },
    setLabels(newLabels, newLang) { for (const [id, sp] of Object.entries(segLabels)) if (newLabels[id]) updateSprite(sp, newLabels[id], { rtl: newLang === 'ar', scale: id === 'AHU' ? 0.85 : 0.6 }); },
    highlight(id) { for (const [sid, sm] of Object.entries(segMeshes)) sm.bodyMat.emissive = sid === id ? new THREE.Color(0x6d5ce7) : new THREE.Color(0x000000); },
    setView(name) { const v = VIEWS[name] || VIEWS.overview; base.flyTo(v[0], v[1]); },
    dispose: base.dispose,
  };
}

import { rampGYR, rampBR } from './common.js';

function buildSite(scene, M) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: 0xa3a89a, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.3; ground.receiveShadow = true; scene.add(ground);
  const paving = new THREE.Mesh(new THREE.PlaneGeometry(BW + 10, BD + 10), new THREE.MeshStandardMaterial({ map: TX.concreteFloor(8, 6), roughness: 0.95 })); paving.rotation.x = -Math.PI / 2; paving.position.set(BX, -0.28, 0); paving.receiveShadow = true; scene.add(paving);
  for (const [x, z] of [[-18, 12], [20, -12], [22, 12], [-18, -12]]) { scene.add(cylinder(0.15, 2.6, new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.9 }), [x, 1.0, z], [0, 0, 0], 8)); const crown = new THREE.Mesh(new THREE.SphereGeometry(2.0, 14, 10), M.plant); crown.position.set(x, 3.6, z); crown.castShadow = true; scene.add(crown); }
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
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(BW, BD), new THREE.MeshStandardMaterial({ map: TX.ceilingTiles(10, 6), transparent: true, opacity: 0.55, roughness: 0.7, side: THREE.DoubleSide })); ceil.rotation.x = Math.PI / 2; ceil.position.set(BX, CEILING_Y, 0); scene.add(ceil);
  for (let x = -9; x <= 11; x += 4) for (const z of [-4.5, 4.5]) { const lp = box(1.2, 0.05, 0.3, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff7e6, emissiveIntensity: 1.2 }), [x, CEILING_Y - 0.03, z]); scene.add(lp); }
  // roof slab (transparent from above) + parapet + curb for the AHU
  const roof = new THREE.Mesh(new THREE.BoxGeometry(BW, 0.25, BD), new THREE.MeshStandardMaterial({ color: 0xc9cdd2, roughness: 0.8, transparent: true, opacity: 0.3 })); roof.position.set(BX, ROOF_Y, 0); scene.add(roof);
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
function buildAHU(scene, M, labels, rtl) {
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
  const label = textSprite(labels.AHU || 'AHU', { rtl, scale: 0.85 }); label.position.set(0, 3.5, 0); g.add(label);
  scene.add(g); scene.add(contactShadow(5.6, 3.2, [-11.5, ROOF_Y + 0.13, 0], 0.35));
  return { group: g, fan, label, setFilter(dp) { const bad = dp > 200; const c = bad ? 0xef4444 : dp > 150 ? 0xf59e0b : 0x22c55e; filterLamp.material.color.setHex(c); filterLamp.material.emissive.setHex(c); } };
}
