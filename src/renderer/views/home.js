import { h, icon, pageHead, modal, asfanLogo } from '../ui.js';
import { t, tr, L, fmtDate, fmtNum, fmtInt } from '../i18n.js';
import { moduleLicensed, isSupervisorSession } from '../state.js';
import { MODULES } from '../../shared/modules.js';
import { contactBlock } from '../app.js';
import { showHelp } from '../help.js';

const ROUTE_OF = { LEARN: 'learn', DESIGN_LAB: 'design', FACTORY_TWIN: 'factory', BUILDING_TWIN: 'building', FABRICATION_QC: 'fabrication', ASSESSMENT: 'assessment' };
const DESC = {
  LEARN: { ar: 'اقرأ 14 درساً عن أنواع الدكت والمواد والمعايير والتصنيع والتركيب.', en: 'Read 14 lessons on duct types, materials, standards, fabrication and installation.' },
  DESIGN_LAB: { ar: 'احسب السرعة والاحتكاك والمقاسات والوزن والعزل بحاسبات فورية.', en: 'Calculate velocity, friction, sizes, weight and insulation with instant calculators.' },
  FACTORY_TWIN: { ar: 'شغّل مصنع دكت ثلاثي الأبعاد وراقب الإنتاج وOEE والطاقة والأعطال.', en: 'Run a 3D duct factory and watch production, OEE, energy and breakdowns.' },
  BUILDING_TWIN: { ar: 'تحكم بمروحة ودامبرات شبكة دكت في مبنى وشاهد الضغط والتسرب والحرارة.', en: 'Control the fan and dampers of a building duct network; watch pressure, leakage and heat.' },
  FABRICATION_QC: { ar: 'اختبار التسرب، جداول السماكة، الآلات، وقائمة فحص الجودة.', en: 'Leakage test, gauge tables, machines and a QC checklist.' },
  ASSESSMENT: { ar: 'أدِّ الاختبار المكلَّف من المشرف أو اختبر نفسك واحصل على تقرير.', en: 'Take the exam assigned by your supervisor or test yourself and get a report.' },
};

export default {
  async render(container, ctx) {
    const st = ctx.state; const lic = st.license.payload; const p = st.profile; const r = st.results || { attempts: [], sessions: [], lessonsCompleted: [] };
    const attempts = r.attempts || []; const best = attempts.length ? Math.max(...attempts.map((a) => a.percent || 0)) : null; const avg = attempts.length ? attempts.reduce((s, a) => s + (a.percent || 0), 0) / attempts.length : null;
    const sup = isSupervisorSession();
    const assignments = sup ? [] : (await ctx.api.assignments.list()).filter((a) => a.active !== false && (!a.classCode || !p.classCode || a.classCode === p.classCode) && !attempts.some((x) => x.assignmentId === a.id));
    container.appendChild(pageHead(`${tr('أهلاً', 'Hello')}, ${p.name}`, `${p.institution || lic.name} · ${sup ? t('supervisor') : t('student')}`, [h('button', { class: 'btn', onClick: () => showHelp('home') }, icon('info', 14), tr('كيف أبدأ؟', 'How do I start?')), h('button', { class: 'btn', onClick: () => ctx.navigate('guide') }, icon('book', 14), t('nav_guide'))]));
    if (assignments.length) container.appendChild(h('div', { class: 'alert warn', style: { marginBottom: '14px' } }, icon('clipboard'), h('div', { style: { flex: 1 } }, h('strong', null, tr(`لديك ${assignments.length} اختباراً مكلَّفاً لم تُنجزه بعد`, `You have ${assignments.length} assigned exam(s) to take`)), h('div', { class: 'small' }, assignments.map((a) => a.title).join(' · '))), h('button', { class: 'btn primary sm', onClick: () => ctx.navigate('assessment') }, tr('إلى الاختبارات', 'Go to assessments'))));
    // start-here steps
    const steps = sup ? [
      [tr('أنشئ فصلاً أو تجاوز ذلك', 'Create a class or skip'), tr('من لوحة المشرف ← الفصول. رمز الفصل يجمع الطلاب.', 'Supervisor Dashboard → Classes. The code groups students.'), 'supervisor'],
      [tr('أنشئ اختباراً مكلَّفاً', 'Create an assigned exam'), tr('لوحة المشرف ← الاختبارات المكلَّفة ← اختبار جديد.', 'Dashboard → Assigned exams → New exam.'), 'supervisor'],
      [tr('دع الطلاب يدخلون ويؤدونه', 'Students sign in and take it'), tr('كل طالب يختار اسمه من شاشة الملفات ثم «الاختبارات» ثم «ابدأ».', 'Each student picks their name on the profiles screen, then Assessments, then Start.'), null],
      [tr('راجع النتائج وصدّرها', 'Review and export results'), tr('الدرجات والإجابات لكل طالب في لوحة المشرف، مع CSV وPDF.', 'Scores and answers per student in the dashboard, with CSV and PDF.'), 'supervisor'],
    ] : [
      [tr('اقرأ الدروس', 'Read the lessons'), tr('المكتبة التعليمية: 14 درساً، علّم كل درس تنهيه.', 'Learning Library: 14 lessons, mark each one you finish.'), 'learn'],
      [tr('جرّب الحاسبات', 'Try the calculators'), tr('مختبر التصميم: غيّر الأرقام وشاهد النتائج فوراً.', 'Design Lab: change numbers and see results instantly.'), 'design'],
      [tr('شغّل التوأمَين الرقميَّين', 'Run the two digital twins'), tr('توأم المصنع وتوأم شبكة الدكت: اضغط تشغيل وغيّر المتغيرات.', 'Factory Twin and Duct Network Twin: press Run and change the variables.'), 'factory'],
      [tr('أدِّ الاختبار', 'Take the exam'), tr('الاختبارات: الاختبار المكلَّف من المشرف أو اختبار ذاتي.', 'Assessments: the exam assigned by your supervisor or a self-test.'), 'assessment'],
    ];
    container.appendChild(h('div', { class: 'card', style: { marginBottom: '14px' } }, h('h3', null, icon('star', 16), ' ', tr('ابدأ من هنا', 'Start here')), h('div', { class: 'grid cols-4' }, steps.map(([title, desc, route], i) => h('div', { class: 'kpi', style: { cursor: route ? 'pointer' : 'default' }, onClick: () => route && ctx.navigate(route) }, h('div', { class: 'row', style: { gap: '8px' } }, h('span', { class: 'avatar', style: { width: '28px', height: '28px', fontSize: '13px' } }, String(i + 1)), h('strong', null, title)), h('div', { class: 'small muted', style: { marginTop: '6px' } }, desc))))));
    container.appendChild(h('div', { class: 'grid cols-4', style: { marginBottom: '16px' } },
      stat(tr('الاختبارات المنجزة', 'Assessments taken'), fmtInt(attempts.length)), stat(tr('أفضل نتيجة', 'Best score'), best === null ? '—' : `${fmtNum(best, 0)}%`), stat(tr('المعدل', 'Average'), avg === null ? '—' : `${fmtNum(avg, 0)}%`), stat(tr('الدروس المكتملة', 'Lessons completed'), `${fmtInt((r.lessonsCompleted || []).length)} / 14`)));
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
    const contact = h('div', { class: 'card' }, h('h3', null, tr('الدعم والتواصل', 'Support & contact')), h('p', { class: 'muted small' }, tr('للتراخيص والتجديد والتدريب المؤسسي أو نسخة مخصصة لمصنعكم:', 'For licenses, renewals, institutional training or a customised edition for your factory:')), contactBlock(), h('div', { class: 'signature', style: { marginTop: '10px' } }, tr('من إنتاج', 'Produced by'), h('img', { src: asfanLogo(), alt: 'ASFAN', style: { height: '20px' } })));
    container.appendChild(h('div', { class: 'grid cols-2', style: { marginTop: '14px' } }, licCard, contact));
    // first-run tour
    if (!st.settings.tourDone) { setTimeout(() => tour(ctx, sup), 400); ctx.setSetting({ tourDone: true }); }
  },
};
function stat(label, value) { return h('div', { class: 'kpi' }, h('div', { class: 'label' }, label), h('div', { class: 'value' }, value)); }
function kv(k, v) { return h('div', null, h('div', { class: 'small muted' }, k), h('div', null, v)); }
function tour(ctx, sup) {
  const slides = [
    { icon: 'star', title: tr('مرحباً بك في التوأم الرقمي لمجاري الهواء', 'Welcome to the Duct Digital Twin'), body: tr('برنامج تعليمي يحاكي مصنع دكت وشبكة دكت في مبنى ببيانات هندسية حقيقية. هذا الشرح السريع في 4 شرائح.', 'An educational simulator of a duct factory and a building duct network built on real engineering data. This quick tour has 4 slides.') },
    { icon: 'book', title: tr('تعلّم ثم جرّب', 'Learn, then try'), body: tr('ابدأ بالمكتبة التعليمية، ثم مختبر التصميم، ثم التوأمَين ثلاثيَّي الأبعاد: اضغط «تشغيل» وغيّر المتغيرات من اللوحة الجانبية وراقب المؤشرات والتنبيهات.', 'Start with the Learning Library, then the Design Lab, then the two 3D twins: press Run, move the controls in the side panel and watch the KPIs and alarms.') },
    { icon: 'clipboard', title: sup ? tr('اختبار الطلاب', 'Testing students') : tr('الاختبارات', 'Assessments'), body: sup ? tr('من لوحة المشرف أنشئ «اختباراً مكلَّفاً»؛ يظهر لكل طالب في صفحة الاختبارات ويؤديه، وتظهر نتائجه وإجاباته عندك مباشرة.', 'From the Supervisor Dashboard create an “assigned exam”; every student sees it on their Assessments page, and their scores and answers appear in your dashboard.') : tr('في صفحة الاختبارات تجد الاختبار الذي كلّفك به المشرف بزر «ابدأ»، ويمكنك أيضاً إجراء اختبارات ذاتية. النتيجة تُحفظ باسمك.', 'On the Assessments page you find the exam your supervisor assigned with a Start button, and you can run self-tests. Results are saved under your name.') },
    { icon: 'info', title: tr('المساعدة في أي وقت', 'Help at any time'), body: tr('زر «شرح الشاشة» في الشريط العلوي يشرح الشاشة الحالية، و«الدليل» يشرح البرنامج كاملاً. A+ وA− لتكبير الخط.', 'The “This screen” button in the top bar explains the current screen and “Guide” explains the whole program. A+ and A− change the text size.') },
  ];
  let i = 0; let m;
  const body = h('div', { style: { textAlign: 'center', padding: '10px 6px' } });
  const draw = () => { const s = slides[i]; body.replaceChildren(h('div', { style: { color: 'var(--brand-1)' } }, icon(s.icon, 46)), h('h2', { style: { marginTop: '10px' } }, s.title), h('p', { style: { fontSize: '15px', lineHeight: 1.8 } }, s.body), h('div', { class: 'q-progress', style: { justifyContent: 'center', marginTop: '10px' } }, slides.map((_, k) => h('i', { class: k === i ? 'cur' : k < i ? 'done' : '' })))); };
  draw();
  m = modal({ title: tr('جولة سريعة', 'Quick tour'), body, actions: [{ label: tr('تخطّي', 'Skip') }, { label: tr('التالي', 'Next'), primary: true, close: false, onClick: () => { if (i < slides.length - 1) { i++; draw(); return false; } m.close(); return false; } }] });
}
