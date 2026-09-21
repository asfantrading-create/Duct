// Parametric library of real HVAC duct components (SMACNA/DW144-style construction details):
// rectangular straight with TDF flanges and corners, radius & mitred elbows (with turning vanes), transitions,
// tees, spiral round duct with couplings, gored round elbows, reducers, flexible duct, VCD/fire dampers,
// 4-way diffusers, grilles, VAV boxes and trapeze hangers. All dimensions in metres. Groups carry
// userData.parts = [{ id, ar, en, position }] for labelled viewers.
import * as THREE from 'three';
import * as TX from './textures.js';

let MATS = null;
export function ductMaterials() {
  if (MATS) return MATS;
  const g = TX.galvanized(1, 1);
  MATS = {
    galv: new THREE.MeshStandardMaterial({ map: g.map, roughnessMap: g.roughnessMap, color: 0xffffff, metalness: 0.85, roughness: 0.42 }),
    galvInner: new THREE.MeshStandardMaterial({ color: 0x6b7480, metalness: 0.7, roughness: 0.6, side: THREE.BackSide }),
    flange: new THREE.MeshStandardMaterial({ color: 0x8a939c, metalness: 0.85, roughness: 0.45 }),
    corner: new THREE.MeshStandardMaterial({ color: 0x6d7681, metalness: 0.8, roughness: 0.5 }),
    gasket: new THREE.MeshStandardMaterial({ color: 0x1f2328, roughness: 0.9, metalness: 0 }),
    bolt: new THREE.MeshStandardMaterial({ color: 0x3a4149, metalness: 0.7, roughness: 0.5 }),
    spiral: new THREE.MeshStandardMaterial({ map: TX.spiralSeam(1, 3), metalness: 0.85, roughness: 0.4 }),
    seam: new THREE.MeshStandardMaterial({ color: 0x5b646e, metalness: 0.8, roughness: 0.5 }),
    black: new THREE.MeshStandardMaterial({ color: 0x1c1f24, roughness: 0.8, metalness: 0.2 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.45, metalness: 0.1 }),
    blue: new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5, metalness: 0.3 }),
    red: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5, metalness: 0.4 }),
    foil: new THREE.MeshStandardMaterial({ color: 0xcfd6dd, metalness: 0.9, roughness: 0.3 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xf2b21b, roughness: 0.5, metalness: 0.2 }),
    insulation: new THREE.MeshStandardMaterial({ color: 0xf3d27a, roughness: 1, metalness: 0 }),
    grey: new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.6, metalness: 0.3 }),
  };
  return MATS;
}
const m = () => ductMaterials();
const part = (g, id, ar, en, pos) => { g.userData.parts = g.userData.parts || []; g.userData.parts.push({ id, ar, en, position: new THREE.Vector3(...pos) }); };
function mesh(geo, mat, pos = [0, 0, 0], rot = [0, 0, 0]) { const o = new THREE.Mesh(geo, mat); o.position.set(...pos); o.rotation.set(...rot); o.castShadow = true; o.receiveShadow = true; if (MATS && (mat === MATS.galv || mat === MATS.spiral)) o.userData.body = true; return o; }
/** Replaces the outer-skin material of every duct body inside `group` (used by the twins to colour segments by pressure/velocity). */
export function setBodyMaterial(group, material) { group.traverse((o) => { if (o.isMesh && o.userData.body) o.material = material; }); return group; }
const box = (w, h, d, mat, pos, rot) => mesh(new THREE.BoxGeometry(w, h, d), mat, pos, rot);
const cyl = (r, h, mat, pos, rot, seg = 24, rTop = null) => mesh(new THREE.CylinderGeometry(rTop ?? r, r, h, seg), mat, pos, rot);

/** TDF/TDC flange frame at z with 4 corner pieces, gasket and bolts. */
export function tdfFlange(w, h, z, { bolts = true, gasket = true } = {}) {
  const g = new THREE.Group(); const t = 0.03, depth = 0.035, lip = 0.03;
  g.add(box(w + 2 * lip, t, depth, m().flange, [0, h / 2 + lip - t / 2, z])); g.add(box(w + 2 * lip, t, depth, m().flange, [0, -h / 2 - lip + t / 2, z]));
  g.add(box(t, h + 2 * lip, depth, m().flange, [w / 2 + lip - t / 2, 0, z])); g.add(box(t, h + 2 * lip, depth, m().flange, [-w / 2 - lip + t / 2, 0, z]));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { g.add(box(0.07, 0.07, depth + 0.01, m().corner, [sx * (w / 2 + lip - 0.035), sy * (h / 2 + lip - 0.035), z])); if (bolts) { g.add(cyl(0.008, 0.06, m().bolt, [sx * (w / 2 + lip - 0.035), sy * (h / 2 + lip - 0.035), z], [Math.PI / 2, 0, 0], 8)); g.add(cyl(0.014, 0.008, m().bolt, [sx * (w / 2 + lip - 0.035), sy * (h / 2 + lip - 0.035), z + depth / 2 + 0.004], [Math.PI / 2, 0, 0], 6)); } }
  if (gasket) g.add(box(w + 2 * lip - 0.01, h + 2 * lip - 0.01, 0.006, m().gasket, [0, 0, z + depth / 2 + 0.003]));
  return g;
}
/** Straight rectangular duct along Z, centred. Pittsburgh seam on one corner, TDF flanges at both ends, optional beading. */
export function straightRect({ w = 0.6, h = 0.4, len = 1.2, flanges = true, seam = true, beading = true } = {}) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(w, h, len), m().galv)); g.add(mesh(new THREE.BoxGeometry(w - 0.002, h - 0.002, len + 0.002), m().galvInner));
  if (seam) { g.add(box(0.012, 0.012, len, m().seam, [w / 2, -h / 2, 0])); part(g, 'seam', 'قفل بيتسبرغ (وصلة طولية)', 'Pittsburgh lock (longitudinal seam)', [w / 2, -h / 2, 0]); }
  if (beading && Math.max(w, h) >= 0.45) for (const z of [-len / 4, len / 4]) { g.add(box(w + 0.006, 0.02, 0.02, m().seam, [0, h / 2, z])); g.add(box(0.02, h + 0.006, 0.02, m().seam, [w / 2, 0, z])); }
  if (flanges) { g.add(tdfFlange(w, h, len / 2)); g.add(tdfFlange(w, h, -len / 2, { bolts: false, gasket: false })); part(g, 'flange', 'فلنجة TDF عرضية', 'TDF transverse flange', [0, h / 2 + 0.03, len / 2]); part(g, 'corner', 'زاوية TDF مع مسمار', 'TDF corner piece with bolt', [w / 2 + 0.03, h / 2 + 0.03, len / 2]); part(g, 'gasket', 'حشوة الفلنجة (بيوتيل)', 'Flange gasket (butyl)', [0, -h / 2 - 0.03, len / 2 + 0.03]); }
  part(g, 'body', 'جسم الدكت المجلفن', 'Galvanized duct body', [-w / 2, 0, 0]);
  if (beading) part(g, 'bead', 'خصر تقوية (Beading)', 'Stiffening bead', [0, h / 2 + 0.02, len / 4]);
  g.userData.dims = { w, h, len };
  return g;
}
/** Arc curve in the XZ plane used for swept elbows. */
class ArcCurve extends THREE.Curve { constructor(radius, angle) { super(); this.r = radius; this.a = angle; } getPoint(t, target = new THREE.Vector3()) { const th = t * this.a; return target.set(this.r - this.r * Math.cos(th), 0, this.r * Math.sin(th)); } }
/** Radius (smooth) rectangular elbow: starts at origin heading +Z, turns towards +X. */
export function elbowRect({ w = 0.6, h = 0.4, radius = null, angleDeg = 90, vanes = false } = {}) {
  const r = radius ?? Math.max(w, 0.3); const ang = THREE.MathUtils.degToRad(angleDeg); const g = new THREE.Group();
  const shape = new THREE.Shape(); shape.moveTo(-w / 2, -h / 2); shape.lineTo(w / 2, -h / 2); shape.lineTo(w / 2, h / 2); shape.lineTo(-w / 2, h / 2); shape.closePath();
  const path = new ArcCurve(r + w / 2, ang);
  const geo = new THREE.ExtrudeGeometry(shape, { steps: 28, bevelEnabled: false, extrudePath: path });
  const body = mesh(geo, m().galv); g.add(body);
  // flanges at both ends
  const f1 = tdfFlange(w, h, 0, { bolts: false, gasket: false }); g.add(f1);
  const end = path.getPoint(1); const tan = path.getTangent(1); const f2 = tdfFlange(w, h, 0); f2.position.copy(end); f2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan); g.add(f2);
  // throat & heel seams
  part(g, 'heel', 'الظهر (Heel) نصف قطر خارجي', 'Heel (outer radius)', [-(w / 2) + 0.01, 0, (r + w / 2) * Math.sin(ang / 2)]);
  part(g, 'throat', 'الحلق (Throat) نصف قطر داخلي', 'Throat (inner radius)', [r + w / 2 - (r) * Math.cos(ang / 2), 0, r * Math.sin(ang / 2)]);
  part(g, 'flange', 'فلنجة TDF', 'TDF flange', [0, h / 2 + 0.03, 0]);
  if (vanes) { for (let i = 1; i <= 3; i++) { const rv = (r + w / 2) - w / 2 + (i * w) / 4 - w / 2 + 0.0; const vane = mesh(new THREE.TorusGeometry(Math.max(0.05, rv), 0.004, 6, 24, ang), m().seam, [r + w / 2, 0, 0], [Math.PI / 2, 0, Math.PI]); vane.scale.set(1, 1, 1); vane.position.set(r + w / 2, 0, 0); g.add(vane); } part(g, 'vanes', 'ريش توجيه (Turning vanes)', 'Turning vanes', [r * 0.4, h / 2, r * 0.6]); }
  g.userData.dims = { w, h, radius: r, angleDeg }; g.userData.endPoint = end.clone(); g.userData.endTangent = tan.clone();
  return g;
}
/** Mitred rectangular elbow (90°) with single-thickness turning vanes. */
export function elbowMitre({ w = 0.6, h = 0.4, vanes = true } = {}) {
  const g = new THREE.Group(); const L = w;
  g.add(mesh(new THREE.BoxGeometry(w, h, L), m().galv, [0, 0, L / 2])); g.add(mesh(new THREE.BoxGeometry(L, h, w), m().galv, [L / 2, 0, L]));
  g.add(tdfFlange(w, h, 0, { bolts: false, gasket: false })); const f2 = tdfFlange(w, h, 0); f2.position.set(L, 0, L); f2.rotation.y = -Math.PI / 2; g.add(f2);
  if (vanes) { const n = Math.max(3, Math.round(w / 0.1)); for (let i = 1; i < n; i++) { const off = (i / n) * w; const vane = mesh(new THREE.TorusGeometry(0.08, 0.003, 6, 16, Math.PI / 2), m().seam, [-w / 2 + off + 0.02, 0, L - w / 2 + off - 0.02], [Math.PI / 2, 0, Math.PI / 2]); vane.scale.set(1, h / 0.16 * 0.98, 1); g.add(vane); } part(g, 'vanes', 'ريش توجيه أحادية السماكة', 'Single-thickness turning vanes', [0, h / 2, L]); }
  part(g, 'mitre', 'قطع مائل 45° (Mitre)', '45° mitre joint', [w / 2, h / 2, L]); part(g, 'flange', 'فلنجة TDF', 'TDF flange', [0, h / 2 + 0.03, 0]);
  g.userData.dims = { w, h }; return g;
}
/** Rectangular transition (concentric or offset) between two sections along Z. */
export function transitionRect({ w1 = 0.8, h1 = 0.5, w2 = 0.5, h2 = 0.35, len = 0.6, offsetX = 0, offsetY = 0 } = {}) {
  const g = new THREE.Group();
  const a = [[-w1 / 2, -h1 / 2], [w1 / 2, -h1 / 2], [w1 / 2, h1 / 2], [-w1 / 2, h1 / 2]]; const b = [[-w2 / 2 + offsetX, -h2 / 2 + offsetY], [w2 / 2 + offsetX, -h2 / 2 + offsetY], [w2 / 2 + offsetX, h2 / 2 + offsetY], [-w2 / 2 + offsetX, h2 / 2 + offsetY]];
  const pos = []; const idx = [];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; const base = pos.length / 3; pos.push(a[i][0], a[i][1], -len / 2, a[j][0], a[j][1], -len / 2, b[j][0], b[j][1], len / 2, b[i][0], b[i][1], len / 2); idx.push(base, base + 1, base + 2, base, base + 2, base + 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const uv = []; for (let i = 0; i < 4; i++) uv.push(0, 0, 1, 0, 1, 1, 0, 1); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const body = mesh(geo, m().galv); body.material = m().galv.clone(); body.material.side = THREE.DoubleSide; body.userData.body = true; g.add(body);
  g.add(tdfFlange(w1, h1, -len / 2, { bolts: false, gasket: false })); const f2 = tdfFlange(w2, h2, len / 2); f2.position.set(offsetX, offsetY, 0); g.add(f2);
  const slope = Math.atan2((w1 - w2) / 2, len) * 180 / Math.PI;
  part(g, 'taper', `ميل الجانب ≈ ${slope.toFixed(0)}° (يفضل ≤ 20° تدريجي)`, `Side slope ≈ ${slope.toFixed(0)}° (≤ 20° preferred)`, [w1 / 2, 0, 0]); part(g, 'flange', 'فلنجة TDF', 'TDF flange', [0, h1 / 2 + 0.03, -len / 2]);
  g.userData.dims = { w1, h1, w2, h2, len }; return g;
}
/** Rectangular tee: straight run along Z with a rectangular branch on +X (45° entry collar). */
export function teeRect({ w = 0.6, h = 0.4, len = 1.2, bw = 0.3, bh = 0.3, blen = 0.5, side = 1 } = {}) {
  const g = straightRect({ w, h, len, beading: false });
  const br = straightRect({ w: bw, h: bh, len: blen, beading: false, flanges: false }); br.rotation.y = -side * Math.PI / 2; br.position.set(side * (w / 2 + blen / 2), 0, 0); g.add(br);
  const f = tdfFlange(bw, bh, 0); f.rotation.y = -side * Math.PI / 2; f.position.set(side * (w / 2 + blen), 0, 0); g.add(f);
  const shoe = mesh(new THREE.BoxGeometry(0.05, bh + 0.04, bw + 0.2), m().flange, [side * (w / 2 + 0.02), 0, 0]); g.add(shoe);
  part(g, 'branch', 'فرع (Branch take-off) مع حذاء 45°', 'Branch take-off with 45° shoe', [side * (w / 2 + blen / 2), bh / 2, 0]); part(g, 'main', 'الخط الرئيسي', 'Main run', [-side * w / 2, 0, 0]);
  g.userData.dims = { w, h, len, bw, bh }; return g;
}
/** Spiral round duct along Z with couplings (slip joints) at both ends. */
export function spiralRound({ d = 0.315, len = 3.0 } = {}) {
  const g = new THREE.Group(); const body = mesh(new THREE.CylinderGeometry(d / 2, d / 2, len, 40), m().spiral, [0, 0, 0], [Math.PI / 2, 0, 0]); g.add(body);
  for (const s of [-1, 1]) { g.add(mesh(new THREE.CylinderGeometry(d / 2 + 0.006, d / 2 + 0.006, 0.08, 40), m().flange, [0, 0, s * (len / 2 - 0.04)], [Math.PI / 2, 0, 0])); g.add(mesh(new THREE.TorusGeometry(d / 2 + 0.008, 0.006, 8, 40), m().gasket, [0, 0, s * (len / 2 - 0.09)])); }
  part(g, 'seam', 'وصلة حلزونية رباعية الطبقات', 'Four-ply spiral lockseam', [0, d / 2, 0]); part(g, 'coupling', 'وصلة انزلاقية (Coupling) بحشوة EPDM', 'Slip coupling with EPDM gasket', [0, d / 2 + 0.02, len / 2 - 0.05]);
  g.userData.dims = { d, len }; return g;
}
/** Gored round elbow (segmented), starts heading +Z at origin and turns to +X. */
export function elbowRound({ d = 0.315, radius = null, angleDeg = 90, gores = 5 } = {}) {
  const r = radius ?? d; const ang = THREE.MathUtils.degToRad(angleDeg); const g = new THREE.Group();
  const torus = mesh(new THREE.TorusGeometry(r + d / 2, d / 2, 28, 40, ang), m().spiral.clone(), [r + d / 2, 0, 0], [Math.PI / 2, 0, Math.PI]); torus.material.map = TX.galvanized(2, 1).map; torus.userData.body = true; g.add(torus);
  for (let i = 1; i < gores; i++) { const a = (i / gores) * ang; const ring = mesh(new THREE.TorusGeometry(d / 2 + 0.004, 0.005, 6, 40), m().seam); ring.position.set(r + d / 2 - (r + d / 2) * Math.cos(a), 0, (r + d / 2) * Math.sin(a)); ring.rotation.y = -a; g.add(ring); }
  for (const [p, rot] of [[[0, 0, 0], [Math.PI / 2, 0, 0]], [[r + d / 2 - (r + d / 2) * Math.cos(ang), 0, (r + d / 2) * Math.sin(ang)], [Math.PI / 2, -ang, 0]]]) { const c = mesh(new THREE.CylinderGeometry(d / 2 + 0.006, d / 2 + 0.006, 0.07, 40), m().flange, p); c.rotation.set(...rot); if (p[0] > 0) c.rotation.set(Math.PI / 2, 0, 0), c.rotateY(-ang); g.add(c); }
  part(g, 'gore', `قطع (Gores) عدد ${gores}`, `${gores} gores`, [r * 0.3, d / 2, r * 0.6]); part(g, 'radius', `نصف قطر الخط المركزي = ${(r + d / 2).toFixed(2)} م`, `Centreline radius ${(r + d / 2).toFixed(2)} m`, [r + d / 2, -d / 2, 0]);
  g.userData.dims = { d, radius: r, angleDeg, gores }; return g;
}
/** Round concentric reducer along Z. */
export function reducerRound({ d1 = 0.4, d2 = 0.25, len = 0.4 } = {}) {
  const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(d2 / 2, d1 / 2, len, 40), m().galv, [0, 0, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.CylinderGeometry(d1 / 2 + 0.005, d1 / 2 + 0.005, 0.07, 40), m().flange, [0, 0, -len / 2], [Math.PI / 2, 0, 0])); g.add(mesh(new THREE.CylinderGeometry(d2 / 2 + 0.005, d2 / 2 + 0.005, 0.07, 40), m().flange, [0, 0, len / 2], [Math.PI / 2, 0, 0]));
  part(g, 'taper', `تقليص ${(d1 * 1000).toFixed(0)}→${(d2 * 1000).toFixed(0)} مم`, `Reduction ${(d1 * 1000).toFixed(0)}→${(d2 * 1000).toFixed(0)} mm`, [d1 / 2, 0, 0]); g.userData.dims = { d1, d2, len }; return g;
}
/** Insulated flexible duct (aluminium/PET with helix wire and glass-wool jacket) along a sagging path. */
/** Flexible duct following a Catmull-Rom path through `points` (world/local Vector3s). Returns a group with helix rings, foil core, optional insulation jacket and clamp straps at both ends. */
export function flexAlong(points, { d = 0.2, insulated = true, ringPitch = 0.05 } = {}) {
  const g = new THREE.Group(); const path = new THREE.CatmullRomCurve3(points.map((p) => p.clone()), false, 'catmullrom', 0.3); const len = path.getLength();
  const inner = mesh(new THREE.TubeGeometry(path, Math.max(12, Math.round(len * 24)), d / 2, 20, false), m().foil); g.add(inner);
  const rings = Math.max(4, Math.round(len / ringPitch)); const ringGeo = new THREE.TorusGeometry(d / 2 + 0.006, 0.005, 6, 20);
  for (let i = 0; i <= rings; i++) { const t = i / rings; const p = path.getPointAt(t); const tan = path.getTangentAt(t); const ring = new THREE.Mesh(ringGeo, m().seam); ring.position.copy(p); ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan); g.add(ring); }
  if (insulated) { const jacket = mesh(new THREE.TubeGeometry(path, Math.max(12, Math.round(len * 24)), d / 2 + 0.04, 20, false), new THREE.MeshStandardMaterial({ color: 0xd9dee5, metalness: 0.4, roughness: 0.6, transparent: true, opacity: 0.55 })); jacket.castShadow = false; g.add(jacket); }
  for (const t of [0.03, 0.97]) { const p = path.getPointAt(t); const tan = path.getTangentAt(t); const strap = new THREE.Mesh(new THREE.TorusGeometry(d / 2 + 0.05, 0.008, 8, 30), m().black); strap.position.copy(p); strap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan); g.add(strap); }
  g.userData.path = path; g.userData.dims = { d, len }; return g;
}
export function flexDuct({ d = 0.2, len = 1.5, sag = 0.25, insulated = true } = {}) {
  const g = flexAlong([new THREE.Vector3(0, 0, -len / 2), new THREE.Vector3(0, -sag, 0), new THREE.Vector3(0, 0, len / 2)], { d, insulated });
  if (insulated) part(g, 'jacket', 'غلاف عزل صوف زجاجي 25 مم بحاجز بخار', '25 mm glass-wool jacket with vapour barrier', [d / 2 + 0.05, 0, 0]);
  part(g, 'helix', 'سلك حلزوني فولاذي', 'Steel helix wire', [0, d / 2, 0]); part(g, 'strap', 'رباط تثبيت + مانع تسرب على الطوق', 'Clamp strap + sealant on the collar', [0, d / 2 + 0.06, len / 2 - 0.05]);
  g.userData.dims = { d, len }; return g;
}
/** Round volume-control damper: short sleeve with a single blade on a shaft and a locking quadrant. userData.setAngle(deg). */
export function damperRound({ d = 0.315, angleDeg = 30 } = {}) {
  const g = new THREE.Group(); const L = 0.25;
  g.add(mesh(new THREE.CylinderGeometry(d / 2 + 0.004, d / 2 + 0.004, L, 40), m().galv, [0, 0, 0], [Math.PI / 2, 0, 0])); g.add(mesh(new THREE.CylinderGeometry(d / 2 + 0.002, d / 2 + 0.002, L + 0.002, 40), m().galvInner, [0, 0, 0], [Math.PI / 2, 0, 0]));
  for (const s of [-1, 1]) g.add(mesh(new THREE.CylinderGeometry(d / 2 + 0.012, d / 2 + 0.012, 0.04, 40), m().flange, [0, 0, s * (L / 2 - 0.02)], [Math.PI / 2, 0, 0]));
  const blade = mesh(new THREE.CylinderGeometry(d / 2 - 0.006, d / 2 - 0.006, 0.006, 32), m().flange, [0, 0, 0], [Math.PI / 2, 0, 0]); const pivot = new THREE.Group(); pivot.add(blade); pivot.rotation.x = THREE.MathUtils.degToRad(angleDeg); g.add(pivot);
  g.add(cyl(0.008, d + 0.08, m().bolt, [0, 0, 0], [0, 0, Math.PI / 2], 8)); g.add(cyl(0.05, 0.015, m().black, [d / 2 + 0.045, 0, 0], [0, 0, Math.PI / 2], 24));
  const handle = new THREE.Group(); handle.position.set(d / 2 + 0.055, 0, 0); handle.add(box(0.012, 0.16, 0.012, m().red, [0, 0.08, 0])); handle.rotation.x = THREE.MathUtils.degToRad(angleDeg); g.add(handle);
  g.userData.setAngle = (deg) => { const a = THREE.MathUtils.degToRad(deg); pivot.rotation.x = a; handle.rotation.x = a; };
  part(g, 'blade', `ريشة دائرية بزاوية ${angleDeg}°`, `Round blade at ${angleDeg}°`, [0, d / 2, 0]); part(g, 'quadrant', 'مقبض ربعي مع قفل', 'Locking quadrant', [d / 2 + 0.07, 0.1, 0]); part(g, 'sleeve', 'غلاف قصير بوصلات انزلاقية', 'Short sleeve with slip joints', [-d / 2, 0, 0]);
  g.userData.dims = { d, angleDeg }; return g;
}
/** Square-to-round transition along Z: rectangular w×h at -len/2 to a circle of diameter d at +len/2. */
export function rectToRound({ w = 0.5, h = 0.35, d = 0.315, len = 0.4 } = {}) {
  const g = new THREE.Group(); const N = 48; const rect = [], circ = [];
  for (let i = 0; i < N; i++) { const t = i / N; const per = 2 * (w + h); let s = t * per; let x, y; if (s < w) { x = -w / 2 + s; y = -h / 2; } else if (s < w + h) { x = w / 2; y = -h / 2 + (s - w); } else if (s < 2 * w + h) { x = w / 2 - (s - w - h); y = h / 2; } else { x = -w / 2; y = h / 2 - (s - 2 * w - h); } rect.push([x, y]); const a = -Math.PI * 0.75 + t * Math.PI * 2; circ.push([Math.cos(a) * d / 2, Math.sin(a) * d / 2]); }
  const pos = [], uv = [], idx = [];
  for (let i = 0; i < N; i++) { const j = (i + 1) % N; const b = pos.length / 3; pos.push(rect[i][0], rect[i][1], -len / 2, rect[j][0], rect[j][1], -len / 2, circ[j][0], circ[j][1], len / 2, circ[i][0], circ[i][1], len / 2); uv.push(i / N, 0, (i + 1) / N, 0, (i + 1) / N, 1, i / N, 1); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const body = mesh(geo, m().galv.clone()); body.material.side = THREE.DoubleSide; body.userData.body = true; g.add(body);
  g.add(tdfFlange(w, h, -len / 2, { bolts: false, gasket: false })); g.add(mesh(new THREE.CylinderGeometry(d / 2 + 0.006, d / 2 + 0.006, 0.07, 40), m().flange, [0, 0, len / 2 - 0.02], [Math.PI / 2, 0, 0]));
  part(g, 'rect', `مدخل مستطيل ${(w * 1000).toFixed(0)}×${(h * 1000).toFixed(0)} مم`, `Rectangular end ${(w * 1000).toFixed(0)}×${(h * 1000).toFixed(0)} mm`, [w / 2, h / 2, -len / 2]); part(g, 'round', `مخرج دائري Ø${(d * 1000).toFixed(0)} مم بوصلة انزلاقية`, `Round end Ø${(d * 1000).toFixed(0)} mm with slip joint`, [0, d / 2, len / 2]);
  g.userData.dims = { w, h, d, len }; return g;
}
/** Volume control damper (opposed/single blade) inside a rectangular sleeve, with quadrant handle. */
export function damperVCD({ w = 0.5, h = 0.3, angleDeg = 30, blades = null } = {}) {
  const g = new THREE.Group(); const L = 0.3; const n = blades ?? Math.max(1, Math.round(h / 0.15));
  g.add(mesh(new THREE.BoxGeometry(w, h, L), m().galv)); g.add(mesh(new THREE.BoxGeometry(w - 0.002, h - 0.002, L + 0.002), m().galvInner));
  const bh = h / n; g.userData.blades = []; for (let i = 0; i < n; i++) { const y = -h / 2 + bh / 2 + i * bh; const blade = box(w - 0.02, bh - 0.01, 0.006, m().flange, [0, y, 0], [THREE.MathUtils.degToRad(angleDeg) * (i % 2 ? -1 : 1), 0, 0]); blade.userData.sign = i % 2 ? -1 : 1; g.add(blade); g.userData.blades.push(blade); g.add(cyl(0.008, w + 0.06, m().bolt, [0, y, 0], [0, 0, Math.PI / 2], 8)); }
  g.add(cyl(0.05, 0.015, m().black, [w / 2 + 0.04, 0, 0], [0, 0, Math.PI / 2], 24)); const handlePivot = new THREE.Group(); handlePivot.position.set(w / 2 + 0.05, 0, 0); handlePivot.add(box(0.012, 0.16, 0.012, m().red, [0, 0.08, 0])); handlePivot.rotation.x = THREE.MathUtils.degToRad(angleDeg); g.add(handlePivot); g.userData.handle = handlePivot; g.add(box(0.03, 0.05, 0.03, m().black, [w / 2 + 0.05, -0.02, 0]));
  g.userData.setAngle = (deg) => { const a = THREE.MathUtils.degToRad(deg); for (const b of g.userData.blades) b.rotation.x = a * b.userData.sign; handlePivot.rotation.x = a; };
  g.add(tdfFlange(w, h, L / 2, { bolts: false, gasket: false })); g.add(tdfFlange(w, h, -L / 2, { bolts: false, gasket: false }));
  part(g, 'blade', `${n > 1 ? 'ريش متعاكسة' : 'ريشة'} بزاوية ${angleDeg}°`, `${n > 1 ? 'Opposed blades' : 'Blade'} at ${angleDeg}°`, [0, h / 2, 0]); part(g, 'quadrant', 'مقبض ربعي مع قفل ومؤشر موضع', 'Locking quadrant with position indicator', [w / 2 + 0.06, 0.1, 0]); part(g, 'shaft', 'محور الريشة', 'Blade shaft', [w / 2 + 0.03, -h / 2 + bh / 2, 0]);
  g.userData.dims = { w, h, angleDeg }; return g;
}
/** Curtain-type fire damper in a wall sleeve with retaining angles and fusible link. */
export function fireDamper({ w = 0.5, h = 0.3, closedPct = 0 } = {}) {
  const g = new THREE.Group(); const L = 0.45; const wallT = 0.2;
  g.add(mesh(new THREE.BoxGeometry(w + 0.6, h + 0.6, wallT), new THREE.MeshStandardMaterial({ color: 0xb5b0a6, roughness: 0.95 }))); // wall
  g.add(mesh(new THREE.BoxGeometry(w + 0.03, h + 0.03, L), m().galv)); g.add(mesh(new THREE.BoxGeometry(w + 0.028, h + 0.028, L + 0.002), m().galvInner));
  for (const z of [-L / 2 + 0.01, L / 2 - 0.01]) { g.add(box(w + 0.16, 0.04, 0.04, m().flange, [0, h / 2 + 0.04, z])); g.add(box(w + 0.16, 0.04, 0.04, m().flange, [0, -h / 2 - 0.04, z])); g.add(box(0.04, h + 0.16, 0.04, m().flange, [w / 2 + 0.04, 0, z])); g.add(box(0.04, h + 0.16, 0.04, m().flange, [-w / 2 - 0.04, 0, z])); }
  const stack = Math.max(0.02, (h + 0.02) * (closedPct / 100)); g.add(box(w, stack, 0.02, m().flange, [0, h / 2 - stack / 2, 0])); for (let i = 1; i <= 6; i++) g.add(box(w, 0.004, 0.024, m().seam, [0, h / 2 + 0.025 - i * 0.009, 0]));
  g.add(box(0.03, 0.03, 0.03, m().red, [0, h / 2 + 0.05, 0.05])); g.add(cyl(0.003, 0.08, m().bolt, [0, h / 2 + 0.02, 0.05], [Math.PI / 2, 0, 0], 6));
  part(g, 'sleeve', 'غلاف (Sleeve) داخل الجدار المقاوم للحريق', 'Sleeve through the fire-rated wall', [w / 2, 0, L / 2]); part(g, 'angles', 'زوايا تثبيت من الجهتين', 'Retaining angles both sides', [w / 2 + 0.06, h / 2 + 0.06, L / 2]); part(g, 'curtain', `ستارة الريش (مغلقة ${closedPct}%)`, `Curtain blade stack (${closedPct}% closed)`, [0, h / 2, 0]); part(g, 'link', 'وصلة قابلة للانصهار 72°م', 'Fusible link 72 °C', [0, h / 2 + 0.06, 0.06]);
  g.userData.dims = { w, h }; return g;
}
/** 4-way square ceiling diffuser with neck. */
export function diffuser4way({ size = 0.6, neck = 0.25 } = {}) {
  const g = new THREE.Group(); const coneMat = new THREE.MeshStandardMaterial({ color: 0xeef1f4, roughness: 0.35, metalness: 0.05, side: THREE.DoubleSide });
  // frame: four flat bars flush with the ceiling (y = 0), face pointing down
  const fw = size * 0.09; for (const [x, z, bw, bd] of [[0, size / 2 - fw / 2, size, fw], [0, -size / 2 + fw / 2, size, fw], [size / 2 - fw / 2, 0, fw, size], [-size / 2 + fw / 2, 0, fw, size]]) g.add(box(bw, 0.016, bd, m().white, [x, -0.008, z]));
  // three concentric square cones stepping down into the room (0.5 % of a real 4-way pattern) + centre plate
  for (let i = 0; i < 3; i++) { const outer = size * (0.82 - i * 0.2), inner = size * (0.82 - (i + 1) * 0.2); const cone = mesh(new THREE.CylinderGeometry(inner / 2 * 1.414, outer / 2 * 1.414, 0.045, 4, 1, true), coneMat, [0, -0.012 - i * 0.03 - 0.0225, 0], [0, Math.PI / 4, 0]); g.add(cone); }
  g.add(box(size * 0.22, 0.012, size * 0.22, m().white, [0, -0.12, 0]));
  // plenum boot and neck above the ceiling
  g.add(box(size * 0.62, 0.16, size * 0.62, m().galv, [0, 0.08, 0])); g.add(mesh(new THREE.CylinderGeometry(neck / 2, neck / 2, 0.2, 32), m().galv, [0, 0.26, 0]));
  part(g, 'cones', 'أقماع توزيع 4 اتجاهات (تأثير كواندا)', '4-way distribution cones (Coanda effect)', [0, -0.06, size * 0.35]); part(g, 'neck', 'طوق العنق للدكت المرن', 'Neck collar for flexible duct', [0, 0.3, neck / 2]); part(g, 'frame', 'إطار الطلاء البودرة الأبيض', 'White powder-coated frame', [size / 2, 0, 0]); part(g, 'boot', 'صندوق (Plenum boot) مجلفن', 'Galvanized plenum boot', [-size * 0.31, 0.08, 0]);
  g.userData.dims = { size, neck, neckTopY: 0.36 }; return g;
}
/** Supply/return grille with horizontal blades. */
export function grille({ w = 0.6, h = 0.3 } = {}) {
  const g = new THREE.Group(); g.add(box(w, h, 0.02, m().white)); g.add(box(w - 0.04, h - 0.04, 0.03, m().black, [0, 0, 0]));
  const n = Math.max(3, Math.round(h / 0.025)); for (let i = 0; i < n; i++) g.add(box(w - 0.05, 0.004, 0.03, m().white, [0, -h / 2 + 0.025 + i * ((h - 0.05) / (n - 1)), 0.005], [THREE.MathUtils.degToRad(30), 0, 0]));
  part(g, 'blades', 'ريش أفقية بزاوية 30°', 'Horizontal blades at 30°', [0, 0, 0.03]); g.userData.dims = { w, h }; return g;
}
/** VAV terminal box: round inlet with damper & actuator, controller, rectangular discharge. */
export function vavBox({ w = 0.5, h = 0.35, len = 0.9, inlet = 0.25 } = {}) {
  const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(w, h, len), m().galv)); g.add(mesh(new THREE.BoxGeometry(w - 0.002, h - 0.002, len + 0.002), m().galvInner));
  g.add(mesh(new THREE.CylinderGeometry(inlet / 2, inlet / 2, 0.25, 32), m().spiral, [0, 0, -len / 2 - 0.12], [Math.PI / 2, 0, 0]));
  const bladePivot = new THREE.Group(); bladePivot.position.set(0, 0, -len / 2 - 0.18); bladePivot.add(cyl(inlet / 2 - 0.01, 0.006, m().flange, [0, 0, 0], [Math.PI / 2, 0, 0], 24)); bladePivot.rotation.x = 0.6; g.add(bladePivot); g.add(cyl(0.006, inlet + 0.08, m().bolt, [0, 0, -len / 2 - 0.18], [0, 0, Math.PI / 2], 8)); g.userData.setAngle = (deg) => { bladePivot.rotation.x = THREE.MathUtils.degToRad(deg); };
  g.add(box(0.12, 0.14, 0.1, m().blue, [inlet / 2 + 0.06, 0.02, -len / 2 - 0.18])); g.add(box(0.2, 0.25, 0.06, m().grey, [w / 2 + 0.03, 0, 0.1])); g.add(box(0.14, 0.08, 0.01, new THREE.MeshStandardMaterial({ color: 0x9fd3ff, emissive: 0x3aa0ff, emissiveIntensity: 0.6 }), [w / 2 + 0.065, 0.06, 0.1]));
  g.add(cyl(0.004, 0.12, m().bolt, [0, -inlet / 2 - 0.05, -len / 2 - 0.05], [Math.PI / 2, 0, 0], 6)); g.add(cyl(0.004, 0.12, m().bolt, [0, -inlet / 2 - 0.05, -len / 2 - 0.2], [Math.PI / 2, 0, 0], 6));
  g.add(tdfFlange(w, h, len / 2));
  part(g, 'inlet', 'مدخل دائري مع ريشة دامبر', 'Round inlet with damper blade', [0, inlet / 2, -len / 2 - 0.12]); part(g, 'actuator', 'محرك الدامبر الكهربائي', 'Electric damper actuator', [inlet / 2 + 0.12, 0.05, -len / 2 - 0.18]); part(g, 'controller', 'وحدة تحكم DDC (BACnet)', 'DDC controller (BACnet)', [w / 2 + 0.1, 0.1, 0.1]); part(g, 'sensor', 'حساس تدفق (حلقة بيتو)', 'Flow sensor (pitot ring)', [0, -inlet / 2 - 0.1, -len / 2 - 0.12]); part(g, 'discharge', 'مخرج مستطيل إلى الفروع', 'Rectangular discharge to branches', [0, h / 2 + 0.03, len / 2]);
  g.userData.dims = { w, h, len, inlet }; return g;
}
/** Trapeze hanger: two threaded rods from the slab, bottom angle, nuts. Placed around a duct of w×h at y=0. */
export function hanger({ w = 0.6, h = 0.4, drop = 0.8 } = {}) {
  const g = new THREE.Group(); const rodX = w / 2 + 0.05;
  for (const s of [-1, 1]) { g.add(cyl(0.006, drop, m().grey, [s * rodX, drop / 2 - h / 2 - 0.03, 0], [0, 0, 0], 8)); g.add(cyl(0.012, 0.01, m().bolt, [s * rodX, -h / 2 - 0.045, 0], [0, 0, 0], 6)); g.add(cyl(0.012, 0.01, m().bolt, [s * rodX, -h / 2 - 0.015, 0], [0, 0, 0], 6)); g.add(box(0.06, 0.02, 0.06, m().grey, [s * rodX, drop - h / 2 - 0.03, 0])); }
  g.add(box(w + 0.2, 0.004, 0.04, m().grey, [0, -h / 2 - 0.03, 0])); g.add(box(w + 0.2, 0.04, 0.004, m().grey, [0, -h / 2 - 0.012, 0.02]));
  part(g, 'rod', 'قضيب ملولب 8–10 مم بمثبت سقفي', '8–10 mm threaded rod with slab anchor', [rodX, drop / 2 - h / 2, 0]); part(g, 'angle', 'زاوية حاملة (Trapeze)', 'Bottom support angle (trapeze)', [0, -h / 2 - 0.03, 0.03]);
  g.userData.dims = { w, h, drop }; return g;
}

/** Catalogue used by the interactive gallery. */
export const CATALOG = [
  { id: 'straight', ar: 'مقطع دكت مستطيل بفلنجات TDF', en: 'Rectangular duct with TDF flanges', build: straightRect, params: [['w', 'العرض (م)', 'Width (m)', 0.2, 1.5, 0.05, 0.6], ['h', 'الارتفاع (م)', 'Height (m)', 0.15, 1.0, 0.05, 0.4], ['len', 'الطول (م)', 'Length (m)', 0.6, 1.5, 0.1, 1.2]], info: { ar: 'القطعة القياسية: صاج مجلفن 0.55–1.0 مم، وصلة طولية بيتسبرغ، فلنجات TDF عرضية بزوايا وحشوة، خصور تقوية للألواح العريضة. طول نموذجي 1.2 أو 1.5 م.', en: 'The standard piece: 0.55–1.0 mm galvanized sheet, Pittsburgh longitudinal seam, TDF transverse flanges with corners and gasket, stiffening beads on wide panels. Typical length 1.2 or 1.5 m.' } },
  { id: 'elbow', ar: 'كوع مستطيل بنصف قطر', en: 'Radius rectangular elbow', build: elbowRect, params: [['w', 'العرض (م)', 'Width (m)', 0.2, 1.2, 0.05, 0.6], ['h', 'الارتفاع (م)', 'Height (m)', 0.15, 0.8, 0.05, 0.4], ['angleDeg', 'الزاوية (°)', 'Angle (°)', 30, 90, 15, 90]], info: { ar: 'نصف قطر الحلق ≥ العرض يعطي معامل فقد C ≈ 0.2 مقابل ≈ 1.2 للكوع الحاد بلا ريش. الظهر والحلق يُصنعان من قطع منفصلة تُقفل على الجوانب.', en: 'Throat radius ≥ width gives C ≈ 0.2 versus ≈ 1.2 for a mitred elbow without vanes. Heel and throat are separate pieces locked to the cheeks.' } },
  { id: 'mitre', ar: 'كوع حاد مع ريش توجيه', en: 'Mitred elbow with turning vanes', build: elbowMitre, params: [['w', 'العرض (م)', 'Width (m)', 0.2, 1.2, 0.05, 0.6], ['h', 'الارتفاع (م)', 'Height (m)', 0.15, 0.8, 0.05, 0.4]], info: { ar: 'يُستخدم عند ضيق المكان؛ الريش الأحادية تخفض الفقد إلى C ≈ 0.15–0.35. بلا ريش يقفز الفقد إلى ≈ 1.2 ويزداد الضجيج.', en: 'Used where space is tight; single-thickness vanes cut the loss to C ≈ 0.15–0.35. Without vanes the loss jumps to ≈ 1.2 and noise increases.' } },
  { id: 'transition', ar: 'انتقال مستطيل', en: 'Rectangular transition', build: transitionRect, params: [['w1', 'عرض المدخل (م)', 'Inlet width (m)', 0.3, 1.5, 0.05, 0.8], ['h1', 'ارتفاع المدخل (م)', 'Inlet height (m)', 0.2, 1.0, 0.05, 0.5], ['w2', 'عرض المخرج (م)', 'Outlet width (m)', 0.2, 1.2, 0.05, 0.5], ['h2', 'ارتفاع المخرج (م)', 'Outlet height (m)', 0.15, 0.8, 0.05, 0.35], ['len', 'الطول (م)', 'Length (m)', 0.3, 1.2, 0.1, 0.6]], info: { ar: 'يغيّر المقاس بين قطعتين. زاوية الجانب ≤ 20° للتقليص و≤ 15° للتوسيع تحافظ على فقد منخفض (C ≈ 0.05)؛ الانتقال المفاجئ يرفعها إلى ≈ 0.35.', en: 'Changes size between pieces. Side angle ≤ 20° when contracting and ≤ 15° when expanding keeps the loss low (C ≈ 0.05); an abrupt change raises it to ≈ 0.35.' } },
  { id: 'tee', ar: 'تفرّع مستطيل (Take-off)', en: 'Rectangular branch take-off', build: teeRect, params: [['w', 'عرض الرئيسي (م)', 'Main width (m)', 0.3, 1.2, 0.05, 0.6], ['h', 'ارتفاع الرئيسي (م)', 'Main height (m)', 0.2, 0.8, 0.05, 0.4], ['bw', 'عرض الفرع (م)', 'Branch width (m)', 0.15, 0.6, 0.05, 0.3], ['bh', 'ارتفاع الفرع (م)', 'Branch height (m)', 0.15, 0.5, 0.05, 0.3]], info: { ar: 'حذاء الدخول بزاوية 45° يخفض فقد الفرع (C ≈ 0.5) مقارنة بالفتحة المستقيمة (≈ 1.0). يوضع دامبر ضبط الحجم على الفرع قرب التفرّع.', en: 'A 45° entry shoe lowers the branch loss (C ≈ 0.5) compared with a straight opening (≈ 1.0). The volume damper goes on the branch near the take-off.' } },
  { id: 'spiral', ar: 'دكت دائري حلزوني', en: 'Spiral round duct', build: spiralRound, params: [['d', 'القطر (م)', 'Diameter (m)', 0.1, 1.0, 0.025, 0.315], ['len', 'الطول (م)', 'Length (m)', 1, 4, 0.5, 3]], info: { ar: 'شريط مجلفن يُلف حلزونياً بوصلة رباعية الطبقات؛ فئة تسرب أفضل (CL 3–6)، أقوى وأخف من المستطيل لنفس المساحة، وأطوال حتى 6 م.', en: 'Galvanized strip wound helically with a four-ply lockseam; better leakage class (CL 3–6), stronger and lighter than rectangular for the same area, lengths up to 6 m.' } },
  { id: 'elbowRound', ar: 'كوع دائري مقطّع (Gored)', en: 'Gored round elbow', build: elbowRound, params: [['d', 'القطر (م)', 'Diameter (m)', 0.1, 0.8, 0.025, 0.315], ['angleDeg', 'الزاوية (°)', 'Angle (°)', 30, 90, 15, 90], ['gores', 'عدد القطع', 'Gores', 3, 7, 1, 5]], info: { ar: 'يُصنع من قطع (Gores) على ماكينة Gorelocker؛ نصف قطر الخط المركزي 1.5 D يعطي C ≈ 0.15.', en: 'Made from gores on a gorelocker machine; a centreline radius of 1.5 D gives C ≈ 0.15.' } },
  { id: 'reducer', ar: 'مقلّص دائري', en: 'Round reducer', build: reducerRound, params: [['d1', 'القطر الكبير (م)', 'Large diameter (m)', 0.2, 1.0, 0.025, 0.4], ['d2', 'القطر الصغير (م)', 'Small diameter (m)', 0.1, 0.8, 0.025, 0.25], ['len', 'الطول (م)', 'Length (m)', 0.2, 0.8, 0.05, 0.4]], info: { ar: 'انتقال دائري متحد المركز؛ الطول ≥ ضعف فرق القطرين يحافظ على انسيابية التدفق.', en: 'Concentric round transition; a length ≥ twice the diameter difference keeps the flow smooth.' } },
  { id: 'flex', ar: 'دكت مرن معزول', en: 'Insulated flexible duct', build: flexDuct, params: [['d', 'القطر (م)', 'Diameter (m)', 0.1, 0.4, 0.025, 0.2], ['len', 'الطول (م)', 'Length (m)', 0.5, 2.0, 0.1, 1.5], ['sag', 'الترهل (م)', 'Sag (m)', 0, 0.5, 0.05, 0.25]], info: { ar: 'للوصلات النهائية فقط بطول ≤ 1.5–2 م، مشدوداً بلا ترهل أو انحناء حاد؛ الترهل والضغط يضاعفان فقد الاحتكاك عدة مرات (UL 181).', en: 'Final connections only, ≤ 1.5–2 m, fully extended without sag or sharp bends; sag and compression multiply friction loss several times (UL 181).' } },
  { id: 'vcd', ar: 'دامبر ضبط الحجم (VCD)', en: 'Volume control damper (VCD)', build: damperVCD, params: [['w', 'العرض (م)', 'Width (m)', 0.2, 1.2, 0.05, 0.5], ['h', 'الارتفاع (م)', 'Height (m)', 0.15, 0.8, 0.05, 0.3], ['angleDeg', 'زاوية الريشة (°)', 'Blade angle (°)', 0, 80, 5, 30]], info: { ar: 'يوازن التدفق بين الفروع؛ الريش المتعاكسة تعطي تحكماً خطياً أكثر. المقبض الربعي يُقفل ويُعلَّم بعد الموازنة.', en: 'Balances flow between branches; opposed blades give more linear control. The quadrant is locked and marked after balancing.' } },
  { id: 'fire', ar: 'دامبر حريق ستاري', en: 'Curtain fire damper', build: fireDamper, params: [['w', 'العرض (م)', 'Width (m)', 0.2, 1.2, 0.05, 0.5], ['h', 'الارتفاع (م)', 'Height (m)', 0.15, 0.8, 0.05, 0.3], ['closedPct', 'الإغلاق (%)', 'Closed (%)', 0, 100, 10, 0]], info: { ar: 'يُركَّب داخل غلاف عند اختراق الجدار المقاوم للحريق مع زوايا تثبيت من الجهتين؛ تنصهر الوصلة عند 72°م فتسقط الستارة وتغلق الفتحة (UL 555، 1.5 أو 3 ساعات).', en: 'Installed in a sleeve where the duct penetrates a fire-rated wall, with retaining angles both sides; the link melts at 72 °C and the curtain drops to close the opening (UL 555, 1.5 or 3 h).' } },
  { id: 'diffuser', ar: 'مخرج هواء سقفي 4 اتجاهات', en: '4-way ceiling diffuser', build: diffuser4way, params: [['size', 'المقاس (م)', 'Size (m)', 0.3, 0.6, 0.05, 0.6], ['neck', 'قطر العنق (م)', 'Neck diameter (m)', 0.15, 0.35, 0.05, 0.25]], info: { ar: 'يوزع الهواء أفقياً على أربع جهات ملتصقاً بالسقف (تأثير كواندا)؛ يُختار بحسب التدفق ومستوى الضجيج NC ومدى الرمي.', en: 'Distributes air horizontally in four directions along the ceiling (Coanda effect); selected by flow, NC noise level and throw.' } },
  { id: 'grille', ar: 'شبكة هواء (Grille)', en: 'Air grille', build: grille, params: [['w', 'العرض (م)', 'Width (m)', 0.2, 1.2, 0.05, 0.6], ['h', 'الارتفاع (م)', 'Height (m)', 0.1, 0.6, 0.05, 0.3]], info: { ar: 'للراجع أو الإمداد الجانبي؛ الريش تحدد اتجاه الرمي، وسرعة الوجه ≤ 2–3 م/ث للضجيج.', en: 'For return or side-wall supply; blades set the throw direction, face velocity ≤ 2–3 m/s for noise.' } },
  { id: 'vav', ar: 'صندوق حجم متغير (VAV)', en: 'VAV terminal box', build: vavBox, params: [['w', 'العرض (م)', 'Width (m)', 0.3, 0.8, 0.05, 0.5], ['h', 'الارتفاع (م)', 'Height (m)', 0.25, 0.5, 0.05, 0.35], ['inlet', 'قطر المدخل (م)', 'Inlet diameter (m)', 0.15, 0.4, 0.05, 0.25]], info: { ar: 'يغيّر التدفق للمنطقة بحسب الحمل عبر ريشة مدخل يحركها محرك تتحكم به وحدة DDC مع حساس تدفق؛ يحتاج ضغطاً استاتيكياً أدنى عند المدخل (60–125 باسكال).', en: 'Varies zone airflow with load through an inlet blade driven by an actuator under DDC control with a flow sensor; needs a minimum inlet static pressure (60–125 Pa).' } },
  { id: 'vcdRound', ar: 'دامبر ضبط حجم دائري', en: 'Round volume damper', build: damperRound, params: [['d', 'القطر (م)', 'Diameter (m)', 0.1, 0.8, 0.025, 0.315], ['angleDeg', 'زاوية الريشة (°)', 'Blade angle (°)', 0, 85, 5, 30]], info: { ar: 'ريشة دائرية واحدة على محور مع مقبض ربعي؛ يُركَّب على فرع الدكت الحلزوني قرب التفرّع لموازنة التدفق (TAB).', en: 'A single round blade on a shaft with a locking quadrant; fitted on the spiral branch near the take-off for balancing (TAB).' } },
  { id: 'rect2round', ar: 'انتقال مستطيل → دائري', en: 'Square-to-round transition', build: rectToRound, params: [['w', 'العرض (م)', 'Width (m)', 0.2, 1.2, 0.05, 0.5], ['h', 'الارتفاع (م)', 'Height (m)', 0.15, 0.8, 0.05, 0.35], ['d', 'القطر (م)', 'Diameter (m)', 0.1, 0.8, 0.025, 0.315], ['len', 'الطول (م)', 'Length (m)', 0.2, 0.8, 0.05, 0.4]], info: { ar: 'يربط مخرج مستطيل (صندوق VAV أو دكت رئيسي) بدكت دائري حلزوني؛ يُصنع بالفرد الهندسي (Triangulation) على ماكينة البلازما ويُطبّق الطول ≥ 1.5 × فرق الأبعاد.', en: 'Joins a rectangular outlet (VAV box or main duct) to spiral round duct; developed by triangulation on the plasma table, length ≥ 1.5 × the size difference.' } },
  { id: 'hanger', ar: 'حمالة Trapeze', en: 'Trapeze hanger', build: hanger, params: [['w', 'عرض الدكت (م)', 'Duct width (m)', 0.2, 1.5, 0.05, 0.6], ['h', 'ارتفاع الدكت (م)', 'Duct height (m)', 0.15, 1.0, 0.05, 0.4], ['drop', 'طول التعليق (م)', 'Drop (m)', 0.3, 1.5, 0.1, 0.8]], info: { ar: 'قضيبان ملولبان وزاوية سفلية كل 2.4–3 م؛ تُثبَّت في الخرسانة بمثبتات تمدد ولا تُعلَّق على أنظمة أخرى.', en: 'Two threaded rods and a bottom angle every 2.4–3 m; anchored in concrete with expansion anchors, never hung from other services.' } },
];
