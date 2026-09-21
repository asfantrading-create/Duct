import { h, icon, toast, kpi, table, field, select, numberInput, slider, sparkline, statusOf, esc } from '../ui.js';
import { t, tr, L, fmtNum, fmtInt, fmtDuration } from '../i18n.js';
import { FactorySim } from '../../shared/factory-sim.js';
import { STATIONS, MACHINES } from '../../shared/data/machines.js';
import { CITIES, cityById, ambientAt } from '../../shared/data/climate.js';
import FACTORIES from '../../shared/data/factories.json';
import { COUNTRY_LABELS } from '../../shared/data/factory-labels.js';
import { createFactoryScene } from '../three/factory-scene.js';
import { reportHtml } from './fabrication.js';

let scene = null, timer = null, sim = null, view = null;
export default {
  destroy() { if (timer) clearInterval(timer); timer = null; if (view && view.autosave) view.autosave(); if (scene) scene.dispose(); scene = null; sim = null; view = null; },
  render(container, ctx, params = {}) {
    const lang = ctx.state.settings.lang; const stationLabels = Object.fromEntries(STATIONS.map((s) => [s.id, L(s)]));
    let factory = FACTORIES.find((f) => f.id === params.factoryId) || null;
    let cityId = ctx.state.settings.city || 'riyadh';
    const state = { running: false, speed: 1, selected: null, startedReal: Date.now(), savedOnce: false };
    sim = new FactorySim({ seed: Date.now() % 100000 });

    const sceneEl = h('div', { class: 'scene' }); const panel = h('div', { class: 'panel' });
    container.appendChild(h('div', { class: 'twin' }, sceneEl, panel));
    scene = createFactoryScene(sceneEl, { lang, labels: stationLabels, onSelect: (id) => { state.selected = id; scene.highlight(id); renderHotspot(); } });
    const hud = h('div', { class: 'scene-hud' }); const hotspot = h('div', { class: 'hotspot-info hidden' });
    sceneEl.append(h('div', { class: 'scene-overlay' }, hud, h('div', { class: 'scene-hud small' }, tr('اسحب للتدوير · عجلة الفأرة للتقريب · انقر محطة لعرض تفاصيلها', 'Drag to orbit · wheel to zoom · click a station for details'))),
      h('div', { class: 'scene-tabs' }, ['overview', 'line', 'assembly', 'dispatch', 'top'].map((v) => h('button', { class: 'btn sm', onClick: () => scene.setView(v) }, { overview: tr('عام', 'Overview'), line: tr('خط القطع', 'Cutting line'), assembly: tr('التجميع', 'Assembly'), dispatch: tr('الشحن', 'Dispatch'), top: tr('من الأعلى', 'Top') }[v]))), hotspot);

    // ---- panel: scenario
    const cityLabel = (c) => `${tr(c.city_ar, c.city_en)} (${c.country_code})`;
    const factorySel = select([{ value: '', label: tr('مصنع نموذجي (بدون ربط بمصنع حقيقي)', 'Generic factory (no real-factory link)') }].concat(FACTORIES.slice().sort((a, b) => a.country_code.localeCompare(b.country_code)).map((f) => ({ value: f.id, label: `${f.name_en} — ${f.city_en || L(COUNTRY_LABELS[f.country_code])}` }))), factory ? factory.id : '', (v) => { factory = FACTORIES.find((f) => f.id === v) || null; const c = factory && CITIES.find((cc) => cc.country_code === factory.country_code && (factory.city_en || '').toLowerCase().includes(cc.city_en.toLowerCase().split(' ')[0])); if (c) { cityId = c.id; citySel.value = c.id; } renderScenario(); });
    const citySel = select(CITIES.map((c) => ({ value: c.id, label: cityLabel(c) })), cityId, (v) => { cityId = v; renderScenario(); });
    const scenarioInfo = h('div', { class: 'small muted' });
    const renderScenario = () => { const c = cityById(cityId); scenarioInfo.replaceChildren(factory ? h('div', null, h('strong', null, factory.name_en), factory.name_ar ? ` · ${factory.name_ar}` : '', h('div', null, `${factory.city_en || ''} ${L(COUNTRY_LABELS[factory.country_code])}${factory.founded ? ` · ${tr('تأسست', 'est.')} ${factory.founded}` : ''}`), factory.capacity_note ? h('div', null, `${tr('الطاقة المنشورة', 'Published capacity')}: ${factory.capacity_note}`) : null, h('div', { class: 'tiny' }, tr('النموذج ثلاثي الأبعاد تمثيل نموذجي لمصنع دكت وليس مخطط هذا المصنع.', 'The 3D model is a representative duct factory, not this plant’s drawing.'))) : null, h('div', null, `${tr('حرارة التصميم الخارجية', 'Outdoor design temperature')} ${cityLabel(c)}: ${c.cooling_db_0_4} °C · ${tr('ارتفاع', 'altitude')} ${c.elevation_m} m`)); };
    renderScenario();

    // ---- controls
    const c = sim.controls;
    const controls = h('div', { class: 'stack' },
      slider({ label: tr('سرعة الآلات %', 'Machine speed %'), min: 50, max: 130, step: 5, value: c.speedPct, onChange: (v) => sim.setControl('speedPct', v) }),
      slider({ label: tr('العمالة %', 'Operators %'), min: 50, max: 130, step: 5, value: c.operatorsPct, onChange: (v) => sim.setControl('operatorsPct', v) }),
      slider({ label: tr('حصة القطع المعزولة', 'Share of insulated pieces'), min: 0, max: 100, step: 5, value: c.insulationShare * 100, unit: '%', onChange: (v) => sim.setControl('insulationShare', v / 100) }),
      slider({ label: tr('نسبة الهدر المستهدفة', 'Target scrap rate'), min: 0, max: 12, step: 0.5, value: c.scrapRatePct, unit: '%', onChange: (v) => sim.setControl('scrapRatePct', v) }),
      slider({ label: tr('الهدف: قطعة/وردية', 'Target pieces/shift'), min: 40, max: 300, step: 10, value: c.targetPiecesPerShift, onChange: (v) => sim.setControl('targetPiecesPerShift', v) }),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: c.breakdowns, onChange: (e) => sim.setControl('breakdowns', e.target.checked) }), tr('أعطال عشوائية للآلات (MTBF ≈ 6 س)', 'Random machine breakdowns (MTBF ≈ 6 h)')),
      h('div', { class: 'row' }, field(tr('سعر الكهرباء USD/kWh', 'Tariff USD/kWh'), numberInput(c.tariffUSDkWh, (v) => sim.setControl('tariffUSDkWh', v), { step: 0.01 })), field(tr('سعر الصاج USD/kg', 'Sheet USD/kg'), numberInput(c.coilCostUSDkg, (v) => sim.setControl('coilCostUSDkg', v), { step: 0.05 }))));
    const pieceForm = h('div', { class: 'row' }, ['aMm', 'bMm', 'lengthM', 'thicknessMm'].map((k) => field({ aMm: 'a (mm)', bMm: 'b (mm)', lengthM: tr('الطول (م)', 'L (m)'), thicknessMm: tr('السماكة (مم)', 't (mm)') }[k], numberInput(sim.piece[k], (v) => { sim.piece[k] = v; sim.weightPerPiece = require_weight(sim); }, { step: k === 'lengthM' ? 0.1 : k === 'thicknessMm' ? 0.05 : 50, style: { width: '80px' } }))));
    function require_weight(s) { const { ductWeightKg, ductSurfaceM2 } = ctx.__eng || (ctx.__eng = { ductWeightKg: (o) => 2 * ((o.aMm + o.bMm) / 1000) * o.lengthM * (o.thicknessMm / 1000) * 7850 * 1.12, ductSurfaceM2: (o) => 2 * ((o.aMm + o.bMm) / 1000) * o.lengthM }); s.areaPerPiece = ductSurfaceM2(s.piece); return ductWeightKg(s.piece); }

    // ---- KPIs
    const kpis = h('div', { class: 'grid cols-2' }); const stTable = h('div'); const events = h('div', { class: 'stack' }); const spark = h('canvas', { class: 'sparkline' }); const spark2 = h('canvas', { class: 'sparkline' });
    const playBtn = h('button', { class: 'btn primary', onClick: () => toggle() }, icon('play', 16), tr('تشغيل', 'Run'));
    const speedSel = select([{ value: 1, label: '×1 (4 min/s)' }, { value: 5, label: '×5' }, { value: 20, label: '×20' }], 1, (v) => { state.speed = parseInt(v, 10); });
    const toggle = () => { state.running = !state.running; playBtn.replaceChildren(icon(state.running ? 'pause' : 'play', 16), state.running ? tr('إيقاف', 'Pause') : tr('تشغيل', 'Run')); };
    const reset = () => { const controls0 = { ...sim.controls }; const piece = { ...sim.piece }; sim = new FactorySim({ seed: Date.now() % 100000, controls: controls0, piece }); state.running = false; playBtn.replaceChildren(icon('play', 16), tr('تشغيل', 'Run')); renderKpis(sim.kpis()); };

    panel.append(
      h('div', { class: 'row between' }, h('h3', { style: { margin: 0 } }, icon('factory', 18), ' ', t('nav_factory')), h('div', { class: 'row' }, playBtn, speedSel, h('button', { class: 'btn sm', title: tr('إعادة', 'Reset'), onClick: reset }, icon('refresh', 14)))),
      h('div', { class: 'card' }, h('h4', null, tr('السيناريو', 'Scenario')), field(tr('المصنع (من الدليل)', 'Factory (from directory)'), factorySel), field(tr('المدينة / المناخ', 'City / climate'), citySel), scenarioInfo),
      h('div', { class: 'card' }, h('h4', null, tr('مؤشرات الأداء الحية', 'Live KPIs')), kpis, h('div', { class: 'tiny muted', style: { marginTop: '6px' } }, tr('الإنتاج التراكمي', 'Cumulative output')), spark, h('div', { class: 'tiny muted' }, 'OEE'), spark2),
      h('div', { class: 'card' }, h('h4', null, tr('التحكم', 'Controls')), controls, h('h4', { style: { marginTop: '10px' } }, tr('القطعة النموذجية', 'Typical piece')), pieceForm),
      h('div', { class: 'card' }, h('h4', null, tr('المحطات', 'Stations')), stTable),
      h('div', { class: 'card' }, h('h4', null, tr('سجل الأحداث', 'Event log')), events),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onClick: () => saveSession(true) }, icon('check', 16), tr('حفظ الجلسة', 'Save session')), h('button', { class: 'btn', onClick: exportCsv }, icon('download', 16), t('exportCsv')), h('button', { class: 'btn', onClick: exportPdf }, icon('print', 16), t('exportPdf'))));

    function renderKpis(k) {
      hud.replaceChildren(h('div', null, h('strong', null, `${tr('الوقت المحاكى', 'Simulated time')}: ${fmtDuration(k.minute * 60)}`), ` · OEE ${fmtNum(k.oee * 100, 0)}% · ${tr('المنتَج', 'Produced')} ${k.produced} · WIP ${k.wip}${k.bottleneck && k.wip > 4 ? ` · ${tr('اختناق', 'bottleneck')}: ${stationLabels[k.bottleneck]}` : ''}`));
      kpis.replaceChildren(
        kpi('OEE', fmtNum(k.oee * 100, 0), '%', statusOf(k.oee, 0.75, 0.6, false)), kpi(`A × P × Q`, `${fmtNum(k.availability * 100, 0)} · ${fmtNum(k.performance * 100, 0)} · ${fmtNum(k.quality * 100, 1)}`, '%'),
        kpi(tr('المنتَج / المهدور', 'Produced / scrapped'), `${k.produced} / ${k.scrapped}`, tr('قطعة', 'pcs')), kpi(tr('قطعة/ساعة', 'Pieces/hour'), fmtNum(k.piecesPerHour, 1), ''),
        kpi(tr('توقّع الوردية', 'Shift projection'), fmtNum(k.shiftProjection, 0), `/ ${k.targetPiecesPerShift}`, statusOf(k.shiftProjection / k.targetPiecesPerShift, 0.9, 0.75, false)), kpi(tr('طن/شهر (وردية واحدة)', 'Tonnes/month (1 shift)'), fmtNum(k.tonsPerMonth, 1), 't'),
        kpi(tr('الطاقة', 'Energy'), fmtNum(k.energyKwh, 0), `kWh · ${fmtNum(k.kwhPerPiece, 2)}/${tr('قطعة', 'pc')}`), kpi(tr('تكلفة الطاقة / الصاج', 'Energy / sheet cost'), `${fmtNum(k.energyCostUSD, 0)} / ${fmtNum(k.coilCostUSD, 0)}`, 'USD'),
        kpi(tr('صاج مستهلك', 'Sheet consumed'), fmtNum(k.coilKg, 0), 'kg'), kpi(tr('م² دكت منتَج', 'm² duct produced'), fmtNum(k.areaM2, 0), 'm²'));
      stTable.replaceChildren(table([tr('المحطة', 'Station'), tr('الحالة', 'Status'), 'WIP', tr('المنتَج', 'Done'), tr('استغلال', 'Util.'), tr('توقف (د)', 'Down (min)')], k.stations.map((s) => [stationLabels[s.id], h('span', { class: `badge ${s.status === 'down' ? 'crit' : s.status === 'running' ? 'ok' : 'warn'}` }, { down: tr('عطل', 'down'), running: tr('يعمل', 'running'), idle: tr('خامل', 'idle') }[s.status]), h('span', { class: s.id === k.bottleneck && k.wip > 4 ? 'crit' : '' }, String(s.queue)), String(s.produced), `${fmtNum(s.utilization * 100, 0)}%`, String(s.downMinutes)]), { wrap: false, numeric: [2, 3, 4, 5] }));
      events.replaceChildren(...(k.events.length ? k.events.slice().reverse().map((e) => h('div', { class: 'alarm warn' }, `${fmtDuration(e.minute * 60)} — ${tr('عطل في', 'Breakdown at')} ${stationLabels[e.station]} (${e.minutes} ${tr('د', 'min')})`)) : [h('div', { class: 'tiny muted' }, tr('لا أحداث بعد', 'No events yet'))]));
      if (sim.history.length > 1) { sparkline(spark, sim.history.map((x) => x.produced), { color: '#22c55e', min: 0 }); sparkline(spark2, sim.history.map((x) => x.oee * 100), { color: '#c93cd6', min: 0, max: 100 }); }
      scene.update(k);
    }
    function renderHotspot() {
      const id = state.selected; if (!id) { hotspot.classList.add('hidden'); return; }
      const st = STATIONS.find((s) => s.id === id); const k = sim.kpis().stations.find((s) => s.id === id);
      hotspot.classList.remove('hidden');
      hotspot.replaceChildren(h('div', { class: 'row between' }, h('h4', null, L(st)), h('button', { class: 'btn ghost sm', style: { color: '#fff' }, onClick: () => { state.selected = null; scene.highlight(null); renderHotspot(); } }, icon('x', 12))),
        h('div', null, `${tr('المعدل الاسمي', 'Nominal rate')}: ${st.ratePiecesPerHour} ${tr('قطعة/س', 'pcs/h')} · ${st.operators} ${tr('عامل', 'operators')} · ${st.kwhPerPiece} kWh/${tr('قطعة', 'pc')}`),
        k ? h('div', null, `${tr('الحالة', 'Status')}: ${k.status} · WIP ${k.queue} · ${tr('المنتَج', 'done')} ${k.produced} · ${tr('استغلال', 'util.')} ${fmtNum(k.utilization * 100, 0)}%`) : null,
        h('ul', { style: { margin: '6px 0 0', paddingInlineStart: '16px' } }, st.machineIds.map((mid) => { const m = MACHINES.find((x) => x.id === mid); return h('li', null, `${L(m)} — ${m.powerKw.typical} kW${m.speed ? ` · ${m.speed.typical} ${m.speed.unit}` : ''}`); })));
    }
    async function saveSession(manual) {
      const k = sim.kpis(); if (k.minute < 5) { if (manual) toast(tr('شغّل المحاكاة أولاً', 'Run the simulation first'), 'warn'); return; }
      const c = cityById(cityId);
      await ctx.api.results.saveSession(ctx.state.profile.id, { type: 'factory', durationSec: Math.round((Date.now() - state.startedReal) / 1000), simulatedMinutes: k.minute, factoryId: factory ? factory.id : null, factoryName: factory ? factory.name_en : null, city: c.city_en, controls: { ...sim.controls }, piece: { ...sim.piece }, kpis: { oee: +k.oee.toFixed(3), availability: +k.availability.toFixed(3), performance: +k.performance.toFixed(3), quality: +k.quality.toFixed(3), produced: k.produced, scrapped: k.scrapped, piecesPerHour: +k.piecesPerHour.toFixed(2), tonsPerMonth: +k.tonsPerMonth.toFixed(1), energyKwh: +k.energyKwh.toFixed(1), kwhPerPiece: +k.kwhPerPiece.toFixed(2), bottleneck: k.bottleneck } });
      state.savedOnce = true; await ctx.refreshResults(); if (manual) toast(t('saved'), 'ok');
    }
    view = { autosave: () => { if (sim && sim.minute >= 60 && !state.savedOnce) saveSession(false); } };
    async function exportCsv() {
      const r = await ctx.api.exporter.csv({ filename: `factory-twin-${new Date().toISOString().slice(0, 10)}.csv`, headers: [tr('الدقيقة', 'Minute'), tr('المنتَج', 'Produced'), 'WIP', 'kWh', 'OEE'], rows: sim.history.map((x) => [x.minute, x.produced, x.wip, x.energyKwh.toFixed(1), (x.oee * 100).toFixed(1)]) }); if (r.ok) toast(`${t('exported')}: ${r.file}`, 'ok');
    }
    async function exportPdf() {
      const k = sim.kpis(); const c = cityById(cityId);
      const body = `<p>${tr('المتدرب', 'Trainee')}: <b>${esc(ctx.state.profile.name)}</b> · ${tr('السيناريو', 'Scenario')}: <b>${esc(factory ? factory.name_en : tr('مصنع نموذجي', 'Generic factory'))}</b> · ${esc(c.city_en)} · ${tr('زمن المحاكاة', 'Simulated time')}: ${fmtDuration(k.minute * 60)}</p>
      <div class="kpis"><div class="kpi">OEE<b>${(k.oee * 100).toFixed(0)}%</b></div><div class="kpi">A / P / Q<b>${(k.availability * 100).toFixed(0)} / ${(k.performance * 100).toFixed(0)} / ${(k.quality * 100).toFixed(1)}</b></div><div class="kpi">${tr('المنتَج', 'Produced')}<b>${k.produced}</b></div><div class="kpi">${tr('المهدور', 'Scrapped')}<b>${k.scrapped}</b></div><div class="kpi">${tr('قطعة/ساعة', 'Pieces/h')}<b>${k.piecesPerHour.toFixed(1)}</b></div><div class="kpi">${tr('طن/شهر', 'Tonnes/month')}<b>${k.tonsPerMonth.toFixed(1)}</b></div><div class="kpi">${tr('الطاقة', 'Energy')}<b>${k.energyKwh.toFixed(0)} kWh</b></div><div class="kpi">${tr('عنق الزجاجة', 'Bottleneck')}<b>${esc(stationLabels[k.bottleneck] || '—')}</b></div></div>
      <h2>${tr('المحطات', 'Stations')}</h2><table><tr><th>${tr('المحطة', 'Station')}</th><th>WIP</th><th>${tr('المنتَج', 'Done')}</th><th>${tr('استغلال', 'Utilisation')}</th><th>${tr('توقف (د)', 'Down (min)')}</th><th>kWh</th></tr>${k.stations.map((s) => `<tr><td>${esc(stationLabels[s.id])}</td><td>${s.queue}</td><td>${s.produced}</td><td>${(s.utilization * 100).toFixed(0)}%</td><td>${s.downMinutes}</td><td>${s.energyKwh.toFixed(1)}</td></tr>`).join('')}</table>
      <h2>${tr('إعدادات المحاكاة', 'Simulation settings')}</h2><table><tr><th>${tr('سرعة الآلات', 'Machine speed')}</th><td>${sim.controls.speedPct}%</td><th>${tr('العمالة', 'Operators')}</th><td>${sim.controls.operatorsPct}%</td><th>${tr('حصة العزل', 'Insulated share')}</th><td>${Math.round(sim.controls.insulationShare * 100)}%</td></tr><tr><th>${tr('الهدف/وردية', 'Target/shift')}</th><td>${sim.controls.targetPiecesPerShift}</td><th>${tr('القطعة', 'Piece')}</th><td>${sim.piece.aMm}×${sim.piece.bMm}×${sim.piece.lengthM} m · ${sim.piece.thicknessMm} mm</td><th>${tr('وزن القطعة', 'Piece weight')}</th><td>${k.weightPerPiece.toFixed(1)} kg</td></tr></table>`;
      const r = await ctx.api.exporter.pdf({ filename: `factory-twin-report-${new Date().toISOString().slice(0, 10)}.pdf`, html: reportHtml(tr('تقرير التوأم الرقمي لمصنع الدكت', 'Duct Factory Digital Twin report'), body, ctx) }); if (r.ok) toast(`${t('exported')}: ${r.file}`, 'ok');
    }
    if (timer) clearInterval(timer);
    timer = setInterval(() => { if (!sim) return; if (state.running) sim.step(state.speed); renderKpis(sim.kpis()); if (state.selected) renderHotspot(); }, 250);
    renderKpis(sim.kpis());
  },
};
