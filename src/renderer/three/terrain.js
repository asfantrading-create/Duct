// Site & terrain context: arid terrain with a flat site pad, asphalt road, fence, gate, palms, light poles and
// parked cars — gives the twins a realistic outdoor setting (Gulf / Levant industrial area).
import * as THREE from 'three';
import * as TX from './textures.js';

function hash(x, y, seed) { let h = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453; return h - Math.floor(h); }
function valueNoise(x, y, seed) { const xi = Math.floor(x), yi = Math.floor(y); const xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
export function fbm(x, y, seed = 1, octaves = 5) { let s = 0, amp = 0.5, f = 1; for (let i = 0; i < octaves; i++) { s += amp * valueNoise(x * f, y * f, seed + i); amp *= 0.5; f *= 2.05; } return s; }

/** Sand / arid ground texture. */
export function sandTexture(repeat = 40) {
  const N = 1024; const c = document.createElement('canvas'); c.width = c.height = N; const ctx = c.getContext('2d');
  ctx.fillStyle = '#d3c19c'; ctx.fillRect(0, 0, N, N);
  // large soft blotches drawn with wrap-around copies so the tile is seamless
  const blot = (x, y, r, col) => { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) { ctx.save(); ctx.translate(x + ox, y + oy); ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r); ctx.restore(); } };
  for (let i = 0; i < 46; i++) blot(Math.random() * N, Math.random() * N, 140 + Math.random() * 320, `rgba(${125 + Math.random() * 40 | 0},${102 + Math.random() * 30 | 0},${68 + Math.random() * 22 | 0},0.09)`);
  for (let i = 0; i < 30; i++) blot(Math.random() * N, Math.random() * N, 80 + Math.random() * 160, `rgba(240,228,200,0.10)`);
  // fine grain
  for (let i = 0; i < 180000; i++) { const a = 0.03 + Math.random() * 0.09; ctx.fillStyle = Math.random() < 0.5 ? `rgba(255,250,235,${a})` : `rgba(90,70,40,${a})`; ctx.fillRect(Math.random() * N, Math.random() * N, 1.5, 1.5); }
  // wind ripples with whole-number periods (seamless)
  for (let i = 0; i < 70; i++) { ctx.strokeStyle = 'rgba(80,60,30,0.045)'; ctx.lineWidth = 2 + Math.random() * 3; ctx.beginPath(); const y = Math.random() * N; const k = 2 + Math.floor(Math.random() * 3); for (let x = 0; x <= N; x += 32) { const yy = y + Math.sin((x / N) * Math.PI * 2 * k + i) * 10; if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); } ctx.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function asphaltTexture(repeat = 8) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const ctx = c.getContext('2d');
  ctx.fillStyle = '#5f6266'; ctx.fillRect(0, 0, 512, 512); for (let i = 0; i < 90000; i++) { const a = 0.04 + Math.random() * 0.12; ctx.fillStyle = Math.random() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`; ctx.fillRect(Math.random() * 512, Math.random() * 512, 1.3, 1.3); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; return t;
}

/**
 * Builds the terrain around a rectangular site pad (centred at origin). Returns { ground, heightAt }.
 * @param opts { size, segments, padHalfX, padHalfZ, amplitude, seed, padY }
 */
export function buildTerrain(scene, { size = 520, segments = 160, padHalfX = 60, padHalfZ = 45, amplitude = 16, seed = 7, padY = -0.06, roadHalfWidth = 5.5 } = {}) {
  const geo = new THREE.PlaneGeometry(size, size, segments, segments); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position; const colors = new Float32Array(pos.count * 3); const c1 = new THREE.Color(0xcdb98f), c2 = new THREE.Color(0x9a8a66), c3 = new THREE.Color(0xb8ab8c);
  const heightAt = (x, z) => {
    const dx = Math.max(0, Math.abs(x) - padHalfX), dz = Math.max(0, Math.abs(z) - padHalfZ); const d = Math.hypot(dx, dz);
    let k = THREE.MathUtils.smoothstep(d, 8, 120); // 0 on the pad, 1 far away
    if (z > padHalfZ - 2) k *= THREE.MathUtils.smoothstep(Math.abs(x), roadHalfWidth + 1, roadHalfWidth + 14); // flat corridor along the access road
    const n = fbm(x / 140 + 10, z / 140 + 10, seed) - 0.5; const ridge = Math.pow(fbm(x / 400 + 3, z / 400 + 3, seed + 9), 2) * 3;
    return padY + k * (n * amplitude + ridge * amplitude * 0.5 + Math.max(0, d - 160) * 0.06);
  };
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i); const y = heightAt(x, z); pos.setY(i, y); const t = THREE.MathUtils.clamp((y - padY) / (amplitude * 0.8), 0, 1); const col = c1.clone().lerp(c2, t * 0.7).lerp(c3, fbm(x / 60, z / 60, seed + 3) * 0.4); colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3)); geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: sandTexture(size / 34), vertexColors: true, roughness: 1, metalness: 0 })); ground.receiveShadow = true; scene.add(ground);
  return { ground, heightAt };
}

/** Paved site: asphalt yard with parking bays, kerbs, fence with gate, sign, palms, light poles, cars, access road. */
export function buildSite(scene, { padHalfX = 60, padHalfZ = 45, roadDir = 'z', signText = '', signSprite = null, palms = 14, cars = 6 } = {}) {
  const g = new THREE.Group(); scene.add(g);
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(padHalfX * 2, padHalfZ * 2), new THREE.MeshStandardMaterial({ map: asphaltTexture(padHalfX / 5), roughness: 0.95, metalness: 0 })); yard.rotation.x = -Math.PI / 2; yard.position.y = -0.04; yard.receiveShadow = true; g.add(yard);
  const kerbMat = new THREE.MeshStandardMaterial({ color: 0xd6d3cb, roughness: 0.9 });
  for (const [w, d, x, z] of [[padHalfX * 2, 0.3, 0, -padHalfZ], [padHalfX * 2, 0.3, 0, padHalfZ], [0.3, padHalfZ * 2, -padHalfX, 0], [0.3, padHalfZ * 2, padHalfX, 0]]) { const k = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, d), kerbMat); k.position.set(x, 0.08, z); k.castShadow = true; g.add(k); }
  // perimeter fence: posts + mesh panels (semi transparent) + top rail; gate opening on the road side
  const postMat = new THREE.MeshStandardMaterial({ color: 0x7c8590, metalness: 0.6, roughness: 0.5 }); const meshMat = new THREE.MeshStandardMaterial({ color: 0x9aa4ae, transparent: true, opacity: 0.35, side: THREE.DoubleSide, metalness: 0.5, roughness: 0.6 });
  const fence = (x1, z1, x2, z2, gapStart = null, gapEnd = null) => { const len = Math.hypot(x2 - x1, z2 - z1); const n = Math.round(len / 3); for (let i = 0; i <= n; i++) { const t = i / n; const x = x1 + (x2 - x1) * t, z = z1 + (z2 - z1) * t; if (gapStart !== null && t > gapStart && t < gapEnd) continue; const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8), postMat); p.position.set(x, 1.2, z); g.add(p); }
    const seg = new THREE.Mesh(new THREE.PlaneGeometry(len, 2.2), meshMat); seg.position.set((x1 + x2) / 2, 1.15, (z1 + z2) / 2); seg.rotation.y = Math.atan2(x2 - x1, z2 - z1) + Math.PI / 2; g.add(seg); const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.05), postMat); rail.position.copy(seg.position); rail.position.y = 2.3; rail.rotation.y = seg.rotation.y; g.add(rail); };
  const fx = padHalfX + 1.5, fz = padHalfZ + 1.5;
  fence(-fx, -fz, fx, -fz); fence(-fx, fz, fx, fz, 0.42, 0.58); fence(-fx, -fz, -fx, fz); fence(fx, -fz, fx, fz);
  // gate (sliding) + guard house + sign
  const gate = new THREE.Mesh(new THREE.BoxGeometry(fx * 0.32, 2.2, 0.08), new THREE.MeshStandardMaterial({ color: 0x2b4b8c, metalness: 0.5, roughness: 0.5 })); gate.position.set(fx * 0.5 + fx * 0.16, 1.1, fz); g.add(gate);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(3, 2.8, 3), new THREE.MeshStandardMaterial({ color: 0xe8eaec, roughness: 0.7 })); guard.position.set(-fx * 0.2, 1.4, fz - 2); guard.castShadow = true; g.add(guard); g.add(new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.15, 3.4), postMat).translateX(-fx * 0.2).translateY(2.9).translateZ(fz - 2));
  if (signSprite) { signSprite.position.set(-fx * 0.2, 4.2, fz - 2); g.add(signSprite); }
  // access road (asphalt) with centre line + light poles
  const roadLen = 200; const road = new THREE.Mesh(new THREE.PlaneGeometry(9, roadLen), new THREE.MeshStandardMaterial({ map: asphaltTexture(2), roughness: 0.95 })); road.rotation.x = -Math.PI / 2; road.position.set(0, -0.045, fz + roadLen / 2); road.receiveShadow = true; g.add(road);
  for (let z = fz + 4; z < fz + roadLen; z += 6) { const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 3), new THREE.MeshStandardMaterial({ color: 0xf3e9c9 })); dash.rotation.x = -Math.PI / 2; dash.position.set(0, -0.04, z); g.add(dash); }
  for (let z = -padHalfZ + 10; z <= padHalfZ; z += 25) for (const x of [-padHalfX + 4, padHalfX - 4]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 9, 8), postMat); pole.position.set(x, 4.5, z); g.add(pole); const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.08), postMat); arm.position.set(x + (x < 0 ? 0.8 : -0.8), 8.9, z); g.add(arm); const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.25), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d6, emissiveIntensity: 0.6 })); lamp.position.set(x + (x < 0 ? 1.5 : -1.5), 8.85, z); g.add(lamp); }
  // parking bays with cars along the front kerb
  const carColors = [0xf2f4f6, 0x1f2937, 0x9ca3af, 0xb91c1c, 0x1e3a8a, 0xd1d5db];
  for (let i = 0; i < cars; i++) { const x = -padHalfX + 12 + i * 4.2; for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 5), new THREE.MeshStandardMaterial({ color: 0xffffff })); l.rotation.x = -Math.PI / 2; l.position.set(x + s * 1.6, -0.035, padHalfZ - 4); g.add(l); } if (i % 3 !== 1) g.add(car(x, padHalfZ - 4, carColors[i % carColors.length])); }
  // palms along the front and around
  for (let i = 0; i < palms; i++) { const t = i / palms; const x = -padHalfX + 4 + t * (padHalfX * 2 - 8); const z = i % 2 ? -padHalfZ - 3.5 : padHalfZ + 4.5 + (Math.abs(x) < 8 ? 100 : 0); if (Math.abs(x) < 8 && i % 2 === 0) continue; g.add(palm(x, z, 5 + (i % 3))); }
  return g;
}
export function palm(x, z, height = 6) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, height, 8), new THREE.MeshStandardMaterial({ color: 0x8b6a45, roughness: 0.95 })); trunk.position.y = height / 2; trunk.castShadow = true; g.add(trunk);
  for (let i = 0; i < 6; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 10), new THREE.MeshStandardMaterial({ color: 0x6e5236, roughness: 1 })); ring.rotation.x = Math.PI / 2; ring.position.y = height * (0.15 + i * 0.13); g.add(ring); }
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f8a3a, roughness: 0.9, side: THREE.DoubleSide });
  for (let i = 0; i < 9; i++) { const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 3.2, 1, 4), leafMat); const a = (i / 9) * Math.PI * 2; leaf.position.set(Math.cos(a) * 0.9, height + 0.3 - 0.4, Math.sin(a) * 0.9); leaf.rotation.set(0.9, a, 0); leaf.castShadow = true; g.add(leaf); const pos = leaf.geometry.attributes.position; for (let k = 0; k < pos.count; k++) pos.setZ(k, -Math.pow(pos.getY(k) / 1.6, 2) * 0.9); pos.needsUpdate = true; leaf.geometry.computeVertexNormals(); }
  const dates = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshStandardMaterial({ color: 0xc27c2c, roughness: 0.9 })); dates.position.set(0.3, height - 0.4, 0.3); g.add(dates);
  return g;
}
export function car(x, z, color = 0xffffff) {
  const g = new THREE.Group(); g.position.set(x, 0, z); const body = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.3 });
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 4.4), body); b1.position.y = 0.55; b1.castShadow = true; g.add(b1);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.2), body); cab.position.set(0, 1.05, -0.2); g.add(cab);
  const glass = TX.glassMaterial(0x7fb4dd, 0.8); for (const [w, h, d, px, py, pz] of [[1.5, 0.4, 0.05, 0, 1.05, 0.92], [1.5, 0.4, 0.05, 0, 1.05, -1.32], [0.05, 0.38, 2.0, 0.81, 1.05, -0.2], [0.05, 0.38, 2.0, -0.81, 1.05, -0.2]]) { const wnd = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glass); wnd.position.set(px, py, pz); g.add(wnd); }
  const tyre = new THREE.MeshStandardMaterial({ color: 0x1c1f24, roughness: 0.9 }); for (const [tx, tz] of [[-0.85, 1.4], [0.85, 1.4], [-0.85, -1.4], [0.85, -1.4]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16), tyre); t.rotation.z = Math.PI / 2; t.position.set(tx, 0.32, tz); g.add(t); }
  return g;
}
/** Soft plume of light particles (e.g. fume-extraction stack). Returns { points, tick(dt) }. */
export function plume(scene, origin, { count = 120, rise = 6, spread = 1.2, color = 0xdfe6ee, size = 0.6, opacity = 0.35 } = {}) {
  const geo = new THREE.BufferGeometry(); const pos = new Float32Array(count * 3); const life = new Float32Array(count);
  for (let i = 0; i < count; i++) { life[i] = Math.random(); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const c = document.createElement('canvas'); c.width = c.height = 64; const ctx = c.getContext('2d'); const grd = ctx.createRadialGradient(32, 32, 2, 32, 32, 30); grd.addColorStop(0, 'rgba(255,255,255,0.9)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = grd; ctx.fillRect(0, 0, 64, 64);
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), color, size, transparent: true, opacity, depthWrite: false })); scene.add(points);
  const o = new THREE.Vector3(...origin);
  return { points, tick(dt) { const arr = geo.attributes.position.array; for (let i = 0; i < count; i++) { life[i] += dt * 0.25; if (life[i] > 1) life[i] -= 1; const t = life[i]; arr[i * 3] = o.x + Math.sin(i * 1.7 + t * 6) * spread * t; arr[i * 3 + 1] = o.y + t * rise; arr[i * 3 + 2] = o.z + Math.cos(i * 2.3 + t * 5) * spread * t; } geo.attributes.position.needsUpdate = true; } };
}

/** Drifting cumulus layer: one large plane high above the site with a procedural (fbm) alpha map. Returns { mesh, tick }. */
export function buildClouds(scene, { y = 260, size = 3200, seed = 11, coverage = 0.5, speed = 0.0025 } = {}) {
  const N = 1024; const c = document.createElement('canvas'); c.width = c.height = N; const ctx = c.getContext('2d'); const img = ctx.createImageData(N, N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const n = fbm(i / 210 + seed, j / 210 + seed, seed, 6); const shape = THREE.MathUtils.smoothstep(n, 0.62 - coverage * 0.14, 0.8 - coverage * 0.08); const k = (j * N + i) * 4; const shade = 235 + Math.round(20 * fbm(i / 60, j / 60, seed + 4, 3)); img.data[k] = shade; img.data[k + 1] = shade; img.data[k + 2] = 255; img.data[k + 3] = Math.round(shape * 255); }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, opacity: 0.92 }); mat.color.setRGB(1.9, 1.9, 2.0);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat); mesh.rotation.x = Math.PI / 2; mesh.position.y = y; mesh.renderOrder = -1; scene.add(mesh);
  return { mesh, tick(dt) { tex.offset.x = (tex.offset.x + dt * speed) % 1; tex.offset.y = (tex.offset.y + dt * speed * 0.35) % 1; } };
}
