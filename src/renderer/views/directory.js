import { h, icon, toast, pageHead, esc } from '../ui.js';
import { t, tr, L, fmtInt } from '../i18n.js';
import FACTORIES from '../../shared/data/factories.json';
import { PRODUCT_LABELS, STANDARD_LABELS, COUNTRY_LABELS, COUNTRY_ANCHORS } from '../../shared/data/factory-labels.js';

const LON0 = -18, LON1 = 62, LAT0 = 8, LAT1 = 40; const W = 1000, H = 400;
const px = (lon) => ((lon - LON0) / (LON1 - LON0)) * W; const py = (lat) => H - ((lat - LAT0) / (LAT1 - LAT0)) * H;
const lbl = (map, k) => { const v = map[k]; return typeof v === 'string' ? v : v ? L(v) : k; };

export default {
  render(container, ctx, params = {}) {
    const filters = { country: params.country || '', product: '', standard: '', q: '', confidence: '' };
    const counts = FACTORIES.reduce((m, f) => { m[f.country_code] = (m[f.country_code] || 0) + 1; return m; }, {});
    const countries = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    container.appendChild(pageHead(t('nav_dir'), tr(`دليل ${FACTORIES.length} مصنعاً لمجاري الهواء في الوطن العربي — بيانات منشورة علناً تم التحقق منها بتاريخ ${FACTORIES[0].verified_on}`, `${FACTORIES.length} HVAC duct manufacturers in the Arab world — publicly published data verified on ${FACTORIES[0].verified_on}`),
      [h('button', { class: 'btn', onClick: exportCsv }, icon('download', 14), t('exportCsv'))]));

    const list = h('div', { class: 'stack' }); const mapBox = h('div', { class: 'map-wrap' }); const countEl = h('span', { class: 'badge' });
    const filterBar = h('div', { class: 'card', style: { marginBottom: '14px' } }, h('div', { class: 'row' },
      h('input', { type: 'text', placeholder: t('search'), style: { maxWidth: '260px' }, onInput: (e) => { filters.q = e.target.value.toLowerCase(); update(); } }),
      sel([{ value: '', label: `${tr('كل الدول', 'All countries')} (${FACTORIES.length})` }].concat(countries.map((c) => ({ value: c, label: `${lbl(COUNTRY_LABELS, c)} (${counts[c]})` }))), filters.country, (v) => { filters.country = v; update(); }),
      sel([{ value: '', label: tr('كل المنتجات', 'All products') }].concat(Object.keys(PRODUCT_LABELS).map((p) => ({ value: p, label: L(PRODUCT_LABELS[p]) }))), '', (v) => { filters.product = v; update(); }),
      sel([{ value: '', label: tr('كل المعايير', 'All standards') }].concat(Object.keys(STANDARD_LABELS).map((s) => ({ value: s, label: lbl(STANDARD_LABELS, s) }))), '', (v) => { filters.standard = v; update(); }),
      sel([{ value: '', label: tr('كل مستويات التحقق', 'Any confidence') }, { value: 'high', label: tr('تحقق عالٍ', 'High confidence') }, { value: 'medium', label: tr('تحقق متوسط', 'Medium confidence') }], '', (v) => { filters.confidence = v; update(); }),
      countEl));
    container.append(filterBar, mapBox, h('div', { style: { height: '14px' } }), list,
      h('p', { class: 'tiny muted', style: { marginTop: '14px' } }, tr('المصدر: مواقع الشركات وأدلة صناعية منشورة علناً؛ تم التحقق بالبحث الموجّه بتاريخ التحديث المذكور. الإحداثيات تقريبية (مركز المدينة أو المنطقة الصناعية). لا تُمثّل القائمة تصنيفاً أو توصية تجارية. لإضافة مصنعكم أو تصحيح بيانات: info@asfanco.com', 'Source: company websites and publicly published industrial directories, verified by targeted search on the stated date. Coordinates are approximate (city or industrial-area centroid). The list is not a ranking or commercial recommendation. To add or correct a factory: info@asfanco.com')));

    function filtered() {
      return FACTORIES.filter((f) => (!filters.country || f.country_code === filters.country) && (!filters.product || (f.products || []).includes(filters.product)) && (!filters.standard || (f.standards || []).includes(filters.standard)) && (!filters.confidence || f.confidence === filters.confidence)
        && (!filters.q || `${f.name_en} ${f.name_ar || ''} ${f.city_en || ''} ${f.city_ar || ''} ${f.notes || ''}`.toLowerCase().includes(filters.q)));
    }
    function update() {
      const rows = filtered();
      countEl.textContent = `${fmtInt(rows.length)} ${tr('مصنع', 'factories')}`;
      renderMap(rows); renderList(rows);
    }
    function renderMap(rows) {
      const ids = new Set(rows.map((r) => r.id));
      const svg = [`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="font-family:inherit">`];
      svg.push(`<rect width="${W}" height="${H}" fill="var(--panel-2)"/>`);
      for (let lon = -10; lon <= 60; lon += 10) svg.push(`<line x1="${px(lon)}" y1="0" x2="${px(lon)}" y2="${H}" stroke="var(--line)" stroke-width="1"/>`);
      for (let lat = 10; lat <= 40; lat += 10) svg.push(`<line x1="0" y1="${py(lat)}" x2="${W}" y2="${py(lat)}" stroke="var(--line)" stroke-width="1"/>`);
      for (const [cc, [lon, lat]] of Object.entries(COUNTRY_ANCHORS)) svg.push(`<text x="${px(lon)}" y="${py(lat)}" fill="var(--muted)" font-size="12" text-anchor="middle" opacity=".8">${esc(lbl(COUNTRY_LABELS, cc))}${counts[cc] ? ` (${counts[cc]})` : ''}</text>`);
      // jitter overlapping dots deterministically
      const seen = {};
      for (const f of FACTORIES) {
        const key = `${f.lat.toFixed(1)}|${f.lon.toFixed(1)}`; const n = seen[key] = (seen[key] || 0) + 1;
        const ang = n * 2.4, rad = n > 1 ? 6 + 2 * n : 0; const x = px(f.lon) + Math.cos(ang) * rad, y = py(f.lat) + Math.sin(ang) * rad;
        const active = ids.has(f.id);
        svg.push(`<circle class="map-dot" data-id="${f.id}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${active ? 5 : 3}" fill="${f.confidence === 'high' ? '#6d5ce7' : '#c93cd6'}" opacity="${active ? 0.95 : 0.2}" stroke="#fff" stroke-width="${active ? 1 : 0}"><title>${esc(f.name_en)} — ${esc(f.city_en || lbl(COUNTRY_LABELS, f.country_code))}</title></circle>`);
      }
      svg.push('</svg>');
      mapBox.innerHTML = svg.join('');
      mapBox.querySelectorAll('.map-dot').forEach((d) => d.addEventListener('click', () => { const el = list.querySelector(`[data-id="${d.dataset.id}"]`); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.borderColor = 'var(--brand-1)'; setTimeout(() => (el.style.borderColor = ''), 1600); } }));
    }
    function renderList(rows) {
      list.replaceChildren(...rows.map((f) => h('div', { class: 'card', dataset: { id: f.id } },
        h('div', { class: 'row between start' },
          h('div', null, h('h3', { style: { marginBottom: '2px' } }, f.name_en, f.name_ar ? h('span', { class: 'muted', style: { fontWeight: 400, marginInlineStart: '8px' } }, f.name_ar) : null),
            h('div', { class: 'small muted' }, [f.city_en ? tr(f.city_ar || f.city_en, f.city_en) : tr('المدينة غير منشورة', 'City not published'), lbl(COUNTRY_LABELS, f.country_code), f.founded ? `${tr('تأسست', 'est.')} ${f.founded}` : null, f.employees_note].filter(Boolean).join(' · '))),
          h('div', { class: 'row' }, h('span', { class: `badge ${f.confidence === 'high' ? 'ok' : 'warn'}` }, f.confidence === 'high' ? tr('تحقق عالٍ', 'High confidence') : tr('تحقق متوسط', 'Medium confidence')),
            f.website ? h('button', { class: 'btn sm', onClick: () => ctx.api.app.openExternal(f.website) }, icon('globe', 14), tr('الموقع', 'Website')) : null,
            h('button', { class: 'btn sm primary', title: tr('استخدام هذا المصنع كسيناريو في توأم المصنع', 'Use this factory as a scenario in the Factory Twin'), onClick: () => ctx.navigate('factory', { factoryId: f.id }) }, icon('factory', 14), tr('محاكاة', 'Simulate')))),
        f.notes ? h('p', { class: 'small', style: { margin: '8px 0 6px' } }, f.notes) : null,
        f.capacity_note ? h('div', { class: 'small' }, h('strong', null, tr('الطاقة الإنتاجية المنشورة: ', 'Published capacity: ')), f.capacity_note) : null,
        h('div', { class: 'row', style: { marginTop: '8px' } }, (f.products || []).map((p) => h('span', { class: 'badge info' }, L(PRODUCT_LABELS[p] || { ar: p, en: p }))), (f.standards || []).map((s) => h('span', { class: 'badge ok' }, lbl(STANDARD_LABELS, s)))),
        h('div', { class: 'tiny muted', style: { marginTop: '6px' } }, `${tr('مصادر', 'Sources')}: `, (f.sources || []).slice(0, 3).map((s, i) => h('a', { href: '#', class: 'ltr', style: { marginInlineEnd: '8px' }, onClick: (e) => { e.preventDefault(); ctx.api.app.openExternal(s); } }, `[${i + 1}] ${new URL(s).hostname}`))))));
      if (!rows.length) list.appendChild(h('div', { class: 'alert info' }, icon('info'), tr('لا توجد نتائج مطابقة.', 'No matching factories.')));
    }
    async function exportCsv() {
      const rows = filtered().map((f) => [f.name_en, f.name_ar || '', lbl(COUNTRY_LABELS, f.country_code), f.city_en || '', f.founded || '', (f.products || []).map((p) => L(PRODUCT_LABELS[p] || { ar: p, en: p })).join('; '), (f.standards || []).join('; '), f.capacity_note || '', f.website || '', f.confidence, (f.sources || []).join(' ')]);
      const r = await ctx.api.exporter.csv({ filename: 'duct-factories-directory.csv', headers: [tr('الاسم', 'Name'), tr('الاسم بالعربية', 'Arabic name'), tr('الدولة', 'Country'), tr('المدينة', 'City'), tr('سنة التأسيس', 'Founded'), tr('المنتجات', 'Products'), tr('المعايير', 'Standards'), tr('الطاقة الإنتاجية', 'Capacity'), tr('الموقع', 'Website'), tr('مستوى التحقق', 'Confidence'), tr('المصادر', 'Sources')], rows });
      if (r.ok) toast(`${t('exported')}: ${r.file}`, 'ok');
    }
    update();
  },
};
function sel(options, value, onChange) { return h('select', { style: { maxWidth: '240px' }, onChange: (e) => onChange(e.target.value) }, options.map((o) => h('option', { value: o.value, selected: o.value === value }, o.label))); }
