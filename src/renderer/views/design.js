import { h, icon, toast, kpi, table, field, select, numberInput, pageHead } from '../ui.js';
import { t, tr, L, fmtNum } from '../i18n.js';
import * as E from '../../shared/engineering.js';
import { MATERIALS } from '../../shared/data/materials.js';
import { CITIES, cityById } from '../../shared/data/climate.js';

export default {
  render(container, ctx) {
    const st = ctx.state; const ip = st.settings.units === 'ip';
    container.appendChild(pageHead(t('nav_design'), tr('حاسبات هندسية تفاعلية وفق ASHRAE/SMACNA — كل النتائج بالوحدات الدولية مع الوحدات الإنجليزية اختيارياً', 'Interactive engineering calculators per ASHRAE/SMACNA — SI results with optional IP units')));
    const tabs = [
      { id: 'segment', label: tr('تحليل مقطع دكت', 'Duct segment analysis') },
      { id: 'sizing', label: tr('تحجيم (سرعة / احتكاك متساوٍ)', 'Sizing (velocity / equal friction)') },
      { id: 'weight', label: tr('الوزن والتكلفة', 'Weight & cost') },
      { id: 'heat', label: tr('العزل والتكاثف', 'Insulation & condensation') },
      { id: 'fan', label: tr('المروحة وقوانينها', 'Fan & fan laws') },
      { id: 'units', label: tr('تحويل الوحدات', 'Unit converter') },
    ];
    let active = 'segment';
    const tabBar = h('div', { class: 'tabs' }); const panel = h('div');
    const renderTabs = () => tabBar.replaceChildren(...tabs.map((tb) => h('button', { class: `tab ${tb.id === active ? 'active' : ''}`, onClick: () => { active = tb.id; renderTabs(); renderPanel(); } }, tb.label)));
    const renderPanel = () => { panel.replaceChildren(); ({ segment, sizing, weight, heat, fan, units })[active](panel, ctx, ip); };
    container.append(tabBar, panel); renderTabs(); renderPanel();
  },
};

const flowIp = (lps) => ` (${fmtNum(E.UNITS.m3sToCfm(lps / 1000), 0)} CFM)`;
const paIp = (pa) => ` (${fmtNum(E.UNITS.paToInWg(pa), 3)} in. w.g.)`;

function segment(panel, ctx, ip) {
  const s = { shape: 'rect', a: 600, b: 400, d: 400, q: 1000, L: 20, roughness: 'medium_smooth', temp: 20, alt: 0, fittings: {} };
  const out = h('div', { class: 'grid cols-4' }); const detail = h('div', { class: 'card' });
  const fitList = h('div', { class: 'stack' }, E.FITTINGS.map((f) => h('div', { class: 'row between' }, h('span', { class: 'small' }, L(f), ' ', h('span', { class: 'muted tiny' }, `C=${f.C}`)), numberInput(0, (v) => { s.fittings[f.id] = v; calc(); }, { min: 0, max: 20, step: 1, style: { width: '70px' } }))));
  const dimsRect = h('div', { class: 'row' }, field(tr('العرض a (مم)', 'Width a (mm)'), numberInput(s.a, (v) => { s.a = v; calc(); }, { min: 100, step: 50 })), field(tr('الارتفاع b (مم)', 'Height b (mm)'), numberInput(s.b, (v) => { s.b = v; calc(); }, { min: 100, step: 50 })));
  const dimsRound = h('div', { class: 'row hidden' }, field(tr('القطر D (مم)', 'Diameter D (mm)'), numberInput(s.d, (v) => { s.d = v; calc(); }, { min: 80, step: 5 })));
  const form = h('div', { class: 'card' }, h('h3', null, tr('المدخلات', 'Inputs')),
    field(tr('الشكل', 'Shape'), select([{ value: 'rect', label: tr('مستطيل', 'Rectangular') }, { value: 'round', label: tr('دائري', 'Round') }], s.shape, (v) => { s.shape = v; dimsRect.classList.toggle('hidden', v !== 'rect'); dimsRound.classList.toggle('hidden', v !== 'round'); calc(); })),
    dimsRect, dimsRound,
    h('div', { class: 'row' }, field(tr('التدفق (لتر/ث)', 'Flow (L/s)'), numberInput(s.q, (v) => { s.q = v; calc(); }, { min: 10, step: 10 })), field(tr('الطول (م)', 'Length (m)'), numberInput(s.L, (v) => { s.L = v; calc(); }, { min: 0.1, step: 0.5 }))),
    field(tr('خشونة السطح (ASHRAE)', 'Surface roughness (ASHRAE)'), select(Object.keys(E.ROUGHNESS).map((k) => ({ value: k, label: `${L(E.ROUGHNESS[k])} — ${E.ROUGHNESS[k].eps * 1000} mm` })), s.roughness, (v) => { s.roughness = v; calc(); })),
    h('div', { class: 'row' }, field(tr('درجة الهواء (°م)', 'Air temperature (°C)'), numberInput(s.temp, (v) => { s.temp = v; calc(); }, { min: -10, max: 60 })), field(tr('الارتفاع عن سطح البحر (م)', 'Altitude (m)'), numberInput(s.alt, (v) => { s.alt = v; calc(); }, { min: 0, max: 3000, step: 50 }))),
    h('h4', { style: { marginTop: '10px' } }, tr('الفتنغز على هذا المقطع (العدد)', 'Fittings on this segment (count)')), fitList);
  function calc() {
    const fittings = E.FITTINGS.filter((f) => s.fittings[f.id] > 0).map((f) => ({ C: f.C, qty: s.fittings[f.id] }));
    const r = E.analyseSegment({ shape: s.shape, dMm: s.d, aMm: s.a, bMm: s.b, qM3s: s.q / 1000, lengthM: s.L, roughness: s.roughness, fittings, tempC: s.temp, altitudeM: s.alt });
    const vStatus = r.v > 10 ? 'crit' : r.v > 7.5 ? 'warn' : 'ok';
    out.replaceChildren(
      kpi(tr('السرعة', 'Velocity'), fmtNum(r.v, 2), 'm/s' + (ip ? ` (${fmtNum(E.UNITS.msToFpm(r.v), 0)} fpm)` : ''), vStatus),
      kpi(tr('ضغط السرعة Pv', 'Velocity pressure Pv'), fmtNum(r.pv, 1), 'Pa' + (ip ? paIp(r.pv) : '')),
      kpi(tr('فقد الاحتكاك', 'Friction rate'), fmtNum(r.frictionPerM, 2), 'Pa/m', r.frictionPerM > 2 ? 'warn' : 'ok'),
      kpi(tr('الفقد الكلي للمقطع', 'Total segment loss'), fmtNum(r.totalPa, 1), 'Pa' + (ip ? paIp(r.totalPa) : '')));
    const gauge = s.shape === 'rect' ? E.smacnaGauge2in(Math.max(s.a, s.b)) : null;
    detail.replaceChildren(h('h3', null, tr('التفاصيل', 'Details')), table([tr('البند', 'Item'), tr('القيمة', 'Value')], [
      [tr('مساحة المقطع', 'Cross-section area'), `${fmtNum(r.areaM2, 4)} m²`], [tr('القطر المكافئ (Huebscher)', 'Equivalent diameter (Huebscher)'), `${fmtNum(r.deMm, 0)} mm`],
      [tr('كثافة الهواء', 'Air density'), `${fmtNum(r.rho, 3)} kg/m³`], [tr('عدد رينولدز', 'Reynolds number'), fmtNum(r.re, 0)], [tr('معامل الاحتكاك f (Altshul–Tsal)', 'Friction factor f (Altshul–Tsal)'), fmtNum(r.f, 4)],
      [tr('فقد الاحتكاك على الطول', 'Friction loss over length'), `${fmtNum(r.frictionTotal, 1)} Pa`], [tr('فقد الفتنغز', 'Fittings loss'), `${fmtNum(r.fittingsTotal, 1)} Pa`], [tr('مساحة السطح (للعزل/الوزن)', 'Surface area (insulation/weight)'), `${fmtNum(r.surfaceM2, 2)} m²`],
      s.shape === 'rect' ? [tr('نسبة الأبعاد', 'Aspect ratio'), `${fmtNum(Math.max(s.a, s.b) / Math.min(s.a, s.b), 2)} : 1 ${Math.max(s.a, s.b) / Math.min(s.a, s.b) > 4 ? '⚠' : ''}`] : [tr('المقاس القياسي الأعلى', 'Next standard size'), `${E.roundUpToStandard(s.d)} mm`],
      gauge ? [tr('السماكة SMACNA عند 500 باسكال', 'SMACNA gauge at 500 Pa'), `${gauge.gauge} ga (${E.GAUGES.find((g) => g.gauge === gauge.gauge).mm} mm) — ${gauge.reinforcement}`] : [tr('سماكة DW/144 (منخفض)', 'DW/144 thickness (low)'), `${E.dw144Thickness(s.d, 'low')} mm`],
    ], { wrap: false }),
    h('p', { class: 'tiny muted', style: { marginTop: '8px' } }, tr('سرعة > 7.5 م/ث تحذير ضجيج للفروع، > 10 م/ث غير مناسبة للمناطق المشغولة. القيم وفق فصل تصميم الدكت في ASHRAE Fundamentals.', 'Velocity > 7.5 m/s is a branch noise warning, > 10 m/s unsuitable for occupied areas. Values per the ASHRAE Fundamentals duct design chapter.')));
  }
  panel.append(h('div', { class: 'grid cols-2' }, form, h('div', null, out, h('div', { style: { height: '14px' } }), detail)));
  calc();
}

function sizing(panel, ctx, ip) {
  const s = { method: 'friction', q: 1500, rate: 0.9, v: 6, shape: 'rect', fixedH: 0, maxAspect: 3, roughness: 'medium_smooth' };
  const out = h('div');
  const form = h('div', { class: 'card' }, h('h3', null, tr('المدخلات', 'Inputs')),
    field(tr('الطريقة', 'Method'), select([{ value: 'friction', label: tr('احتكاك متساوٍ (Pa/m)', 'Equal friction (Pa/m)') }, { value: 'velocity', label: tr('السرعة (م/ث)', 'Velocity (m/s)') }], s.method, (v) => { s.method = v; calc(); })),
    h('div', { class: 'row' }, field(tr('التدفق (لتر/ث)', 'Flow (L/s)'), numberInput(s.q, (v) => { s.q = v; calc(); }, { min: 10, step: 10 })), field(tr('معدل الاحتكاك (Pa/m)', 'Friction rate (Pa/m)'), numberInput(s.rate, (v) => { s.rate = v; calc(); }, { min: 0.2, max: 5, step: 0.1 })), field(tr('السرعة المستهدفة (م/ث)', 'Target velocity (m/s)'), numberInput(s.v, (v) => { s.v = v; calc(); }, { min: 1, max: 25, step: 0.5 }))),
    h('div', { class: 'row' }, field(tr('الشكل المطلوب', 'Required shape'), select([{ value: 'rect', label: tr('مستطيل', 'Rectangular') }, { value: 'round', label: tr('دائري', 'Round') }], s.shape, (v) => { s.shape = v; calc(); })), field(tr('ارتفاع ثابت (مم، 0 = حر)', 'Fixed height (mm, 0 = free)'), numberInput(s.fixedH, (v) => { s.fixedH = v; calc(); }, { min: 0, step: 50 })), field(tr('أقصى نسبة أبعاد', 'Max aspect ratio'), numberInput(s.maxAspect, (v) => { s.maxAspect = v; calc(); }, { min: 1, max: 8, step: 0.5 }))),
    field(tr('خشونة السطح', 'Roughness'), select(Object.keys(E.ROUGHNESS).map((k) => ({ value: k, label: L(E.ROUGHNESS[k]) })), s.roughness, (v) => { s.roughness = v; calc(); })));
  function calc() {
    const q = s.q / 1000; const opts = { epsM: E.ROUGHNESS[s.roughness].eps };
    const dMm = s.method === 'friction' ? E.diameterForFriction(q, s.rate, opts) : E.diameterForVelocity(q, s.v);
    const dStd = E.roundUpToStandard(dMm);
    const rows = [];
    const roundR = E.analyseSegment({ shape: 'round', dMm: dStd, qM3s: q, lengthM: 1, roughness: s.roughness });
    rows.push([tr('دائري قياسي', 'Standard round'), `Ø ${dStd} mm`, fmtNum(roundR.v, 2), fmtNum(roundR.frictionPerM, 2), fmtNum(roundR.pv, 1), fmtNum(Math.PI * dStd / 1000, 2)]);
    if (s.shape === 'rect') {
      const rect = E.rectangularForEquivalent(dMm, { fixedHeightMm: s.fixedH || null, maxAspect: s.maxAspect });
      const rr = E.analyseSegment({ shape: 'rect', aMm: rect.a, bMm: rect.b, qM3s: q, lengthM: 1, roughness: s.roughness });
      rows.push([tr('مستطيل مكافئ', 'Equivalent rectangular'), `${rect.a} × ${rect.b} mm (De ${fmtNum(rect.de, 0)})`, fmtNum(rr.v, 2), fmtNum(rr.frictionPerM, 2), fmtNum(rr.pv, 1), fmtNum(2 * (rect.a + rect.b) / 1000, 2)]);
      const g = E.smacnaGauge2in(Math.max(rect.a, rect.b));
      rows.push([tr('السماكة (SMACNA 500 باسكال)', 'Gauge (SMACNA 500 Pa)'), `${g.gauge} ga — ${E.GAUGES.find((x) => x.gauge === g.gauge).mm} mm`, '', '', '', g.reinforcement]);
    }
    const guide = E.VELOCITY_GUIDE.map((g) => `${L(g)}: ${g.main[0]}–${g.main[1]} / ${g.branch[0]}–${g.branch[1]} m/s`).join(' · ');
    out.replaceChildren(h('div', { class: 'grid cols-3', style: { marginBottom: '14px' } },
      kpi(tr('القطر النظري', 'Theoretical diameter'), fmtNum(dMm, 0), 'mm'), kpi(tr('المقاس القياسي', 'Standard size'), String(dStd), 'mm'), kpi(tr('التدفق', 'Flow'), fmtNum(s.q, 0), 'L/s' + (ip ? flowIp(s.q) : ''))),
      h('div', { class: 'card' }, h('h3', null, tr('النتائج', 'Results')), table([tr('الخيار', 'Option'), tr('المقاس', 'Size'), tr('السرعة (م/ث)', 'Velocity (m/s)'), tr('الاحتكاك (Pa/m)', 'Friction (Pa/m)'), 'Pv (Pa)', tr('المحيط (م) / ملاحظة', 'Perimeter (m) / note')], rows, { wrap: false, numeric: [2, 3, 4] }),
        h('p', { class: 'tiny muted', style: { marginTop: '8px' } }, tr('السرعات الموصى بها (رئيسي / فروع) — ', 'Recommended velocities (mains / branches) — ') + guide)));
  }
  panel.append(h('div', { class: 'grid cols-2' }, form, out)); calc();
}

function weight(panel, ctx) {
  const s = { shape: 'rectangular', a: 600, b: 400, d: 400, L: 1.2, t: 0.7, qty: 10, material: 'gi', cost: 1.25, labour: 0.8, labourRate: 6, ins: 'glass_wool', insMm: 25, insCost: 4.5 };
  const out = h('div');
  const mat = () => MATERIALS.find((m) => m.id === s.material);
  const form = h('div', { class: 'card' }, h('h3', null, tr('المدخلات', 'Inputs')),
    field(tr('الشكل', 'Shape'), select([{ value: 'rectangular', label: tr('مستطيل', 'Rectangular') }, { value: 'round', label: tr('دائري', 'Round') }], s.shape, (v) => { s.shape = v; calc(); })),
    h('div', { class: 'row' }, field('a (mm)', numberInput(s.a, (v) => { s.a = v; calc(); }, { step: 50 })), field('b (mm)', numberInput(s.b, (v) => { s.b = v; calc(); }, { step: 50 })), field('D (mm)', numberInput(s.d, (v) => { s.d = v; calc(); }, { step: 5 }))),
    h('div', { class: 'row' }, field(tr('طول القطعة (م)', 'Piece length (m)'), numberInput(s.L, (v) => { s.L = v; calc(); }, { step: 0.1 })), field(tr('السماكة (مم)', 'Thickness (mm)'), select(E.GAUGES.map((g) => ({ value: g.mm, label: `${g.mm} mm (${g.gauge} ga)` })), s.t, (v) => { s.t = parseFloat(v); calc(); })), field(tr('عدد القطع', 'Quantity'), numberInput(s.qty, (v) => { s.qty = v; calc(); }, { min: 1, step: 1 }))),
    h('div', { class: 'row' }, field(tr('المادة', 'Material'), select(MATERIALS.filter((m) => m.density && m.density > 1000).map((m) => ({ value: m.id, label: L(m) })), s.material, (v) => { s.material = v; s.cost = mat().costPerKgUSD; costIn.value = s.cost; calc(); })), field(tr('سعر المادة (USD/كغ) — قابل للتعديل', 'Material price (USD/kg) — editable'), (window.__costIn = numberInput(s.cost, (v) => { s.cost = v; calc(); }, { step: 0.05 })))),
    h('div', { class: 'row' }, field(tr('ساعات عمل التصنيع لكل م²', 'Fabrication labour hours per m²'), numberInput(s.labour, (v) => { s.labour = v; calc(); }, { step: 0.1 })), field(tr('أجر الساعة (USD)', 'Hourly rate (USD)'), numberInput(s.labourRate, (v) => { s.labourRate = v; calc(); }, { step: 0.5 }))),
    h('div', { class: 'row' }, field(tr('العزل', 'Insulation'), select(E.INSULATION.map((i) => ({ value: i.id, label: L(i) })), s.ins, (v) => { s.ins = v; calc(); })), field(tr('سماكة العزل (مم)', 'Insulation thickness (mm)'), numberInput(s.insMm, (v) => { s.insMm = v; calc(); }, { step: 5 })), field(tr('سعر العزل (USD/م²)', 'Insulation price (USD/m²)'), numberInput(s.insCost, (v) => { s.insCost = v; calc(); }, { step: 0.5 }))));
  const costIn = window.__costIn; delete window.__costIn;
  function calc() {
    const m = mat(); const perPiece = E.ductWeightKg({ shape: s.shape, aMm: s.a, bMm: s.b, dMm: s.d, lengthM: s.L, thicknessMm: s.t, density: m.density });
    const area = E.ductSurfaceM2({ shape: s.shape, aMm: s.a, bMm: s.b, dMm: s.d, lengthM: s.L });
    const totalKg = perPiece * s.qty, totalArea = area * s.qty;
    const matCost = totalKg * s.cost, labourCost = totalArea * s.labour * s.labourRate, insCost = s.ins === 'none' ? 0 : totalArea * 1.1 * s.insCost;
    out.replaceChildren(h('div', { class: 'grid cols-4', style: { marginBottom: '14px' } },
      kpi(tr('وزن القطعة', 'Piece weight'), fmtNum(perPiece, 2), 'kg'), kpi(tr('الوزن الكلي', 'Total weight'), fmtNum(totalKg, 1), 'kg'), kpi(tr('مساحة السطح الكلية', 'Total surface'), fmtNum(totalArea, 2), 'm²'), kpi(tr('التكلفة التقديرية', 'Estimated cost'), fmtNum(matCost + labourCost + insCost, 0), 'USD')),
      h('div', { class: 'card' }, h('h3', null, tr('تفصيل التكلفة (تقديري — عدّل الأسعار حسب سوقك)', 'Cost breakdown (indicative — edit prices for your market)')), table([tr('البند', 'Item'), tr('الكمية', 'Quantity'), 'USD'], [
        [L(m), `${fmtNum(totalKg, 1)} kg`, fmtNum(matCost, 0)], [tr('عمالة التصنيع', 'Fabrication labour'), `${fmtNum(totalArea * s.labour, 1)} h`, fmtNum(labourCost, 0)], [tr('العزل (+10% تداخل)', 'Insulation (+10% overlap)'), s.ins === 'none' ? '—' : `${fmtNum(totalArea * 1.1, 1)} m²`, fmtNum(insCost, 0)],
        [tr('المجموع', 'Total'), '', fmtNum(matCost + labourCost + insCost, 0)], [tr('التكلفة لكل م² دكت', 'Cost per m² of duct'), '', fmtNum((matCost + labourCost + insCost) / totalArea, 1)]], { wrap: false, numeric: [2] }),
        h('p', { class: 'tiny muted', style: { marginTop: '8px' } }, L(m.notes))));
  }
  panel.append(h('div', { class: 'grid cols-2' }, form, out)); calc();
}

function heat(panel, ctx) {
  const st = ctx.state; const s = { city: st.settings.city || 'riyadh', a: 600, b: 400, L: 20, q: 1000, tIn: 13, ins: 'glass_wool', insMm: 25, location: 'roof', rh: null, tAmb: null };
  const out = h('div');
  const city = () => cityById(s.city);
  const form = h('div', { class: 'card' }, h('h3', null, tr('المدخلات', 'Inputs')),
    field(tr('المدينة (مناخ التصميم)', 'City (design climate)'), select(CITIES.map((c) => ({ value: c.id, label: `${tr(c.city_ar, c.city_en)} — ${c.cooling_db_0_4}°C ${c.source === 'approx' ? tr('(تقريبي)', '(approx.)') : `(${c.source})`}` })), s.city, (v) => { s.city = v; s.tAmb = null; s.rh = null; calc(); })),
    h('div', { class: 'row' }, field(tr('موقع الدكت', 'Duct location'), select([{ value: 'roof', label: tr('على السطح (حرارة التصميم الخارجية)', 'On the roof (outdoor design temperature)') }, { value: 'ceiling', label: tr('فراغ سقف (حرارة الخارج − 10°)', 'Ceiling void (outdoor − 10 °C)') }], s.location, (v) => { s.location = v; calc(); })), field(tr('حرارة المحيط (°م) — تعديل يدوي', 'Ambient (°C) — override'), numberInput('', (v) => { s.tAmb = v; calc(); }, { step: 1 })), field(tr('الرطوبة النسبية %', 'Relative humidity %'), numberInput('', (v) => { s.rh = v; calc(); }, { min: 5, max: 100 }))),
    h('div', { class: 'row' }, field('a (mm)', numberInput(s.a, (v) => { s.a = v; calc(); }, { step: 50 })), field('b (mm)', numberInput(s.b, (v) => { s.b = v; calc(); }, { step: 50 })), field(tr('الطول (م)', 'Length (m)'), numberInput(s.L, (v) => { s.L = v; calc(); }, { step: 1 }))),
    h('div', { class: 'row' }, field(tr('التدفق (لتر/ث)', 'Flow (L/s)'), numberInput(s.q, (v) => { s.q = v; calc(); }, { step: 50 })), field(tr('حرارة هواء الإمداد (°م)', 'Supply air temperature (°C)'), numberInput(s.tIn, (v) => { s.tIn = v; calc(); }, { step: 0.5 }))),
    h('div', { class: 'row' }, field(tr('العزل', 'Insulation'), select(E.INSULATION.map((i) => ({ value: i.id, label: `${L(i)}${i.k ? ` (k=${i.k})` : ''}` })), s.ins, (v) => { s.ins = v; calc(); })), field(tr('السماكة (مم)', 'Thickness (mm)'), numberInput(s.insMm, (v) => { s.insMm = v; calc(); }, { step: 5, min: 0 }))));
  function calc() {
    const c = city(); const tAmb = s.tAmb ?? (s.location === 'roof' ? c.cooling_db_0_4 : c.cooling_db_0_4 - 10); const rh = s.rh ?? (s.location === 'roof' ? c.rh_summer_pct : Math.min(c.rh_summer_pct, 60));
    const ins = E.INSULATION.find((i) => i.id === s.ins); const seg = E.analyseSegment({ shape: 'rect', aMm: s.a, bMm: s.b, qM3s: s.q / 1000, lengthM: s.L });
    const rows = [];
    const cases = [{ label: tr('بدون عزل', 'Bare duct'), k: null, mm: 0 }, { label: `${L(ins)} ${s.insMm} mm`, k: ins.k, mm: s.insMm }, { label: `${L(ins)} ${s.insMm * 2} mm`, k: ins.k, mm: s.insMm * 2 }];
    let main = null;
    for (const cs of cases) {
      const U = E.ductUValue({ v: seg.v, insulationK: cs.k, insulationM: cs.mm / 1000 });
      const g = E.ductHeatGain({ tInC: s.tIn, tAmbC: tAmb, qM3s: s.q / 1000, surfaceM2: seg.surfaceM2, U, rho: seg.rho });
      const cond = E.condensationRisk(g.surfaceOutsideTempC, tAmb, rh);
      rows.push([cs.label, fmtNum(U, 2), fmtNum(g.tOut - s.tIn, 2), fmtNum(g.heatGainW / 1000, 2), fmtNum(E.UNITS.kwToTR(g.heatGainW / 1000), 2), fmtNum(g.surfaceOutsideTempC, 1), cond ? h('span', { class: 'badge crit' }, tr('تكاثف!', 'Condensation!')) : h('span', { class: 'badge ok' }, tr('آمن', 'Safe'))]);
      if (cs === cases[1]) main = { U, g, cond };
    }
    const dew = E.dewPoint(tAmb, rh);
    out.replaceChildren(h('div', { class: 'grid cols-4', style: { marginBottom: '14px' } },
      kpi(tr('حرارة المحيط', 'Ambient'), fmtNum(tAmb, 1), '°C'), kpi(tr('نقطة الندى', 'Dew point'), fmtNum(dew, 1), '°C'), kpi(tr('الاكتساب الحراري (الحالة المختارة)', 'Heat gain (selected case)'), fmtNum(main.g.heatGainW / 1000, 2), 'kW', main.cond ? 'crit' : 'ok'), kpi(tr('ارتفاع حرارة الهواء', 'Air temperature rise'), fmtNum(main.g.tOut - s.tIn, 2), '°C')),
      h('div', { class: 'card' }, h('h3', null, tr('مقارنة العزل', 'Insulation comparison')), table([tr('الحالة', 'Case'), 'U (W/m²K)', tr('ΔT هواء (°م)', 'Air ΔT (°C)'), tr('اكتساب (كW)', 'Gain (kW)'), 'TR', tr('حرارة السطح الخارجي (°م)', 'Outer surface (°C)'), tr('التكاثف', 'Condensation')], rows, { wrap: false, numeric: [1, 2, 3, 4, 5] }),
        h('p', { class: 'tiny muted', style: { marginTop: '8px' } }, `${tr('مساحة السطح', 'Surface area')} ${fmtNum(seg.surfaceM2, 1)} m² · ${tr('سرعة الهواء', 'air velocity')} ${fmtNum(seg.v, 1)} m/s · ${tr('مصدر بيانات المدينة', 'city data source')}: ${c.source === 'approx' ? tr('قيم تقريبية تعليمية', 'approximate educational values') : c.source}${c.wmo ? ` · WMO ${c.wmo}` : ''}. ${tr('يُعدّ السطح معرّضاً للتكاثف إذا كانت حرارته ≤ نقطة الندى.', 'The surface is at risk when its temperature ≤ dew point.')}`)));
  }
  panel.append(h('div', { class: 'grid cols-2' }, form, out)); calc();
}

function fan(panel, ctx, ip) {
  const s = { q: 2, dp: 800, eta: 62, n: 80, hours: 3000, tariff: 0.08 };
  const out = h('div');
  const form = h('div', { class: 'card' }, h('h3', null, tr('نقطة التشغيل عند 100% سرعة', 'Operating point at 100% speed')),
    h('div', { class: 'row' }, field(tr('التدفق (م³/ث)', 'Flow (m³/s)'), numberInput(s.q, (v) => { s.q = v; calc(); }, { step: 0.1 })), field(tr('الضغط الكلي (باسكال)', 'Total pressure (Pa)'), numberInput(s.dp, (v) => { s.dp = v; calc(); }, { step: 10 })), field(tr('الكفاءة الكلية %', 'Overall efficiency %'), numberInput(s.eta, (v) => { s.eta = v; calc(); }, { min: 20, max: 90 }))),
    h('div', { class: 'row' }, field(tr('سرعة جديدة % (VFD)', 'New speed % (VFD)'), numberInput(s.n, (v) => { s.n = v; calc(); }, { min: 20, max: 120 })), field(tr('ساعات التشغيل/سنة', 'Operating hours/year'), numberInput(s.hours, (v) => { s.hours = v; calc(); }, { step: 100 })), field(tr('تعرفة الكهرباء (USD/kWh)', 'Electricity tariff (USD/kWh)'), numberInput(s.tariff, (v) => { s.tariff = v; calc(); }, { step: 0.01 }))));
  function calc() {
    const p1 = E.fanPowerW(s.q, s.dp, s.eta / 100) / 1000; const fl = E.fanLaws(s.q, s.dp, p1, s.n / 100);
    const e1 = p1 * s.hours, e2 = fl.p * s.hours;
    out.replaceChildren(h('div', { class: 'grid cols-3', style: { marginBottom: '14px' } }, kpi(tr('قدرة المروحة', 'Fan power'), fmtNum(p1, 2), 'kW'), kpi(tr('الطاقة السنوية', 'Annual energy'), fmtNum(e1, 0), 'kWh'), kpi(tr('التكلفة السنوية', 'Annual cost'), fmtNum(e1 * s.tariff, 0), 'USD')),
      h('div', { class: 'card' }, h('h3', null, tr('قوانين المراوح عند تغيير السرعة', 'Fan laws at the new speed')), table([tr('الكمية', 'Quantity'), '100%', `${s.n}%`, tr('النسبة', 'Ratio')], [
        [tr('التدفق (م³/ث)', 'Flow (m³/s)'), fmtNum(s.q, 2) + (ip ? flowIp(s.q * 1000) : ''), fmtNum(fl.q, 2), `× ${fmtNum(s.n / 100, 2)}`],
        [tr('الضغط (باسكال)', 'Pressure (Pa)'), fmtNum(s.dp, 0) + (ip ? paIp(s.dp) : ''), fmtNum(fl.dp, 0), `× ${fmtNum(Math.pow(s.n / 100, 2), 2)}`],
        [tr('القدرة (كW)', 'Power (kW)'), fmtNum(p1, 2), fmtNum(fl.p, 2), `× ${fmtNum(Math.pow(s.n / 100, 3), 2)}`],
        [tr('الطاقة السنوية (kWh)', 'Annual energy (kWh)'), fmtNum(e1, 0), fmtNum(e2, 0), `${tr('توفير', 'saving')} ${fmtNum((1 - e2 / e1) * 100, 0)}%`],
        [tr('التكلفة السنوية (USD)', 'Annual cost (USD)'), fmtNum(e1 * s.tariff, 0), fmtNum(e2 * s.tariff, 0), `${tr('توفير', 'saving')} ${fmtNum((e1 - e2) * s.tariff, 0)} USD`]], { wrap: false, numeric: [1, 2] }),
        h('p', { class: 'tiny muted', style: { marginTop: '8px' } }, tr('Q ∝ N، Δp ∝ N²، P ∝ N³ — بافتراض ثبات منحنى النظام. هذا أساس توفير الطاقة في أنظمة VAV بمحركات متغيرة السرعة.', 'Q ∝ N, Δp ∝ N², P ∝ N³ — assuming the system curve is unchanged. This is the basis of energy savings in VAV systems with variable-speed drives.'))));
  }
  panel.append(h('div', { class: 'grid cols-2' }, form, out)); calc();
}

function units(panel) {
  const rows = [
    { label: tr('التدفق', 'Flow'), units: [['L/s', 1], ['m³/h', 3.6], ['CFM', 2.11888], ['m³/s', 0.001]] },
    { label: tr('الضغط', 'Pressure'), units: [['Pa', 1], ['in. w.g.', 1 / 249.089], ['mm w.g.', 1 / 9.80665], ['kPa', 0.001]] },
    { label: tr('السرعة', 'Velocity'), units: [['m/s', 1], ['fpm', 196.85], ['km/h', 3.6]] },
    { label: tr('الطول', 'Length'), units: [['mm', 1], ['in', 1 / 25.4], ['m', 0.001], ['ft', 1 / 304.8]] },
    { label: tr('القدرة الحرارية', 'Thermal power'), units: [['kW', 1], ['TR', 1 / 3.51685], ['Btu/h', 3412.14], ['W', 1000]] },
    { label: tr('الكتلة', 'Mass'), units: [['kg', 1], ['lb', 2.20462], ['t', 0.001]] },
  ];
  panel.append(h('div', { class: 'grid cols-2' }, rows.map((r) => {
    const inputs = r.units.map(([u, f]) => ({ u, f, el: h('input', { type: 'number', step: 'any', class: 'ltr' }) }));
    for (const i of inputs) i.el.addEventListener('input', () => { const base = parseFloat(i.el.value) / i.f; for (const j of inputs) if (j !== i) j.el.value = isFinite(base) ? +(base * j.f).toPrecision(6) : ''; });
    return h('div', { class: 'card' }, h('h3', null, r.label), h('div', { class: 'row' }, inputs.map((i) => field(i.u, i.el))));
  })));
}
