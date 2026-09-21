import { h, icon, pageHead } from '../ui.js';
import { t, tr, L, fmtDate, fmtNum, fmtInt } from '../i18n.js';
import { moduleLicensed, isSupervisorSession } from '../state.js';
import { MODULES } from '../../shared/modules.js';
import { contactBlock } from '../app.js';

const ROUTE_OF = { LEARN: 'learn', DESIGN_LAB: 'design', FACTORY_TWIN: 'factory', BUILDING_TWIN: 'building', FABRICATION_QC: 'fabrication', ASSESSMENT: 'assessment' };
const DESC = {
  LEARN: { ar: 'دروس ثنائية اللغة عن أنواع الدكت والمواد والمعايير (SMACNA، DW/144، ASHRAE) والتصنيع والتركيب.', en: 'Bilingual lessons on duct types, materials, standards (SMACNA, DW/144, ASHRAE), fabrication and installation.' },
  DESIGN_LAB: { ar: 'حاسبات تصميم: السرعة، الاحتكاك المتساوي، القطر المكافئ، اختيار السماكة، الوزن والتكلفة.', en: 'Design calculators: velocity, equal friction, equivalent diameter, gauge selection, weight and cost.' },
  FACTORY_TWIN: { ar: 'نموذج ثلاثي الأبعاد لمصنع دكت مع محاكاة خط الإنتاج والمؤشرات (OEE، الإنتاجية، الهدر، الطاقة).', en: '3D duct-factory model with production-line simulation and KPIs (OEE, throughput, scrap, energy).' },
  BUILDING_TWIN: { ar: 'شبكة مجاري هواء في مبنى: مروحة، فلاتر، دامبرات، تسرب، حرارة — تحكم حي وقراءات حساسات.', en: 'Building duct network: fan, filters, dampers, leakage, heat — live controls and sensor readings.' },
  FABRICATION_QC: { ar: 'اختبار التسرب، اختيار السماكة والتقوية، مسافات الحمالات، قوائم فحص الجودة والآلات.', en: 'Leakage testing, gauge & reinforcement selection, hanger spacing, QC checklists and machines.' },
  ASSESSMENT: { ar: 'اختبارات تقييم بأسئلة متعددة الخيارات وحسابية مع تقارير النتائج وتصديرها.', en: 'Assessments with multiple-choice and calculation questions, result reports and export.' },
};

export default {
  render(container, ctx) {
    const st = ctx.state; const lic = st.license.payload; const p = st.profile; const r = st.results || { attempts: [], sessions: [], lessonsCompleted: [] };
    const attempts = r.attempts || []; const best = attempts.length ? Math.max(...attempts.map((a) => a.percent || 0)) : null; const avg = attempts.length ? attempts.reduce((s, a) => s + (a.percent || 0), 0) / attempts.length : null;
    container.appendChild(pageHead(`${tr('أهلاً', 'Hello')}, ${p.name}`, `${p.institution || lic.name} · ${p.role === 'supervisor' ? t('supervisor') : t('student')}`));
    container.appendChild(h('div', { class: 'grid cols-4', style: { marginBottom: '16px' } },
      stat(tr('الاختبارات المنجزة', 'Assessments taken'), fmtInt(attempts.length)),
      stat(tr('أفضل نتيجة', 'Best score'), best === null ? '—' : `${fmtNum(best, 0)}%`),
      stat(tr('المعدل', 'Average'), avg === null ? '—' : `${fmtNum(avg, 0)}%`),
      stat(tr('الدروس المكتملة', 'Lessons completed'), fmtInt((r.lessonsCompleted || []).length))));
    container.appendChild(h('div', { class: 'grid cols-3' }, MODULES.map((m) => {
      const locked = !moduleLicensed(m.id);
      return h('div', { class: `module-card ${locked ? 'locked' : ''}`, onClick: () => ctx.navigate(ROUTE_OF[m.id]) }, icon(m.icon, 30), h('div', { class: 'title' }, L(m)), h('div', { class: 'desc' }, L(DESC[m.id])), locked ? h('span', { class: 'badge crit lock-badge' }, t('locked')) : h('span', { class: 'small', style: { color: 'var(--brand-1)' } }, tr('افتح الوحدة ←', 'Open module →')));
    })));
    const licCard = h('div', { class: 'card' }, h('h3', null, icon('key', 16), ' ', tr('الترخيص', 'License')),
      h('div', { class: 'grid cols-2' },
        kv(tr('الجهة', 'Licensee'), lic.name), kv(tr('النوع', 'Type'), lic.type === 'lifetime' ? t('lifetime') : `${t('subscription')} — ${fmtDate(lic.expires)} (${st.license.daysLeft} ${t('daysLeft')})`),
        kv(tr('تاريخ الإصدار', 'Issued'), fmtDate(lic.issued)), kv(tr('الوحدات', 'Modules'), Array.isArray(lic.modules) && lic.modules.length ? lic.modules.map((id) => L(MODULES.find((m) => m.id === id) || { ar: id, en: id })).join('، ') : tr('جميع الوحدات', 'All modules')),
        kv(tr('الدور', 'Role'), lic.role === 'supervisor' ? tr('ترخيص مشرف', 'Supervisor license') : tr('ترخيص متدرب', 'Trainee license')), lic.seats ? kv(tr('المقاعد', 'Seats'), String(lic.seats)) : null,
        lic.machine ? kv(tr('مربوط بالجهاز', 'Bound to machine'), h('code', null, lic.machine)) : null));
    const contact = h('div', { class: 'card' }, h('h3', null, tr('الدعم والتواصل', 'Support & contact')), h('p', { class: 'muted small' }, tr('للتراخيص والتجديد والتدريب المؤسسي أو طلب نسخة مخصصة لمصنعكم:', 'For licenses, renewals, institutional training or a customised edition for your factory:')), contactBlock());
    container.appendChild(h('div', { class: 'grid cols-2', style: { marginTop: '14px' } }, licCard, contact));
    if (isSupervisorSession()) container.appendChild(h('div', { class: 'alert info', style: { marginTop: '14px' } }, icon('users'), h('div', null, h('strong', null, tr('وضع المشرف', 'Supervisor mode')), h('div', { class: 'small' }, tr('افتح «لوحة المشرف» من القائمة لمتابعة الطلاب وتصدير التقارير.', 'Open “Supervisor Dashboard” from the menu to track students and export reports.')))));
  },
};
function stat(label, value) { return h('div', { class: 'kpi' }, h('div', { class: 'label' }, label), h('div', { class: 'value' }, value)); }
function kv(k, v) { return h('div', null, h('div', { class: 'small muted' }, k), h('div', null, v)); }
