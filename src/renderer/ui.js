// DOM helpers, icons, toasts, modals, tables and a mini-markdown renderer.
import { t, L } from './i18n.js';

// Allow conditional children (null/undefined/false) and nested arrays in replaceChildren, like h() does.
if (typeof Element !== 'undefined' && !Element.prototype.__ductPatched) {
  const orig = Element.prototype.replaceChildren;
  Element.prototype.replaceChildren = function (...c) { return orig.apply(this, c.flat(Infinity).filter((x) => x !== null && x !== undefined && x !== false)); };
  Element.prototype.__ductPatched = true;
}

export function h(tag, props = null, ...children) {
  const el = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class' || k === 'className') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k in el && k !== 'list' && typeof v !== 'object') { try { el[k] = v; } catch (_) { el.setAttribute(k, v); } }
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}
export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}
export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---- icons (stroke paths, 24x24 viewBox)
const ICONS = {
  home: 'M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z',
  ruler: 'M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4zM7 14l2 2M10 11l2 2M13 8l2 2',
  factory: 'M2 20V9l6 4V9l6 4V9l6 4v7H2zM17 3h3v6h-3z',
  building: 'M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2',
  wrench: 'M14.7 6.3a4 4 0 0 0 5 5L22 9v6l-3-3a4 4 0 0 0-5 5L2 22l-.7-.7L12 10.3a4 4 0 0 0 2.7-4z',
  clipboard: 'M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1zM8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M9 12l2 2 4-4',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  lock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4',
  map: 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  refresh: 'M23 4v6h-6M1 20v-6h6M20.5 9A9 9 0 0 0 5.6 5.6L1 10M3.5 15a9 9 0 0 0 14.9 3.4L23 14',
  check: 'M20 6 9 17l-5-5', x: 'M18 6 6 18M6 6l12 12',
  alert: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
  play: 'M5 3l14 9-14 9V3z', pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  folder: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  plus: 'M12 5v14M5 12h14', trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z',
  chevron: 'M9 18l6-6-6-6', wind: 'M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2M17.7 7.7A2.5 2.5 0 1 1 19.5 12H2',
  gauge: 'M12 2a10 10 0 0 0-10 10c0 3 1.3 5.7 3.4 7.5h13.2A10 10 0 0 0 12 2zM12 12l4-4M12 12h.01',
  thermo: 'M14 14.8V4a2 2 0 1 0-4 0v10.8a4 4 0 1 0 4 0z', chart: 'M3 3v18h18M7 14l4-4 4 4 5-6',
  key: 'M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3-3.5 3.5z',
  layers: 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  print: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  timer: 'M10 2h4M12 14l3-3M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', flame: 'M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-3-1-6-3-8-1 3-2 5-4 7-1 2-1 3-1 5 0 4 3 7 7 7z',
  arrowRight: 'M5 12h14M12 5l7 7-7 7', arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
};
export function icon(name, size = 20) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', size); svg.setAttribute('height', size);
  svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.8'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', ICONS[name] || ICONS.info); svg.appendChild(p);
  return svg;
}

// ---- toasts
export function toast(msg, type = 'info', ms = 3800) {
  const box = document.getElementById('toasts');
  const el = h('div', { class: `toast ${type}` }, msg);
  box.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, ms);
}

// ---- modals
export function modal({ title, body, actions = [], wide = false, onClose = null, closable = true }) {
  const host = document.getElementById('modals');
  const backdrop = h('div', { class: 'modal-backdrop' });
  const close = () => { backdrop.remove(); if (onClose) onClose(); };
  const footer = actions.length ? h('footer', null, actions.map((a) => h('button', { class: `btn ${a.primary ? 'primary' : ''} ${a.danger ? 'danger' : ''}`, onClick: async () => { const r = a.onClick ? await a.onClick() : true; if (r !== false && a.close !== false) close(); } }, a.label))) : null;
  const box = h('div', { class: `modal ${wide ? 'wide' : ''}` },
    h('header', null, h('h3', null, title), closable ? h('button', { class: 'btn ghost sm', onClick: close, title: t('close') }, icon('x', 16)) : null),
    h('div', { class: 'body' }, body), footer);
  backdrop.appendChild(box);
  if (closable) backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  host.appendChild(backdrop);
  return { close, el: box };
}
export function confirmDialog(message, { title = t('confirm'), danger = false } = {}) {
  return new Promise((resolve) => {
    modal({ title, body: h('p', null, message), onClose: () => resolve(false), actions: [
      { label: t('cancel'), onClick: () => { resolve(false); } },
      { label: t('confirm'), primary: !danger, danger, onClick: () => { resolve(true); } },
    ] });
  });
}
export function promptDialog({ title, label, type = 'text', value = '', placeholder = '' }) {
  return new Promise((resolve) => {
    const input = h('input', { type, value, placeholder, class: 'input' });
    let done = false;
    const m = modal({ title, body: h('div', { class: 'field' }, h('label', null, label), input), onClose: () => { if (!done) resolve(null); }, actions: [
      { label: t('cancel'), onClick: () => { done = true; resolve(null); } },
      { label: t('ok'), primary: true, onClick: () => { done = true; resolve(input.value); } },
    ] });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { done = true; resolve(input.value); m.close(); } });
    setTimeout(() => input.focus(), 30);
  });
}

// ---- widgets
export function kpi(label, value, unit = '', status = '') {
  return h('div', { class: `kpi ${status}` }, h('div', { class: 'label' }, label), h('div', null, h('span', { class: 'value' }, value), unit ? h('span', { class: 'unit' }, unit) : null));
}
export function table(headers, rows, { numeric = [], wrap = true, className = '' } = {}) {
  const tbl = h('table', { class: `tbl ${className}` },
    h('thead', null, h('tr', null, headers.map((hd, i) => h('th', { class: numeric.includes(i) ? 'num' : '' }, hd)))),
    h('tbody', null, rows.map((r) => h('tr', null, r.map((c, i) => h('td', { class: numeric.includes(i) ? 'num' : '' }, c))))));
  return wrap ? h('div', { class: 'tbl-wrap' }, tbl) : tbl;
}
export function field(label, input, hint = null) { return h('div', { class: 'field' }, h('label', null, label), input, hint ? h('div', { class: 'hint' }, hint) : null); }
export function select(options, value, onChange, attrs = {}) {
  const sel = h('select', { ...attrs, onChange: (e) => onChange(e.target.value, e) }, options.map((o) => h('option', { value: o.value, selected: String(o.value) === String(value) }, o.label)));
  return sel;
}
export function numberInput(value, onChange, { min, max, step = 'any', ...attrs } = {}) {
  return h('input', { type: 'number', value, min, max, step, ...attrs, onInput: (e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v, e); } });
}
export function slider({ label, min, max, step = 1, value, unit = '', format = (v) => v, onChange }) {
  const val = h('span', { class: 'val' }, `${format(value)} ${unit}`.trim());
  const input = h('input', { type: 'range', min, max, step, value, onInput: (e) => { const v = parseFloat(e.target.value); val.textContent = `${format(v)} ${unit}`.trim(); onChange(v); } });
  return h('div', { class: 'ctl' }, h('div', { class: 'row' }, h('label', null, label), val), input);
}
export function sparkline(canvas, data, { color = '#6d5ce7', min = null, max = null } = {}) {
  const ctx = canvas.getContext('2d'); const w = canvas.width = canvas.clientWidth * 2 || 600; const hgt = canvas.height = canvas.clientHeight * 2 || 92;
  ctx.clearRect(0, 0, w, hgt);
  if (!data.length) return;
  const lo = min ?? Math.min(...data), hi = max ?? Math.max(...data); const span = hi - lo || 1;
  ctx.beginPath(); ctx.lineWidth = 3; ctx.strokeStyle = color;
  data.forEach((v, i) => { const x = (i / Math.max(1, data.length - 1)) * (w - 6) + 3; const y = hgt - 4 - ((v - lo) / span) * (hgt - 8); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.stroke();
  ctx.globalAlpha = 0.15; ctx.lineTo(w - 3, hgt); ctx.lineTo(3, hgt); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.globalAlpha = 1;
}
export function statusOf(value, warnAt, critAt, higherIsWorse = true) {
  if (higherIsWorse) return value >= critAt ? 'crit' : value >= warnAt ? 'warn' : 'ok';
  return value <= critAt ? 'crit' : value <= warnAt ? 'warn' : 'ok';
}

// ---- mini markdown (headings, lists, tables, bold/italic/code, blockquote, formula blocks with $$)
export function renderMarkdown(md) {
  const lines = String(md || '').replace(/\r/g, '').split('\n');
  let html = '', i = 0;
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*(?!\*)(.+?)\*(?!\*)/g, '$1<em>$2</em>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\[(.+?)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith('$$')) { const buf = []; i++; while (i < lines.length && !lines[i].startsWith('$$')) buf.push(esc(lines[i++])); i++; html += `<div class="formula">${buf.join('<br>')}</div>`; continue; }
    const hm = line.match(/^(#{1,4})\s+(.*)/); if (hm) { const lvl = hm[1].length + 1; html += `<h${lvl}>${inline(hm[2])}</h${lvl}>`; i++; continue; }
    if (line.startsWith('>')) { const buf = []; while (i < lines.length && lines[i].startsWith('>')) buf.push(inline(lines[i++].replace(/^>\s?/, ''))); html += `<blockquote>${buf.join('<br>')}</blockquote>`; continue; }
    if (line.startsWith('|')) {
      const rows = []; while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(rows[0]); const body = rows.slice(1).filter((r) => !/^\|\s*:?-{2,}/.test(r));
      html += `<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`; continue;
    }
    if (/^\s*[-*]\s+/.test(line)) { const items = []; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(inline(lines[i++].replace(/^\s*[-*]\s+/, ''))); html += `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`; continue; }
    if (/^\s*\d+[.)]\s+/.test(line)) { const items = []; while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(inline(lines[i++].replace(/^\s*\d+[.)]\s+/, ''))); html += `<ol>${items.map((x) => `<li>${x}</li>`).join('')}</ol>`; continue; }
    const buf = []; while (i < lines.length && lines[i].trim() && !/^(#|\||>|\$\$|\s*[-*]\s|\s*\d+[.)]\s)/.test(lines[i])) buf.push(inline(lines[i++]));
    html += `<p>${buf.join(' ')}</p>`;
  }
  return html;
}
export function pageHead(title, subtitle, actions = []) {
  return h('div', { class: 'page-head' }, h('div', null, h('h1', null, title), subtitle ? h('p', null, subtitle) : null), actions.length ? h('div', { class: 'row' }, actions) : null);
}
export const Lx = L;
