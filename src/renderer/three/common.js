// Shared three.js helpers: renderer/camera setup with daylight look, environment reflections, text labels,
// colour ramps, resize & dispose.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { skyGradient } from './textures.js';

export { THREE };

export function createBase(container, { camPos = [30, 22, 30], target = [0, 2, 0], fov = 42, sunPos = [40, 60, 25], shadowSize = 90 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', logarithmicDepthBuffer: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth || 800, container.clientHeight || 600);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const sky = skyGradient(); sky.colorSpace = THREE.SRGBColorSpace; scene.background = sky;
  scene.fog = new THREE.Fog(0xdfe7f0, 120, 320);
  // image-based lighting for realistic metal/paint reflections
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; pmrem.dispose();
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(fov, (container.clientWidth || 800) / (container.clientHeight || 600), 0.1, 600);
  camera.position.set(...camPos);
  const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(...target); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI / 2.02; controls.minDistance = 2.5; controls.maxDistance = 160; controls.update();
  scene.add(new THREE.HemisphereLight(0xe8f0fa, 0x8c8a82, 0.75));
  const sun = new THREE.DirectionalLight(0xfff3e0, 2.2); sun.position.set(...sunPos); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.camera.left = -shadowSize; sun.shadow.camera.right = shadowSize; sun.shadow.camera.top = shadowSize; sun.shadow.camera.bottom = -shadowSize; sun.shadow.camera.far = 250; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; scene.add(sun); scene.add(sun.target);
  const fill = new THREE.DirectionalLight(0xdbe6ff, 0.5); fill.position.set(-40, 25, -30); scene.add(fill);
  const ro = new ResizeObserver(() => { const w = container.clientWidth, hgt = container.clientHeight; if (!w || !hgt) return; renderer.setSize(w, hgt); camera.aspect = w / hgt; camera.updateProjectionMatrix(); });
  ro.observe(container);
  const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
  let raf = 0; const tickers = [];
  const clock = new THREE.Clock();
  function loop() { raf = requestAnimationFrame(loop); const dt = Math.min(0.1, clock.getDelta()); for (const t of tickers) t(dt); controls.update(); renderer.render(scene, camera); }
  loop();
  function pick(event, objects) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(objects, true);
    for (const hit of hits) { let o = hit.object; while (o && !o.userData.pickId) o = o.parent; if (o) return o.userData.pickId; }
    return null;
  }
  function flyTo(pos, tgt) { const p0 = camera.position.clone(), t0 = controls.target.clone(); const p1 = new THREE.Vector3(...pos), t1 = new THREE.Vector3(...tgt); let k = 0; const tk = (dt) => { k = Math.min(1, k + dt * 1.4); const e = 1 - Math.pow(1 - k, 3); camera.position.lerpVectors(p0, p1, e); controls.target.lerpVectors(t0, t1, e); if (k >= 1) tickers.splice(tickers.indexOf(tk), 1); }; tickers.push(tk); }
  function dispose() { cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { for (const k of ['map', 'roughnessMap', 'normalMap', 'emissiveMap']) if (m[k]) m[k].dispose(); m.dispose(); }); } }); renderer.dispose(); renderer.domElement.remove(); }
  return { renderer, scene, camera, controls, tickers, pick, flyTo, dispose, sun };
}

/** Canvas text label sprite (supports Arabic via system fonts). Light "signboard" style by default. */
export function textSprite(text, { size = 26, color = '#1a2233', bg = 'rgba(255,255,255,0.92)', border = 'rgba(30,40,60,0.25)', scale = 1, rtl = false } = {}) {
  const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
  const font = `600 ${size}px 'Segoe UI', 'Noto Sans Arabic', Tahoma, sans-serif`; ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 30; const hgt = size + 22;
  canvas.width = w * 2; canvas.height = hgt * 2; ctx.scale(2, 2); ctx.font = font;
  ctx.fillStyle = bg; roundRect(ctx, 1, 1, w - 2, hgt - 2, 9); ctx.fill(); ctx.strokeStyle = border; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.direction = rtl ? 'rtl' : 'ltr'; ctx.fillText(text, w / 2, hgt / 2 + 1);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sp = new THREE.Sprite(mat); sp.scale.set((w / 60) * scale, (hgt / 60) * scale, 1); sp.renderOrder = 10;
  return sp;
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
export function updateSprite(sprite, text, opts) { const n = textSprite(text, opts); sprite.material.map.dispose(); sprite.material.map = n.material.map; sprite.material.needsUpdate = true; sprite.scale.copy(n.scale); n.material.dispose(); }

/** Green→yellow→red ramp for 0..1 */
export function rampGYR(x) { x = Math.min(1, Math.max(0, x)); const c = new THREE.Color(); if (x < 0.5) c.setRGB(0.13 + (0.96 - 0.13) * (x / 0.5), 0.77, 0.37 * (1 - x / 0.5)); else c.setRGB(0.96, 0.62 - (0.62 - 0.27) * ((x - 0.5) / 0.5), 0.27 * (1 - (x - 0.5) / 0.5)); return c; }
/** Blue→red ramp for 0..1 */
export function rampBR(x) { x = Math.min(1, Math.max(0, x)); return new THREE.Color().setHSL(0.66 * (1 - x), 0.85, 0.55); }

export function mat(color, opts = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.2, ...opts }); }
export function box(w, h, d, material, pos = [0, 0, 0], { shadow = true } = {}) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); m.position.set(...pos); m.castShadow = shadow; m.receiveShadow = shadow; return m; }
export function cylinder(r, h, material, pos = [0, 0, 0], rot = [0, 0, 0], seg = 24, rTop = null) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop ?? r, r, h, seg), material); m.position.set(...pos); m.rotation.set(...rot); m.castShadow = true; m.receiveShadow = true; return m; }
/** Soft fake contact shadow (dark radial decal) under an object footprint. */
export function contactShadow(w, d, pos = [0, 0.01, 0], opacity = 0.35) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const ctx = c.getContext('2d'); const g = ctx.createRadialGradient(64, 64, 10, 64, 64, 64); g.addColorStop(0, `rgba(0,0,0,${opacity})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.4, d * 1.4), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(...pos); m.renderOrder = 1; return m;
}
/** Simple human figure (worker) with hi-vis vest and helmet, ~1.75 m tall. */
export function worker(pos = [0, 0, 0], rotY = 0, { vest = 0xf59e0b, helmet = 0xffffff, shirt = 0x3b4a5c, pants = 0x2b3340 } = {}) {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = rotY;
  const skin = mat(0xd9a679, { roughness: 0.8, metalness: 0 });
  g.add(cylinder(0.14, 0.75, mat(pants, { roughness: 0.9, metalness: 0 }), [-0.11, 0.38, 0], [0, 0, 0], 10)); g.add(cylinder(0.14, 0.75, mat(pants, { roughness: 0.9, metalness: 0 }), [0.11, 0.38, 0], [0, 0, 0], 10));
  g.add(box(0.46, 0.62, 0.28, mat(shirt, { roughness: 0.9, metalness: 0 }), [0, 1.07, 0])); g.add(box(0.5, 0.5, 0.32, mat(vest, { roughness: 0.7, metalness: 0, emissive: vest, emissiveIntensity: 0.15 }), [0, 1.1, 0]));
  g.add(cylinder(0.06, 0.6, mat(shirt, { roughness: 0.9, metalness: 0 }), [-0.3, 1.05, 0], [0, 0, 0.15], 8)); g.add(cylinder(0.06, 0.6, mat(shirt, { roughness: 0.9, metalness: 0 }), [0.3, 1.05, 0], [0, 0, -0.15], 8));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), skin); head.position.y = 1.53; head.castShadow = true; g.add(head);
  const hat = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(helmet, { roughness: 0.4, metalness: 0.1 })); hat.position.y = 1.55; g.add(hat); g.add(cylinder(0.17, 0.02, mat(helmet, { roughness: 0.4 }), [0, 1.55, 0], [0, 0, 0], 16));
  return g;
}
