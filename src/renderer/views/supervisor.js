import { h, icon, toast, kpi, table, field, select, numberInput, pageHead, esc, confirmDialog, modal, sparkline } from '../ui.js';
import { t, tr, L, fmtNum, fmtDate, fmtDuration, fmtInt } from '../i18n.js';
import { MODULES } from '../../shared/modules.js';
import { LESSONS } from '../../shared/content/lessons.js';
import { QUESTIONS } from '../../shared/quiz-bank.js';
import { reportHtml } from './fabrication.js';
import { exportAttemptPdf, exportHistoryCsv, fmtResponse } from './assessment.js';
import { showHelp } from '../help.js';

export default {
  async render(container, ctx, params = {}) {
    const root = h('div'); container.appendChild(root);
    let all = [], classes = [], assignments = [], imported = []; let filterClass = '', q = ''; let tab = params.tab || 'students';
    const load = async () => { [all, classes, assignments] = await Promise.all([ctx.api.supervisor.allResults(), ctx.api.supervisor.listClasses(), ctx.api.assignments.list()]); };
    await load();
    const students = () => all.concat(imported).filter((r) => r.profile && r.profile.role !== 'supervisor').filter((r) => (!filterClass || (r.profile.classCode || '') === filterClass) && (!q || `${r.profile.name} ${r.profile.studentId} ${r.profile.institution}`.toLowerCase().includes(q)));

    const render = () => {
      const list = students(); const attempts = list.flatMap((s) => s.attempts || []);
      const avg = attempts.length ? attempts.reduce((a, x) => a + (x.percent || 0), 0) / attempts.length : null; const passRate = attempts.length ? (attempts.filter((a) => a.passed).length / attempts.length) * 100 : null;
      root.replaceChildren(pageHead(t('nav_sup'), tr('نتائج جميع الطلاب، الاختبارات المكلَّفة، والفصول. البيانات من هذا الجهاز ومن مجلد الفصل المشترك.', 'All students’ results, assigned exams and classes. Data from this computer and the shared classroom folder.'),
        [h('button', { class: 'btn', onClick: () => showHelp('supervisor') }, icon('info', 14), tr('كيف أختبر الطلاب؟', 'How do I test students?')), h('button', { class: 'btn', onClick: async () => { await load(); render(); toast(tr('تم التحديث', 'Refreshed')); } }, icon('refresh', 14), tr('تحديث', 'Refresh'))]),
        h('div', { class: 'grid cols-4', style: { marginBottom: '14px' } }, kpi(tr('الطلاب', 'Students'), fmtInt(list.length)), kpi(tr('المحاولات', 'Attempts'), fmtInt(attempts.length)), kpi(tr('المعدل العام', 'Average score'), avg === null ? '—' : fmtNum(avg, 0), '%'), kpi(tr('الاختبارات المكلَّفة', 'Assigned exams'), fmtInt(assignments.length))),
        h('div', { class: 'tabs' }, [['students', tr('الطلاب', 'Students')], ['assignments', tr('الاختبارات المكلَّفة', 'Assigned exams')], ['classes', tr('الفصول', 'Classes')]].map(([id, label]) => h('button', { class: `tab ${tab === id ? 'active' : ''}`, onClick: () => { tab = id; render(); } }, label))),
        tab === 'students' ? studentsTab(list) : tab === 'assignments' ? assignmentsTab(list) : classesTab());
    };

    // ---------------- students
    const studentsTab = (list) => h('div', null,
      h('div', { class: 'card', style: { marginBottom: '14px' } }, h('div', { class: 'row' }, h('input', { type: 'text', placeholder: t('search'), style: { maxWidth: '260px' }, value: q, onInput: (e) => { q = e.target.value.toLowerCase(); render(); } }),
        h('select', { style: { maxWidth: '240px' }, onChange: (e) => { filterClass = e.target.value; render(); } }, h('option', { value: '' }, tr('كل الفصول', 'All classes')), classes.map((c) => h('option', { value: c.code, selected: filterClass === c.code }, `${c.name} (${c.code})`))),
        h('span', { style: { flex: 1 } }),
        h('button', { class: 'btn sm', onClick: async () => { const l = await ctx.api.classroom.importFiles(); if (l.length) { imported = imported.concat(l); toast(`${tr('تم استيراد', 'Imported')} ${l.length}`, 'ok'); render(); } } }, icon('folder', 14), tr('استيراد ملفات نتائج', 'Import result files')),
        h('button', { class: 'btn sm primary', onClick: () => exportAll(list) }, icon('download', 14), tr('تصدير الكل CSV', 'Export all CSV')), h('button', { class: 'btn sm', onClick: () => exportSummaryPdf(list) }, icon('print', 14), tr('تقرير PDF', 'PDF report')))),
      h('div', { class: 'card' }, list.length ? table([tr('الطالب', 'Student'), tr('الرقم', 'ID'), tr('الفصل', 'Class'), tr('المحاولات', 'Attempts'), tr('أفضل %', 'Best %'), tr('المعدل %', 'Avg %'), tr('الدروس', 'Lessons'), tr('الجلسات', 'Sessions'), tr('آخر نشاط', 'Last active'), tr('المصدر', 'Source'), ''],
        list.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))).map((s) => { const at = s.attempts || []; const best = at.length ? Math.max(...at.map((x) => x.percent || 0)) : null; const av = at.length ? at.reduce((a, x) => a + (x.percent || 0), 0) / at.length : null;
          return [h('strong', null, s.profile.name), s.profile.studentId || '—', s.profile.classCode || '—', fmtInt(at.length), best === null ? '—' : fmtNum(best, 0), av === null ? '—' : fmtNum(av, 0), `${(s.lessonsCompleted || []).length}/${LESSONS.length}`, fmtInt((s.sessions || []).length), fmtDate(s.updatedAt), h('span', { class: 'badge' }, s.source === 'classroom' ? tr('مجلد مشترك', 'shared folder') : s.source === 'import' ? tr('مستورد', 'imported') : tr('هذا الجهاز', 'this PC')), h('button', { class: 'btn sm', onClick: () => detail(s) }, tr('التفاصيل', 'Details'))]; }), { numeric: [3, 4, 5] })
        : h('div', { class: 'alert info' }, icon('info'), h('div', null, h('strong', null, tr('لا توجد نتائج طلاب بعد', 'No student results yet')), h('div', { class: 'small' }, tr('الخطوات: 1) أنشئ اختباراً مكلَّفاً من التبويب المجاور. 2) يدخل كل طالب بملفه من شاشة الملفات ويفتح «الاختبارات» ويضغط «ابدأ». 3) تظهر نتائجه هنا فوراً. على الأجهزة الأخرى فعّل «مجلد الفصل المشترك» من الإعدادات أو استورد ملفات JSON.', 'Steps: 1) Create an assigned exam in the next tab. 2) Each student signs in with their profile, opens Assessments and presses Start. 3) Results appear here immediately. On other computers enable the shared classroom folder in Settings or import JSON files.'))))));

    // ---------------- assignments
    const assignmentsTab = (list) => {
      const box = h('div', null, h('div', { class: 'row between', style: { marginBottom: '12px' } }, h('p', { class: 'muted small', style: { margin: 0 } }, tr('اختبار مكلَّف = اختبار موحّد يحدده المشرف؛ يحصل كل الطلاب على الأسئلة نفسها ويظهر لهم في صفحة الاختبارات.', 'An assigned exam is a standard exam set by the supervisor; all students get the same questions and see it on their Assessments page.')), h('button', { class: 'btn primary', onClick: createAssignment }, icon('plus', 16), tr('اختبار مكلَّف جديد', 'New assigned exam'))));
      if (!assignments.length) box.appendChild(h('div', { class: 'alert info' }, icon('info'), tr('لا توجد اختبارات مكلَّفة. اضغط «اختبار مكلَّف جديد».', 'No assigned exams yet. Press “New assigned exam”.')));
      for (const a of assignments) {
        const rows = list.map((s) => { const mine = (s.attempts || []).filter((x) => x.assignmentId === a.id); const best = mine.length ? mine.reduce((m, x) => (x.percent > m.percent ? x : m), mine[0]) : null; return { s, best }; });
        const done = rows.filter((r) => r.best); const passed = done.filter((r) => r.best.passed);
        box.appendChild(h('div', { class: 'card', style: { marginBottom: '12px' } },
          h('div', { class: 'row between start' }, h('div', null, h('h3', { style: { marginBottom: '2px' } }, a.title, a.active === false ? h('span', { class: 'badge warn', style: { marginInlineStart: '8px' } }, tr('مغلق', 'Closed')) : null), h('div', { class: 'small muted' }, `${(a.moduleIds && a.moduleIds.length ? a.moduleIds : MODULES.map((m) => m.id)).map((id) => L(MODULES.find((m) => m.id === id) || { ar: id, en: id })).join('، ')} · ${a.count} ${tr('سؤالاً', 'questions')} · ${a.minutes ? a.minutes + ' ' + tr('د', 'min') : tr('بلا حد', 'unlimited')} · ${tr('النجاح', 'pass')} ${a.passPct}% · ${tr('صعوبة حتى', 'difficulty ≤')} ${a.maxDifficulty}${a.dueDate ? ' · ' + tr('يُغلق', 'closes') + ' ' + fmtDate(a.dueDate) : ''}${a.classCode ? ' · ' + tr('فصل', 'class') + ' ' + a.classCode : ''}`)),
            h('div', { class: 'row' }, h('span', { class: 'badge info' }, `${done.length}/${list.length} ${tr('أنجزوا', 'done')}`), h('span', { class: `badge ${passed.length === done.length && done.length ? 'ok' : 'warn'}` }, `${passed.length} ${tr('ناجح', 'passed')}`),
              h('button', { class: 'btn sm', onClick: () => exportAssignmentCsv(a, rows) }, icon('download', 12), 'CSV'),
              h('button', { class: 'btn sm', onClick: async () => { await ctx.api.assignments.update(a.id, { active: a.active === false }); await load(); render(); } }, a.active === false ? tr('إعادة الفتح', 'Reopen') : tr('إغلاق', 'Close')),
              h('button', { class: 'btn sm danger', onClick: async () => { if (await confirmDialog(tr('حذف هذا الاختبار المكلَّف؟ تبقى نتائج الطلاب محفوظة.', 'Delete this assigned exam? Student results stay saved.'), { danger: true })) { await ctx.api.assignments.remove(a.id); await load(); render(); } } }, icon('trash', 12)))),
          list.length ? table([tr('الطالب', 'Student'), tr('الرقم', 'ID'), tr('الحالة', 'Status'), '%', tr('الدرجة', 'Score'), tr('الوقت', 'Time'), tr('التاريخ', 'Date'), ''], rows.map(({ s, best }) => [s.profile.name, s.profile.studentId || '—', best ? h('span', { class: `badge ${best.passed ? 'ok' : 'crit'}` }, best.passed ? tr('ناجح', 'PASS') : tr('راسب', 'FAIL')) : h('span', { class: 'badge' }, tr('لم يُنجز', 'Not taken')), best ? fmtNum(best.percent, 0) : '—', best ? `${best.score}/${best.maxScore}` : '—', best ? fmtDuration(best.durationSec) : '—', best ? fmtDate(best.finishedAt, true) : '—', best ? h('div', { class: 'row' }, h('button', { class: 'btn sm', onClick: () => showAnswers(best, s.profile) }, tr('الإجابات', 'Answers')), h('button', { class: 'btn sm', onClick: () => exportAttemptPdf(best, ctx, s.profile) }, icon('print', 12))) : '']), { numeric: [3, 4] }) : h('p', { class: 'muted small' }, tr('لا يوجد طلاب بعد.', 'No students yet.'))));
      }
      return box;
    };
    const createAssignment = () => {
      const d = { title: '', moduleIds: [], count: 15, minutes: 20, passPct: 70, maxDifficulty: 3, dueDate: '', classCode: '' };
      const title = h('input', { type: 'text', placeholder: tr('مثال: اختبار منتصف الفصل – أساسيات الدكت', 'e.g. Midterm – duct fundamentals'), onInput: (e) => { d.title = e.target.value; } });
      const mods = MODULES.map((m) => h('label', { class: 'check' }, h('input', { type: 'checkbox', onChange: (e) => { if (e.target.checked) d.moduleIds.push(m.id); else d.moduleIds = d.moduleIds.filter((x) => x !== m.id); } }), `${L(m)} (${QUESTIONS.filter((qq) => qq.moduleId === m.id).length})`));
      modal({ title: tr('اختبار مكلَّف جديد', 'New assigned exam'), wide: true, body: h('div', null,
        field(tr('عنوان الاختبار', 'Exam title'), title),
        h('div', { class: 'grid cols-4' }, field(tr('عدد الأسئلة', 'Questions'), numberInput(d.count, (v) => { d.count = v; }, { min: 3, max: 60 })), field(tr('الوقت (دقيقة، 0 بلا حد)', 'Time (min, 0 unlimited)'), numberInput(d.minutes, (v) => { d.minutes = v; }, { min: 0, max: 180 })), field(tr('درجة النجاح %', 'Pass mark %'), numberInput(d.passPct, (v) => { d.passPct = v; }, { min: 30, max: 100 })), field(tr('أقصى صعوبة', 'Max difficulty'), select([{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }], 3, (v) => { d.maxDifficulty = parseInt(v, 10); }))),
        h('div', { class: 'grid cols-2' }, field(tr('تاريخ الإغلاق (اختياري)', 'Closing date (optional)'), h('input', { type: 'date', onInput: (e) => { d.dueDate = e.target.value; } })), field(tr('حصره في فصل (اختياري)', 'Restrict to class (optional)'), select([{ value: '', label: tr('كل الطلاب', 'All students') }].concat(classes.map((c) => ({ value: c.code, label: `${c.name} (${c.code})` }))), '', (v) => { d.classCode = v; }))),
        h('h4', { style: { marginTop: '8px' } }, tr('الوحدات (فارغة = كل الوحدات)', 'Modules (empty = all)')), h('div', { class: 'row' }, mods),
        h('p', { class: 'tiny muted', style: { marginTop: '8px' } }, tr('يحصل كل الطلاب على الأسئلة نفسها بالترتيب نفسه. الأسئلة الحسابية تستخدم القيم نفسها للجميع.', 'All students get the same questions in the same order; calculation questions use identical values for everyone.'))),
        actions: [{ label: t('cancel') }, { label: tr('إنشاء ونشر', 'Create & publish'), primary: true, onClick: async () => { if (!d.title.trim()) { title.focus(); return false; } await ctx.api.assignments.create({ ...d, createdBy: ctx.state.profile.name }); await load(); tab = 'assignments'; render(); toast(tr('تم إنشاء الاختبار؛ سيظهر للطلاب في صفحة الاختبارات', 'Exam created; it now appears on the students’ Assessments page'), 'ok', 6000); } }] });
      setTimeout(() => title.focus(), 30);
    };
    const exportAssignmentCsv = async (a, rows) => {
      const r = await ctx.api.exporter.csv({ filename: `assigned-${a.title}.csv`, headers: [tr('الطالب', 'Student'), tr('الرقم', 'ID'), tr('الفصل', 'Class'), tr('الحالة', 'Status'), '%', tr('الدرجة', 'Score'), tr('الحد الأقصى', 'Max'), tr('الوقت (ث)', 'Time (s)'), tr('التاريخ', 'Date')], rows: rows.map(({ s, best }) => [s.profile.name, s.profile.studentId || '', s.profile.classCode || '', best ? (best.passed ? 'PASS' : 'FAIL') : 'NOT TAKEN', best ? Math.round(best.percent) : '', best ? best.score : '', best ? best.maxScore : '', best ? best.durationSec : '', best ? best.finishedAt : '']) });
      if (r.ok) toast(`${t('exported')}: ${r.file}`, 'ok');
    };

    // ---------------- classes
    const classesTab = () => h('div', { class: 'card' }, h('div', { class: 'row between' }, h('p', { class: 'muted small', style: { margin: 0 } }, tr('الفصل رمز من 6 خانات يكتبه الطالب عند إنشاء ملفه؛ يفيد لتجميع الطلاب وحصر اختبار مكلَّف في فصل معيّن.', 'A class is a 6-character code students enter when creating their profile; use it to group students and restrict an assigned exam to one class.')), h('button', { class: 'btn primary', onClick: createClass }, icon('plus', 16), tr('فصل جديد', 'New class'))),
      classes.length ? table([tr('الفصل', 'Class'), tr('الرمز', 'Code'), tr('الجهة', 'Institution'), tr('الطلاب', 'Students'), tr('أُنشئ', 'Created'), ''], classes.map((c) => [c.name, h('code', null, c.code), c.institution || '—', String(all.filter((r) => r.profile && r.profile.classCode === c.code).length), fmtDate(c.createdAt), h('button', { class: 'btn sm danger', onClick: async () => { if (await confirmDialog(tr('حذف الفصل؟', 'Delete class?'), { danger: true })) { await ctx.api.supervisor.removeClass(c.id); await load(); render(); } } }, icon('trash', 12))])) : h('p', { class: 'muted small', style: { marginTop: '10px' } }, tr('لا توجد فصول بعد.', 'No classes yet.')));
    const createClass = () => {
      const name = h('input', { type: 'text', placeholder: tr('مثال: HVAC 301 – الفصل الأول', 'e.g. HVAC 301 – Term 1') }); const inst = h('input', { type: 'text', value: ctx.state.license.payload.name });
      modal({ title: tr('فصل جديد', 'New class'), body: h('div', null, field(tr('اسم الفصل', 'Class name'), name), field(tr('الجهة', 'Institution'), inst)), actions: [{ label: t('cancel') }, { label: t('add'), primary: true, onClick: async () => { if (!name.value.trim()) return false; const c = await ctx.api.supervisor.createClass({ name: name.value, institution: inst.value }); toast(`${tr('رمز الفصل', 'Class code')}: ${c.code}`, 'ok', 8000); await load(); tab = 'classes'; render(); } }] });
    };

    // ---------------- details / answers / exports
    const detail = (s) => {
      const at = (s.attempts || []).slice().reverse(); const canvas = h('canvas', { class: 'sparkline', style: { height: '60px' } });
      modal({ title: `${s.profile.name} — ${s.profile.institution || ''}`, wide: true, body: h('div', null,
        h('div', { class: 'grid cols-4', style: { marginBottom: '10px' } }, kpi(tr('المحاولات', 'Attempts'), fmtInt(at.length)), kpi(tr('أفضل نتيجة', 'Best'), at.length ? fmtNum(Math.max(...at.map((x) => x.percent || 0)), 0) : '—', '%'), kpi(tr('الدروس المكتملة', 'Lessons done'), `${(s.lessonsCompleted || []).length}/${LESSONS.length}`), kpi(tr('جلسات المحاكاة', 'Simulation sessions'), fmtInt((s.sessions || []).length))),
        at.length > 1 ? h('div', { class: 'card', style: { marginBottom: '10px' } }, h('div', { class: 'small muted' }, tr('تطور النتائج', 'Score trend')), canvas) : null,
        h('h4', null, tr('الاختبارات', 'Assessments')), at.length ? table([tr('التاريخ', 'Date'), tr('الاختبار', 'Exam'), tr('الدرجة', 'Score'), '%', tr('الوقت', 'Time'), tr('النتيجة', 'Result'), ''], at.map((a) => [fmtDate(a.finishedAt, true), a.assignmentTitle || tr('ذاتي', 'Self'), `${a.score}/${a.maxScore}`, fmtNum(a.percent, 0), fmtDuration(a.durationSec), a.passed ? h('span', { class: 'badge ok' }, tr('ناجح', 'PASS')) : h('span', { class: 'badge crit' }, tr('راسب', 'FAIL')), h('div', { class: 'row' }, h('button', { class: 'btn sm', onClick: () => showAnswers(a, s.profile) }, tr('الإجابات', 'Answers')), h('button', { class: 'btn sm', onClick: () => exportAttemptPdf(a, ctx, s.profile) }, icon('print', 12)))])) : h('p', { class: 'muted small' }, tr('لا توجد اختبارات.', 'No assessments.')),
        h('h4', { style: { marginTop: '12px' } }, tr('جلسات المحاكاة', 'Simulation sessions')), (s.sessions || []).length ? table([tr('التاريخ', 'Date'), tr('النوع', 'Type'), tr('المدة', 'Duration'), tr('ملخص المؤشرات', 'KPI summary')], (s.sessions || []).slice().reverse().slice(0, 30).map((x) => [fmtDate(x.savedAt, true), x.type === 'factory' ? tr('توأم المصنع', 'Factory twin') : tr('توأم الشبكة', 'Network twin'), fmtDuration(x.durationSec), h('code', { class: 'tiny' }, summarizeKpis(x.kpis))])) : h('p', { class: 'muted small' }, tr('لا توجد جلسات.', 'No sessions.'))),
        actions: [{ label: t('exportCsv'), onClick: () => { exportHistoryCsv(at, ctx, s.profile); return false; } }, { label: t('close'), primary: true }] });
      if (at.length > 1) setTimeout(() => sparkline(canvas, at.slice().reverse().map((a) => a.percent || 0), { min: 0, max: 100 }), 30);
    };
    const showAnswers = (a, profile) => modal({ title: `${profile.name} — ${a.assignmentTitle || tr('اختبار ذاتي', 'Self-test')} — ${fmtDate(a.finishedAt, true)}`, wide: true, body: table(['#', tr('الوحدة', 'Module'), tr('السؤال', 'Question'), tr('إجابة الطالب', 'Student answer'), tr('الصحيح', 'Correct'), ''], (a.questions || []).map((d, i) => [String(i + 1), d.moduleId, d.text, fmtResponse(d), d.correctAnswer, d.isCorrect ? h('span', { class: 'badge ok' }, '✓') : h('span', { class: 'badge crit' }, '✗')])), actions: [{ label: t('close'), primary: true }] });
    const exportAll = async (list) => {
      const rows = []; for (const s of list) for (const a of s.attempts || []) rows.push([s.profile.name, s.profile.studentId || '', s.profile.institution || '', s.profile.classCode || '', a.assignmentTitle || 'self', a.finishedAt, (a.moduleIds || []).join(';'), a.questionCount || (a.questions || []).length, a.score, a.maxScore, Math.round(a.percent), a.durationSec, a.passed ? 1 : 0]);
      for (const s of list) if (!(s.attempts || []).length) rows.push([s.profile.name, s.profile.studentId || '', s.profile.institution || '', s.profile.classCode || '', '', '', '', 0, '', '', '', '', '']);
      const r = await ctx.api.exporter.csv({ filename: `all-students-${new Date().toISOString().slice(0, 10)}.csv`, headers: [tr('الطالب', 'Student'), tr('الرقم', 'ID'), tr('الجهة', 'Institution'), tr('الفصل', 'Class'), tr('الاختبار', 'Exam'), tr('التاريخ', 'Date'), tr('الوحدات', 'Modules'), tr('الأسئلة', 'Questions'), tr('الدرجة', 'Score'), tr('الحد الأقصى', 'Max'), '%', tr('الوقت (ث)', 'Time (s)'), tr('ناجح', 'Passed')], rows });
      if (r.ok) toast(`${t('exported')}: ${r.file}`, 'ok');
    };
    const exportSummaryPdf = async (list) => {
      const rows = list.map((s) => { const at = s.attempts || []; const best = at.length ? Math.max(...at.map((x) => x.percent || 0)) : null; const av = at.length ? at.reduce((a, x) => a + (x.percent || 0), 0) / at.length : null; return `<tr><td>${esc(s.profile.name)}</td><td>${esc(s.profile.studentId || '')}</td><td>${esc(s.profile.classCode || '')}</td><td>${at.length}</td><td>${best === null ? '—' : Math.round(best)}</td><td>${av === null ? '—' : Math.round(av)}</td><td>${(s.lessonsCompleted || []).length}/${LESSONS.length}</td><td>${fmtDate(s.updatedAt)}</td></tr>`; }).join('');
      const body = `<p>${tr('المشرف', 'Supervisor')}: <b>${esc(ctx.state.profile.name)}</b> · ${tr('الجهة', 'Institution')}: <b>${esc(ctx.state.license.payload.name)}</b> · ${tr('عدد الطلاب', 'Students')}: <b>${list.length}</b></p><table><tr><th>${tr('الطالب', 'Student')}</th><th>${tr('الرقم', 'ID')}</th><th>${tr('الفصل', 'Class')}</th><th>${tr('المحاولات', 'Attempts')}</th><th>${tr('أفضل %', 'Best %')}</th><th>${tr('المعدل %', 'Avg %')}</th><th>${tr('الدروس', 'Lessons')}</th><th>${tr('آخر نشاط', 'Last active')}</th></tr>${rows}</table>`;
      const r = await ctx.api.exporter.pdf({ filename: `supervisor-report-${new Date().toISOString().slice(0, 10)}.pdf`, html: reportHtml(tr('تقرير المشرف — نتائج الطلاب', 'Supervisor report — student results'), body, ctx, { landscape: true }), landscape: true });
      if (r.ok) toast(`${t('exported')}: ${r.file}`, 'ok');
    };
    render();
  },
};
function summarizeKpis(k) { if (!k) return ''; return Object.entries(k).filter(([, v]) => typeof v === 'number').slice(0, 6).map(([kk, v]) => `${kk}=${Number.isInteger(v) ? v : v.toFixed(2)}`).join(' '); }
