// 3D digital twin of a rectangular-duct factory hall — daylight industrial visualisation with textured
// concrete, sandwich-panel cladding, portal-frame steel structure, detailed machines, workers, racks, crane,
// forklift and a delivery truck. Representative layout of a Gulf duct plant (60 × 32 m hall).
import { THREE, createBase, textSprite, updateSprite, mat, box, cylinder, contactShadow, worker } from './common.js';
import * as TX from './textures.js';

const HALL = { w: 60, d: 32, eave: 8, ridge: 10.5, bay: 6 };
const STATION_LAYOUT = { // U-shaped production flow
  coil:       { pos: [-22, 0, -8],  size: [9, 3, 7] },
  cutting:    { pos: [-9, 0, -8.5], size: [13, 2.2, 6] },
  forming:    { pos: [5, 0, -8.5],  size: [12, 2, 5] },
  assembly:   { pos: [18, 0, -8],   size: [10, 1.6, 7] },
  insulation: { pos: [18, 0, 6],    size: [8, 1.8, 5] },
  qc:         { pos: [6, 0, 6.5],   size: [7, 1.6, 4.5] },
  dispatch:   { pos: [-9, 0, 7],    size: [14, 1.2, 7] },
};
const FLOW_PATH = ['coil', 'cutting', 'forming', 'assembly', 'insulation', 'qc', 'dispatch'];

// ---- shared materials
let M = null;
function materials() {
  if (M) return M;
  const galv = TX.galvanized(1, 1);
  M = {
    galv: new THREE.MeshStandardMaterial({ map: galv.map, roughnessMap: galv.roughnessMap, color: 0xffffff, metalness: 0.85, roughness: 0.45 }),
    galvDark: new THREE.MeshStandardMaterial({ color: 0x8e959c, metalness: 0.8, roughness: 0.5 }),
    steelBlue: new THREE.MeshStandardMaterial({ map: TX.paintedSteel('#1f4e9c'), metalness: 0.35, roughness: 0.45 }),
    steelGrey: new THREE.MeshStandardMaterial({ map: TX.paintedSteel('#8f98a3'), metalness: 0.4, roughness: 0.5 }),
    steelDark: new THREE.MeshStandardMaterial({ map: TX.paintedSteel('#3a4048'), metalness: 0.4, roughness: 0.55 }),
    orange: new THREE.MeshStandardMaterial({ map: TX.paintedSteel('#e8611b'), metalness: 0.3, roughness: 0.45 }),
    green: new THREE.MeshStandardMaterial({ map: TX.paintedSteel('#2f7d4f'), metalness: 0.3, roughness: 0.5 }),
    yellow: new THREE.MeshStandardMaterial({ map: TX.paintedSteel('#f2b21b'), metalness: 0.3, roughness: 0.45 }),
    structure: new THREE.MeshStandardMaterial({ map: TX.paintedSteel('#6b7c93'), metalness: 0.5, roughness: 0.45 }),
    hazard: new THREE.MeshStandardMaterial({ map: TX.hazard(3), roughness: 0.7, metalness: 0 }),
    wood: new THREE.MeshStandardMaterial({ map: TX.wood(), roughness: 0.9, metalness: 0 }),
    concreteBlock: new THREE.MeshStandardMaterial({ color: 0xa9a59c, roughness: 0.95, metalness: 0 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x1c1f24, roughness: 0.9, metalness: 0 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf1f3f5, roughness: 0.5, metalness: 0.1 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x9fd3ff, emissive: 0x3aa0ff, emissiveIntensity: 0.6, roughness: 0.3 }),
    glass: TX.glassMaterial(0xcfe6f7, 0.3),
    insulation: new THREE.MeshStandardMaterial({ color: 0xf3d27a, roughness: 1, metalness: 0 }),
    foil: new THREE.MeshStandardMaterial({ color: 0xd8dde3, metalness: 0.9, roughness: 0.25 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6e0, emissiveIntensity: 1.6 }),
  };
  return M;
}

export function createFactoryScene(container, { onSelect = () => {}, lang = 'ar', labels = {} } = {}) {
  const base = createBase(container, { camPos: [44, 30, 50], target: [0, 1, 0], sunPos: [35, 70, 40], shadowSize: 70 });
  const { scene, tickers } = base; const rtl = lang === 'ar'; const m = materials();
  const pickables = []; const stationGroups = {}; const statusLights = {}; const wipStacks = {}; const labelSprites = {}; const rings = {};
  const roofGroup = new THREE.Group(); scene.add(roofGroup);

  buildSite(scene, m); buildHall(scene, roofGroup, m);

  // ---- stations
  for (const [id, L] of Object.entries(STATION_LAYOUT)) {
    const g = new THREE.Group(); g.position.set(L.pos[0], 0, L.pos[2]); g.userData.pickId = id;
    // painted floor zone (grey epoxy) with yellow border
    const zone = new THREE.Mesh(new THREE.PlaneGeometry(L.size[0] + 1.6, L.size[2] + 1.6), new THREE.MeshStandardMaterial({ color: 0x8e949b, roughness: 0.85, metalness: 0 })); zone.rotation.x = -Math.PI / 2; zone.position.y = 0.012; zone.receiveShadow = true; g.add(zone);
    const border = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.11, 4), m.yellow); // placeholder replaced by line strips below
    border.visible = false; g.add(border);
    for (const [sx, sz, w, d] of [[0, (L.size[2] + 1.6) / 2, L.size[0] + 1.6, 0.12], [0, -(L.size[2] + 1.6) / 2, L.size[0] + 1.6, 0.12], [(L.size[0] + 1.6) / 2, 0, 0.12, L.size[2] + 1.6], [-(L.size[0] + 1.6) / 2, 0, 0.12, L.size[2] + 1.6]]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color: 0xf2c11b, roughness: 0.7 })); s.rotation.x = -Math.PI / 2; s.position.set(sx, 0.014, sz); g.add(s); }
    buildStation(id, L, g, m);
    // status beacon on a pole
    const px = -L.size[0] / 2 + 0.6, pz = -L.size[2] / 2 + 0.6;
    g.add(cylinder(0.04, L.size[1] + 1.4, m.steelGrey, [px, (L.size[1] + 1.4) / 2, pz]));
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.5 })); light.position.set(px, L.size[1] + 1.6, pz); g.add(light); statusLights[id] = light;
    // signboard label
    const lbl = textSprite(labels[id] || id, { rtl, scale: 1.05 }); lbl.position.set(0, L.size[1] + 2.9, 0); g.add(lbl); labelSprites[id] = lbl;
    // WIP stack beside the station
    const stack = new THREE.Group(); stack.position.set(L.size[0] / 2 + 1.5, 0, 0); g.add(stack); wipStacks[id] = stack;
    // bottleneck ring
    const ring = new THREE.Mesh(new THREE.RingGeometry(Math.max(L.size[0], L.size[2]) / 2 + 1.0, Math.max(L.size[0], L.size[2]) / 2 + 1.35, 64), new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; g.add(ring); rings[id] = ring;
    scene.add(g); stationGroups[id] = g; pickables.push(g);
  }

  // ---- roller conveyor + moving pieces along the U flow
  const pathPts = FLOW_PATH.map((id) => { const L = STATION_LAYOUT[id]; return new THREE.Vector3(L.pos[0], 0.55, L.pos[2] + (L.pos[2] < 0 ? L.size[2] / 2 + 1.6 : -(L.size[2] / 2 + 1.6))); });
  const curve = new THREE.CatmullRomCurve3(pathPts, false, 'catmullrom', 0.08);
  buildConveyor(scene, curve, m);
  const pieceGeo = new THREE.BoxGeometry(1.2, 0.5, 0.7); const pieces = [];
  for (let i = 0; i < 24; i++) { const p = ductPiece(1.2, 0.5, 0.7, m); p.userData.t = i / 24; scene.add(p); pieces.push(p); }
  let pieceSpeed = 0.012;
  tickers.push((dt) => { for (const p of pieces) { p.userData.t = (p.userData.t + dt * pieceSpeed) % 1; const pos = curve.getPointAt(p.userData.t); p.position.copy(pos); p.position.y = 0.85; const tan = curve.getTangentAt(p.userData.t); p.rotation.y = Math.atan2(tan.x, tan.z); p.visible = p.userData.t < 0.985; } });

  // ---- vehicles
  const fork = forklift(m); scene.add(fork);
  const forkCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-26, 0, 13.5), new THREE.Vector3(-2, 0, 13.5), new THREE.Vector3(27, 0, 12), new THREE.Vector3(27, 0, -13.5), new THREE.Vector3(-26, 0, -13.5), new THREE.Vector3(-28.5, 0, 0)], true); let forkT = 0;
  tickers.push((dt) => { forkT = (forkT + dt * 0.016) % 1; const p = forkCurve.getPointAt(forkT); fork.position.copy(p); const tan = forkCurve.getTangentAt(forkT); fork.rotation.y = Math.atan2(tan.x, tan.z) - Math.PI / 2; });
  const truckG = truck(m); truckG.position.set(-9, 0, 25.5); truckG.rotation.y = Math.PI / 2; scene.add(truckG);
  // overhead crane travelling slowly along the hall
  const crane = overheadCrane(m); scene.add(crane); let craneT = 0;
  tickers.push((dt) => { craneT += dt * 0.05; crane.position.x = Math.sin(craneT) * 18; });
  // plasma torch flicker
  const torches = []; scene.traverse((o) => { if (o.userData.torch) torches.push(o); });
  tickers.push((dt) => { for (const t of torches) t.material.emissiveIntensity = 1.2 + Math.random() * 1.6; });
  // pulsing bottleneck ring
  let bottleneck = null; let pulse = 0;
  tickers.push((dt) => { pulse += dt * 3; for (const [id, ring] of Object.entries(rings)) ring.material.opacity = id === bottleneck ? 0.35 + 0.3 * Math.sin(pulse) : 0; });

  // ---- interaction
  let hovered = null;
  base.renderer.domElement.addEventListener('click', (e) => { const id = base.pick(e, pickables); if (id) onSelect(id); });
  base.renderer.domElement.addEventListener('pointermove', (e) => { const id = base.pick(e, pickables); if (id !== hovered) { hovered = id; base.renderer.domElement.style.cursor = id ? 'pointer' : 'grab'; } });
  const VIEWS = { overview: [[44, 30, 50], [0, 1, 0]], line: [[-24, 8, 6], [-6, 1.5, -8]], assembly: [[30, 9, 2], [18, 1.5, -3]], dispatch: [[-16, 9, 22], [-9, 1, 8]], top: [[0, 75, 0.1], [0, 0, 0]], inside: [[-27, 1.7, 2], [10, 2, -4]] };

  return {
    update(kpis) {
      pieceSpeed = 0.004 + 0.02 * Math.min(1.5, kpis.piecesPerHour / 15);
      bottleneck = kpis.wip > 4 ? kpis.bottleneck : null;
      for (const st of kpis.stations) {
        const light = statusLights[st.id]; if (light) { const c = st.status === 'down' ? 0xef4444 : st.status === 'running' ? 0x22c55e : 0xf59e0b; light.material.color.setHex(c); light.material.emissive.setHex(c); }
        const stack = wipStacks[st.id]; if (stack) { const want = Math.min(12, st.queue); while (stack.children.length < want) { const n = stack.children.length; const b = ductPiece(1.2, 0.5, 0.7, m); b.position.set((n % 2) * 1.35, 0.26 + Math.floor(n / 2) * 0.54, 0); stack.add(b); } while (stack.children.length > want) { const b = stack.children.pop(); stack.remove(b); } }
      }
    },
    setLabels(newLabels, newLang) { for (const [id, sp] of Object.entries(labelSprites)) updateSprite(sp, newLabels[id] || id, { rtl: newLang === 'ar', scale: 1.05 }); },
    highlight(id) { for (const [sid, g] of Object.entries(stationGroups)) { const zone = g.children[0]; zone.material.color.setHex(sid === id ? 0x9b8cf0 : 0x8e949b); } },
    setView(name) { const v = VIEWS[name] || VIEWS.overview; base.flyTo(v[0], v[1]); },
    toggleRoof() { roofGroup.visible = !roofGroup.visible; return roofGroup.visible; },
    dispose: base.dispose,
  };
}

// ------------------------------------------------------------------ site & hall
function buildSite(scene, m) {
  const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshStandardMaterial({ color: 0x9d9a92, roughness: 1, metalness: 0 })); asphalt.rotation.x = -Math.PI / 2; asphalt.position.y = -0.03; asphalt.receiveShadow = true; scene.add(asphalt);
  // yard: parking bays, kerbs, some trees
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 5.5), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 })); l.rotation.x = -Math.PI / 2; l.position.set(-40 + i * 3, -0.02, 27); scene.add(l); }
  const kerb = box(70, 0.15, 0.3, m.concreteBlock, [0, 0.05, 30.5]); scene.add(kerb);
  for (const [x, z] of [[-36, 24], [-36, -22], [36, 24], [36, -22], [-42, 0], [42, 0]]) { scene.add(cylinder(0.18, 3, new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.9 }), [x, 1.5, z], [0, 0, 0], 8)); const crown = new THREE.Mesh(new THREE.SphereGeometry(2.4, 12, 10), new THREE.MeshStandardMaterial({ color: 0x4f7a3a, roughness: 0.95 })); crown.position.set(x, 4.6, z); crown.castShadow = true; scene.add(crown); }
}
function buildHall(scene, roofGroup, m) {
  const { w, d, eave, ridge } = HALL;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w + 4, d + 4), new THREE.MeshStandardMaterial({ map: TX.concreteFloor(16, 9), roughness: 0.9, metalness: 0.02 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  // yellow walkway lines and pedestrian zebra
  for (const z of [-3.2, 3.2]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(w - 4, 0.12), new THREE.MeshStandardMaterial({ color: 0xf2c11b, roughness: 0.7 })); l.rotation.x = -Math.PI / 2; l.position.set(0, 0.011, z); scene.add(l); }
  for (let i = 0; i < 8; i++) { const zb = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 6.2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 })); zb.rotation.x = -Math.PI / 2; zb.position.set(-27 + i * 1.0, 0.011, 0); scene.add(zb); }
  // walls (sandwich panels) rendered back-side so the camera always looks into the hall
  const wallMat = new THREE.MeshStandardMaterial({ map: TX.wallPanels(15, 2), roughness: 0.6, metalness: 0.15, side: THREE.BackSide });
  const wallMatShort = new THREE.MeshStandardMaterial({ map: TX.wallPanels(8, 2), roughness: 0.6, metalness: 0.15, side: THREE.BackSide });
  const long = new THREE.PlaneGeometry(w, eave), short = new THREE.PlaneGeometry(d, eave);
  for (const [geo, mt, x, z, ry] of [[long, wallMat, 0, -d / 2, 0], [long, wallMat, 0, d / 2, Math.PI], [short, wallMatShort, -w / 2, 0, Math.PI / 2], [short, wallMatShort, w / 2, 0, -Math.PI / 2]]) { const wall = new THREE.Mesh(geo, mt); wall.position.set(x, eave / 2, z); wall.rotation.y = ry; wall.receiveShadow = true; scene.add(wall); }
  // gable triangles
  const gableShape = new THREE.Shape(); gableShape.moveTo(-d / 2, eave); gableShape.lineTo(0, ridge); gableShape.lineTo(d / 2, eave); gableShape.closePath();
  for (const [x, ry] of [[-w / 2, Math.PI / 2], [w / 2, -Math.PI / 2]]) { const gable = new THREE.Mesh(new THREE.ShapeGeometry(gableShape), new THREE.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.6, side: THREE.BackSide })); gable.position.x = x; gable.rotation.y = ry; scene.add(gable); }
  // blue accent band + company signage on the long wall
  const band = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.6), new THREE.MeshStandardMaterial({ color: 0x2b4b8c, roughness: 0.5, side: THREE.BackSide })); band.position.set(0, 6.3, -d / 2 - 0.02); scene.add(band);
  // window band on the office side and roller-shutter doors on the dispatch side
  for (let i = 0; i < 6; i++) { const win = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.4), TX.glassMaterial(0x9fc9ea, 0.6)); win.position.set(-22 + i * 4.2, 4.6, -d / 2 + 0.05); scene.add(win); }
  for (const x of [-13, -5]) { const door = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshStandardMaterial({ map: TX.shutter(1, 10), metalness: 0.5, roughness: 0.5 })); door.position.set(x, 2.5, d / 2 - 0.05); door.rotation.y = Math.PI; scene.add(door); const frame = box(5.4, 0.25, 0.3, m.steelDark, [x, 5.1, d / 2 - 0.1]); scene.add(frame); }
  const pdoor = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), new THREE.MeshStandardMaterial({ color: 0x2b4b8c, roughness: 0.5 })); pdoor.position.set(-w / 2 + 0.05, 1.1, 10); pdoor.rotation.y = Math.PI / 2; scene.add(pdoor);
  // portal frames: columns, rafters, purlins, runway beams, roof cladding & skylights
  for (let x = -w / 2; x <= w / 2 + 0.01; x += HALL.bay) {
    for (const z of [-d / 2 + 0.3, d / 2 - 0.3]) { scene.add(iBeam(0.45, eave, m.structure, [x, eave / 2, z], 'y')); scene.add(box(0.9, 0.06, 0.9, m.steelDark, [x, 0.03, z])); }
    for (const s of [-1, 1]) { const len = Math.hypot(d / 2, ridge - eave); const r = iBeam(0.35, len, m.structure, [x, (eave + ridge) / 2, s * d / 4], 'z'); r.rotation.x = s * Math.atan2(ridge - eave, d / 2); scene.add(r); }
  }
  for (let z = -d / 2 + 2; z < d / 2; z += 2) { const y = eave + (ridge - eave) * (1 - Math.abs(z) / (d / 2)); scene.add(box(w, 0.12, 0.08, m.structure, [0, y + 0.15, z])); }
  for (const z of [-d / 2 + 1.5, d / 2 - 1.5]) scene.add(box(w - 1, 0.35, 0.3, m.structure, [0, eave - 1.2, z])); // crane runway
  // roof
  const roofMat = new THREE.MeshStandardMaterial({ map: TX.roofDeck(30, 8), roughness: 0.6, metalness: 0.4, side: THREE.BackSide, transparent: true, opacity: 0.92 });
  const slopeLen = Math.hypot(d / 2, ridge - eave); const slopeAng = Math.atan2(ridge - eave, d / 2);
  for (const s of [-1, 1]) { const slope = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.6, slopeLen), roofMat); slope.position.set(0, (eave + ridge) / 2 + 0.3, s * d / 4); slope.rotation.x = -Math.PI / 2 + s * slopeAng * -1; roofGroup.add(slope);
    for (let x = -w / 2 + 4; x < w / 2; x += 8) { const sky = new THREE.Mesh(new THREE.PlaneGeometry(3, slopeLen * 0.6), new THREE.MeshStandardMaterial({ color: 0xf6fbff, transparent: true, opacity: 0.45, roughness: 0.2, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: 0.25 })); sky.position.set(x, (eave + ridge) / 2 + 0.36, s * d / 4); sky.rotation.x = -Math.PI / 2 + s * slopeAng * -1; roofGroup.add(sky); } }
  // high-bay LED luminaires
  for (let x = -24; x <= 24; x += 8) for (const z of [-9, 0, 9]) { const y = eave + (ridge - eave) * (1 - Math.abs(z) / (d / 2)) - 1.2; scene.add(cylinder(0.02, 1.0, m.steelDark, [x, y + 0.5, z])); scene.add(cylinder(0.45, 0.12, m.lamp, [x, y, z], [0, 0, 0], 20)); }
  // office block in the north-west corner (two storeys with glazing) and mezzanine stairs
  const office = new THREE.Group(); office.position.set(22, 0, 12.5);
  office.add(box(12, 3.2, 5, new THREE.MeshStandardMaterial({ color: 0xe6e9ec, roughness: 0.7 }), [0, 1.6, 0])); office.add(box(12, 3.0, 5, new THREE.MeshStandardMaterial({ color: 0xdde2e6, roughness: 0.7 }), [0, 4.7, 0]));
  for (const y of [1.7, 4.8]) for (let i = 0; i < 4; i++) office.add(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3), TX.glassMaterial(0x9fc9ea, 0.7)).translateX(-4.5 + i * 3).translateY(y).translateZ(-2.51));
  const sign = textSprite(HALL_SIGN_TEXT, { scale: 1.1, color: '#fff', bg: 'rgba(43,75,140,0.95)', border: 'rgba(255,255,255,0.4)' }); sign.position.set(0, 6.9, -2.4); office.add(sign);
  scene.add(office);
  // fire extinguishers & first-aid board on columns
  for (const x of [-18, 0, 18]) { scene.add(cylinder(0.08, 0.5, new THREE.MeshStandardMaterial({ color: 0xd11a1a, roughness: 0.4 }), [x + 0.5, 0.9, -d / 2 + 0.9])); }
}
const HALL_SIGN_TEXT = 'DUCT FACTORY · مصنع الدكت';
function iBeam(size, len, material, pos, axis) {
  const g = new THREE.Group(); const t = size * 0.14;
  if (axis === 'y') { g.add(box(size, len, t, material)); g.add(box(size, len, t, material).translateZ(size / 2 - t / 2)); g.children[1].position.z = size / 2 - t / 2; g.add(box(size, len, t, material)); g.children[2].position.z = -size / 2 + t / 2; g.children[0].scale.set(0.3, 1, 1); }
  else { g.add(box(t, size, len, material)); g.add(box(size, t, len, material)); g.children[1].position.y = size / 2 - t / 2; g.add(box(size, t, len, material)); g.children[2].position.y = -size / 2 + t / 2; }
  g.position.set(...pos); return g;
}
function buildConveyor(scene, curve, m) {
  const pts = curve.getPoints(160);
  for (let i = 0; i < pts.length - 1; i += 2) { const a = pts[i], b = pts[Math.min(i + 2, pts.length - 1)]; const len = a.distanceTo(b); const mid = a.clone().add(b).multiplyScalar(0.5); const dir = b.clone().sub(a).normalize();
    const seg = new THREE.Group(); seg.position.copy(mid); seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    seg.add(box(0.08, 0.14, len + 0.05, m.steelBlue, [-0.45, 0.62, 0])); seg.add(box(0.08, 0.14, len + 0.05, m.steelBlue, [0.45, 0.62, 0]));
    for (let k = -len / 2 + 0.15; k < len / 2; k += 0.3) seg.add(cylinder(0.035, 0.86, m.galvDark, [0, 0.62, k], [0, 0, Math.PI / 2], 10));
    if (i % 6 === 0) { seg.add(cylinder(0.03, 0.62, m.steelGrey, [-0.42, 0.31, 0])); seg.add(cylinder(0.03, 0.62, m.steelGrey, [0.42, 0.31, 0])); }
    scene.add(seg); }
}
/** A rectangular duct piece with TDF flanges and corners. */
function ductPiece(w, h, l, m) {
  const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), m.galv); body.castShadow = true; body.receiveShadow = true; g.add(body);
  for (const s of [-1, 1]) { const fl = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.03), m.galvDark); fl.position.z = s * (l / 2 - 0.015); g.add(fl); }
  return g;
}
function forklift(m) {
  const g = new THREE.Group();
  g.add(box(2.0, 0.9, 1.2, m.orange, [0, 0.75, 0])); g.add(box(1.0, 0.7, 1.1, m.steelDark, [-0.5, 1.55, 0])); g.add(box(0.9, 0.05, 1.0, m.steelDark, [0.1, 2.1, 0]));
  for (const z of [-0.5, 0.5]) g.add(cylinder(0.03, 1.0, m.steelDark, [0.6, 1.6, z]));
  g.add(box(0.12, 2.8, 1.1, m.steelDark, [1.15, 1.45, 0])); g.add(box(0.06, 2.6, 0.9, m.steelGrey, [1.22, 1.5, 0]));
  for (const z of [-0.3, 0.3]) g.add(box(1.1, 0.05, 0.12, m.steelDark, [1.75, 0.2, z]));
  for (const [x, z] of [[-0.6, 0.65], [-0.6, -0.65], [0.7, 0.65], [0.7, -0.65]]) { g.add(cylinder(0.32, 0.25, m.rubber, [x, 0.32, z], [Math.PI / 2, 0, 0], 16)); g.add(cylinder(0.16, 0.27, m.steelGrey, [x, 0.32, z], [Math.PI / 2, 0, 0], 12)); }
  g.add(worker([-0.4, 0.95, 0], -Math.PI / 2, { vest: 0xf59e0b })); g.children[g.children.length - 1].scale.set(0.8, 0.8, 0.8);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffa500, emissive: 0xffa500, emissiveIntensity: 2 })); light.position.set(-0.5, 2.35, 0); g.add(light);
  return g;
}
function truck(m) {
  const g = new THREE.Group(); const white = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.35, metalness: 0.3 });
  g.add(box(2.6, 2.6, 2.4, white, [4.6, 2.0, 0])); g.add(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.0), TX.glassMaterial(0x7fb4dd, 0.8)).translateX(5.91).translateY(2.5).rotateY(Math.PI / 2));
  g.add(box(7.5, 0.5, 2.4, m.steelDark, [0.4, 1.05, 0])); g.add(box(7.4, 0.12, 2.4, m.wood, [0.4, 1.35, 0]));
  // load: stacked duct pieces strapped on the flatbed
  for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { const p = ductPiece(1.2, 0.6, 0.9, m); p.position.set(-2.6 + i * 1.35, 1.72 + j * 0.62, (j % 2 ? 0.55 : -0.55)); g.add(p); }
  for (const x of [-2, 0.5, 3]) g.add(box(0.05, 1.35, 2.5, new THREE.MeshStandardMaterial({ color: 0xf2c11b, roughness: 0.8 }), [x, 2.05, 0]));
  for (const [x, z] of [[-2.4, 1.2], [-2.4, -1.2], [-1.4, 1.2], [-1.4, -1.2], [4.4, 1.2], [4.4, -1.2]]) { g.add(cylinder(0.5, 0.35, m.rubber, [x, 0.5, z], [Math.PI / 2, 0, 0], 18)); g.add(cylinder(0.28, 0.37, m.steelGrey, [x, 0.5, z], [Math.PI / 2, 0, 0], 12)); }
  g.add(contactShadow(9, 3, [1, 0.01, 0], 0.4));
  return g;
}
function overheadCrane(m) {
  const g = new THREE.Group(); const y = HALL.eave - 0.6;
  g.add(box(0.5, 0.7, HALL.d - 3, m.yellow, [0, y, 0])); g.add(box(0.5, 0.7, HALL.d - 3, m.yellow, [1.2, y, 0]));
  for (const z of [-(HALL.d - 3) / 2, (HALL.d - 3) / 2]) g.add(box(2.2, 0.5, 0.6, m.steelDark, [0.6, y, z]));
  g.add(box(1.6, 0.9, 1.4, m.steelDark, [0.6, y + 0.8, 3])); g.add(cylinder(0.02, 3.0, m.steelDark, [0.6, y - 1.5, 3])); g.add(box(0.3, 0.25, 0.1, m.yellow, [0.6, y - 3.1, 3]));
  return g;
}
function controlPanel(m, pos, rotY = 0) { const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = rotY; g.add(box(0.7, 1.7, 0.4, m.steelGrey, [0, 0.85, 0])); g.add(box(0.45, 0.3, 0.02, m.screen, [0, 1.35, 0.21])); for (let i = 0; i < 6; i++) g.add(cylinder(0.025, 0.02, new THREE.MeshStandardMaterial({ color: [0x22c55e, 0xef4444, 0xf59e0b][i % 3], emissive: [0x22c55e, 0xef4444, 0xf59e0b][i % 3], emissiveIntensity: 0.8 }), [-0.2 + (i % 3) * 0.2, 0.95 - Math.floor(i / 3) * 0.15, 0.21], [Math.PI / 2, 0, 0], 8)); return g; }
function bench(m, w, d, pos) { const g = new THREE.Group(); g.position.set(...pos); g.add(box(w, 0.08, d, m.wood, [0, 0.9, 0])); for (const [x, z] of [[-w / 2 + 0.1, -d / 2 + 0.1], [w / 2 - 0.1, -d / 2 + 0.1], [-w / 2 + 0.1, d / 2 - 0.1], [w / 2 - 0.1, d / 2 - 0.1]]) g.add(box(0.08, 0.86, 0.08, m.steelDark, [x, 0.43, z])); g.add(box(w - 0.2, 0.05, d - 0.2, m.steelDark, [0, 0.3, 0])); return g; }
function coil(m, r, width, pos, rot = [0, 0, Math.PI / 2]) { const g = new THREE.Group(); g.position.set(...pos); const c = cylinder(r, width, m.galv, [0, 0, 0], rot, 32); g.add(c); const hole = cylinder(r * 0.4, width + 0.02, m.steelDark, [0, 0, 0], rot, 20); g.add(hole); for (const s of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.98, 0.03, 8, 40), m.steelDark); ring.rotation.set(0, Math.PI / 2, 0); ring.position.x = s * (width / 2); g.add(ring); } return g; }
function pallet(m, pos) { const g = new THREE.Group(); g.position.set(...pos); g.add(box(1.2, 0.03, 1.0, m.wood, [0, 0.14, 0])); for (const z of [-0.45, 0, 0.45]) g.add(box(1.2, 0.09, 0.09, m.wood, [0, 0.05, z])); return g; }

// ------------------------------------------------------------------ stations
function buildStation(id, L, g, m) {
  const [w, hgt, d] = L.size;
  switch (id) {
    case 'coil': {
      // cantilever coil racks (blue uprights, orange arms) with coils, plus decoiler with mounted coil
      for (let i = 0; i < 3; i++) { const x = -3.2 + i * 2.6; g.add(box(0.25, 2.8, 0.25, m.steelBlue, [x, 1.4, -2.4])); g.add(box(0.25, 2.8, 0.25, m.steelBlue, [x, 1.4, -1.0])); for (const y of [0.35, 1.5]) { g.add(box(0.15, 0.15, 1.6, m.orange, [x, y, -1.7])); } }
      for (let i = 0; i < 3; i++) { g.add(coil(m, 0.62, 1.25, [-3.2 + i * 2.6, 0.62 + 0.35, -1.7])); if (i < 2) g.add(coil(m, 0.5, 1.25, [-3.2 + i * 2.6, 1.5 + 0.5, -1.7])); }
      g.add(box(2.6, 0.9, 1.6, m.steelBlue, [1.0, 0.45, 1.6])); g.add(cylinder(0.12, 1.8, m.steelDark, [1.0, 1.35, 1.6], [0, 0, Math.PI / 2])); g.add(coil(m, 0.7, 1.3, [1.0, 1.35, 1.6]));
      g.add(box(1.4, 1.2, 0.9, m.steelGrey, [3.4, 0.6, 1.6])); g.add(controlPanel(m, [3.6, 0, -0.2], Math.PI));
      g.add(worker([-0.2, 0, 1.0], Math.PI / 4)); g.add(pallet(m, [3.6, 0, 3.0])); g.add(coil(m, 0.45, 0.9, [3.6, 0.6, 3.0], [Math.PI / 2, 0, 0]));
      break; }
    case 'cutting': {
      // coil line: decoiler → straightener → notcher/punch → plasma gantry → shear → exit table; separate CNC plasma table
      g.add(box(2.2, 1.3, 1.6, m.steelBlue, [-5.6, 0.65, -1.2])); g.add(coil(m, 0.55, 1.2, [-5.6, 1.6, -1.2]));
      g.add(box(2.4, 1.4, 1.5, m.steelBlue, [-3.0, 0.7, -1.2])); for (let i = 0; i < 4; i++) g.add(cylinder(0.08, 1.4, m.galvDark, [-3.7 + i * 0.45, 1.45, -1.2], [Math.PI / 2, 0, 0], 12));
      g.add(box(1.8, 1.9, 1.7, m.steelDark, [-0.6, 0.95, -1.2])); g.add(box(1.2, 0.5, 1.9, m.steelBlue, [-0.6, 2.1, -1.2]));
      g.add(box(4.2, 0.9, 1.8, m.steelGrey, [2.6, 0.45, -1.2])); g.add(box(0.3, 1.6, 2.2, m.orange, [1.0, 1.7, -1.2])); g.add(box(0.3, 1.6, 2.2, m.orange, [4.2, 1.7, -1.2])); g.add(box(3.5, 0.25, 0.3, m.orange, [2.6, 2.4, -1.2]));
      const torch = cylinder(0.05, 0.5, new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffa41b, emissiveIntensity: 1.5 }), [2.2, 1.3, -1.0]); torch.userData.torch = true; g.add(torch); g.add(box(0.25, 0.4, 0.25, m.steelDark, [2.2, 1.75, -1.0]));
      g.add(box(1.2, 1.5, 1.7, m.steelBlue, [5.4, 0.75, -1.2])); // shear
      // fume hood + duct riser to roof (galvanized duct in the duct factory)
      g.add(box(3.6, 0.5, 2.0, m.galv, [2.6, 3.2, -1.2])); g.add(cylinder(0.3, 4.6, m.galv, [4.0, 5.6, -1.2])); g.add(cylinder(0.32, 0.5, m.galvDark, [4.0, 3.5, -1.2]));
      // sheet exit table with cut blanks
      g.add(box(3.0, 0.8, 1.6, m.steelGrey, [-2.8, 0.4, 1.4])); for (let i = 0; i < 5; i++) g.add(box(1.2 - i * 0.05, 0.015, 1.3, m.galv, [-2.8, 0.81 + i * 0.016, 1.4]));
      // CNC plasma table for fittings (orange frame, slats, gantry, water bath)
      g.add(box(3.2, 0.7, 1.7, m.orange, [3.2, 0.35, 1.5])); for (let i = 0; i < 12; i++) g.add(box(0.03, 0.15, 1.5, m.steelDark, [1.75 + i * 0.26, 0.78, 1.5])); g.add(box(0.2, 0.9, 2.0, m.steelDark, [2.3, 1.2, 1.5])); g.add(box(0.2, 0.9, 2.0, m.steelDark, [4.1, 1.2, 1.5])); g.add(box(1.9, 0.15, 0.2, m.steelDark, [3.2, 1.6, 1.5]));
      const torch2 = cylinder(0.04, 0.35, new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffa41b, emissiveIntensity: 1.5 }), [3.0, 1.1, 1.2]); torch2.userData.torch = true; g.add(torch2);
      g.add(controlPanel(m, [5.6, 0, 1.6], -Math.PI / 2)); g.add(controlPanel(m, [-6.0, 0, 1.0], Math.PI / 2));
      // safety fence around plasma area
      for (let i = 0; i < 6; i++) g.add(box(0.04, 1.2, 0.04, m.yellow, [1.4 + i * 0.75, 0.6, 2.6])); g.add(box(4.0, 0.03, 0.03, m.yellow, [3.2, 1.15, 2.6])); g.add(box(4.0, 0.03, 0.03, m.yellow, [3.2, 0.6, 2.6]));
      g.add(worker([-0.6, 0, 0.3], Math.PI)); g.add(worker([5.7, 0, 0.2], -Math.PI / 2, { vest: 0x22c55e }));
      break; }
    case 'forming': {
      const machine = (x, z, mw, mh, md, color, rollers = 2) => { g.add(box(mw, mh * 0.55, md, color, [x, mh * 0.275, z])); g.add(box(mw * 0.8, mh * 0.45, md * 0.8, m.steelDark, [x, mh * 0.55 + mh * 0.22, z])); for (let i = 0; i < rollers; i++) g.add(cylinder(0.09, md * 0.9, m.galvDark, [x - mw * 0.25 + i * (mw * 0.5) / Math.max(1, rollers - 1), mh + 0.05, z], [Math.PI / 2, 0, 0], 12)); g.add(box(mw + 0.8, 0.04, 0.5, m.galvDark, [x, mh * 0.7, z + md / 2 + 0.3])); };
      machine(-4.6, -0.5, 1.5, 1.2, 1.1, m.steelBlue, 3); // Pittsburgh lock former
      machine(-2.3, -0.5, 1.6, 1.2, 1.1, m.steelBlue, 3);  // TDF former
      g.add(box(4.4, 1.4, 1.2, m.green, [1.6, 0.7, -0.5])); g.add(box(4.6, 0.12, 0.3, m.steelDark, [1.6, 1.5, -0.5])); g.add(box(4.0, 0.4, 0.15, m.steelDark, [1.6, 1.9, -1.0])); g.add(box(4.2, 0.015, 0.9, m.galv, [1.6, 1.47, 0.2])); // folding machine with blank
      machine(4.9, -0.5, 1.2, 1.1, 1.0, m.steelBlue, 2); // beader
      g.add(controlPanel(m, [5.6, 0, 1.4], -Math.PI / 2));
      // rack of formed L-shaped blanks
      g.add(box(3.0, 0.08, 1.2, m.steelGrey, [-3.5, 0.6, 1.5])); for (let i = 0; i < 6; i++) g.add(box(0.02, 0.9, 1.1, m.galv, [-4.6 + i * 0.4, 1.1, 1.5]));
      g.add(worker([-3.4, 0, 0.7], Math.PI)); g.add(worker([1.6, 0, 0.9], Math.PI, { vest: 0x22c55e }));
      break; }
    case 'assembly': {
      for (let i = 0; i < 3; i++) { const x = -3.4 + i * 3.2; g.add(bench(m, 2.6, 1.3, [x, 0, -1.8])); const p = ductPiece(1.5, 0.8, 1.1, m); p.position.set(x, 1.34, -1.8); g.add(p); g.add(worker([x, 0, -0.6], Math.PI)); }
      g.add(bench(m, 2.6, 1.3, [-1.8, 0, 1.6])); const big = ductPiece(2.2, 1.0, 1.2, m); big.position.set(-1.8, 1.44, 1.6); g.add(big); g.add(worker([-1.8, 0, 2.8], 0, { vest: 0x22c55e }));
      g.add(box(1.3, 1.4, 1.0, m.steelBlue, [2.6, 0.7, 1.6])); g.add(cylinder(0.08, 1.2, m.galvDark, [2.6, 1.45, 1.6], [Math.PI / 2, 0, 0], 12)); // seam closer
      for (let i = 0; i < 3; i++) { g.add(cylinder(0.18, 0.4, new THREE.MeshStandardMaterial({ color: [0xeeeeee, 0x1d4ed8, 0xeeeeee][i], roughness: 0.6 }), [4.2 + (i % 2) * 0.45, 0.2, 1.2 + Math.floor(i / 2) * 0.5], [0, 0, 0], 14)); } // sealant buckets
      g.add(cylinder(0.25, 0.3, m.orange, [4.4, 2.6, -2.6], [0, 0, Math.PI / 2], 16)); g.add(cylinder(0.03, 2.4, m.steelDark, [4.4, 1.4, -2.6])); // air hose reel
      g.add(controlPanel(m, [4.6, 0, -1.0], -Math.PI / 2));
      break; }
    case 'insulation': {
      g.add(bench(m, 3.2, 1.6, [-1.8, 0, 0])); const p = ductPiece(2.0, 0.9, 1.3, m); p.position.set(-1.8, 1.39, 0); g.add(p); g.add(box(2.1, 0.95, 1.36, m.insulation, [-1.8, 1.39, 0]).translateY(0.001)); g.add(box(2.12, 0.5, 1.38, m.foil, [-1.8, 1.62, 0]));
      for (let i = 0; i < 4; i++) g.add(cylinder(0.45, 1.2, m.insulation, [1.4 + (i % 2) * 1.0, 0.45, -1.5 + Math.floor(i / 2) * 1.0], [0, 0, Math.PI / 2], 18));
      for (let i = 0; i < 6; i++) g.add(box(1.2, 0.03, 2.4, m.foil, [2.6, 0.1 + i * 0.04, 1.2]));
      g.add(box(1.2, 1.5, 1.0, m.steelBlue, [-3.4, 0.75, 1.6])); g.add(box(0.5, 0.4, 0.4, m.steelDark, [-3.4, 1.7, 1.6])); // pinspotter
      g.add(worker([-1.8, 0, 1.3], 0)); g.add(worker([1.9, 0, 0.4], Math.PI / 2, { vest: 0x22c55e }));
      break; }
    case 'qc': {
      g.add(bench(m, 2.8, 1.4, [-1.6, 0, 0])); const p = ductPiece(1.6, 0.8, 1.1, m); p.position.set(-1.6, 1.34, 0); g.add(p); for (const s of [-1, 1]) g.add(box(1.7, 0.9, 0.04, new THREE.MeshStandardMaterial({ color: 0xd11a1a, roughness: 0.5 }), [-1.6, 1.34, s * 0.57]));
      // leakage test cart: fan, orifice tube, gauges
      g.add(box(1.0, 0.8, 0.7, new THREE.MeshStandardMaterial({ color: 0xd11a1a, roughness: 0.5 }), [1.4, 0.6, 0.4])); g.add(cylinder(0.25, 0.6, m.steelDark, [1.4, 1.2, 0.4], [0, 0, Math.PI / 2], 20)); g.add(cylinder(0.06, 1.8, m.galvDark, [0.2, 1.3, 0.4], [0, 0, Math.PI / 2])); for (const [x, z] of [[1.0, 0.75], [1.4, 0.75]]) { g.add(cylinder(0.12, 0.04, m.white, [x, 1.15, z], [Math.PI / 2, 0, 0], 16)); }
      for (const [x, z] of [[1.0, 0.1], [1.8, 0.1], [1.0, 0.7], [1.8, 0.7]]) g.add(cylinder(0.1, 0.08, m.rubber, [x, 0.1, z], [Math.PI / 2, 0, 0], 12));
      g.add(box(0.8, 0.5, 0.05, m.screen, [1.6, 1.75, -1.2])); g.add(cylinder(0.03, 1.5, m.steelDark, [1.6, 0.75, -1.2])); // display stand
      g.add(worker([-0.2, 0, 1.3], 0, { vest: 0xffffff, helmet: 0xffffff }));
      break; }
    case 'dispatch': {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { g.add(pallet(m, [-5 + i * 2.6, 0, -1.8 + j * 2.6])); for (let k = 0; k < 2 + (i % 2); k++) { const p = ductPiece(1.1, 0.5, 0.8, m); p.position.set(-5 + i * 2.6, 0.44 + k * 0.54, -1.8 + j * 2.6); g.add(p); } const wrap = box(1.25, 0.6 + (1 + (i % 2)) * 0.54, 0.95, new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, roughness: 0.15 }), [-5 + i * 2.6, 0.5 + (0.6 + (1 + (i % 2)) * 0.54) / 2, -1.8 + j * 2.6]); g.add(wrap); }
      g.add(box(1.4, 0.15, 1.0, m.orange, [5.2, 0.1, 0])); g.add(box(0.1, 1.2, 0.1, m.orange, [5.8, 0.7, 0])); // pallet jack
      for (let i = 0; i < 3; i++) { g.add(box(0.15, 3.2, 0.15, m.steelBlue, [5.8, 1.6, -2.6 + i * 2.6])); g.add(box(0.15, 3.2, 0.15, m.steelBlue, [6.6, 1.6, -2.6 + i * 2.6])); } for (const y of [1.0, 2.2]) g.add(box(0.1, 0.12, 5.4, m.orange, [5.8, y, 0])); // shelving
      g.add(worker([-1.8, 0, 2.5], Math.PI / 2, { vest: 0x22c55e })); g.add(controlPanel(m, [-6.3, 0, 2.6], Math.PI / 2));
      break; }
  }
}
