// 3D digital twin of a rectangular-duct factory hall (representative layout of a Gulf duct plant).
import { THREE, createBase, textSprite, updateSprite, mat, box, cylinder, rampGYR } from './common.js';

const GI = () => mat(0xb8c0cc, { metalness: 0.75, roughness: 0.35 });
const STATION_LAYOUT = { // U-shaped line inside a 60×32 m hall
  coil:       { pos: [-22, 0, -8],  size: [8, 3, 6],   color: 0x3b4a6b },
  cutting:    { pos: [-10, 0, -8],  size: [12, 2.2, 5], color: 0x4b5f8f },
  forming:    { pos: [4, 0, -8],    size: [12, 2, 5],  color: 0x556b9f },
  assembly:   { pos: [17, 0, -8],   size: [9, 1.6, 6], color: 0x6d5ce7 },
  insulation: { pos: [17, 0, 6],    size: [8, 1.8, 5], color: 0x8b5cf6 },
  qc:         { pos: [5, 0, 6],     size: [7, 1.6, 4], color: 0xc93cd6 },
  dispatch:   { pos: [-9, 0, 6],    size: [12, 1.2, 6], color: 0x22c55e },
};
const FLOW_PATH = ['coil', 'cutting', 'forming', 'assembly', 'insulation', 'qc', 'dispatch'];

export function createFactoryScene(container, { onSelect = () => {}, lang = 'ar', labels = {} } = {}) {
  const base = createBase(container, { camPos: [38, 30, 46], target: [0, 1, 0] });
  const { scene, tickers } = base;
  const rtl = lang === 'ar';
  const pickables = []; const stationGroups = {}; const statusLights = {}; const wipStacks = {}; const labelSprites = {}; const rings = {};

  // ---- hall
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(64, 36), mat(0x1a2236, { roughness: 0.95, metalness: 0 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const grid = new THREE.GridHelper(64, 32, 0x2a3552, 0x22304a); grid.position.y = 0.01; scene.add(grid);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x8fa3c7, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false });
  for (const [w, d, x, z, ry] of [[64, 9, 0, -18, 0], [64, 9, 0, 18, 0], [36, 9, -32, 0, Math.PI / 2], [36, 9, 32, 0, Math.PI / 2]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), wallMat); m.position.set(x, 4.5, z); m.rotation.y = ry; scene.add(m); }
  const colMat = mat(0x6b7a99, { metalness: 0.6 });
  for (let x = -30; x <= 30; x += 10) for (const z of [-17.5, 17.5]) scene.add(box(0.5, 9, 0.5, colMat, [x, 4.5, z]));
  for (let x = -30; x <= 30; x += 10) { const t = box(0.3, 0.6, 36, colMat, [x, 9, 0]); scene.add(t); }
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3a4a6a, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }); const roof = new THREE.Mesh(new THREE.PlaneGeometry(64, 36), roofMat); roof.rotation.x = Math.PI / 2; roof.position.y = 9.3; scene.add(roof);
  // yard: truck + loading dock
  const dock = box(14, 0.8, 5, mat(0x2b3653), [-9, 0.4, 21]); scene.add(dock);
  const truck = new THREE.Group(); truck.add(box(8, 3, 2.6, mat(0xe2e8f0), [0, 2.2, 0]), box(2.4, 2.2, 2.6, mat(0x6d5ce7), [5.2, 1.8, 0])); for (const [x, z] of [[-2.6, 1.3], [-2.6, -1.3], [3.5, 1.3], [3.5, -1.3], [1.5, 1.3], [1.5, -1.3]]) truck.add(cylinder(0.55, 0.4, mat(0x111827), [x, 0.55, z], [Math.PI / 2, 0, 0], 16)); truck.position.set(-9, 0, 26); scene.add(truck);

  // ---- stations
  for (const [id, L] of Object.entries(STATION_LAYOUT)) {
    const g = new THREE.Group(); g.position.set(L.pos[0], 0, L.pos[2]); g.userData.pickId = id;
    const pad = box(L.size[0] + 1, 0.1, L.size[2] + 1, mat(0x243050), [0, 0.05, 0]); g.add(pad);
    buildStationMachines(id, L, g);
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.2 })); light.position.set(-L.size[0] / 2 + 0.5, L.size[1] + 1.2, -L.size[2] / 2 + 0.5); g.add(light); statusLights[id] = light;
    const pole = cylinder(0.05, L.size[1] + 1.0, mat(0x94a3b8), [-L.size[0] / 2 + 0.5, (L.size[1] + 1.0) / 2, -L.size[2] / 2 + 0.5]); g.add(pole);
    const lbl = textSprite(labels[id] || id, { rtl, scale: 1.15 }); lbl.position.set(0, L.size[1] + 2.6, 0); g.add(lbl); labelSprites[id] = lbl;
    const stack = new THREE.Group(); stack.position.set(L.size[0] / 2 + 1.6, 0, 0); g.add(stack); wipStacks[id] = stack;
    const ring = new THREE.Mesh(new THREE.RingGeometry(Math.max(L.size[0], L.size[2]) / 2 + 0.8, Math.max(L.size[0], L.size[2]) / 2 + 1.2, 48), new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.12; g.add(ring); rings[id] = ring;
    scene.add(g); stationGroups[id] = g; pickables.push(g);
  }
  // ---- conveyors between stations + moving pieces
  const pathPts = FLOW_PATH.map((id) => { const L = STATION_LAYOUT[id]; return new THREE.Vector3(L.pos[0], 1.0, L.pos[2] + (L.pos[2] < 0 ? 4.2 : -4.2)); });
  const curve = new THREE.CatmullRomCurve3(pathPts, false, 'catmullrom', 0.05);
  const conveyor = new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 0.25, 8, false), mat(0x475569, { metalness: 0.5 })); conveyor.position.y = -0.2; scene.add(conveyor);
  const pieceGeo = new THREE.BoxGeometry(1.2, 0.5, 0.7); const pieces = [];
  for (let i = 0; i < 26; i++) { const p = new THREE.Mesh(pieceGeo, GI()); p.userData.t = i / 26; scene.add(p); pieces.push(p); }
  let pieceSpeed = 0.012;
  tickers.push((dt) => { for (const p of pieces) { p.userData.t = (p.userData.t + dt * pieceSpeed) % 1; const pos = curve.getPointAt(p.userData.t); p.position.copy(pos); const tan = curve.getTangentAt(p.userData.t); p.rotation.y = Math.atan2(tan.x, tan.z); p.visible = p.userData.t < 0.985; } });
  // forklift loop
  const fork = new THREE.Group(); fork.add(box(2.2, 1.2, 1.3, mat(0xf59e0b), [0, 0.9, 0]), box(0.15, 2.6, 1.2, mat(0x334155), [1.3, 1.5, 0]), box(1.1, 0.08, 1.0, mat(0x94a3b8), [1.9, 0.35, 0])); for (const [x, z] of [[-0.7, 0.7], [-0.7, -0.7], [0.7, 0.7], [0.7, -0.7]]) fork.add(cylinder(0.3, 0.3, mat(0x111827), [x, 0.3, z], [Math.PI / 2, 0, 0], 12)); scene.add(fork);
  const forkCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-26, 0, 14), new THREE.Vector3(-4, 0, 14), new THREE.Vector3(26, 0, 12), new THREE.Vector3(26, 0, -14), new THREE.Vector3(-26, 0, -14)], true); let forkT = 0;
  tickers.push((dt) => { forkT = (forkT + dt * 0.02) % 1; const p = forkCurve.getPointAt(forkT); fork.position.copy(p); const tan = forkCurve.getTangentAt(forkT); fork.rotation.y = Math.atan2(tan.x, tan.z) - Math.PI / 2; });
  // pulsing bottleneck ring
  let bottleneck = null; let pulse = 0;
  tickers.push((dt) => { pulse += dt * 3; for (const [id, ring] of Object.entries(rings)) ring.material.opacity = id === bottleneck ? 0.35 + 0.3 * Math.sin(pulse) : 0; });

  // ---- interaction
  let hovered = null;
  base.renderer.domElement.addEventListener('click', (e) => { const id = base.pick(e, pickables); if (id) onSelect(id); });
  base.renderer.domElement.addEventListener('pointermove', (e) => { const id = base.pick(e, pickables); if (id !== hovered) { hovered = id; base.renderer.domElement.style.cursor = id ? 'pointer' : 'grab'; } });

  const VIEWS = { overview: [[38, 30, 46], [0, 1, 0]], line: [[-20, 9, 8], [-4, 1.5, -8]], assembly: [[26, 10, 4], [17, 1.5, -2]], dispatch: [[-14, 9, 20], [-9, 1, 8]], top: [[0, 60, 0.1], [0, 0, 0]] };

  return {
    update(kpis) {
      pieceSpeed = 0.004 + 0.02 * Math.min(1.5, kpis.piecesPerHour / 15);
      bottleneck = kpis.wip > 4 ? kpis.bottleneck : null;
      for (const st of kpis.stations) {
        const light = statusLights[st.id]; if (light) { const c = st.status === 'down' ? 0xef4444 : st.status === 'running' ? 0x22c55e : 0xf59e0b; light.material.color.setHex(c); light.material.emissive.setHex(c); }
        const stack = wipStacks[st.id]; if (stack) { const want = Math.min(12, st.queue); while (stack.children.length < want) { const b = new THREE.Mesh(pieceGeo, GI()); const n = stack.children.length; b.position.set((n % 2) * 1.3, 0.3 + Math.floor(n / 2) * 0.55, 0); stack.add(b); } while (stack.children.length > want) { const b = stack.children.pop(); stack.remove(b); } }
      }
    },
    setLabels(newLabels, newLang) { for (const [id, sp] of Object.entries(labelSprites)) updateSprite(sp, newLabels[id] || id, { rtl: newLang === 'ar', scale: 1.15 }); },
    highlight(id) { for (const [sid, g] of Object.entries(stationGroups)) g.children[0].material.color.setHex(sid === id ? 0x6d5ce7 : 0x243050); },
    setView(name) { const v = VIEWS[name] || VIEWS.overview; base.flyTo(v[0], v[1]); },
    dispose: base.dispose,
  };
}

function buildStationMachines(id, L, g) {
  const gi = GI(); const machine = mat(L.color, { metalness: 0.4, roughness: 0.5 }); const dark = mat(0x1f2937);
  const [w, hgt, d] = L.size;
  switch (id) {
    case 'coil': { // coil racks with steel coils
      for (let i = 0; i < 4; i++) { const c = cylinder(1.1, 1.3, gi, [-3 + i * 2, 1.1, -1.2], [0, 0, Math.PI / 2]); g.add(c); const hole = cylinder(0.45, 1.32, dark, [-3 + i * 2, 1.1, -1.2], [0, 0, Math.PI / 2]); g.add(hole); }
      g.add(box(8, 0.2, 2.6, dark, [0, 0.2, -1.2]));
      g.add(box(2.4, 1.6, 2.2, machine, [-2.2, 0.8, 1.8])); g.add(cylinder(1.0, 0.6, gi, [-2.2, 1.6, 1.8], [Math.PI / 2, 0, 0])); // decoiler with coil
      break; }
    case 'cutting': { // coil line: leveler + plasma gantry + table
      g.add(box(4, 1.2, 2.4, machine, [-3.5, 0.6, 0])); g.add(box(1.6, 1.8, 2.6, dark, [-1.2, 0.9, 0]));
      g.add(box(6, 0.9, 3, mat(0x334155), [2.5, 0.45, 0])); g.add(box(0.4, 2.2, 3.4, machine, [1.5, 1.1, 0])); g.add(box(0.4, 2.2, 3.4, machine, [5.2, 1.1, 0])); g.add(box(4.2, 0.3, 0.4, machine, [3.35, 2.2, 0]));
      const torch = cylinder(0.12, 0.8, mat(0xfbbf24, { emissive: 0xf59e0b, emissiveIntensity: 0.8 }), [3.0, 1.4, 0.6]); g.add(torch); g.userData.torch = torch;
      g.add(box(1.4, 3.2, 1.4, mat(0x475569), [-5.2, 1.6, -2.2])); g.add(cylinder(0.5, 2.0, mat(0x64748b), [-5.2, 4.2, -2.2])); // fume extractor
      break; }
    case 'forming': { // Pittsburgh lock former, TDF former, folding machine, beader
      const mk = (x, w2, h2, d2, c) => { g.add(box(w2, h2, d2, mat(c, { metalness: 0.5 }), [x, h2 / 2, 0])); g.add(box(w2 * 0.9, 0.15, d2 * 0.6, gi, [x, h2 + 0.08, 0])); };
      mk(-4.5, 1.6, 1.2, 1.2, 0x2563eb); mk(-2.2, 1.6, 1.2, 1.2, 0x7c3aed); mk(1.5, 4.2, 1.5, 1.4, 0x0ea5e9); mk(4.8, 1.4, 1.1, 1.1, 0x10b981);
      g.add(box(4.6, 0.12, 0.8, gi, [1.5, 1.7, 1.2])); // folded blank on the brake
      break; }
    case 'assembly': { // work benches with duct pieces being assembled
      for (let i = 0; i < 3; i++) { g.add(box(2.4, 0.9, 1.4, mat(0x475569), [-3 + i * 3, 0.45, -1.5])); g.add(box(1.6, 0.9, 1.1, gi, [-3 + i * 3, 1.45, -1.5])); }
      g.add(box(2.4, 0.9, 1.4, mat(0x475569), [-1.5, 0.45, 1.6])); g.add(box(1.4, 0.9, 1.2, gi, [-1.5, 1.45, 1.6]));
      g.add(box(1.2, 1.4, 1.0, machine, [2.5, 0.7, 1.6])); // seam closer
      break; }
    case 'insulation': { g.add(box(3, 0.9, 2, mat(0x475569), [-2, 0.45, 0])); g.add(box(2.2, 0.9, 1.4, mat(0xfde68a, { roughness: 0.95, metalness: 0 }), [-2, 1.4, 0])); g.add(box(1.4, 1.6, 1.2, machine, [1.8, 0.8, 0])); for (let i = 0; i < 3; i++) g.add(cylinder(0.5, 1.2, mat(0xfef3c7, { roughness: 1, metalness: 0 }), [1.5 + i * 0.4 - 0.4, 0.6, 1.9], [0, 0, 0])); break; }
    case 'qc': { g.add(box(2.6, 0.9, 1.6, mat(0x475569), [-1.5, 0.45, 0])); g.add(box(1.5, 0.8, 1.0, gi, [-1.5, 1.35, 0])); g.add(box(0.9, 1.1, 0.8, machine, [1.5, 0.55, 0.4])); g.add(cylinder(0.08, 2.2, mat(0x94a3b8), [0.3, 1.2, 0.6], [0, 0, Math.PI / 2])); // leak tester + hose
      const screen = box(0.8, 0.6, 0.06, mat(0x38bdf8, { emissive: 0x0ea5e9, emissiveIntensity: 0.6 }), [1.5, 1.6, 0.4]); g.add(screen); break; }
    case 'dispatch': { for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) g.add(box(1.4, 0.6, 0.9, gi, [-4.5 + i * 2.6, 0.3 + j * 0.65, -1.5 + (i % 2) * 0.4])); for (let i = 0; i < 2; i++) g.add(box(1.2, 0.5, 0.8, gi, [-2 + i * 2.6, 0.25, 1.8])); g.add(box(1.4, 0.15, 1.0, mat(0xb45309), [-4.5, 0.08, 1.8])); break; }
  }
}
