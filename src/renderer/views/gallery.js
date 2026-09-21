// Interactive 3D gallery of real duct components (parametric): pick a component, change its dimensions,
// read the labelled parts, and export a screenshot.
import { h, icon, toast, kpi, field, select, slider, pageHead } from '../ui.js';
import { t, tr, L, fmtNum } from '../i18n.js';
import { THREE, createBase, contactShadow, savePng } from '../three/common.js';
import { CATALOG } from '../three/duct-parts.js';
import * as E from '../../shared/engineering.js';
import { showHelp } from '../help.js';

let base = null;
export default {
  destroy() { if (base) base.dispose(); base = null; },
  render(container, ctx, params = {}) {
    const rtl = ctx.state.settings.lang === 'ar';
    let current = CATALOG.find((c) => c.id === params.componentId) || CATALOG[0]; let values = {}; let model = null; let labels = []; let labelsOn = true;
    const sceneEl = h('div', { class: 'scene' }); const panel = h('div', { class: 'panel' });
    container.appendChild(h('div', { class: 'twin' }, sceneEl, panel));
    base = createBase(sceneEl, { camPos: [2.6, 1.8, 3.2], target: [0, 0.6, 0], fov: 38, sunPos: [6, 10, 5], shadowSize: 6, sky: 'day', hdrBackground: true, fog: false, backgroundBlur: 0.45, quality: 'high' });
    base.setAutoRotate(true);
    // display stage
    const stage = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.12, 64), new THREE.MeshStandardMaterial({ color: 0x5b6472, roughness: 0.55, metalness: 0.15 })); stage.position.y = -0.06; stage.receiveShadow = true; base.scene.add(stage);
    const grid = new THREE.GridHelper(4.6, 23, 0x8b97a8, 0x6b7686); grid.position.y = 0.001; base.scene.add(grid);
    base.scene.add(contactShadow(2.2, 2.2, [0, 0.005, 0], 0.25));
    const hud = h('div', { class: 'scene-hud' });
    sceneEl.append(h('div', { class: 'scene-overlay' }, hud), h('div', { class: 'scene-tools' },
      h('button', { class: 'btn sm on', onClick: (e) => { labelsOn = !labelsOn; base.setLabelsVisible(labelsOn); e.currentTarget.classList.toggle('on', labelsOn); } }, icon('layers', 14), tr('التسميات', 'Labels')),
      h('button', { class: 'btn sm on', onClick: (e) => { const on = !e.currentTarget.classList.contains('on'); base.setAutoRotate(on); e.currentTarget.classList.toggle('on', on); } }, icon('refresh', 14), tr('دوران', 'Rotate')),
      h('button', { class: 'btn sm', onClick: async () => { const r = await savePng(ctx.api, `duct-${current.id}.png`, base.screenshot()); if (r.ok) toast(`${t('exported')}: ${r.file}`, 'ok'); } }, icon('print', 14), tr('لقطة شاشة', 'Screenshot'))));

    const chips = h('div', { class: 'gallery-chips' }); const paramsBox = h('div', { class: 'stack' }); const info = h('div', { class: 'small' }); const partsBox = h('div', { class: 'stack' }); const kpis = h('div', { class: 'grid cols-2' });
    panel.append(h('div', { class: 'row between' }, h('h3', { style: { margin: 0 } }, icon('layers', 18), ' ', tr('معرض مكونات الدكت 3D', 'Duct components 3D gallery')), h('button', { class: 'btn sm', onClick: () => showHelp('gallery') }, icon('info', 14), tr('شرح', 'Help'))),
      h('div', { class: 'card' }, h('h4', null, tr('اختر المكوّن', 'Choose a component')), chips),
      h('div', { class: 'card' }, h('h4', null, tr('الأبعاد', 'Dimensions')), paramsBox, kpis),
      h('div', { class: 'card' }, h('h4', null, tr('الأجزاء المسمّاة', 'Labelled parts')), partsBox),
      h('div', { class: 'card' }, h('h4', null, tr('عن هذا المكوّن', 'About this component')), info));

    const renderChips = () => chips.replaceChildren(...CATALOG.map((c) => h('span', { class: `chip ${c.id === current.id ? 'on' : ''}`, onClick: () => { current = c; values = {}; renderChips(); renderParams(); build(); } }, L(c))));
    const renderParams = () => { paramsBox.replaceChildren(...current.params.map(([key, ar, en, min, max, step, def]) => { values[key] = values[key] ?? def; return slider({ label: tr(ar, en), min, max, step, value: values[key], format: (v) => (step < 1 ? fmtNum(v, 3) : String(v)), onChange: (v) => { values[key] = v; build(); } }); })); };
    const build = () => {
      if (model) { base.scene.remove(model); model.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); } for (const l of labels) l.remove(); labels = [];
      const args = {}; for (const [key] of current.params) args[key] = values[key];
      model = current.build(args); model.position.y = 0.55; base.scene.add(model);
      const bb = new THREE.Box3().setFromObject(model); const size = bb.getSize(new THREE.Vector3()); const center = bb.getCenter(new THREE.Vector3()); model.position.y += Math.max(0, 0.15 - bb.min.y); model.position.x -= center.x; model.position.z -= center.z;
      model.updateMatrixWorld(true);
      const parts = model.userData.parts || [];
      parts.forEach((p, i) => { const world = p.position.clone().applyMatrix4(model.matrixWorld); const dir = world.clone().sub(new THREE.Vector3(0, world.y, 0)).normalize(); if (!isFinite(dir.x)) dir.set(1, 0, 0); const at = world.clone().add(dir.multiplyScalar(0.55)).add(new THREE.Vector3(0, 0.35 + (i % 3) * 0.12, 0)); labels.push(base.addLabel(rtl ? p.ar : p.en, at, { rtl, scale: 0.8, stemFrom: world })); });
      base.setLabelsVisible(labelsOn);
      partsBox.replaceChildren(...(parts.length ? parts.map((p) => h('div', { class: 'alarm', style: { cursor: 'pointer' }, onClick: () => { const w = p.position.clone().applyMatrix4(model.matrixWorld); base.flyTo([w.x + 1.6, w.y + 1.0, w.z + 1.6], [w.x, w.y, w.z]); } }, h('strong', null, rtl ? p.ar : p.en))) : [h('div', { class: 'tiny muted' }, '—')]));
      info.replaceChildren(h('p', null, L(current.info)));
      // engineering readouts for sheet-metal components
      const d = model.userData.dims || {}; const items = [];
      if (d.w && d.h) { const len = d.len || 1; const area = E.ductSurfaceM2({ shape: 'rectangular', aMm: d.w * 1000, bMm: d.h * 1000, lengthM: len }); const g = E.smacnaGauge2in(Math.max(d.w, d.h) * 1000); const gmm = E.GAUGES.find((x) => x.gauge === g.gauge).mm; items.push(kpi(tr('مساحة السطح', 'Surface area'), fmtNum(area, 2), 'm²'), kpi(tr('السماكة SMACNA 500 باسكال', 'SMACNA gauge @ 500 Pa'), `${g.gauge} ga`, `${gmm} mm`), kpi(tr('الوزن التقريبي', 'Approx. weight'), fmtNum(E.ductWeightKg({ shape: 'rectangular', aMm: d.w * 1000, bMm: d.h * 1000, lengthM: len, thicknessMm: gmm }), 1), 'kg'), kpi(tr('القطر المكافئ', 'Equivalent diameter'), fmtNum(E.equivalentDiameter(d.w * 1000, d.h * 1000), 0), 'mm')); }
      else if (d.d) { const len = d.len || 1; items.push(kpi(tr('مساحة السطح', 'Surface area'), fmtNum(Math.PI * d.d * len, 2), 'm²'), kpi(tr('المساحة المقطعية', 'Cross-section'), fmtNum(E.roundArea(d.d), 4), 'm²'), kpi(tr('الوزن التقريبي (0.6 مم)', 'Approx. weight (0.6 mm)'), fmtNum(E.ductWeightKg({ shape: 'round', dMm: d.d * 1000, lengthM: len, thicknessMm: 0.6 }), 1), 'kg')); }
      kpis.replaceChildren(...items);
      hud.replaceChildren(h('strong', null, L(current)), h('div', { class: 'tiny' }, `${tr('الأبعاد', 'Dims')}: ${fmtNum(size.x, 2)} × ${fmtNum(size.y, 2)} × ${fmtNum(size.z, 2)} m`));
    };
    renderChips(); renderParams(); build();
  },
};
