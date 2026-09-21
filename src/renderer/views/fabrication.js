import { h, icon, toast, kpi, table, field, select, numberInput, pageHead, esc } from '../ui.js';
import { t, tr, L, fmtNum, fmtDate } from '../i18n.js';
import * as E from '../../shared/engineering.js';
import { MACHINES, STATIONS } from '../../shared/data/machines.js';
import { MATERIALS, SEALANTS } from '../../shared/data/materials.js';

export default {
  render(container, ctx) {
    container.appendChild(pageHead(t('nav_fab'), tr('اختبار التسرب، اختيار السماكة والتقوية، الحمالات، الآلات، وقوائم فحص الجودة', 'Leakage testing, gauge & reinforcement, hangers, machines and QC checklists')));
    const tabs = [{ id: 'leak', label: tr('اختبار التسرب', 'Leakage test') }, { id: 'gauge', label: tr('السماكة والتقوية', 'Gauge & reinforcement') }, { id: 'hangers', label: tr('الحمالات والوصلات', 'Hangers & joints') }, { id: 'machines', label: tr('الآلات وخط الإنتاج', 'Machines & line') }, { id: 'qc', label: tr('قائمة فحص الجودة', 'QC checklist') }];
    let active = 'leak'; const bar = h('div', { class: 'tabs' }); const panel = h('div');
    const renderTabs = () => bar.replaceChildren(...tabs.map((tb) => h('button', { class: `tab ${tb.id === active ? 'active' : ''}`, onClick: () => { active = tb.id; renderTabs(); renderPanel(); } }, tb.label)));
    const renderPanel = () => { panel.replaceChildren(); ({ leak, gauge, hangers, machines, qc })[active](panel, ctx); };
    container.append(bar, panel); renderTabs(); renderPanel();
  },
};

function leak(panel, ctx) {
  const s = { shape: 'rectangular', seal: 'A', area: 200, p: 500, measured: 80 };
  const out = h('div');
  const form = h('div', { class: 'card' }, h('h3', null, tr('بيانات الاختبار', 'Test data')),
    h('div', { class: 'row' }, field(tr('شكل الدكت', 'Duct shape'), select([{ value: 'rectangular', label: tr('مستطيل', 'Rectangular') }, { value: 'round', label: tr('دائري', 'Round') }], s.shape, (v) => { s.shape = v; calc(); })), field(tr('فئة الإحكام', 'Seal class'), select(Object.keys(E.LEAKAGE_CLASSES).map((k) => ({ value: k, label: L(E.LEAKAGE_CLASSES[k]) })), s.seal, (v) => { s.seal = v; calc(); }))),
    h('div', { class: 'row' }, field(tr('مساحة سطح الدكت المُختبَر (م²)', 'Tested duct surface (m²)'), numberInput(s.area, (v) => { s.area = v; calc(); }, { step: 10 })), field(tr('ضغط الاختبار (باسكال)', 'Test pressure (Pa)'), select(E.PRESSURE_CLASSES.map((p) => ({ value: p.pa, label: `${p.pa} Pa (${p.label})` })), s.p, (v) => { s.p = parseFloat(v); calc(); }))),
    field(tr('التسرب المقاس بجهاز الاختبار (لتر/ث)', 'Leakage measured by the test rig (L/s)'), numberInput(s.measured, (v) => { s.measured = v; calc(); }, { step: 1 })));
  function calc() {
    const cl = E.LEAKAGE_CLASSES[s.seal][s.shape]; const allowed = E.leakageLps(cl, s.area, s.p); const pass = s.measured <= allowed;
    const rows = Object.keys(E.LEAKAGE_CLASSES).map((k) => { const c = E.LEAKAGE_CLASSES[k]; return [L(c), c.round, c.rectangular, fmtNum(E.leakageLps(c[s.shape], s.area, s.p), 1)]; });
    out.replaceChildren(h('div', { class: 'grid cols-3', style: { marginBottom: '14px' } }, kpi(tr('فئة التسرب CL', 'Leakage class CL'), String(cl), ''), kpi(tr('التسرب المسموح', 'Allowable leakage'), fmtNum(allowed, 1), 'L/s'), kpi(tr('النتيجة', 'Result'), pass ? tr('ناجح ✓', 'PASS ✓') : tr('راسب ✗', 'FAIL ✗'), '', pass ? 'ok' : 'crit')),
      h('div', { class: 'card' }, h('h3', null, tr('المسموح لكل فئة عند نفس الشروط', 'Allowable per class at the same conditions')), table([tr('فئة الإحكام', 'Seal class'), tr('CL دائري', 'CL round'), tr('CL مستطيل', 'CL rect.'), tr('المسموح (لتر/ث)', 'Allowable (L/s)')], rows, { wrap: false, numeric: [1, 2, 3] }),
        h('div', { class: 'formula', style: { marginTop: '10px' } }, `F = CL × P^0.65   →   L/s per m² = 0.001407 × ${cl} × ${s.p}^0.65 = ${fmtNum(E.leakageLps(cl, 1, s.p), 4)}`),
        h('p', { class: 'tiny muted' }, tr('إجراء SMACNA/DW143: اعزل الجزء، أغلق النهايات، ارفع الضغط إلى فئة الضغط، اقرأ الفوهة، قارن بالمسموح، وثّق. لا تُجرِ الاختبار بعد العزل وإغلاق الأسقف.', 'SMACNA/DW143 procedure: isolate the section, blank the ends, pressurise to the pressure class, read the nozzle, compare with the allowable, document. Do not test after insulating and closing ceilings.'))));
  }
  panel.append(h('div', { class: 'grid cols-2' }, form, out)); calc();
}

function gauge(panel) {
  const s = { side: 800, pClass: 500, dw: 'low' };
  const out = h('div');
  const form = h('div', { class: 'card' }, h('h3', null, tr('المقطع', 'Section')),
    h('div', { class: 'row' }, field(tr('الضلع الأطول (مم)', 'Longest side (mm)'), numberInput(s.side, (v) => { s.side = v; calc(); }, { step: 50 })), field(tr('فئة DW/144', 'DW/144 class'), select([{ value: 'low', label: tr('منخفض ≤ 500 باسكال', 'Low ≤ 500 Pa') }, { value: 'medium', label: tr('متوسط ≤ 1000', 'Medium ≤ 1000') }, { value: 'high', label: tr('عالٍ ≤ 2500', 'High ≤ 2500') }], s.dw, (v) => { s.dw = v; calc(); }))));
  function calc() {
    const sm = E.smacnaGauge2in(s.side); const gmm = E.GAUGES.find((g) => g.gauge === sm.gauge).mm; const dw = E.dw144Thickness(s.side, s.dw);
    out.replaceChildren(h('div', { class: 'grid cols-3', style: { marginBottom: '14px' } }, kpi('SMACNA 2" w.g.', `${sm.gauge} ga`, `${gmm} mm`), kpi('DW/144', fmtNum(dw, 1), 'mm'), kpi(tr('التقوية (SMACNA)', 'Reinforcement (SMACNA)'), sm.reinforcement, '')),
      h('div', { class: 'grid cols-2' },
        h('div', { class: 'card' }, h('h3', null, tr('جدول SMACNA المبسّط عند 500 باسكال', 'Simplified SMACNA table at 500 Pa')), table([tr('حتى (مم)', 'Up to (mm)'), tr('حتى (بوصة)', 'Up to (in)'), 'Gauge', tr('مم', 'mm'), tr('التقوية', 'Reinforcement')], E.SMACNA_GAUGE_2IN.map((r) => [r.maxSideMm, r.maxSideIn, r.gauge, E.GAUGES.find((g) => g.gauge === r.gauge).mm, r.reinforcement]), { wrap: false })),
        h('div', { class: 'card' }, h('h3', null, tr('جدول DW/144 (نموذجي)', 'DW/144 table (typical)')), table([tr('الضلع الأطول حتى (مم)', 'Longest side up to (mm)'), tr('منخفض', 'Low'), tr('متوسط', 'Medium'), tr('عالٍ', 'High')], E.DW144_THICKNESS.map((r) => [r.maxSide, r.low, r.medium, r.high]), { wrap: false, numeric: [1, 2, 3] }))),
      h('p', { class: 'tiny muted', style: { marginTop: '8px' } }, tr('قيم تعليمية مبسّطة؛ للمشاريع استخدم جداول SMACNA/DW144 الرسمية التي تربط السماكة بمسافة التقوية ونوعها. الخصور (Beading) مطلوبة للألواح ≥ 480 مم بحسب SMACNA.', 'Simplified educational values; for projects use the official SMACNA/DW144 tables linking gauge to reinforcement type and spacing. Beading is required for panels ≥ 480 mm per SMACNA.')));
  }
  panel.append(h('div', { class: 'grid cols-2' }, form, out)); calc();
}

function hangers(panel) {
  panel.append(h('div', { class: 'grid cols-2' },
    h('div', { class: 'card' }, h('h3', null, tr('تباعد الحمالات النموذجي', 'Typical hanger spacing')), table([tr('نوع الدكت', 'Duct type'), tr('الحمالة', 'Hanger'), tr('أقصى تباعد', 'Max spacing')], [
      [tr('مستطيل حتى 750 مم', 'Rectangular ≤ 750 mm'), tr('شريط مجلفن 25×1 مم أو قضيب 8 مم + زاوية', 'Galvanized strap 25×1 mm or 8 mm rod + angle'), '2.4–3.0 m'],
      [tr('مستطيل 750–1500 مم', 'Rectangular 750–1500 mm'), tr('قضيبان 10 مم + زاوية 40×40×4', 'Two 10 mm rods + 40×40×4 angle'), '2.4 m'],
      [tr('مستطيل > 1500 مم', 'Rectangular > 1500 mm'), tr('قضبان 12 مم + قناة', '12 mm rods + channel'), '1.5–2.4 m'],
      [tr('دائري حتى 500 مم', 'Round ≤ 500 mm'), tr('شريط أو طوق', 'Strap or band'), '3.0 m'],
      [tr('دائري > 500 مم', 'Round > 500 mm'), tr('طوق نصفي + قضيبان', 'Half band + two rods'), '2.4–3.0 m'],
      [tr('دكت مرن', 'Flexible duct'), tr('شريط عريض ≥ 25 مم (لا يُهرَس)', 'Wide strap ≥ 25 mm (no crushing)'), '1.5 m']], { wrap: false })),
    h('div', { class: 'card' }, h('h3', null, tr('الوصلات والإحكام', 'Joints & sealing')), table([tr('الوصلة', 'Joint'), tr('النوع', 'Type'), tr('الاستخدام', 'Use')], [
      ['Pittsburgh lock', tr('طولية', 'Longitudinal'), tr('الأكثر شيوعاً لكل الفئات', 'Most common, all classes')], ['Snap lock', tr('طولية', 'Longitudinal'), tr('سماكات رفيعة وضغط منخفض', 'Thin gauges, low pressure')],
      ['TDF / TDC', tr('عرضية', 'Transverse'), tr('ضغط متوسط وعالٍ، إحكام ممتاز', 'Medium/high pressure, excellent sealing')], ['Slip & Drive (S & C cleats)', tr('عرضية', 'Transverse'), tr('ضغط منخفض ومقاسات صغيرة', 'Low pressure, small sizes')],
      [tr('فلنجة زاوية مبرشمة', 'Riveted angle flange'), tr('عرضية', 'Transverse'), tr('مقاسات كبيرة وضغط عالٍ', 'Large sizes, high pressure')], [tr('وصلة حلزونية', 'Spiral lockseam'), tr('طولية (دائري)', 'Longitudinal (round)'), tr('دكت دائري بأقل تسرب', 'Round duct, lowest leakage')]], { wrap: false }),
      h('h4', { style: { marginTop: '12px' } }, tr('مواد الإحكام', 'Sealing materials')), h('ul', { class: 'small' }, SEALANTS.map((x) => h('li', null, h('strong', null, L(x)), ': ', L(x.notes))))),
    h('div', { class: 'card' }, h('h3', null, tr('مواد الدكت', 'Duct materials')), table([tr('المادة', 'Material'), tr('الكثافة (كغ/م³)', 'Density (kg/m³)'), tr('ملاحظات', 'Notes')], MATERIALS.map((m) => [L(m), m.density ? String(m.density) : '—', L(m.notes)]), { wrap: false }))));
}

function machines(panel, ctx) {
  panel.append(h('div', { class: 'card', style: { marginBottom: '14px' } }, h('h3', null, tr('محطات خط الإنتاج (بالترتيب)', 'Production line stations (in order)')),
    h('div', { class: 'row' }, STATIONS.map((s, i) => h('div', { class: 'kpi', style: { flex: 1, minWidth: '150px' } }, h('div', { class: 'label' }, `${i + 1}. ${L(s)}`), h('div', { class: 'small' }, `${s.ratePiecesPerHour} ${tr('قطعة/س', 'pcs/h')} · ${s.operators} ${tr('عامل', 'op.')} · ${s.kwhPerPiece} kWh/${tr('قطعة', 'pc')}`)))),
    h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn primary', onClick: () => ctx.navigate('factory') }, icon('factory', 16), tr('افتح توأم المصنع ثلاثي الأبعاد', 'Open the 3D Factory Twin')))));
  panel.append(h('div', { class: 'card' }, h('h3', null, tr('كتالوج الآلات (مواصفات نموذجية)', 'Machine catalogue (typical specifications)')), table([tr('الآلة', 'Machine'), tr('السعة', 'Capacity'), tr('السرعة النموذجية', 'Typical speed'), tr('القدرة (كW)', 'Power (kW)'), tr('ملاحظات', 'Notes')],
    MACHINES.map((m) => [L(m), L(m.capacity), m.speed ? `${m.speed.typical} ${m.speed.unit} (${m.speed.min}–${m.speed.max})` : '—', `${m.powerKw.typical} (${m.powerKw.min}–${m.powerKw.max})`, L(m.notes)]), { wrap: false })));
}

const QC_ITEMS = [
  { g: { ar: 'قبل التصنيع', en: 'Before fabrication' }, items: [{ ar: 'مراجعة الرسومات التنفيذية والأرقام التسلسلية للقطع', en: 'Shop drawings reviewed; piece numbers assigned' }, { ar: 'شهادة مصنع للصاج (السماكة، طلاء Z275)', en: 'Mill certificate for sheet (thickness, Z275 coating)' }, { ar: 'معايرة ماكينات القطع والتشكيل', en: 'Cutting/forming machines calibrated' }] },
  { g: { ar: 'أثناء التصنيع', en: 'During fabrication' }, items: [{ ar: 'الأبعاد ضمن ±3 مم والزوايا قائمة', en: 'Dimensions within ±3 mm; corners square' }, { ar: 'السماكة والتقوية وفق فئة الضغط (SMACNA/DW144)', en: 'Gauge and reinforcement per pressure class (SMACNA/DW144)' }, { ar: 'الوصلات الطولية مغلقة بالكامل ومحكمة', en: 'Longitudinal seams fully closed and sealed' }, { ar: 'فلنجات TDF مستقيمة مع زوايا وحشوات', en: 'TDF flanges straight with corners and gaskets' }, { ar: 'خصور/تقوية للألواح ≥ 480 مم', en: 'Beading/cross-breaking for panels ≥ 480 mm' }, { ar: 'إزالة الحواف الحادة والبرادة', en: 'Sharp edges and swarf removed' }] },
  { g: { ar: 'قبل الشحن', en: 'Before dispatch' }, items: [{ ar: 'ملصق التعريف (رقم القطعة، المشروع، المنطقة)', en: 'Identification label (piece no., project, zone)' }, { ar: 'اختبار تسرب لعينات وفق الفئة', en: 'Leakage test on samples per class' }, { ar: 'حماية النهايات والتغليف', en: 'End protection and packing' }, { ar: 'قائمة التعبئة مطابقة للشحنة', en: 'Packing list matches shipment' }] },
  { g: { ar: 'في الموقع', en: 'On site' }, items: [{ ar: 'الحمالات بالتباعد الصحيح وغير معلّقة على أنظمة أخرى', en: 'Hangers at correct spacing, not on other systems' }, { ar: 'دامبرات الحريق بغلاف وزوايا تثبيت وباب فحص', en: 'Fire dampers with sleeve, retaining angles and access door' }, { ar: 'إحكام كل الوصلات قبل العزل', en: 'All joints sealed before insulation' }, { ar: 'اختبار التسرب موثّق قبل إغلاق الأسقف', en: 'Leakage test documented before ceiling closure' }, { ar: 'العزل وحاجز البخار متصلان بلا انقطاع', en: 'Insulation and vapour barrier continuous' }, { ar: 'الدكت المرن ≤ 2 م مشدود ومحكم', en: 'Flexible duct ≤ 2 m, stretched and sealed' }, { ar: 'تقرير الموازنة TAB ضمن ±10%', en: 'TAB report within ±10%' }] },
];
function qc(panel, ctx) {
  const state = {}; const meta = { project: '', inspector: ctx.state.profile.name, date: new Date().toISOString().slice(0, 10) };
  const list = h('div', { class: 'stack' });
  for (const g of QC_ITEMS) list.appendChild(h('div', { class: 'card' }, h('h3', null, L(g.g)), g.items.map((it) => { const key = L(it); return h('label', { class: 'check', style: { padding: '4px 0' } }, h('input', { type: 'checkbox', onChange: (e) => { state[key] = e.target.checked; } }), h('span', null, L(it))); })));
  const form = h('div', { class: 'card' }, h('div', { class: 'row' }, field(tr('المشروع / القطعة', 'Project / piece'), h('input', { type: 'text', onInput: (e) => { meta.project = e.target.value; } })), field(tr('المفتش', 'Inspector'), h('input', { type: 'text', value: meta.inspector, onInput: (e) => { meta.inspector = e.target.value; } })), field(tr('التاريخ', 'Date'), h('input', { type: 'date', value: meta.date, onInput: (e) => { meta.date = e.target.value; } }))));
  const exportPdf = async () => {
    const rows = QC_ITEMS.map((g) => `<tr><th colspan="2">${esc(L(g.g))}</th></tr>` + g.items.map((it) => `<tr><td>${state[L(it)] ? '☑' : '☐'}</td><td>${esc(L(it))}</td></tr>`).join('')).join('');
    const html = reportHtml(tr('قائمة فحص جودة الدكت', 'Duct QC checklist'), `<p><b>${tr('المشروع', 'Project')}:</b> ${esc(meta.project)} &nbsp; <b>${tr('المفتش', 'Inspector')}:</b> ${esc(meta.inspector)} &nbsp; <b>${tr('التاريخ', 'Date')}:</b> ${meta.date}</p><table>${rows}</table>`, ctx);
    const r = await ctx.api.exporter.pdf({ filename: `QC-checklist-${meta.date}.pdf`, html }); if (r.ok) toast(`${t('exported')}: ${r.file}`, 'ok');
  };
  panel.append(form, list, h('div', { class: 'row end', style: { marginTop: '12px' } }, h('button', { class: 'btn primary', onClick: exportPdf }, icon('print', 16), t('exportPdf'))));
}

/** Shared A4 report wrapper with ASFAN branding. */
export function reportHtml(title, bodyHtml, ctx, { landscape = false } = {}) {
  const rtl = (ctx.state.settings.lang || 'ar') === 'ar'; const company = (ctx.state.info && ctx.state.info.company) || {};
  const logo = document.querySelector('img[src$="logo.png"]'); let logoData = 'assets/logo.png';
  try { const c = document.createElement('canvas'); c.width = logo.naturalWidth; c.height = logo.naturalHeight; c.getContext('2d').drawImage(logo, 0, 0); logoData = c.toDataURL('image/png'); } catch (_) {}
  return `<!doctype html><html lang="${rtl ? 'ar' : 'en'}" dir="${rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
  body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;font-size:12px;color:#111;margin:24px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #6d5ce7;padding-bottom:10px;margin-bottom:14px}header img{height:40px}h1{font-size:18px;margin:0}h2{font-size:14px;margin:14px 0 6px;color:#6d5ce7}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #cbd5e1;padding:5px 7px;text-align:start;font-size:11px}th{background:#f1f5f9}footer{margin-top:18px;border-top:1px solid #cbd5e1;padding-top:8px;font-size:10px;color:#555;display:flex;justify-content:space-between}.kpis{display:flex;gap:10px;flex-wrap:wrap}.kpi{border:1px solid #cbd5e1;border-radius:6px;padding:6px 10px;min-width:120px}.kpi b{display:block;font-size:15px}.muted{color:#666}@page{size:A4 ${landscape ? 'landscape' : 'portrait'};margin:14mm}
  </style></head><body><header><div><h1>${esc(title)}</h1><div class="muted">ASFAN Duct Digital Twin · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}</div></div><img src="${logoData}" alt="ASFAN"></header>${bodyHtml}<footer><span>${esc(company.nameAr || 'شركة أصفان')} — ${esc(company.name || 'ASFAN Trading Co.')}</span><span>${esc(company.email || 'info@asfanco.com')} · WhatsApp ${esc(company.whatsapp || '+962776140404')}</span></footer></body></html>`;
}
