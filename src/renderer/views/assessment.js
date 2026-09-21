import { h, icon, toast, kpi, table, field, select, numberInput, pageHead, esc, confirmDialog } from '../ui.js';
import { t, tr, L, fmtNum, fmtDate, fmtDuration } from '../i18n.js';
import { moduleLicensed } from '../state.js';
import { MODULES } from '../../shared/modules.js';
import { QUESTIONS, buildExam, grade, fillTemplate } from '../../shared/quiz-bank.js';
import { reportHtml } from './fabrication.js';

let timer = null;
export default {
  destroy() { if (timer) clearInterval(timer); timer = null; },
  render(container, ctx, params = {}) {
    const cfg = { count: 15, moduleIds: params.moduleIds || [], maxDifficulty: 3, minutes: 20, passPct: 70 };
    const root = h('div'); container.appendChild(root);
    const showSetup = () => {
      root.replaceChildren(pageHead(t('nav_quiz'), tr(`بنك أسئلة ${QUESTIONS.length} سؤالاً (اختيار من متعدد، صح/خطأ، حسابية بقيم عشوائية). النتائج تُحفظ باسمك وتُصدَّر كملفات.`, `${QUESTIONS.length}-question bank (multiple choice, true/false, calculations with random values). Results are saved under your name and can be exported.`)));
      const modChecks = MODULES.map((m) => { const cb = h('input', { type: 'checkbox', checked: cfg.moduleIds.includes(m.id), disabled: !moduleLicensed(m.id), onChange: (e) => { if (e.target.checked) cfg.moduleIds.push(m.id); else cfg.moduleIds = cfg.moduleIds.filter((x) => x !== m.id); } }); return h('label', { class: 'check' }, cb, `${L(m)} (${QUESTIONS.filter((q) => q.moduleId === m.id).length})`); });
      const setup = h('div', { class: 'card' }, h('h3', null, tr('إعداد الاختبار', 'Exam setup')),
        h('div', { class: 'grid cols-3' }, field(tr('عدد الأسئلة', 'Number of questions'), numberInput(cfg.count, (v) => { cfg.count = v; }, { min: 5, max: 60, step: 1 })), field(tr('الوقت (دقيقة، 0 = بلا حد)', 'Time (minutes, 0 = unlimited)'), numberInput(cfg.minutes, (v) => { cfg.minutes = v; }, { min: 0, max: 180 })), field(tr('درجة النجاح %', 'Pass mark %'), numberInput(cfg.passPct, (v) => { cfg.passPct = v; }, { min: 30, max: 100 })),
          field(tr('أقصى صعوبة', 'Max difficulty'), select([{ value: 1, label: tr('1 – أساسي', '1 – basic') }, { value: 2, label: tr('2 – متوسط', '2 – intermediate') }, { value: 3, label: tr('3 – متقدم (حسابات)', '3 – advanced (calculations)') }], cfg.maxDifficulty, (v) => { cfg.maxDifficulty = parseInt(v, 10); }))),
        h('h4', { style: { marginTop: '10px' } }, tr('الوحدات (اتركها فارغة لكل الوحدات المرخّصة)', 'Modules (leave empty for all licensed modules)')), h('div', { class: 'row' }, modChecks),
        h('div', { class: 'row end', style: { marginTop: '12px' } }, h('button', { class: 'btn primary lg', onClick: startExam }, icon('play', 18), tr('ابدأ الاختبار', 'Start exam'))));
      root.appendChild(setup);
      root.appendChild(history(ctx));
    };
    const startExam = () => {
      const licensed = MODULES.filter((m) => moduleLicensed(m.id)).map((m) => m.id);
      const mods = cfg.moduleIds.length ? cfg.moduleIds.filter((m) => licensed.includes(m)) : licensed;
      const exam = buildExam({ count: cfg.count, moduleIds: mods, maxDifficulty: cfg.maxDifficulty });
      if (!exam.length) { toast(tr('لا توجد أسئلة مطابقة', 'No matching questions'), 'warn'); return; }
      runExam(exam);
    };
    const runExam = (exam) => {
      const answers = new Array(exam.length).fill(null); let idx = 0; const started = Date.now(); const deadline = cfg.minutes ? started + cfg.minutes * 60000 : null;
      const timerEl = h('span', { class: 'chip' }); const qBox = h('div'); const prog = h('div', { class: 'q-progress' });
      const finish = async (auto = false) => {
        if (timer) clearInterval(timer); timer = null;
        const durationSec = Math.round((Date.now() - started) / 1000);
        let score = 0, max = 0; const detail = exam.map((q, i) => { const g = grade(q, answers[i]); score += g.points; max += q.difficulty; return { id: q.id, moduleId: q.moduleId, type: q.type, difficulty: q.difficulty, text: fillTemplate(L(q.text), q.params), response: answers[i], correctAnswer: q.type === 'mcq' ? L(q.options[q.answer]) : q.type === 'tf' ? (q.answer ? t('yes') : t('no')) : `${fmtNum(q.answer, 3)} ${q.unit || ''}`, isCorrect: g.correct, points: g.points }; });
        const percent = max ? (score / max) * 100 : 0; const passed = percent >= cfg.passPct;
        const byModule = {}; for (const d of detail) { byModule[d.moduleId] = byModule[d.moduleId] || { correct: 0, total: 0 }; byModule[d.moduleId].total++; if (d.isCorrect) byModule[d.moduleId].correct++; }
        const attempt = { startedAt: new Date(started).toISOString(), finishedAt: new Date().toISOString(), durationSec, score, maxScore: max, percent, passed, passPct: cfg.passPct, moduleIds: [...new Set(exam.map((q) => q.moduleId))], questionCount: exam.length, answered: answers.filter((a) => a !== null && a !== '').length, byModule, questions: detail, autoSubmitted: auto, lang: ctx.state.settings.lang };
        await ctx.api.results.saveAttempt(ctx.state.profile.id, attempt); await ctx.refreshResults();
        showResult(attempt);
      };
      const renderQ = () => {
        const q = exam[idx]; const text = fillTemplate(L(q.text), q.params);
        prog.replaceChildren(...exam.map((_, i) => h('i', { class: i === idx ? 'cur' : answers[i] !== null && answers[i] !== '' ? 'done' : '' })));
        let body;
        if (q.type === 'mcq') body = h('div', null, q.options.map((o, i) => h('div', { class: `q-option ${answers[idx] === i ? 'selected' : ''}`, onClick: () => { answers[idx] = i; renderQ(); } }, h('input', { type: 'radio', checked: answers[idx] === i }), h('span', null, L(o)))));
        else if (q.type === 'tf') body = h('div', null, [[true, tr('صحيح', 'True')], [false, tr('خطأ', 'False')]].map(([v, lbl]) => h('div', { class: `q-option ${answers[idx] === v ? 'selected' : ''}`, onClick: () => { answers[idx] = v; renderQ(); } }, h('input', { type: 'radio', checked: answers[idx] === v }), h('span', null, lbl))));
        else body = h('div', { class: 'row', style: { marginTop: '10px' } }, h('input', { type: 'number', step: 'any', class: 'ltr', style: { maxWidth: '220px' }, value: answers[idx] ?? '', placeholder: tr('الإجابة الرقمية', 'Numeric answer'), onInput: (e) => { answers[idx] = e.target.value; } }), h('span', { class: 'muted' }, q.unit || ''), h('span', { class: 'tiny muted' }, `± ${q.tolerancePct}%`));
        qBox.replaceChildren(h('div', { class: 'q-card' }, h('div', { class: 'row between' }, h('span', { class: 'badge' }, `${idx + 1} / ${exam.length}`), h('span', { class: 'badge info' }, L(MODULES.find((m) => m.id === q.moduleId))), h('span', { class: 'badge' }, `${tr('صعوبة', 'difficulty')} ${q.difficulty}`)), h('h3', { style: { marginTop: '12px', fontSize: '17px', lineHeight: 1.6 } }, text), body,
          h('div', { class: 'row between', style: { marginTop: '18px' } }, h('button', { class: 'btn', disabled: idx === 0, onClick: () => { idx--; renderQ(); } }, tr('السابق', 'Previous')),
            idx < exam.length - 1 ? h('button', { class: 'btn primary', onClick: () => { idx++; renderQ(); } }, tr('التالي', 'Next')) : h('button', { class: 'btn primary', onClick: async () => { const un = answers.filter((a) => a === null || a === '').length; if (un && !(await confirmDialog(tr(`لديك ${un} سؤالاً بلا إجابة. إنهاء الاختبار؟`, `You have ${un} unanswered question(s). Submit anyway?`)))) return; finish(false); } }, icon('check', 16), tr('إنهاء وتسليم', 'Submit')))));
      };
      root.replaceChildren(h('div', { class: 'row between', style: { marginBottom: '12px' } }, h('h2', null, tr('اختبار قيد التنفيذ', 'Exam in progress')), h('div', { class: 'row' }, timerEl, h('button', { class: 'btn sm danger', onClick: async () => { if (await confirmDialog(tr('إلغاء الاختبار دون حفظ؟', 'Abandon the exam without saving?'), { danger: true })) { if (timer) clearInterval(timer); timer = null; showSetup(); } } }, t('cancel')))), prog, h('div', { style: { height: '10px' } }), qBox);
      const tick = () => { const el = Math.round((Date.now() - started) / 1000); if (deadline) { const left = Math.max(0, Math.round((deadline - Date.now()) / 1000)); timerEl.textContent = `⏱ ${fmtDuration(left)}`; timerEl.className = `chip ${left < 120 ? 'crit' : ''}`; if (left <= 0) { finish(true); } } else timerEl.textContent = `⏱ ${fmtDuration(el)}`; };
      if (timer) clearInterval(timer); timer = setInterval(tick, 500); tick(); renderQ();
    };
    const showResult = (a) => {
      const rows = a.questions.map((d, i) => [String(i + 1), L(MODULES.find((m) => m.id === d.moduleId)), d.text, fmtResponse(d), d.correctAnswer, d.isCorrect ? h('span', { class: 'badge ok' }, '✓') : h('span', { class: 'badge crit' }, '✗')]);
      root.replaceChildren(pageHead(tr('نتيجة الاختبار', 'Exam result'), `${ctx.state.profile.name} · ${fmtDate(a.finishedAt, true)}`),
        h('div', { class: 'card' }, h('div', { class: 'row', style: { gap: '24px' } }, h('div', { class: 'score-ring', style: { '--p': a.percent } }, h('span', null, `${fmtNum(a.percent, 0)}%`)),
          h('div', { class: 'grid cols-3', style: { flex: 1 } }, kpi(tr('النتيجة', 'Result'), a.passed ? tr('ناجح', 'PASS') : tr('راسب', 'FAIL'), '', a.passed ? 'ok' : 'crit'), kpi(tr('الدرجة', 'Score'), `${a.score} / ${a.maxScore}`, tr('نقطة', 'points')), kpi(tr('الوقت', 'Time'), fmtDuration(a.durationSec), ''),
            ...Object.entries(a.byModule).map(([m, v]) => kpi(L(MODULES.find((x) => x.id === m)), `${v.correct}/${v.total}`, ''))))),
        h('div', { class: 'card', style: { marginTop: '14px' } }, h('div', { class: 'row between' }, h('h3', null, tr('تفاصيل الإجابات', 'Answer details')), h('div', { class: 'row' },
          h('button', { class: 'btn sm', onClick: () => exportAttemptPdf(a, ctx) }, icon('print', 14), t('exportPdf')), h('button', { class: 'btn sm', onClick: () => exportAttemptCsv(a, ctx) }, icon('download', 14), t('exportCsv')), h('button', { class: 'btn sm', onClick: () => ctx.api.exporter.json({ filename: `attempt-${a.finishedAt.slice(0, 10)}.json`, data: { profile: ctx.state.profile, attempt: a } }).then((r) => r.ok && toast(t('exported'), 'ok')) }, icon('file', 14), t('exportJson')))),
          table([tr('#', '#'), tr('الوحدة', 'Module'), tr('السؤال', 'Question'), tr('إجابتك', 'Your answer'), tr('الإجابة الصحيحة', 'Correct answer'), ''], rows)),
        h('div', { class: 'row end', style: { marginTop: '14px' } }, h('button', { class: 'btn primary', onClick: showSetup }, tr('اختبار جديد', 'New exam'))));
    };
    if (params.autoStart) startExam(); else showSetup();
  },
};

export function fmtResponse(d) {
  if (d.response === null || d.response === '') return '—';
  if (d.type === 'mcq') return `${tr('خيار', 'option')} ${Number(d.response) + 1}`;
  if (d.type === 'tf') return d.response === true || d.response === 'true' ? tr('صحيح', 'True') : tr('خطأ', 'False');
  return String(d.response);
}
function history(ctx) {
  const attempts = ((ctx.state.results && ctx.state.results.attempts) || []).slice().reverse();
  const box = h('div', { class: 'card', style: { marginTop: '14px' } }, h('div', { class: 'row between' }, h('h3', null, tr('محاولاتك السابقة', 'Your previous attempts')), attempts.length ? h('button', { class: 'btn sm', onClick: () => exportHistoryCsv(attempts, ctx) }, icon('download', 14), t('exportCsv')) : null));
  if (!attempts.length) box.appendChild(h('p', { class: 'muted small' }, tr('لا توجد محاولات بعد.', 'No attempts yet.')));
  else box.appendChild(table([tr('التاريخ', 'Date'), tr('الوحدات', 'Modules'), tr('الأسئلة', 'Questions'), tr('الدرجة', 'Score'), '%', tr('الوقت', 'Time'), tr('النتيجة', 'Result')], attempts.map((a) => [fmtDate(a.finishedAt, true), (a.moduleIds || []).map((m) => L(MODULES.find((x) => x.id === m) || { ar: m, en: m })).join('، '), String(a.questionCount || (a.questions || []).length), `${a.score}/${a.maxScore}`, fmtNum(a.percent, 0), fmtDuration(a.durationSec), a.passed ? h('span', { class: 'badge ok' }, tr('ناجح', 'PASS')) : h('span', { class: 'badge crit' }, tr('راسب', 'FAIL'))]), { numeric: [2, 3, 4] }));
  return box;
}
export async function exportAttemptCsv(a, ctx) {
  const r = await ctx.api.exporter.csv({ filename: `attempt-${ctx.state.profile.name}-${a.finishedAt.slice(0, 10)}.csv`, headers: ['#', tr('الوحدة', 'Module'), tr('السؤال', 'Question'), tr('إجابتك', 'Your answer'), tr('الإجابة الصحيحة', 'Correct'), tr('صحيح؟', 'Correct?'), tr('النقاط', 'Points')], rows: a.questions.map((d, i) => [i + 1, d.moduleId, d.text, d.response ?? '', d.correctAnswer, d.isCorrect ? 1 : 0, d.points]) });
  if (r.ok) toast(`${t('exported')}: ${r.file}`, 'ok');
}
export async function exportHistoryCsv(attempts, ctx, profile = ctx.state.profile) {
  const r = await ctx.api.exporter.csv({ filename: `results-${profile.name}.csv`, headers: [tr('الطالب', 'Student'), tr('الرقم', 'ID'), tr('التاريخ', 'Date'), tr('الوحدات', 'Modules'), tr('الأسئلة', 'Questions'), tr('الدرجة', 'Score'), tr('الحد الأقصى', 'Max'), '%', tr('الوقت (ث)', 'Time (s)'), tr('ناجح', 'Passed')], rows: attempts.map((a) => [profile.name, profile.studentId || '', a.finishedAt, (a.moduleIds || []).join(';'), a.questionCount || (a.questions || []).length, a.score, a.maxScore, Math.round(a.percent), a.durationSec, a.passed ? 1 : 0]) });
  if (r.ok) toast(`${t('exported')}: ${r.file}`, 'ok');
}
export async function exportAttemptPdf(a, ctx, profile = ctx.state.profile) {
  const rows = a.questions.map((d, i) => `<tr><td>${i + 1}</td><td>${esc(d.moduleId)}</td><td>${esc(d.text)}</td><td>${esc(fmtResponse(d))}</td><td>${esc(d.correctAnswer)}</td><td>${d.isCorrect ? '✓' : '✗'}</td></tr>`).join('');
  const body = `<div class="kpis"><div class="kpi">${tr('الطالب', 'Student')}<b>${esc(profile.name)}</b></div><div class="kpi">${tr('الرقم', 'ID')}<b>${esc(profile.studentId || '—')}</b></div><div class="kpi">${tr('الجهة', 'Institution')}<b>${esc(profile.institution || '')}</b></div><div class="kpi">${tr('النتيجة', 'Score')}<b>${Math.round(a.percent)}% (${a.score}/${a.maxScore})</b></div><div class="kpi">${tr('الحالة', 'Status')}<b>${a.passed ? tr('ناجح', 'PASS') : tr('راسب', 'FAIL')}</b></div><div class="kpi">${tr('الوقت', 'Time')}<b>${fmtDuration(a.durationSec)}</b></div><div class="kpi">${tr('التاريخ', 'Date')}<b>${fmtDate(a.finishedAt, true)}</b></div></div>
  <h2>${tr('تفاصيل الإجابات', 'Answer details')}</h2><table><tr><th>#</th><th>${tr('الوحدة', 'Module')}</th><th>${tr('السؤال', 'Question')}</th><th>${tr('الإجابة', 'Answer')}</th><th>${tr('الصحيح', 'Correct')}</th><th></th></tr>${rows}</table>`;
  const r = await ctx.api.exporter.pdf({ filename: `report-${profile.name}-${a.finishedAt.slice(0, 10)}.pdf`, html: reportHtml(tr('تقرير نتيجة اختبار', 'Assessment report'), body, ctx) });
  if (r.ok) toast(`${t('exported')}: ${r.file}`, 'ok');
}
