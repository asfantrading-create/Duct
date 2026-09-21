import { h, icon, toast, renderMarkdown, pageHead } from '../ui.js';
import { t, tr, L, fmtInt } from '../i18n.js';
import { LESSONS } from '../../shared/content/lessons.js';

export default {
  render(container, ctx, params = {}) {
    const results = ctx.state.results || { lessonsCompleted: [] };
    const done = new Set(results.lessonsCompleted || []);
    let current = LESSONS.find((l) => l.id === params.lessonId) || LESSONS[0];
    const nav = h('div', { class: 'lesson-nav' }); const body = h('div', { class: 'lesson-body' });
    const progress = h('div', { class: 'small muted' });
    const renderNav = () => {
      progress.textContent = `${tr('أكملت', 'Completed')} ${fmtInt(done.size)} / ${LESSONS.length}`;
      nav.replaceChildren(...LESSONS.map((l) => h('div', { class: `lesson-item ${l.id === current.id ? 'active' : ''} ${done.has(l.id) ? 'done' : ''}`, onClick: () => { current = l; renderNav(); renderBody(); } },
        h('span', { class: 'n' }, done.has(l.id) ? icon('check', 14) : String(l.order)), h('div', { style: { flex: 1 } }, h('div', null, L(l.title)), h('div', { class: 'tiny muted' }, `${l.minutes} ${tr('دقيقة', 'min')}`)))));
    };
    const renderBody = () => {
      const idx = LESSONS.indexOf(current);
      body.replaceChildren(
        h('div', { class: 'row between', style: { marginBottom: '8px' } }, h('span', { class: 'badge' }, `${tr('الدرس', 'Lesson')} ${current.order} / ${LESSONS.length}`), h('span', { class: 'badge' }, `${current.minutes} ${tr('دقيقة قراءة', 'min read')}`)),
        h('article', { class: 'prose', html: `<h2>${L(current.title)}</h2>` + renderMarkdown(L(current.body)) }),
        h('div', { class: 'row between', style: { marginTop: '24px', maxWidth: '900px' } },
          h('button', { class: 'btn', disabled: idx === 0, onClick: () => { current = LESSONS[idx - 1]; renderNav(); renderBody(); body.scrollTop = 0; } }, tr('الدرس السابق', 'Previous lesson')),
          h('div', { class: 'row' },
            done.has(current.id) ? h('span', { class: 'badge ok' }, icon('check', 12), ' ', tr('مكتمل', 'Completed')) : h('button', { class: 'btn primary', onClick: async () => { await ctx.api.results.markLesson(ctx.state.profile.id, current.id); done.add(current.id); await ctx.refreshResults(); toast(tr('تم تسجيل إكمال الدرس', 'Lesson marked complete'), 'ok'); renderNav(); renderBody(); } }, icon('check', 16), tr('أكملت هذا الدرس', 'Mark as completed')),
            h('button', { class: 'btn', onClick: () => ctx.navigate('assessment', { moduleIds: [moduleOf(current.id)] }) }, icon('clipboard', 16), tr('اختبر نفسك', 'Quiz me'))),
          h('button', { class: 'btn', disabled: idx === LESSONS.length - 1, onClick: () => { current = LESSONS[idx + 1]; renderNav(); renderBody(); body.scrollTop = 0; } }, tr('الدرس التالي', 'Next lesson'))));
      body.scrollTop = 0;
    };
    container.appendChild(pageHead(t('nav_learn'), tr('14 درساً ثنائيّ اللغة عن مجاري الهواء: من الأساسيات إلى التصنيع والتوأم الرقمي', '14 bilingual lessons on ductwork: from fundamentals to fabrication and digital twins'), [progress]));
    container.appendChild(h('div', { class: 'lesson-list' }, nav, body));
    renderNav(); renderBody();
  },
};
function moduleOf(lessonId) {
  if (['airflow', 'friction-fittings', 'sizing'].includes(lessonId)) return 'DESIGN_LAB';
  if (['leakage', 'insulation', 'fabrication', 'installation', 'commissioning', 'safety'].includes(lessonId)) return 'FABRICATION_QC';
  if (lessonId === 'digital-twin') return 'FACTORY_TWIN';
  return 'LEARN';
}
