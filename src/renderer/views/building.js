import { h, icon, toast, kpi, table, field, select, numberInput, slider, sparkline, statusOf, esc } from '../ui.js';
import { t, tr, L, fmtNum, fmtDuration } from '../i18n.js';
import * as NS from '../../shared/network-sim.js';
import * as E from '../../shared/engineering.js';
import { CITIES, cityById, ambientAt } from '../../shared/data/climate.js';
import { createBuildingScene } from '../three/building-scene.js';
import { reportHtml } from './fabrication.js';

let scene = null, timer = null, view = null;
export default {
  destroy() { if (timer) clearInterval(timer); timer = null; if (view && view.autosave) view.autosave(); if (scene) scene.dispose(); scene = null; view = null; },
  render(container, ctx) {
    const lang = ctx.state.settings.lang;
    const topo = NS.defaultTopology(); const sized = NS.sizeNetwork(topo); let controls = NS.defaultControls();
    let cityId = ctx.state.settings.city || 'riyadh';
    const st = { hour: 15, live: false, speed: 1, selected: null, history: [], startedReal: Date.now(), savedOnce: false, simMinutes: 0, faults: {} };
    const env = () => { const c = cityById(cityId); const tAmb = ambientAt(c, st.hour); return { tempC: tAmb, plenumTempC: tAmb - 10, rhPct: c.rh_summer_pct, altitudeM: c.elevation_m, city: c }; };
    NS.calibrateFan(topo, sized, NS.defaultControls(), env());
    const labels = {}; for (const s of Object.values(sized.segs)) labels[s.id] = L(s); labels.AHU = tr('وحدة مناولة الهواء (AHU)', 'Air handling unit (AHU)');

    const sceneEl = h('div', { class: 'scene' }); const panel = h('div', { class: 'panel' });
    container.appendChild(h('div', { class: 'twin' }, sceneEl, panel));
    scene = createBuildingScene(sceneEl, { lang, labels, onSelect: (id) => { st.selected = id; scene.highlight(id); renderHotspot(); } });
    scene.build(sized);
    const hud = h('div', { class: 'scene-hud' }); const legend = h('div', { class: 'scene-hud scene-legend small' }); const hotspot = h('div', { class: 'hotspot-info hidden' });
    let colorMode = 'pressure';
    const modeBtns = h('div', { class: 'row' }, ['pressure', 'velocity', 'temperature'].map((m) => h('button', { class: `btn sm ${m === colorMode ? 'active' : ''}`, onClick: (e) => { colorMode = m; scene.setColorMode(m); modeBtns.querySelectorAll('.btn').forEach((b) => b.classList.remove('active')); e.currentTarget.classList.add('active'); renderLegend(); } }, { pressure: tr('الضغط', 'Pressure'), velocity: tr('السرعة', 'Velocity'), temperature: tr('الحرارة', 'Temperature') }[m])));
    sceneEl.append(h('div', { class: 'scene-overlay' }, hud, legend, h('div', { class: 'scene-hud small' }, tr('انقر على دكت أو مخرج أو وحدة المناولة لعرض قراءات الحساسات', 'Click a duct, outlet or the AHU to read its sensors'))),
      h('div', { class: 'scene-tabs' }, modeBtns, ['overview', 'ahu', 'branchA', 'branchBC', 'inside', 'top'].map((v) => h('button', { class: 'btn sm', onClick: () => scene.setView(v) }, { overview: tr('عام', 'Overview'), ahu: 'AHU', branchA: tr('فرع A', 'Branch A'), branchBC: tr('فرعا B/C', 'Branches B/C'), inside: tr('من الداخل', 'Inside'), top: tr('من الأعلى', 'Top') }[v]))), hotspot);
    function renderLegend() { legend.replaceChildren(h('span', null, { pressure: tr('ضغط استاتيكي: منخفض ← عالٍ', 'Static pressure: low → high'), velocity: tr('سرعة: 3 م/ث ← 11 م/ث', 'Velocity: 3 → 11 m/s'), temperature: tr('حرارة الهواء: 12 ← 22°م', 'Air temperature: 12 → 22 °C') }[colorMode]), h('i', { style: { background: colorMode === 'velocity' ? 'linear-gradient(90deg,#22c55e,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#3b5bdb,#22c55e,#f59e0b,#ef4444)' } })); }
    renderLegend();

    // ---- controls
    const citySel = select(CITIES.map((c) => ({ value: c.id, label: `${tr(c.city_ar, c.city_en)} — ${c.cooling_db_0_4}°C${c.source === 'approx' ? '' : ' ✓'}` })), cityId, (v) => { cityId = v; recompute(); });
    const hourSlider = slider({ label: tr('ساعة اليوم (المناخ)', 'Hour of day (climate)'), min: 0, max: 23, step: 1, value: st.hour, format: (v) => `${String(v).padStart(2, '0')}:00`, onChange: (v) => { st.hour = v; recompute(); } });
    const fanSlider = slider({ label: tr('سرعة المروحة (VFD)', 'Fan speed (VFD)'), min: 30, max: 120, step: 1, value: controls.fanSpeedPct, unit: '%', onChange: (v) => { controls.fanSpeedPct = v; recompute(); } });
    const filterSlider = slider({ label: tr('انسداد الفلتر', 'Filter loading'), min: 0, max: 100, step: 1, value: controls.filterLoading * 100, unit: '%', onChange: (v) => { controls.filterLoading = v / 100; recompute(); } });
    const damperSliders = {}; for (const id of ['B1', 'B2', 'B3']) damperSliders[id] = slider({ label: `${tr('دامبر', 'Damper')} ${id} — ${labels[id]}`, min: 0, max: 80, step: 1, value: controls.dampers[id], unit: '°', onChange: (v) => { controls.dampers[id] = v; recompute(); } });
    const sealSel = select(Object.keys(E.LEAKAGE_CLASSES).map((k) => ({ value: k, label: L(E.LEAKAGE_CLASSES[k]) })), controls.sealClass, (v) => { controls.sealClass = v; recompute(); });
    const insSel = select(E.INSULATION.map((i) => ({ value: i.id, label: L(i) })), controls.insulation.id, (v) => { const i = E.INSULATION.find((x) => x.id === v); controls.insulation = { id: v, k: i.k, mm: i.k ? (controls.insulation.mm || 25) : 0 }; recompute(); });
    const insMm = numberInput(controls.insulation.mm, (v) => { controls.insulation.mm = v; recompute(); }, { min: 0, max: 100, step: 5 });
    const roughSel = select(Object.keys(E.ROUGHNESS).map((k) => ({ value: k, label: L(E.ROUGHNESS[k]) })), controls.roughness, (v) => { controls.roughness = v; recompute(); });
    const syncSliders = () => { fanSlider.querySelector('input').value = controls.fanSpeedPct; fanSlider.querySelector('.val').textContent = `${controls.fanSpeedPct} %`; filterSlider.querySelector('input').value = Math.round(controls.filterLoading * 100); filterSlider.querySelector('.val').textContent = `${Math.round(controls.filterLoading * 100)} %`; for (const id of ['B1', 'B2', 'B3']) { damperSliders[id].querySelector('input').value = controls.dampers[id]; damperSliders[id].querySelector('.val').textContent = `${controls.dampers[id]} °`; } };
    const liveBtn = h('button', { class: 'btn primary', onClick: () => { st.live = !st.live; liveBtn.replaceChildren(icon(st.live ? 'pause' : 'play', 16), st.live ? tr('إيقاف الزمن الحي', 'Pause live time') : tr('تشغيل الزمن الحي', 'Run live time')); } }, icon('play', 16), tr('تشغيل الزمن الحي', 'Run live time'));
    const speedSel = select([{ value: 1, label: '×1 (1 min/s)' }, { value: 10, label: '×10' }, { value: 60, label: '×60' }], 1, (v) => { st.speed = parseInt(v, 10); });

    const kpis = h('div', { class: 'grid cols-2' }); const alarms = h('div', { class: 'stack' }); const terminals = h('div'); const segTable = h('div'); const spark = h('canvas', { class: 'sparkline' }); const spark2 = h('canvas', { class: 'sparkline' });
    panel.append(
      h('div', { class: 'row between' }, h('h3', { style: { margin: 0 } }, icon('building', 18), ' ', t('nav_building')), h('div', { class: 'row' }, liveBtn, speedSel)),
      h('div', { class: 'card' }, h('h4', null, tr('المناخ والموقع', 'Climate & site')), field(tr('المدينة (مناخ التصميم)', 'City (design climate)'), citySel), hourSlider),
      h('div', { class: 'card' }, h('h4', null, tr('مؤشرات حية', 'Live readings')), kpis, h('div', { class: 'tiny muted', style: { marginTop: '6px' } }, tr('الضغط الاستاتيكي الرئيسي (باسكال)', 'Main static pressure (Pa)')), spark, h('div', { class: 'tiny muted' }, tr('قدرة المروحة (كW)', 'Fan power (kW)')), spark2),
      h('div', { class: 'card' }, h('h4', null, tr('التنبيهات', 'Alarms')), alarms),
      h('div', { class: 'card' }, h('h4', null, tr('التحكم', 'Controls')), fanSlider, filterSlider, damperSliders.B1, damperSliders.B2, damperSliders.B3,
        h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn sm primary', onClick: () => { controls = NS.autoBalance(topo, sized, controls, env()); syncSliders(); recompute(); toast(tr('تمت الموازنة النسبية للفروع وضبط سرعة المروحة', 'Branches proportionally balanced and fan speed set'), 'ok'); } }, icon('gauge', 14), tr('موازنة تلقائية (TAB)', 'Auto-balance (TAB)')),
          h('button', { class: 'btn sm', onClick: () => { controls = NS.defaultControls(); syncSliders(); recompute(); } }, icon('refresh', 14), tr('إعادة الضبط', 'Reset')),
          h('button', { class: 'btn sm danger', onClick: injectFault }, icon('alert', 14), tr('حقن عطل', 'Inject fault')))),
      h('div', { class: 'card' }, h('h4', null, tr('التصنيع والعزل', 'Construction & insulation')), field(tr('فئة الإحكام (SMACNA)', 'Seal class (SMACNA)'), sealSel), h('div', { class: 'row' }, field(tr('العزل', 'Insulation'), insSel), field(tr('السماكة (مم)', 'Thickness (mm)'), insMm)), field(tr('خشونة السطح الداخلي', 'Internal roughness'), roughSel)),
      h('div', { class: 'card' }, h('h4', null, tr('المخارج', 'Outlets')), terminals),
      h('div', { class: 'card' }, h('h4', null, tr('المقاطع', 'Segments')), segTable),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onClick: () => saveSession(true) }, icon('check', 16), tr('حفظ الجلسة', 'Save session')), h('button', { class: 'btn', onClick: exportCsv }, icon('download', 16), t('exportCsv')), h('button', { class: 'btn', onClick: exportPdf }, icon('print', 16), t('exportPdf'))));

    let last = null;
    function recompute() {
      const e = env(); const r = NS.solve(topo, sized, controls, e); last = r; scene.update(r);
      st.history.push({ minute: st.simMinutes, staticPa: r.totals.maxStaticPa, fanKw: r.fan.powerKw, delivered: r.totals.deliveredLps, leakPct: r.totals.leakPct, heatKw: r.totals.heatGainKw, filterDp: r.filterDpPa, ambient: e.tempC }); if (st.history.length > 400) st.history.shift();
      hud.replaceChildren(h('div', null, h('strong', null, `${tr(e.city.city_ar, e.city.city_en)} · ${String(st.hour).padStart(2, '0')}:00 · ${fmtNum(e.tempC, 1)} °C`), ` · ${tr('المروحة', 'fan')} ${fmtNum(r.fan.qLps, 0)} L/s @ ${fmtNum(r.fan.dpPa, 0)} Pa · ${fmtNum(r.fan.powerKw, 2)} kW`), st.live ? h('div', { class: 'tiny' }, `${tr('زمن حي', 'Live time')}: ${fmtDuration(st.simMinutes * 60)}`) : null);
      const pcls = topo.pressureClassPa;
      kpis.replaceChildren(
        kpi(tr('تدفق المروحة', 'Fan flow'), fmtNum(r.fan.qLps, 0), `L/s / ${sized.designTotalLps}`), kpi(tr('ضغط المروحة الكلي', 'Fan total pressure'), fmtNum(r.fan.dpPa, 0), 'Pa'),
        kpi(tr('قدرة المروحة', 'Fan power'), fmtNum(r.fan.powerKw, 2), `kW / ${topo.fan.ratedKw}`, statusOf(r.fan.powerKw / topo.fan.ratedKw, 0.9, 1.0)), kpi(tr('الضغط الاستاتيكي الرئيسي', 'Main static pressure'), fmtNum(r.totals.maxStaticPa, 0), `Pa / ${pcls}`, statusOf(r.totals.maxStaticPa / pcls, 0.85, 1.0)),
        kpi(tr('الهواء المُوصَل', 'Delivered air'), fmtNum(r.totals.deliveredLps, 0), `L/s (${fmtNum((r.totals.deliveredLps / sized.designTotalLps) * 100, 0)}%)`, statusOf(r.totals.deliveredLps / sized.designTotalLps, 0.9, 0.8, false)), kpi(tr('التسرب', 'Leakage'), fmtNum(r.totals.leakPct, 1), `% · ${fmtNum(r.totals.leakLps, 0)} L/s`, statusOf(r.totals.leakPct, 5, 10)),
        kpi(tr('فرق ضغط الفلتر', 'Filter ΔP'), fmtNum(r.filterDpPa, 0), 'Pa', statusOf(r.filterDpPa, 180, 250)), kpi(tr('اكتساب حراري في الدكت', 'Duct heat gain'), fmtNum(r.totals.heatGainKw, 2), `kW (${fmtNum(E.UNITS.kwToTR(r.totals.heatGainKw), 2)} TR)`, statusOf(r.totals.heatGainKw, 3, 6)));
      alarms.replaceChildren(...(r.alarms.length ? r.alarms.map((a) => h('div', { class: `alarm ${a.level}` }, L(a))) : [h('div', { class: 'alarm', style: { borderColor: 'var(--ok)' } }, tr('لا تنبيهات — النظام ضمن الحدود', 'No alarms — system within limits'))]));
      terminals.replaceChildren(table([tr('المخرج', 'Outlet'), tr('الفرع', 'Branch'), tr('التدفق', 'Flow'), tr('التصميم', 'Design'), '%', tr('حرارة', 'Temp')], r.terminals.map((tm) => [tm.id, tm.branch, fmtNum(tm.qLps, 0), String(tm.designQLps), h('span', { class: statusOf(tm.ratio, 0.9, 0.8, false) }, fmtNum(tm.ratio * 100, 0)), fmtNum(tm.tempC, 1)]), { wrap: false, numeric: [2, 3, 4, 5] }));
      segTable.replaceChildren(table([tr('المقطع', 'Segment'), tr('المقاس', 'Size'), 'L/s', 'm/s', 'Pa/m', tr('Δp', 'Δp'), tr('تسرب', 'Leak'), '°C'], Object.values(r.segments).map((s) => [h('a', { href: '#', onClick: (ev) => { ev.preventDefault(); st.selected = s.id; scene.highlight(s.id); renderHotspot(); } }, s.id), s.dMm ? `Ø${s.dMm}` : `${s.aMm}×${s.bMm}`, fmtNum(s.qLps, 0), h('span', { class: statusOf(s.v, 8, 10) }, fmtNum(s.v, 1)), fmtNum(s.frictionPerM, 2), fmtNum(s.dpPa, 0), fmtNum(s.leakLps, 1), h('span', { class: s.condensation ? 'crit' : '' }, fmtNum(s.tOutC, 1))]), { wrap: false, numeric: [2, 3, 4, 5, 6, 7] }));
      if (st.history.length > 1) { sparkline(spark, st.history.map((x) => x.staticPa), { color: '#6d5ce7', min: 0 }); sparkline(spark2, st.history.map((x) => x.fanKw), { color: '#22c55e', min: 0 }); }
      if (st.selected) renderHotspot();
    }
    function renderHotspot() {
      const id = st.selected; if (!id || !last) { hotspot.classList.add('hidden'); return; }
      hotspot.classList.remove('hidden');
      const close = h('button', { class: 'btn ghost sm', style: { color: '#fff' }, onClick: () => { st.selected = null; scene.highlight(null); renderHotspot(); } }, icon('x', 12));
      if (id === 'AHU') { hotspot.replaceChildren(h('div', { class: 'row between' }, h('h4', null, labels.AHU), close), h('div', null, `${tr('حساس ضغط الفلتر', 'Filter ΔP sensor')}: ${fmtNum(last.filterDpPa, 0)} Pa (${tr('نظيف', 'clean')} ${topo.filter.cleanDpPa})`), h('div', null, `${tr('ملف التبريد', 'Cooling coil')}: ${topo.coil.dpPa} Pa · ${tr('هواء الإمداد', 'supply')} ${topo.supplyTempC} °C`), h('div', null, `${tr('المروحة', 'Fan')}: ${fmtNum(last.fan.qLps, 0)} L/s · ${fmtNum(last.fan.dpPa, 0)} Pa · ${fmtNum(last.fan.powerKw, 2)} kW · VFD ${last.fan.speedPct}%`), h('div', { class: 'tiny muted' }, `${tr('منحنى المروحة', 'Fan curve')}: Δp₀ ${fmtNum(topo.fan.dpShutoffPa, 0)} Pa, Q₀ ${fmtNum(topo.fan.qFreeDeliveryLps, 0)} L/s, η ${Math.round(topo.fan.efficiency * 100)}%`)); return; }
      const s = last.segments[id]; if (!s) { hotspot.classList.add('hidden'); return; }
      hotspot.replaceChildren(h('div', { class: 'row between' }, h('h4', null, `${L(s)} (${s.id})`), close),
        h('div', null, `${tr('المقاس', 'Size')}: ${s.dMm ? `Ø${s.dMm} mm` : `${s.aMm}×${s.bMm} mm`} · L ${s.lengthM} m · ${s.location === 'roof' ? tr('على السطح', 'on roof') : tr('فراغ السقف', 'ceiling void')}`),
        h('div', null, `${tr('التدفق', 'Flow')}: ${fmtNum(s.qLps, 0)} / ${s.designQLps} L/s · V ${fmtNum(s.v, 2)} m/s · Pv ${fmtNum(s.pv, 1)} Pa`),
        h('div', null, `${tr('الضغط الاستاتيكي', 'Static')}: ${fmtNum(s.pInPa, 0)} → ${fmtNum(s.pOutPa, 0)} Pa · ${fmtNum(s.frictionPerM, 2)} Pa/m`),
        h('div', null, `${tr('التسرب', 'Leakage')}: ${fmtNum(s.leakLps, 1)} L/s (${tr('سطح', 'surface')} ${fmtNum(s.surfaceM2, 1)} m²) · U ${fmtNum(s.U, 2)} W/m²K`),
        h('div', null, `${tr('حرارة الهواء', 'Air temp')}: ${fmtNum(s.tInC, 1)} → ${fmtNum(s.tOutC, 1)} °C · ${tr('سطح خارجي', 'outer surface')} ${fmtNum(s.surfaceTempC, 1)} °C ${s.condensation ? '⚠ ' + tr('تكاثف', 'condensation') : ''}`),
        s.damperDeg !== undefined && last.segments[id].designQLps && ['B1', 'B2', 'B3'].includes(id) ? h('div', null, `${tr('الدامبر', 'Damper')}: ${s.damperDeg}° (C = ${fmtNum(E.damperCoefficient(s.damperDeg), 2)})${s.vav ? ' · VAV' : ''}`) : null);
    }
    function injectFault() {
      const faults = [() => { controls.filterLoading = 0.9; toast(tr('عطل: فلتر مسدود', 'Fault: clogged filter'), 'warn'); }, () => { controls.dampers.B3 = 70; toast(tr('عطل: دامبر الفرع C عالق شبه مغلق', 'Fault: branch C damper stuck nearly closed'), 'warn'); }, () => { controls.sealClass = 'unsealed'; sealSel.value = 'unsealed'; toast(tr('عطل: وصلات غير محكمة (تسرب)', 'Fault: unsealed joints (leakage)'), 'warn'); }, () => { controls.insulation = { id: 'none', k: null, mm: 0 }; insSel.value = 'none'; insMm.value = 0; toast(tr('عطل: عزل متضرر', 'Fault: damaged insulation'), 'warn'); }, () => { controls.fanSpeedPct = 55; toast(tr('عطل: سير مروحة مرتخٍ (سرعة منخفضة)', 'Fault: slipping fan belt (low speed)'), 'warn'); }];
      faults[Math.floor(Math.random() * faults.length)](); syncSliders(); recompute();
    }
    async function saveSession(manual) {
      if (!last) return; const e = env();
      await ctx.api.results.saveSession(ctx.state.profile.id, { type: 'building', durationSec: Math.round((Date.now() - st.startedReal) / 1000), simulatedMinutes: st.simMinutes, city: e.city.city_en, hour: st.hour, controls: JSON.parse(JSON.stringify(controls)), kpis: { fanLps: +last.fan.qLps.toFixed(0), fanPa: +last.fan.dpPa.toFixed(0), fanKw: +last.fan.powerKw.toFixed(3), staticPa: +last.totals.maxStaticPa.toFixed(0), deliveredPct: +((last.totals.deliveredLps / sized.designTotalLps) * 100).toFixed(1), leakPct: +last.totals.leakPct.toFixed(2), heatGainKw: +last.totals.heatGainKw.toFixed(2), alarms: last.alarms.length } });
      st.savedOnce = true; await ctx.refreshResults(); if (manual) toast(t('saved'), 'ok');
    }
    view = { autosave: () => { if (last && (Date.now() - st.startedReal) > 60000 && !st.savedOnce) saveSession(false); } };
    async function exportCsv() {
      const r = await ctx.api.exporter.csv({ filename: `network-twin-${new Date().toISOString().slice(0, 10)}.csv`, headers: [tr('الدقيقة', 'Minute'), tr('المحيط °C', 'Ambient °C'), tr('ضغط استاتيكي', 'Static Pa'), tr('فلتر Pa', 'Filter Pa'), tr('مروحة kW', 'Fan kW'), tr('مُوصَل L/s', 'Delivered L/s'), tr('تسرب %', 'Leak %'), tr('اكتساب kW', 'Heat kW')], rows: st.history.map((x) => [x.minute, x.ambient.toFixed(1), x.staticPa.toFixed(0), x.filterDp.toFixed(0), x.fanKw.toFixed(3), x.delivered.toFixed(0), x.leakPct.toFixed(2), x.heatKw.toFixed(2)]) }); if (r.ok) toast(`${t('exported')}: ${r.file}`, 'ok');
    }
    async function exportPdf() {
      if (!last) return; const e = env(); const r0 = last;
      const body = `<p>${tr('المتدرب', 'Trainee')}: <b>${esc(ctx.state.profile.name)}</b> · ${esc(e.city.city_en)} ${String(st.hour).padStart(2, '0')}:00 · ${tr('محيط', 'ambient')} ${e.tempC.toFixed(1)} °C · RH ${e.rhPct}%</p>
      <div class="kpis"><div class="kpi">${tr('تدفق المروحة', 'Fan flow')}<b>${r0.fan.qLps.toFixed(0)} L/s</b></div><div class="kpi">${tr('ضغط المروحة', 'Fan pressure')}<b>${r0.fan.dpPa.toFixed(0)} Pa</b></div><div class="kpi">${tr('قدرة المروحة', 'Fan power')}<b>${r0.fan.powerKw.toFixed(2)} kW</b></div><div class="kpi">${tr('ضغط استاتيكي', 'Static')}<b>${r0.totals.maxStaticPa.toFixed(0)} Pa</b></div><div class="kpi">${tr('الهواء الموصَل', 'Delivered')}<b>${r0.totals.deliveredLps.toFixed(0)} L/s</b></div><div class="kpi">${tr('التسرب', 'Leakage')}<b>${r0.totals.leakPct.toFixed(1)}%</b></div><div class="kpi">${tr('اكتساب حراري', 'Heat gain')}<b>${r0.totals.heatGainKw.toFixed(2)} kW</b></div></div>
      <h2>${tr('المقاطع', 'Segments')}</h2><table><tr><th>ID</th><th>${tr('المقطع', 'Segment')}</th><th>${tr('المقاس', 'Size')}</th><th>L/s</th><th>m/s</th><th>Pa/m</th><th>Δp</th><th>${tr('تسرب L/s', 'Leak L/s')}</th><th>°C out</th></tr>${Object.values(r0.segments).map((s) => `<tr><td>${s.id}</td><td>${esc(L(s))}</td><td>${s.dMm ? 'Ø' + s.dMm : s.aMm + '×' + s.bMm}</td><td>${s.qLps.toFixed(0)}</td><td>${s.v.toFixed(2)}</td><td>${s.frictionPerM.toFixed(2)}</td><td>${s.dpPa.toFixed(0)}</td><td>${s.leakLps.toFixed(1)}</td><td>${s.tOutC.toFixed(1)}</td></tr>`).join('')}</table>
      <h2>${tr('المخارج', 'Outlets')}</h2><table><tr><th>${tr('المخرج', 'Outlet')}</th><th>${tr('الفرع', 'Branch')}</th><th>L/s</th><th>${tr('التصميم', 'Design')}</th><th>%</th></tr>${r0.terminals.map((tm) => `<tr><td>${tm.id}</td><td>${tm.branch}</td><td>${tm.qLps.toFixed(0)}</td><td>${tm.designQLps}</td><td>${(tm.ratio * 100).toFixed(0)}</td></tr>`).join('')}</table>
      <h2>${tr('الإعدادات والتنبيهات', 'Settings & alarms')}</h2><p>VFD ${controls.fanSpeedPct}% · ${tr('فلتر', 'filter')} ${Math.round(controls.filterLoading * 100)}% · ${tr('دامبرات', 'dampers')} B1 ${controls.dampers.B1}° B2 ${controls.dampers.B2}° B3 ${controls.dampers.B3}° · ${tr('إحكام', 'seal')} ${controls.sealClass} · ${tr('عزل', 'insulation')} ${controls.insulation.id} ${controls.insulation.mm} mm</p><ul>${r0.alarms.map((a) => `<li>${esc(L(a))}</li>`).join('') || '<li>—</li>'}</ul>`;
      const r = await ctx.api.exporter.pdf({ filename: `network-twin-report-${new Date().toISOString().slice(0, 10)}.pdf`, html: reportHtml(tr('تقرير التوأم الرقمي لشبكة الدكت', 'Duct Network Digital Twin report'), body, ctx) }); if (r.ok) toast(`${t('exported')}: ${r.file}`, 'ok');
    }
    if (timer) clearInterval(timer);
    timer = setInterval(() => { if (!st.live) return; st.simMinutes += st.speed; st.hour = (st.hour + st.speed / 60) % 24; hourSlider.querySelector('input').value = Math.floor(st.hour); hourSlider.querySelector('.val').textContent = `${String(Math.floor(st.hour)).padStart(2, '0')}:00`; controls.filterLoading = Math.min(1, controls.filterLoading + (st.speed / 60) * 0.004); filterSlider.querySelector('input').value = Math.round(controls.filterLoading * 100); filterSlider.querySelector('.val').textContent = `${Math.round(controls.filterLoading * 100)} %`; recompute(); }, 1000);
    recompute();
  },
};
