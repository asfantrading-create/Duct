// Shared three.js helpers: renderer/camera setup, text sprites, colour ramps, resize & dispose.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export { THREE };

export function createBase(container, { camPos = [30, 22, 30], target = [0, 2, 0], bg = 0x060a17, fov = 45 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth || 800, container.clientHeight || 600);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(bg); scene.fog = new THREE.Fog(bg, 90, 220);
  const camera = new THREE.PerspectiveCamera(fov, (container.clientWidth || 800) / (container.clientHeight || 600), 0.1, 500);
  camera.position.set(...camPos);
  const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(...target); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI / 2.05; controls.minDistance = 4; controls.maxDistance = 140; controls.update();
  scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x1b2233, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(30, 45, 20); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -60; sun.shadow.camera.right = 60; sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60; sun.shadow.camera.far = 150; scene.add(sun);
  const fill = new THREE.DirectionalLight(0x99aaff, 0.35); fill.position.set(-30, 20, -20); scene.add(fill);
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
  function flyTo(pos, tgt) { const p0 = camera.position.clone(), t0 = controls.target.clone(); const p1 = new THREE.Vector3(...pos), t1 = new THREE.Vector3(...tgt); let k = 0; const tk = (dt) => { k = Math.min(1, k + dt * 1.5); const e = 1 - Math.pow(1 - k, 3); camera.position.lerpVectors(p0, p1, e); controls.target.lerpVectors(t0, t1, e); if (k >= 1) tickers.splice(tickers.indexOf(tk), 1); }; tickers.push(tk); }
  function dispose() { cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); } }); renderer.dispose(); renderer.domElement.remove(); }
  return { renderer, scene, camera, controls, tickers, pick, flyTo, dispose };
}

const spriteCache = new Map();
/** Canvas text sprite (supports Arabic via system fonts). */
export function textSprite(text, { size = 26, color = '#ffffff', bg = 'rgba(10,14,30,0.72)', scale = 1, rtl = false } = {}) {
  const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
  const font = `600 ${size}px 'Segoe UI', 'Noto Sans Arabic', Tahoma, sans-serif`; ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 28; const hgt = size + 22;
  canvas.width = w * 2; canvas.height = hgt * 2; ctx.scale(2, 2); ctx.font = font;
  ctx.fillStyle = bg; roundRect(ctx, 0, 0, w, hgt, 8); ctx.fill();
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
export function cylinder(r, h, material, pos = [0, 0, 0], rot = [0, 0, 0], seg = 24) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), material); m.position.set(...pos); m.rotation.set(...rot); m.castShadow = true; m.receiveShadow = true; return m; }
