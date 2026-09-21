// Shared three.js base: physically based sky (analytic sky shader driven by the hour of day) or HDRI backdrop,
// HDRI image-based lighting (Poly Haven CC0), post-processing (GTAO ambient occlusion, subtle bloom, SMAA),
// quality levels with adaptive fallback, screen-constant callout labels, screenshots and auto-rotate.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { skyGradient } from './textures.js';

export { THREE };
export const SKIES = { day: 'assets/hdr/blouberg_sunrise_2_1k.hdr', sunset: 'assets/hdr/venice_sunset_1k.hdr', night: 'assets/hdr/moonless_golf_1k.hdr' };
const hdrCache = new Map();
function loadHdr(url) { if (!hdrCache.has(url)) hdrCache.set(url, new Promise((res, rej) => new HDRLoader().load(url, (t) => { t.mapping = THREE.EquirectangularReflectionMapping; t.userData.shared = true; res(t); }, undefined, rej))); return hdrCache.get(url); }

/** Sun elevation/azimuth (degrees) for an hour of the day (06:00 sunrise east → 18:00 sunset west). */
export function sunForHour(hour) { const t = (((hour % 24) + 24) % 24 - 6) / 12; const elev = Math.sin(Math.PI * t) * 66; const az = 100 + t * 160; return { elev, az, daylight: THREE.MathUtils.clamp(Math.sin(THREE.MathUtils.degToRad(Math.max(-6, elev))) / Math.sin(THREE.MathUtils.degToRad(18)), 0, 1) }; }

export function createBase(container, { camPos = [30, 22, 30], target = [0, 2, 0], fov = 42, sunPos = [40, 60, 25], shadowSize = 90, sky = 'day', hdrBackground = true, skyShader = false, hour = 10, quality = 'high', fog = true, fogColor = 0xd8dee6, fogDensity = 0.0018, backgroundBlur = 0, far = 900 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  renderer.setSize(container.clientWidth || 800, container.clientHeight || 600);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = skyShader ? 0.52 : 0.9;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const gradient = skyGradient(); gradient.colorSpace = THREE.SRGBColorSpace; scene.background = gradient;
  if (fog) scene.fog = new THREE.FogExp2(fogColor, fogDensity);
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; pmrem.dispose();
  scene.environmentIntensity = 0.6; scene.backgroundBlurriness = backgroundBlur;
  const camera = new THREE.PerspectiveCamera(fov, (container.clientWidth || 800) / (container.clientHeight || 600), 0.1, skyShader ? Math.max(far, 6000) : far);
  camera.position.set(...camPos);
  const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(...target); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI / 2.02; controls.minDistance = 1.5; controls.maxDistance = 260; controls.autoRotateSpeed = 0.5; controls.update();
  const hemi = new THREE.HemisphereLight(0xe8f0fa, 0x8c8a82, 0.55); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.4); sun.position.set(...sunPos); sun.castShadow = true; sun.shadow.camera.left = -shadowSize; sun.shadow.camera.right = shadowSize; sun.shadow.camera.top = shadowSize; sun.shadow.camera.bottom = -shadowSize; sun.shadow.camera.far = 400; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; scene.add(sun); scene.add(sun.target);
  const fill = new THREE.DirectionalLight(0xdbe6ff, 0.35); fill.position.set(-40, 25, -30); scene.add(fill);
  const sunDistance = Math.hypot(...sunPos);

  // ---- sky / environment
  let currentSky = null; let currentHour = hour; let skyMesh = null;
  const skyState = { day: { sun: 2.4, hemi: 0.5, col: 0xfff1dc, fog: fogColor, env: 0.75 }, sunset: { sun: 1.6, hemi: 0.35, col: 0xffc38a, fog: 0xe8c9a8, env: 0.6 }, night: { sun: 0.15, hemi: 0.15, col: 0x9fb4ff, fog: 0x0c1220, env: 0.3 } };
  async function setSky(name) {
    const url = SKIES[name] || SKIES.day; if (currentSky === url) return; currentSky = url;
    try { const tex = await loadHdr(url); if (currentSky !== url) return; scene.environment = tex; const s = skyState[name] || skyState.day; scene.environmentIntensity = s.env;
      if (hdrBackground && !skyShader) { scene.background = tex; scene.backgroundIntensity = name === 'night' ? 0.6 : 0.8; }
      if (!skyShader) { sun.intensity = s.sun; hemi.intensity = s.hemi; sun.color.setHex(s.col); if (scene.fog) scene.fog.color.setHex(s.fog); } } catch (e) { console.warn('HDR load failed', e); }
  }
  if (skyShader) { skyMesh = new Sky(); skyMesh.scale.setScalar(4000); scene.add(skyMesh); scene.background = null; const u = skyMesh.material.uniforms; u.turbidity.value = 4; u.rayleigh.value = 1.6; u.mieCoefficient.value = 0.004; u.mieDirectionalG.value = 0.85; }
  const dayFog = new THREE.Color(fogColor), duskFog = new THREE.Color(0xe3b98f), nightFog = new THREE.Color(0x0b1120);
  /** Time-of-day lighting (sky shader mode): sun position, colour temperature, intensities, IBL choice. */
  function setHour(h) {
    currentHour = h; const { elev, az, daylight } = sunForHour(h); const d = daylight;
    const dir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - Math.max(elev, -8)), THREE.MathUtils.degToRad(az));
    sun.position.copy(dir).multiplyScalar(sunDistance); sun.target.position.set(0, 0, 0);
    const warm = new THREE.Color(0xffa25c), white = new THREE.Color(0xfff3e0); const low = THREE.MathUtils.clamp(elev / 25, 0, 1);
    sun.color.copy(warm).lerp(white, low); sun.intensity = 0.05 + 2.4 * Math.pow(d, 0.8) * (0.55 + 0.45 * low); hemi.intensity = 0.08 + 0.42 * d; fill.intensity = 0.05 + 0.25 * d;
    hemi.color.setHex(d > 0.5 ? 0xe8f0fa : 0x7f8fb8); hemi.groundColor.setHex(0x8c8a82);
    if (skyMesh) { const u = skyMesh.material.uniforms; u.sunPosition.value.copy(dir); u.turbidity.value = 2.2 + (1 - low) * 7; u.rayleigh.value = 0.9 + (1 - low) * 2.4; u.mieCoefficient.value = 0.0025 + (1 - low) * 0.012; }
    renderer.toneMappingExposure = skyShader ? 0.4 + 0.12 * d : renderer.toneMappingExposure;
    if (scene.fog) { const c = elev < -2 ? nightFog.clone().lerp(duskFog, THREE.MathUtils.clamp((elev + 8) / 6, 0, 1)) : duskFog.clone().lerp(dayFog, low); scene.fog.color.copy(c); }
    const name = elev > 9 ? 'day' : elev > -3 ? 'sunset' : 'night'; setSky(name).then(() => { scene.environmentIntensity = 0.15 + 0.6 * d; });
  }
  if (skyShader) setHour(hour); else setSky(sky);

  // ---- post-processing & quality
  let composer = null, gtao = null, smaa = null, bloom = null; let level = quality;
  const size = () => ({ w: container.clientWidth || 800, h: container.clientHeight || 600 });
  function buildComposer() {
    disposeComposer(); const { w, h } = size();
    composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
    if (level === 'high') { gtao = new GTAOPass(scene, camera, w, h); gtao.output = GTAOPass.OUTPUT.Default; gtao.blendIntensity = 0.9; gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1, thickness: 1, scale: 1, samples: 12, distanceFallOff: 1, screenSpaceRadius: false }); gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, radiusExponent: 1, rings: 2, samples: 12 }); composer.addPass(gtao); }
    bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.12, 0.4, 4.0); composer.addPass(bloom);
    composer.addPass(new OutputPass());
    smaa = new SMAAPass(); composer.addPass(smaa);
  }
  function disposeComposer() { if (composer) { composer.passes.forEach((p) => p.dispose && p.dispose()); composer.dispose(); } composer = null; gtao = null; smaa = null; bloom = null; }
  function setQuality(q) {
    level = q; const dpr = window.devicePixelRatio || 1;
    renderer.setPixelRatio(q === 'high' ? Math.min(dpr, 2) : q === 'medium' ? Math.min(dpr, 1.5) : 1);
    const shadow = q === 'high' ? 4096 : q === 'medium' ? 2048 : 1024; if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } sun.shadow.mapSize.set(shadow, shadow);
    if (q === 'low') disposeComposer(); else buildComposer();
    const { w, h } = size(); renderer.setSize(w, h); if (composer) composer.setSize(w, h);
  }
  setQuality(quality);
  const ro = new ResizeObserver(() => { const { w, h } = size(); if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); if (composer) composer.setSize(w, h); });
  ro.observe(container);

  // ---- labels (screen-constant callouts)
  const labels = [];
  function fitLabels() { const { h } = size(); const k = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / h; for (const l of labels) { const s = l.sprite; const sy = s.userData.px * k; s.scale.set(sy * s.userData.aspect, sy, 1); } }
  function addLabel(text, position, { sub = '', rtl = false, scale = 1, stemFrom = null, light = false, color = null } = {}) {
    const sprite = textSprite(text, { sub, rtl, scale, light, color, screen: true }); sprite.position.copy(position); scene.add(sprite);
    let line = null;
    if (stemFrom) { const geo = new THREE.BufferGeometry().setFromPoints([stemFrom.clone(), position.clone()]); line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: light ? 0x334155 : 0xe2e8f0, transparent: true, opacity: 0.75, depthTest: false })); line.renderOrder = 9; scene.add(line);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.03 + 0.004 * position.distanceTo(stemFrom), 10, 8), new THREE.MeshBasicMaterial({ color: light ? 0x334155 : 0xffffff })); dot.position.copy(stemFrom); scene.add(dot); line.userData.dot = dot; }
    let lastKey = text + '\u0000' + sub;
    const rec = { sprite, line, set(t, s = '') { const key = t + '\u0000' + s; if (key === lastKey) return; lastKey = key; updateSprite(sprite, t, { sub: s, rtl, scale, light, color, screen: true }); fitLabels(); }, setVisible(v) { sprite.visible = v; if (line) { line.visible = v; line.userData.dot.visible = v; } }, moveTo(p, from = null) { sprite.position.copy(p); if (line && from) { line.geometry.setFromPoints([from, p]); line.userData.dot.position.copy(from); } }, remove() { scene.remove(sprite); sprite.material.map.dispose(); sprite.material.dispose(); if (line) { scene.remove(line); scene.remove(line.userData.dot); line.geometry.dispose(); } labels.splice(labels.indexOf(rec), 1); } };
    labels.push(rec); fitLabels(); if (!labelsVisible) rec.setVisible(false); return rec;
  }
  let labelsVisible = true;
  function setLabelsVisible(v) { labelsVisible = v; for (const l of labels) l.setVisible(v); scene.traverse((o) => { if (o.isSprite && o.userData.isLabel && !o.userData.screen) o.visible = v; }); }

  // ---- loop with adaptive quality
  const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
  let raf = 0; const tickers = []; let prevT = performance.now(); let frames = 0, acc = 0, adapted = false; let lastH = 0, lastFov = 0;
  function renderFrame() { if (composer) composer.render(); else renderer.render(scene, camera); }
  function loop() { raf = requestAnimationFrame(loop); const now = performance.now(); const dt = Math.min(0.1, (now - prevT) / 1000); prevT = now; for (const t of tickers) t(dt); controls.update();
    const { h } = size(); if (h !== lastH || camera.fov !== lastFov) { lastH = h; lastFov = camera.fov; fitLabels(); }
    renderFrame();
    if (!adapted) { frames++; acc += dt; if (acc > 6) { const fps = frames / acc; adapted = true; if (fps < 22 && level === 'high') { setQuality('medium'); onQualityChange && onQualityChange('medium', fps); } else if (fps < 14) { setQuality('low'); onQualityChange && onQualityChange('low', fps); } } } }
  let onQualityChange = null;
  loop();

  function pick(event, objects) {
    const rect = renderer.domElement.getBoundingClientRect(); mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera); const hits = raycaster.intersectObjects(objects, true);
    for (const hit of hits) { let o = hit.object; while (o && !o.userData.pickId) o = o.parent; if (o) return o.userData.pickId; }
    return null;
  }
  function flyTo(pos, tgt) { const p0 = camera.position.clone(), t0 = controls.target.clone(); const p1 = new THREE.Vector3(...pos), t1 = new THREE.Vector3(...tgt); let k = 0; const tk = (dt) => { k = Math.min(1, k + dt * 1.4); const e = 1 - Math.pow(1 - k, 3); camera.position.lerpVectors(p0, p1, e); controls.target.lerpVectors(t0, t1, e); if (k >= 1) tickers.splice(tickers.indexOf(tk), 1); }; tickers.push(tk); }
  function screenshot() { renderFrame(); return renderer.domElement.toDataURL('image/png'); }
  function dispose() { cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); disposeComposer(); scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((mt) => { for (const k of ['map', 'roughnessMap', 'normalMap', 'emissiveMap']) if (mt[k] && !mt[k].userData.shared) mt[k].dispose(); mt.dispose(); }); } }); renderer.dispose(); renderer.domElement.remove(); }
  return { renderer, scene, camera, controls, tickers, sun, hemi, pick, flyTo, dispose, setSky, setHour, get hour() { return currentHour; }, setQuality, getQuality: () => level, screenshot, addLabel, setLabelsVisible, get labelsVisible() { return labelsVisible; }, setAutoRotate: (v) => { controls.autoRotate = !!v; }, set onQualityChange(fn) { onQualityChange = fn; } };
}

/** Callout label sprite (dark pill, white text, optional second line). `screen: true` keeps a constant on-screen size (anchored at its bottom-centre). */
export function textSprite(text, { sub = '', size = 26, scale = 1, rtl = false, light = false, color = null, bg = null, border = null, screen = false } = {}) {
  const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
  const font = `600 ${size}px 'Segoe UI', 'Noto Sans Arabic', Tahoma, sans-serif`; const subFont = `500 ${Math.round(size * 0.78)}px Consolas, 'Segoe UI', monospace`;
  ctx.font = font; const w1 = ctx.measureText(text).width; ctx.font = subFont; const w2 = sub ? ctx.measureText(sub).width : 0;
  const w = Math.ceil(Math.max(w1, w2)) + 34; const hgt = sub ? size + Math.round(size * 0.78) + 30 : size + 22;
  canvas.width = w * 2; canvas.height = hgt * 2; ctx.scale(2, 2);
  ctx.fillStyle = bg || (light ? 'rgba(255,255,255,0.94)' : 'rgba(18,24,42,0.90)'); roundRect(ctx, 1, 1, w - 2, hgt - 2, 11); ctx.fill(); ctx.strokeStyle = border || (light ? 'rgba(30,40,60,0.25)' : 'rgba(255,255,255,0.22)'); ctx.lineWidth = 1.5; ctx.stroke();
  if (color && !light) { ctx.fillStyle = color; ctx.fillRect(1, hgt - 5, w - 2, 4); }
  ctx.fillStyle = light ? '#1a2233' : '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = rtl ? 'rtl' : 'ltr';
  ctx.font = font; ctx.fillText(text, w / 2, sub ? size / 2 + 11 : hgt / 2 + 1);
  if (sub) { ctx.font = subFont; ctx.fillStyle = light ? '#4b5563' : '#b7c3dd'; ctx.direction = 'ltr'; ctx.fillText(sub, w / 2, size + 12 + Math.round(size * 0.78) / 2 + 4); }
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, sizeAttenuation: !screen })); sp.renderOrder = 10; sp.userData.isLabel = true;
  if (screen) { sp.userData.screen = true; sp.userData.px = hgt * 0.62 * scale; sp.userData.aspect = w / hgt; sp.center.set(0.5, 0); sp.scale.set(sp.userData.px * sp.userData.aspect / 500, sp.userData.px / 500, 1); }
  else sp.scale.set((w / 60) * scale, (hgt / 60) * scale, 1);
  return sp;
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
export function updateSprite(sprite, text, opts = {}) { const n = textSprite(text, opts); sprite.material.map.dispose(); sprite.material.map = n.material.map; sprite.material.needsUpdate = true; sprite.scale.copy(n.scale); sprite.userData.px = n.userData.px; sprite.userData.aspect = n.userData.aspect; n.material.dispose(); }

export function rampGYR(x) { x = Math.min(1, Math.max(0, x)); const c = new THREE.Color(); if (x < 0.5) c.setRGB(0.13 + (0.96 - 0.13) * (x / 0.5), 0.77, 0.37 * (1 - x / 0.5)); else c.setRGB(0.96, 0.62 - (0.62 - 0.27) * ((x - 0.5) / 0.5), 0.27 * (1 - (x - 0.5) / 0.5)); return c; }
export function rampBR(x) { x = Math.min(1, Math.max(0, x)); return new THREE.Color().setHSL(0.66 * (1 - x), 0.85, 0.55); }
export function mat(color, opts = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.2, ...opts }); }
export function box(w, h, d, material, pos = [0, 0, 0], { shadow = true } = {}) { const mm = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); mm.position.set(...pos); mm.castShadow = shadow; mm.receiveShadow = shadow; return mm; }
export function cylinder(r, h, material, pos = [0, 0, 0], rot = [0, 0, 0], seg = 24, rTop = null) { const mm = new THREE.Mesh(new THREE.CylinderGeometry(rTop ?? r, r, h, seg), material); mm.position.set(...pos); mm.rotation.set(...rot); mm.castShadow = true; mm.receiveShadow = true; return mm; }
export function contactShadow(w, d, pos = [0, 0.01, 0], opacity = 0.35) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const ctx = c.getContext('2d'); const g = ctx.createRadialGradient(64, 64, 10, 64, 64, 64); g.addColorStop(0, `rgba(0,0,0,${opacity})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); const mm = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.4, d * 1.4), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); mm.rotation.x = -Math.PI / 2; mm.position.set(...pos); mm.renderOrder = 1; return mm;
}
export function worker(pos = [0, 0, 0], rotY = 0, { vest = 0xf59e0b, helmet = 0xffffff, shirt = 0x3b4a5c, pants = 0x2b3340 } = {}) {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = rotY; const skin = mat(0xd9a679, { roughness: 0.8, metalness: 0 });
  g.add(cylinder(0.14, 0.75, mat(pants, { roughness: 0.9, metalness: 0 }), [-0.11, 0.38, 0], [0, 0, 0], 10)); g.add(cylinder(0.14, 0.75, mat(pants, { roughness: 0.9, metalness: 0 }), [0.11, 0.38, 0], [0, 0, 0], 10));
  g.add(box(0.46, 0.62, 0.28, mat(shirt, { roughness: 0.9, metalness: 0 }), [0, 1.07, 0])); g.add(box(0.5, 0.5, 0.32, mat(vest, { roughness: 0.7, metalness: 0, emissive: vest, emissiveIntensity: 0.15 }), [0, 1.1, 0]));
  g.add(cylinder(0.06, 0.6, mat(shirt, { roughness: 0.9, metalness: 0 }), [-0.3, 1.05, 0], [0, 0, 0.15], 8)); g.add(cylinder(0.06, 0.6, mat(shirt, { roughness: 0.9, metalness: 0 }), [0.3, 1.05, 0], [0, 0, -0.15], 8));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), skin); head.position.y = 1.53; head.castShadow = true; g.add(head);
  const hat = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(helmet, { roughness: 0.4, metalness: 0.1 })); hat.position.y = 1.55; g.add(hat); g.add(cylinder(0.17, 0.02, mat(helmet, { roughness: 0.4 }), [0, 1.55, 0], [0, 0, 0], 16));
  return g;
}
/** Downloads / saves a data-URL PNG through the app's exporter when available, else via an anchor. */
export async function savePng(api, filename, dataUrl) {
  if (api && api.exporter && api.exporter.png) return api.exporter.png({ filename, dataUrl });
  const a = document.createElement('a'); a.href = dataUrl; a.download = filename; a.click(); return { ok: true, file: filename };
}
