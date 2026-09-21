import { h, icon, renderMarkdown, pageHead } from '../ui.js';
import { t, tr, L } from '../i18n.js';
import { HELP } from '../help.js';
import { isSupervisorSession } from '../state.js';

const FLOW = {
  ar: `## كيف يعمل البرنامج بخطوات بسيطة
1. **التفعيل**: يُدخل مفتاح الترخيص مرة واحدة على الجهاز.
2. **الملفات**: كل طالب أو متدرب ينشئ ملفاً باسمه ويختاره عند الدخول؛ المشرف يدخل بزر «دخول المشرف» ورمز PIN.
3. **التعلّم**: يقرأ الطالب الدروس، ويجرّب الحاسبات، ويشغّل التوأمَين الرقميَّين.
4. **الاختبار**: المشرف ينشئ اختباراً مكلَّفاً من لوحته، فيظهر للطلاب في صفحة الاختبارات ويؤدونه. يمكن للطالب أيضاً إجراء اختبارات ذاتية.
5. **المتابعة**: يفتح المشرف لوحة المشرف ليرى الدرجات والإجابات والدروس المكتملة وجلسات المحاكاة لكل طالب، ويصدّر التقارير.

## جهاز واحد أم عدة أجهزة؟
- **جهاز واحد في المختبر**: كل الطلاب يستخدمون البرنامج نفسه، كل واحد يختار اسمه من شاشة الملفات. المشرف يرى الجميع مباشرة.
- **عدة أجهزة**: ثبّت البرنامج بنفس مفتاح الترخيص على كل الأجهزة، واختر في الإعدادات «مجلد الفصل المشترك» على مجلد شبكي واحد. تتجمع النتائج والاختبارات المكلَّفة تلقائياً. بديل بلا شبكة: يصدّر الطالب نتائجه JSON ويستوردها المشرف.

## الأدوار
| الدور | ماذا يستطيع |
|---|---|
| طالب / متدرب | الدروس، الحاسبات، التوأمان، الاختبارات، تصدير نتائجه |
| مشرف (سوبر أدمن) | كل ما سبق + لوحة المشرف: الفصول، الاختبارات المكلَّفة، نتائج كل الطلاب، التقارير، حذف الملفات |

## أزرار الشريط العلوي
**A−** و**A+** تصغير وتكبير الخط، **EN/ع** اللغة، الشمس/القمر المظهر، **مساعدة** هذا الدليل، وزر الخروج لتبديل المستخدم.`,
  en: `## How the program works in simple steps
1. **Activation**: the license key is entered once on the computer.
2. **Profiles**: each student or trainee creates a profile and picks it when entering; the supervisor uses “Supervisor sign-in” with a PIN.
3. **Learning**: students read the lessons, try the calculators and run the two digital twins.
4. **Testing**: the supervisor creates an assigned exam from the dashboard; it appears on the students' Assessments page and they take it. Students can also run self-tests.
5. **Follow-up**: the supervisor opens the dashboard to see scores, answers, completed lessons and simulation sessions for every student, and exports reports.

## One computer or several?
- **One lab computer**: everyone uses the same installation, each student picks their name on the profiles screen. The supervisor sees everyone directly.
- **Several computers**: install with the same license key on all of them and set the **shared classroom folder** in Settings to one network folder. Results and assigned exams synchronise automatically. Offline alternative: students export JSON results and the supervisor imports them.

## Roles
| Role | Can do |
|---|---|
| Student / trainee | Lessons, calculators, both twins, exams, export own results |
| Supervisor (super admin) | All of the above + dashboard: classes, assigned exams, all students' results, reports, delete profiles |

## Top bar buttons
**A−** / **A+** text size, **EN/ع** language, sun/moon theme, **Help** this guide, and the exit button to switch user.`,
};

export default {
  render(container, ctx) {
    container.appendChild(pageHead(t('nav_guide'), tr('شرح البرنامج خطوة بخطوة، ثم شرح كل شاشة', 'The program step by step, then every screen')));
    const routes = ['home', 'learn', 'design', 'factory', 'building', 'fabrication', 'assessment', 'directory', ...(isSupervisorSession() ? ['supervisor'] : []), 'settings'];
    const nav = h('div', { class: 'lesson-nav' }); const body = h('div', { class: 'lesson-body' });
    let current = 'flow';
    const items = [{ id: 'flow', title: { ar: 'كيف يعمل البرنامج', en: 'How it works' } }].concat(routes.map((r) => ({ id: r, title: HELP[r].title })));
    const renderNav = () => nav.replaceChildren(...items.map((it, i) => h('div', { class: `lesson-item ${it.id === current ? 'active' : ''}`, onClick: () => { current = it.id; renderNav(); renderBody(); } }, h('span', { class: 'n' }, String(i + 1)), h('div', null, L(it.title)))));
    const renderBody = () => { const md = current === 'flow' ? L(FLOW) : L(HELP[current].body); const title = current === 'flow' ? tr('كيف يعمل البرنامج', 'How it works') : L(HELP[current].title); body.replaceChildren(h('article', { class: 'prose', html: `<h2>${title}</h2>` + renderMarkdown(md) }), current !== 'flow' ? h('button', { class: 'btn primary', style: { marginTop: '14px' }, onClick: () => ctx.navigate(current) }, icon('arrowRight', 16), tr('افتح هذه الشاشة', 'Open this screen')) : null); body.scrollTop = 0; };
    container.appendChild(h('div', { class: 'lesson-list' }, nav, body)); renderNav(); renderBody();
  },
};
