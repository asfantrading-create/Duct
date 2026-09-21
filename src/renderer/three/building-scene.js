// 3D digital twin of a building duct network (AHU on roof → main → branches → diffusers) with live colouring.
import { THREE, createBase, textSprite, updateSprite, mat, box, cylinder, rampGYR, rampBR } from './common.js';

// Fixed 3D routing for the default topology (M0, J1→B1/M1, J2→B2/B3). Coordinates in metres.
const ROUTES = {
  M0: [[-9, 5.0, 0], [-2.5, 5.0, 0], [-2.5, 3.6, 0], [-0.4, 3.6, 0]],
  B1: [[0, 3.6, 0.4], [0, 3.6, 6.2]],
  M1: [[0.4, 3.6, 0], [7.6, 3.6, 0]],
  B2: [[8, 3.6, 0.4], [8, 3.6, 6.2]],
  B3: [[8, 3.6, -0.4], [8, 3.6, -6.2]],
};
const TERMINALS = { D1: ['B1', [0, 2.0]], D2: ['B1', [0, 3.6]], D3: ['B1', [0, 5.4]], D4: ['B2', [8, 3.6]], D5: ['B2', [8, 5.4]], D6: ['B3', [8, -2.0]], D7: ['B3', [8, -3.6]], D8: ['B3', [8, -5.4]] };
const CEILING_Y = 3.0, ROOF_Y = 4.2;

export function createBuildingScene(container, { onSelect = () => {}, lang = 'ar', labels = {} } = {}) {
  const base = createBase(container, { camPos: [16, 12, 20], target: [2, 2.5, 0], bg: 0x070b19 });
  const { scene, tickers } = base; const rtl = lang === 'ar';
  const pickables = []; const segMeshes = {}; const segLabels = {}; const diffuserCones = {}; const particles = {}; const damperDiscs = {};
  let colorMode = 'pressure'; let lastResult = null;

  // ---- building shell
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat(0x121a2e, { roughness: 1, metalness: 0 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true; scene.add(ground);
  scene.add(new THREE.GridHelper(60, 30, 0x22304a, 0x1b2540));
  const slabMat = mat(0x64748b, { roughness: 0.9 }); scene.add(box(24, 0.25, 15, slabMat, [1, -0.12, 0]));
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.35, side: THREE.DoubleSide }); const ceil = new THREE.Mesh(new THREE.PlaneGeometry(24, 15), ceilMat); ceil.rotation.x = Math.PI / 2; ceil.position.set(1, CEILING_Y, 0); scene.add(ceil);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.22, side: THREE.DoubleSide }); const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(24, 0.25, 15), roofMat); roofSlab.position.set(1, ROOF_Y, 0); scene.add(roofSlab);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false });
  for (const [w, x, z, ry] of [[24, 1, -7.5, 0], [24, 1, 7.5, 0], [15, -11, 0, Math.PI / 2], [15, 13, 0, Math.PI / 2]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, ROOF_Y), wallMat); m.position.set(x, ROOF_Y / 2, z); m.rotation.y = ry; scene.add(m); }
  for (const x of [-10.5, -3, 4.5, 12.5]) for (const z of [-7, 7]) scene.add(box(0.4, ROOF_Y, 0.4, mat(0x94a3b8), [x, ROOF_Y / 2, z]));
  // rooms hint: partitions under branches
  for (const [x1, x2, name] of [[-11, 3.8, 'A'], [4, 13, 'B/C']]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.06, CEILING_Y), new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.25, side: THREE.DoubleSide })); p.position.set(x2 === 3.8 ? 3.9 : 13, CEILING_Y / 2, 0); if (x2 === 3.8) scene.add(p); }

  // ---- AHU on the roof
  const ahu = new THREE.Group(); ahu.position.set(-11.5, ROOF_Y + 0.12, 0); ahu.userData.pickId = 'AHU';
  ahu.add(box(4.6, 2.2, 2.4, mat(0xd1d5db, { metalness: 0.5, roughness: 0.4 }), [0, 1.1, 0]));
  ahu.add(box(1.3, 1.7, 0.08, mat(0x64748b), [-1.2, 1.1, 1.25])); // filter access door
  ahu.add(box(1.3, 1.7, 0.08, mat(0x64748b), [0.6, 1.1, 1.25]));
  const fanDisc = new THREE.Group(); for (let i = 0; i < 6; i++) { const blade = box(0.08, 0.7, 0.22, mat(0x1e293b, { metalness: 0.7 }), [0, 0.42, 0]); const pivot = new THREE.Group(); pivot.rotation.z = (i / 6) * Math.PI * 2; pivot.add(blade); fanDisc.add(pivot); }
  fanDisc.position.set(2.32, 1.1, 0); fanDisc.rotation.y = Math.PI / 2; ahu.add(fanDisc);
  ahu.add(new THREE.Mesh(new THREE.RingGeometry(0.75, 0.95, 32), mat(0x334155)).translateX(2.31).translateY(1.1).rotateY(Math.PI / 2));
  const ahuLabel = textSprite(labels.AHU || 'AHU', { rtl, scale: 0.9 }); ahuLabel.position.set(0, 3.1, 0); ahu.add(ahuLabel); segLabels.AHU = ahuLabel;
  scene.add(ahu); pickables.push(ahu);
  let fanSpeed = 1; tickers.push((dt) => { fanDisc.rotation.x += dt * 14 * fanSpeed; });

  // ---- duct segments
  function buildSegment(id, seg) {
    const pts = ROUTES[id].map((p) => new THREE.Vector3(...p)); const g = new THREE.Group(); g.userData.pickId = id;
    const isRound = seg.shape === 'round'; const w = (seg.aMm || seg.dMm) / 1000, hgt = (seg.bMm || seg.dMm) / 1000;
    const m = mat(0x9aa7b8, { metalness: 0.7, roughness: 0.35 });
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1]; const len = a.distanceTo(b); const mid = a.clone().add(b).multiplyScalar(0.5); const dir = b.clone().sub(a).normalize();
      let mesh;
      if (isRound) { mesh = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, len + (i < pts.length - 2 ? hgt : 0), 24), m); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); }
      else { mesh = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, len + (i < pts.length - 2 ? hgt : 0)), m); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir); }
      mesh.position.copy(mid); mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh);
    }
    // label at the middle of the longest run
    const lbl = textSprite(labels[id] || id, { rtl, scale: 0.8 }); const mid = pts[Math.floor((pts.length - 1) / 2)].clone().add(pts[Math.floor((pts.length - 1) / 2) + 1]).multiplyScalar(0.5); lbl.position.copy(mid).add(new THREE.Vector3(0, Math.max(hgt, 0.5) + 0.5, 0)); g.add(lbl); segLabels[id] = lbl;
    // damper disc at branch entry
    if (seg.terminals) { const disc = new THREE.Mesh(isRound ? new THREE.CylinderGeometry(w / 2 * 0.95, w / 2 * 0.95, 0.04, 24) : new THREE.BoxGeometry(w * 0.95, hgt * 0.95, 0.04), mat(0xef4444, { metalness: 0.5 })); const p0 = pts[0], p1 = pts[1]; const d = p1.clone().sub(p0).normalize(); disc.position.copy(p0).add(d.clone().multiplyScalar(0.9)); disc.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d); if (isRound) disc.rotateX(Math.PI / 2); const pivot = new THREE.Group(); pivot.position.copy(disc.position); disc.position.set(0, 0, 0); pivot.quaternion.copy(disc.quaternion); disc.quaternion.identity(); if (isRound) disc.rotateX(Math.PI / 2); pivot.add(disc); g.add(pivot); damperDiscs[id] = { pivot, base: pivot.quaternion.clone() }; }
    // VAV box
    if (seg.vav) { const vb = box(0.9, 0.5, 0.7, mat(0x6d5ce7), [pts[0].x, pts[0].y, pts[0].z + 1.4]); g.add(vb); const vl = textSprite('VAV', { scale: 0.6 }); vl.position.set(pts[0].x, pts[0].y + 0.7, pts[0].z + 1.4); g.add(vl); }
    scene.add(g); pickables.push(g); segMeshes[id] = { group: g, meshes: g.children.filter((c) => c.isMesh && c.geometry.type !== 'RingGeometry'), pts, isRound };
    // particles
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.0); const n = 40; const geo = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pm = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.16, transparent: true, opacity: 0.9, depthWrite: false }); const cloud = new THREE.Points(geo, pm); scene.add(cloud);
    particles[id] = { curve, cloud, ts: Array.from({ length: n }, (_, i) => i / n), speed: 0.15, count: n, len: curve.getLength() };
  }
  // ---- diffusers
  function buildTerminals() {
    for (const [id, [branch, [x, z]]] of Object.entries(TERMINALS)) {
      const g = new THREE.Group(); g.userData.pickId = branch;
      g.add(box(0.6, 0.06, 0.6, mat(0xf8fafc, { metalness: 0.3 }), [x, CEILING_Y - 0.03, z]));
      g.add(cylinder(0.12, 0.6, mat(0xcbd5e1), [x, CEILING_Y + 0.3, z])); // drop
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.6, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })); cone.position.set(x, CEILING_Y - 0.9, z); cone.rotation.x = Math.PI; g.add(cone); diffuserCones[id] = cone;
      const lbl = textSprite(id, { scale: 0.55 }); lbl.position.set(x, CEILING_Y - 0.25, z + 0.5); g.add(lbl); segLabels[id] = lbl;
      scene.add(g); pickables.push(g);
    }
  }
  buildTerminals();

  // particle animation
  tickers.push((dt) => { for (const p of Object.values(particles)) { const arr = p.cloud.geometry.attributes.position.array; for (let i = 0; i < p.count; i++) { p.ts[i] = (p.ts[i] + dt * p.speed / Math.max(0.5, p.len)) % 1; const v = p.curve.getPointAt(p.ts[i]); arr[i * 3] = v.x + (Math.random() - 0.5) * 0.05; arr[i * 3 + 1] = v.y + (Math.random() - 0.5) * 0.05; arr[i * 3 + 2] = v.z + (Math.random() - 0.5) * 0.05; } p.cloud.geometry.attributes.position.needsUpdate = true; } });

  let hovered = null;
  base.renderer.domElement.addEventListener('click', (e) => { const id = base.pick(e, pickables); if (id) onSelect(id); });
  base.renderer.domElement.addEventListener('pointermove', (e) => { const id = base.pick(e, pickables); if (id !== hovered) { hovered = id; base.renderer.domElement.style.cursor = id ? 'pointer' : 'grab'; } });
  const VIEWS = { overview: [[16, 12, 20], [2, 2.5, 0]], ahu: [[-16, 9, 8], [-11, 5, 0]], branchA: [[-4, 7, 12], [0, 3, 3]], branchBC: [[16, 8, 0], [8, 3, 0]], inside: [[-6, 1.6, 4], [8, 2.8, 0]], top: [[1, 30, 0.1], [1, 0, 0]] };

  function applyColors(result) {
    if (!result) return;
    const maxP = Math.max(200, result.totals.maxStaticPa); const segs = result.segments;
    for (const [id, s] of Object.entries(segs)) {
      const sm = segMeshes[id]; if (!sm) continue;
      let c;
      if (colorMode === 'velocity') c = rampGYR((s.v - 3) / 8);
      else if (colorMode === 'temperature') c = rampBR((s.tOutC - 12) / 10);
      else c = rampBR(Math.max(0, s.pInPa) / maxP);
      for (const m of sm.meshes) if (m.geometry.type !== 'RingGeometry') { m.material.color.copy(c); }
      const p = particles[id]; if (p) { p.speed = 0.05 + s.v * 0.06; p.cloud.material.opacity = Math.min(0.95, 0.15 + s.qLps / 800); p.cloud.material.color.copy(rampBR((s.tOutC - 12) / 10)); }
      const d = damperDiscs[id]; if (d) { d.pivot.quaternion.copy(d.base); d.pivot.rotateOnAxis(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(90 - (s.damperDeg || 0))); }
    }
    for (const t of result.terminals) { const cone = diffuserCones[t.id]; if (cone) { const k = Math.max(0.15, Math.min(1.6, t.ratio)); cone.scale.set(k, k, k); cone.material.opacity = 0.08 + 0.15 * k; cone.material.color.copy(t.ratio < 0.8 ? new THREE.Color(0xf59e0b) : new THREE.Color(0x38bdf8)); } }
    fanSpeed = (result.fan.speedPct || 100) / 100;
  }

  return {
    build(sized) { for (const [id, seg] of Object.entries(sized.segs)) if (ROUTES[id]) buildSegment(id, seg); },
    update(result) { lastResult = result; applyColors(result); },
    setColorMode(m) { colorMode = m; applyColors(lastResult); },
    setLabels(newLabels, newLang) { for (const [id, sp] of Object.entries(segLabels)) if (newLabels[id]) updateSprite(sp, newLabels[id], { rtl: newLang === 'ar', scale: id === 'AHU' ? 0.9 : 0.8 }); },
    highlight(id) { for (const [sid, sm] of Object.entries(segMeshes)) for (const m of sm.meshes) m.material.emissive = new THREE.Color(sid === id ? 0x6d5ce7 : 0x000000); },
    setView(name) { const v = VIEWS[name] || VIEWS.overview; base.flyTo(v[0], v[1]); },
    dispose: base.dispose,
  };
}
