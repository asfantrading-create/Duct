// Procedurally generated PBR-ish textures (canvas based) — no external assets needed, works offline.
import * as THREE from 'three';

const cache = new Map();
function canvasTexture(key, w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  if (cache.has(key)) return cache.get(key).clone();
  const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t); return t.clone();
}
function noise(ctx, w, h, { density = 0.35, alphaMin = 0.02, alphaMax = 0.09, size = 1.5, light = true, dark = true } = {}) {
  const n = Math.floor(w * h * density / (size * size));
  for (let i = 0; i < n; i++) { const a = alphaMin + Math.random() * (alphaMax - alphaMin); const isLight = light && (!dark || Math.random() < 0.5); ctx.fillStyle = isLight ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`; ctx.fillRect(Math.random() * w, Math.random() * h, size, size); }
}
function blotches(ctx, w, h, count, rMin, rMax, color) { for (let i = 0; i < count; i++) { const r = rMin + Math.random() * (rMax - rMin); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.save(); ctx.translate(Math.random() * w, Math.random() * h); ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r); ctx.restore(); } }

/** Industrial concrete floor: 4 m panels with saw-cut joints, stains and speckle. One tile = 4×4 m. */
export function concreteFloor(repeatX = 16, repeatY = 9) {
  return canvasTexture('concrete', 1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#b5b3ab'; ctx.fillRect(0, 0, w, h);
    blotches(ctx, w, h, 30, 60, 260, 'rgba(90,88,80,0.10)'); blotches(ctx, w, h, 20, 40, 180, 'rgba(255,255,255,0.08)');
    noise(ctx, w, h, { density: 0.6, alphaMin: 0.02, alphaMax: 0.10, size: 2 });
    // trowel sweeps
    ctx.strokeStyle = 'rgba(0,0,0,0.035)'; ctx.lineWidth = 3; for (let i = 0; i < 40; i++) { ctx.beginPath(); const y = Math.random() * h; ctx.moveTo(0, y); ctx.bezierCurveTo(w / 3, y + (Math.random() - 0.5) * 80, (2 * w) / 3, y + (Math.random() - 0.5) * 80, w, y); ctx.stroke(); }
    // saw-cut joints at panel edges
    ctx.strokeStyle = 'rgba(40,40,40,0.55)'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.strokeRect(9, 9, w - 18, h - 18);
  }, { repeat: [repeatX, repeatY] });
}
/** Insulated sandwich-panel wall cladding: 1 m wide light panels with joints and micro-ribs. Tile = 4 m × 4 m. */
export function wallPanels(repeatX = 16, repeatY = 2, base = '#e3e6e8') {
  return canvasTexture('wall' + base, 1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 256) { const g = ctx.createLinearGradient(x, 0, x + 256, 0); g.addColorStop(0, 'rgba(0,0,0,0.10)'); g.addColorStop(0.08, 'rgba(255,255,255,0.06)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(0.92, 'rgba(0,0,0,0.06)'); g.addColorStop(1, 'rgba(0,0,0,0.18)'); ctx.fillStyle = g; ctx.fillRect(x, 0, 256, h); ctx.fillStyle = 'rgba(30,30,30,0.35)'; ctx.fillRect(x, 0, 3, h); }
    ctx.strokeStyle = 'rgba(0,0,0,0.05)'; ctx.lineWidth = 1; for (let y = 0; y < h; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    noise(ctx, w, h, { density: 0.2, alphaMin: 0.01, alphaMax: 0.05 });
  }, { repeat: [repeatX, repeatY] });
}
/** Trapezoidal roof deck / cladding seen from below or above (ribs along one axis). Tile 2 m. */
export function roofDeck(repeatX = 32, repeatY = 18, base = '#cfd4da') {
  return canvasTexture('roofdeck' + base, 512, 512, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 64) { const g = ctx.createLinearGradient(x, 0, x + 64, 0); g.addColorStop(0, 'rgba(0,0,0,0.22)'); g.addColorStop(0.3, 'rgba(255,255,255,0.10)'); g.addColorStop(0.55, 'rgba(0,0,0,0.02)'); g.addColorStop(0.8, 'rgba(0,0,0,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0.25)'); ctx.fillStyle = g; ctx.fillRect(x, 0, 64, h); }
    noise(ctx, w, h, { density: 0.15, alphaMin: 0.01, alphaMax: 0.05 });
  }, { repeat: [repeatX, repeatY] });
}
/** Galvanized steel sheet with spangle pattern. Returns { map, roughnessMap }. */
export function galvanized(repeatX = 1, repeatY = 1) {
  const map = canvasTexture('galv', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#c2c7cc'; ctx.fillRect(0, 0, w, h);
    // spangles: voronoi-ish cells approximated by overlapping polygons
    for (let i = 0; i < 260; i++) { const cx = Math.random() * w, cy = Math.random() * h, r = 12 + Math.random() * 26; const l = 170 + Math.floor(Math.random() * 60); ctx.fillStyle = `rgba(${l},${l + 3},${l + 8},0.55)`; ctx.beginPath(); const k = 5 + Math.floor(Math.random() * 3); for (let j = 0; j < k; j++) { const a = (j / k) * Math.PI * 2 + Math.random() * 0.4; const rr = r * (0.7 + Math.random() * 0.5); ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
    noise(ctx, w, h, { density: 0.4, alphaMin: 0.01, alphaMax: 0.06 });
  }, { repeat: [repeatX, repeatY] });
  const roughnessMap = canvasTexture('galv-rough', 512, 512, (ctx, w, h) => { ctx.fillStyle = '#6a6a6a'; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { const l = 70 + Math.floor(Math.random() * 90); ctx.fillStyle = `rgb(${l},${l},${l})`; ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 10 + Math.random() * 24, 0, Math.PI * 2); ctx.fill(); } }, { repeat: [repeatX, repeatY], srgb: false });
  return { map, roughnessMap };
}
/** Spiral duct: diagonal lock-seam stripes over galvanized. */
export function spiralSeam(repeatX = 1, repeatY = 4) {
  return canvasTexture('spiral', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#c4c9ce'; ctx.fillRect(0, 0, w, h); noise(ctx, w, h, { density: 0.5, alphaMin: 0.01, alphaMax: 0.07 });
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(-0.28); ctx.translate(-w, -h);
    for (let y = -h; y < 3 * h; y += 128) { ctx.fillStyle = 'rgba(60,65,72,0.55)'; ctx.fillRect(-w, y, 4 * w, 7); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-w, y + 7, 4 * w, 3); }
    ctx.restore();
  }, { repeat: [repeatX, repeatY] });
}
/** Painted machine steel with subtle wear. */
export function paintedSteel(hex) {
  return canvasTexture('paint' + hex, 256, 256, (ctx, w, h) => { ctx.fillStyle = hex; ctx.fillRect(0, 0, w, h); noise(ctx, w, h, { density: 0.3, alphaMin: 0.01, alphaMax: 0.05 }); blotches(ctx, w, h, 6, 20, 70, 'rgba(0,0,0,0.08)'); ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(Math.random() * w, Math.random() * h); ctx.lineTo(Math.random() * w, Math.random() * h); ctx.stroke(); } });
}
/** Yellow/black hazard stripes. */
export function hazard(repeat = 4) {
  return canvasTexture('hazard', 256, 64, (ctx, w, h) => { ctx.fillStyle = '#f2c11b'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#1b1b1b'; for (let x = -h; x < w + h; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 32, 0); ctx.lineTo(x + 32 + h, h); ctx.lineTo(x + h, h); ctx.closePath(); ctx.fill(); } }, { repeat: [repeat, 1] });
}
/** Wooden pallet planks. */
export function wood() {
  return canvasTexture('wood', 256, 256, (ctx, w, h) => { ctx.fillStyle = '#b48a5a'; ctx.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) { ctx.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.12})`; ctx.fillRect(0, y, w, 3); } ctx.strokeStyle = 'rgba(80,50,20,0.25)'; for (let i = 0; i < 60; i++) { ctx.beginPath(); const y = Math.random() * h; ctx.moveTo(0, y); ctx.bezierCurveTo(w / 3, y + 6, (2 * w) / 3, y - 6, w, y); ctx.stroke(); } });
}
/** Suspended ceiling tiles 600×600 with grid. Tile = 2.4 m. */
export function ceilingTiles(repeatX = 10, repeatY = 6) {
  return canvasTexture('ceiling', 512, 512, (ctx, w, h) => { ctx.fillStyle = '#f2f3f4'; ctx.fillRect(0, 0, w, h); noise(ctx, w, h, { density: 0.5, alphaMin: 0.01, alphaMax: 0.04, light: false }); ctx.strokeStyle = '#c9cdd2'; ctx.lineWidth = 6; for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo((i * w) / 4, 0); ctx.lineTo((i * w) / 4, h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, (i * h) / 4); ctx.lineTo(w, (i * h) / 4); ctx.stroke(); } }, { repeat: [repeatX, repeatY] });
}
/** Carpet tiles for offices. */
export function carpet(repeatX = 24, repeatY = 15, base = '#7d8797') {
  return canvasTexture('carpet' + base, 256, 256, (ctx, w, h) => { ctx.fillStyle = base; ctx.fillRect(0, 0, w, h); noise(ctx, w, h, { density: 1.2, alphaMin: 0.02, alphaMax: 0.08, size: 1 }); ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, w - 2, h - 2); }, { repeat: [repeatX, repeatY] });
}
/** Sky gradient used as scene background. */
export function skyGradient() {
  return canvasTexture('sky', 64, 512, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#6aa5e6'); g.addColorStop(0.45, '#b9d6f2'); g.addColorStop(0.7, '#e4eef8'); g.addColorStop(1, '#d9dde3'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
}
/** Roller-shutter door ribs. */
export function shutter(repeatX = 1, repeatY = 12) {
  return canvasTexture('shutter', 64, 64, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9aa3ad'); g.addColorStop(0.5, '#d7dde3'); g.addColorStop(1, '#8b939c'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }, { repeat: [repeatX, repeatY] });
}
/** Glass-like clear material helper. */
export function glassMaterial(tint = 0xbfe0f5, opacity = 0.35) { return new THREE.MeshPhysicalMaterial({ color: tint, transparent: true, opacity, roughness: 0.05, metalness: 0, transmission: 0, side: THREE.DoubleSide, depthWrite: false }); }
