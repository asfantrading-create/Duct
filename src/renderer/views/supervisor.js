import { h, icon, toast, kpi, table, field, pageHead, esc, confirmDialog, modal, sparkline } from '../ui.js';
import { t, tr, L, fmtNum, fmtDate, fmtDuration, fmtInt } from '../i18n.js';
import { MODULES } from '../../shared/modules.js';
import { LESSONS } from '../../shared/content/lessons.js';
import { reportHtml } from './fabrication.js';
import { exportAttemptPdf, exportHistoryCsv, fmtResponse } from './assessment.js';

export default {
  async render(container, ctx) {
    const root = h('div'); container.appendChild(root);
    let all = []; let classes = []; let imported = []; let filterClass = ''; let q = '';
    const load = async () => { [all, classes] = await Promise.all([ctx.api.supervisor.allResults(), ctx.api.supervisor.listClasses()]); };
    await load();
    const render = () => {
      const students = all.concat(imported).filter((r) => r.profile && r.profile.role !== 'supervisor').filter((r) => (!filterClass || (r.profile.classCode || '') === filterClass) && (!q || `${r.profile.name} ${r.profile.studentId} ${r.profile.institution}`.toLowerCase().includes(q)));
      const attempts = students.flatMap((s) => s.attempts || []);
      const avg = attempts.length ? attempts.reduce((a, x) => a + (x.percent || 0), 0) / attempts.length : null; const passRate = attempts.length ? (attempts.filter((a) => a.passed).length / attempts.length) * 100 : null;
      root.replaceChildren(pageHead(t('nav_sup'), tr('نتائج جميع الطلاب على هذا الجهاز وفي مجلد الفصل المشترك، مع التقارير والتصدير', 'All students’ results on this computer and in the shared classroom folder, with reports and export'),
        [h('button', { class: 'btn', onClick: async () => { await load(); render(); toast(tr('تم التحديث', 'Refreshed')); } }, icon('refresh', 14), tr('تحديث', 'Refresh')),
         h('button', { class: 'btn', onClick: async () => { const list = await ctx.api.classroom.importFiles(); if (list.length) { imported = imported.concat(list); toast(`${tr('تم استيراد', 'Imported')} ${list.length}`, 'ok'); render(); } } }, icon('folder', 14), tr('استيراد ملفات نتائج', 'Import result files')),
         h('button', { class: 'btn primary', onClick: () => exportAll(students) }, icon('download', 14), tr('تصدير الكل CSV', 'Export all CSV')),
         h('button', { class: 'btn', onClick: () => exportSummaryPdf(students) }, icon('print', 14), tr('تقرير PDF', 'PDF report'))]),
        h('div', { class: 'grid cols-4', style: { marginBottom: '14px' } }, kpi(tr('الطلاب', 'Students'), fmtInt(students.length)), kpi(tr('المحاولات', 'Attempts'), fmtInt(attempts.length)), kpi(tr('المعدل العام', 'Average score'), avg === null ? '—' : fmtNum(avg, 0), '%'), kpi(tr('نسبة النجاح', 'Pass rate'), passRate === null ? '—' : fmtNum(passRate, 0), '%')),
        h('div', { class: 'card', style: { marginBottom: '14px' } }, h('div', { class: 'row' }, h('input', { type: 'text', placeholder: t('search'), style: { maxWidth: '260px' }, value: q, onInput: (e) => { q = e.target.value.toLowerCase(); render(); } }),
          h('select', { style: { maxWidth: '240px' }, onChange: (e) => { filterClass = e.target.value; render(); } }, h('option', { value: '' }, tr('كل الفصول', 'All classes')), classes.map((c) => h('option', { value: c.code, selected: filterClass === c.code }, `${c.name} (${c.code})`))),
          h('span', { class: 'spacer', style: { flex: 1 } }), h('button', { class: 'btn sm', onClick: createClass }, icon('plus', 14), tr('فصل جديد', 'New class')), classes.map((c) => h('span', { class: 'chip', title: c.institution }, `${c.name}: `, h('code', null, c.code), h('button', { class: 'btn ghost sm', style: { padding: '0 4px' }, onClick: async () => { if (await confirmDialog(tr('حذف الفصل؟', 'Delete class?'), { danger: true })) { await ctx.api.supervisor.removeClass(c.id); await load(); render(); } } }, icon('x', 12)))))),
        h('div', { class: 'card' }, h('h3', null, tr('الطلاب', 'Students')), students.length ? table([tr('الطالب', 'Student'), tr('الرقم', 'ID'), tr('الفصل', 'Class'), tr('المحاولات', 'Attempts'), tr('أفضل %', 'Best %'), tr('المعدل %', 'Avg %'), tr('الدروس', 'Lessons'), tr('الجلسات', 'Sessions'), tr('آخر نشاط', 'Last active'), tr('المصدر', 'Source'), ''],
          students.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))).map((s) => { const at = s.attempts || []; const best = at.length ? Math.max(...at.map((x) => x.percent || 0)) : null; const av = at.length ? at.reduce((a, x) => a + (x.percent || 0), 0) / at.length : null;
            return [h('strong', null, s.profile.name), s.profile.studentId || '—', s.profile.classCode || '—', fmtInt(at.length), best === null ? '—' : fmtNum(best, 0), av === null ? '—' : fmtNum(av, 0), `${(s.lessonsCompleted || []).length}/${LESSONS.length}`, fmtInt((s.sessions || []).length), fmtDate(s.updatedAt), h('span', { class: 'badge' }, s.source === 'classroom' ? tr('مجلد مشترك', 'shared folder') : s.source === 'import' ? tr('مستورد', 'imported') : tr('هذا الجهاز', 'this PC')), h('button', { class: 'btn sm', onClick: () => detail(s) }, tr('التفاصيل', 'Details'))]; }), { numeric: [3, 4, 5] })
          : h('div', { class: 'alert info' }, icon('info'), h('div', null, tr('لا توجد نتائج طلاب بعد. عندما يُنهي الطلاب اختبارات على هذا الجهاز أو على أجهزة مرتبطة بمجلد الفصل المشترك (الإعدادات ← مجلد الفصل) ستظهر هنا. يمكنك أيضاً استيراد ملفات JSON المصدَّرة من أجهزة الطلاب.', 'No student results yet. When students finish exams on this computer, or on computers linked to the shared classroom folder (Settings → classroom folder), they appear here. You can also import JSON files exported from students’ computers.')))));
    };
    const createClass = () => {
      const name = h('input', { type: 'text', placeholder: tr('مثال: HVAC 301 – الفصل الأول', 'e.g. HVAC 301 – Term 1') }); const inst = h('input', { type: 'text', value: ctx.state.license.payload.name });
      modal({ title: tr('فصل جديد', 'New class'), body: h('div', null, h('p', { class: 'small muted' }, tr('يُنشأ رمز فصل يعطيه الطلاب عند إنشاء ملفاتهم ليُجمَعوا في لوحة المشرف.', 'A class code is generated; students enter it when creating their profile so they are grouped in the dashboard.')), field(tr('اسم الفصل', 'Class name'), name), field(tr('الجهة', 'Institution'), inst)), actions: [{ label: t('cancel') }, { label: t('add'), primary: true, onClick: async () => { if (!name.value.trim()) return false; const c = await ctx.api.supervisor.createClass({ name: name.value, institution: inst.value }); toast(`${tr('رمز الفصل', 'Class code')}: ${c.code}`, 'ok', 8000); await load(); render(); } }] });
    };
    const detail = (s) => {
      const at = (s.attempts || []).slice().reverse(); const canvas = h('canvas', { class: 'sparkline', style: { height: '60px' } });
      const m = modal({ title: `${s.profile.name} — ${s.profile.institution || ''}`, wide: true, body: h('div', null,
        h('div', { class: 'grid cols-4', style: { marginBottom: '10px' } }, kpi(tr('المحاولات', 'Attempts'), fmtInt(at.length)), kpi(tr('أفضل نتيجة', 'Best'), at.length ? fmtNum(Math.max(...at.map((x) => x.percent || 0)), 0) : '—', '%'), kpi(tr('الدروس المكتملة', 'Lessons done'), `${(s.lessonsCompleted || []).length}/${LESSONS.length}`), kpi(tr('جلسات المحاكاة', 'Simulation sessions'), fmtInt((s.sessions || []).length))),
        at.length > 1 ? h('div', { class: 'card', style: { marginBottom: '10px' } }, h('div', { class: 'small muted' }, tr('تطور النتائج', 'Score trend')), canvas) : null,
        h('h4', null, tr('الاختبارات', 'Assessments')), at.length ? table([tr('التاريخ', 'Date'), tr('الوحدات', 'Modules'), tr('الدرجة', 'Score'), '%', tr('الوقت', 'Time'), tr('النتيجة', 'Result'), ''], at.map((a) => [fmtDate(a.finishedAt, true), (a.moduleIds || []).map((x) => L(MODULES.find((mm) => mm.id === x) || { ar: x, en: x })).join('، '), `${a.score}/${a.maxScore}`, fmtNum(a.percent, 0), fmtDuration(a.durationSec), a.passed ? h('span', { class: 'badge ok' }, tr('ناجح', 'PASS')) : h('span', { class: 'badge crit' }, tr('راسب', 'FAIL')), h('div', { class: 'row' }, h('button', { class: 'btn sm', onClick: () => showAnswers(a, s.profile) }, tr('الإجابات', 'Answers')), h('button', { class: 'btn sm', onClick: () => exportAttemptPdf(a, ctx, s.profile) }, icon('print', 12)))])) : h('p', { class: 'muted small' }, tr('لا توجد اختبارات.', 'No assessments.')),
        h('h4', { style: { marginTop: '12px' } }, tr('جلسات المحاكاة', 'Simulation sessions')), (s.sessions || []).length ? table([tr('التاريخ', 'Date'), tr('النوع', 'Type'), tr('المدة', 'Duration'), tr('ملخص المؤشرات', 'KPI summary')], (s.sessions || []).slice().reverse().slice(0, 30).map((x) => [fmtDate(x.savedAt, true), x.type, fmtDuration(x.durationSec), h('code', { class: 'tiny' }, summarizeKpis(x.kpis))])) : h('p', { class: 'muted small' }, tr('لا توجد جلسات.', 'No sessions.'))),
        actions: [{ label: t('exportCsv'), onClick: () => { exportHistoryCsv(at, ctx, s.profile); return false; } }, { label: t('close'), primary: true }] });
      if (at.length > 1) setTimeout(() => sparkline(canvas, at.slice().reverse().map((a) => a.percent || 0), { min: 0, max: 100 }), 30);
    };
    const showAnswers = (a, profile) => {
      modal({ title: `${profile.name} — ${fmtDate(a.finishedAt, true)}`, wide: true, body: table(['#', tr('الوحدة', 'Module'), tr('السؤال', 'Question'), tr('إجابة الطالب', 'Student answer'), tr('الصحيح', 'Correct'), ''], (a.questions || []).map((d, i) => [String(i + 1), d.moduleId, d.text, fmtResponse(d), d.correctAnswer, d.isCorrect ? h('span', { class: 'badge ok' }, '✓') : h('span', { class: 'badge crit' }, '✗')])), actions: [{ label: t('close'), primary: true }] });
    };
    const exportAll = async (students) => {
      const rows = []; for (const s of students) for (const a of s.attempts || []) rows.push([s.profile.name, s.profile.studentId || '', s.profile.institution || '', s.profile.classCode || '', a.finishedAt, (a.moduleIds || []).join(';'), a.questionCount || (a.questions || []).length, a.score, a.maxScore, Math.round(a.percent), a.durationSec, a.passed ? 1 : 0]);
      for (const s of students) if (!(s.attempts || []).length) rows.push([s.profile.name, s.profile.studentId || '', s.profile.institution || '', s.profile.classCode || '', '', '', 0, '', '', '', '', '']);
      const r = await ctx.api.exporter.csv({ filename: `all-students-${new Date().toISOString().slice(0, 10)}.csv`, headers: [tr('الطالب', 'Student'), tr('الرقم', 'ID'), tr('الجهة', 'Institution'), tr('الفصل', 'Class'), tr('التاريخ', 'Date'), tr('الوحدات', 'Modules'), tr('الأسئلة', 'Questions'), tr('الدرجة', 'Score'), tr('الحد الأقصى', 'Max'), '%', tr('الوقت (ث)', 'Time (s)'), tr('ناجح', 'Passed')], rows });
      if (r.ok) toast(`${t('exported')}: ${r.file}`, 'ok');
      await ctx.api.exporter.json({ filename: `all-students-${new Date().toISOString().slice(0, 10)}.json`, data: { exportedAt: new Date().toISOString(), supervisor: ctx.state.profile.name, students } }).catch(() => {});
    };
    const exportSummaryPdf = async (students) => {
      const rows = students.map((s) => { const at = s.attempts || []; const best = at.length ? Math.max(...at.map((x) => x.percent || 0)) : null; const av = at.length ? at.reduce((a, x) => a + (x.percent || 0), 0) / at.length : null; return `<tr><td>${esc(s.profile.name)}</td><td>${esc(s.profile.studentId || '')}</td><td>${esc(s.profile.classCode || '')}</td><td>${at.length}</td><td>${best === null ? '—' : Math.round(best)}</td><td>${av === null ? '—' : Math.round(av)}</td><td>${(s.lessonsCompleted || []).length}/${LESSONS.length}</td><td>${fmtDate(s.updatedAt)}</td></tr>`; }).join('');
      const body = `<p>${tr('المشرف', 'Supervisor')}: <b>${esc(ctx.state.profile.name)}</b> · ${tr('الجهة', 'Institution')}: <b>${esc(ctx.state.license.payload.name)}</b> · ${tr('عدد الطلاب', 'Students')}: <b>${students.length}</b></p><table><tr><th>${tr('الطالب', 'Student')}</th><th>${tr('الرقم', 'ID')}</th><th>${tr('الفصل', 'Class')}</th><th>${tr('المحاولات', 'Attempts')}</th><th>${tr('أفضل %', 'Best %')}</th><th>${tr('المعدل %', 'Avg %')}</th><th>${tr('الدروس', 'Lessons')}</th><th>${tr('آخر نشاط', 'Last active')}</th></tr>${rows}</table>`;
      const r = await ctx.api.exporter.pdf({ filename: `supervisor-report-${new Date().toISOString().slice(0, 10)}.pdf`, html: reportHtml(tr('تقرير المشرف — نتائج الطلاب', 'Supervisor report — student results'), body, ctx, { landscape: true }), landscape: true });
      if (r.ok) toast(`${t('exported')}: ${r.file}`, 'ok');
    };
    render();
  },
};
function summarizeKpis(k) { if (!k) return ''; return Object.entries(k).filter(([, v]) => typeof v === 'number').slice(0, 6).map(([kk, v]) => `${kk}=${Number.isInteger(v) ? v : v.toFixed(2)}`).join(' '); }
