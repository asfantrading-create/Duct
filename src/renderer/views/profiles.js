import { h, icon, toast, modal, promptDialog, confirmDialog, field, asfanLogo } from '../ui.js';
import { t, tr, fmtDate } from '../i18n.js';
import { licenseLong } from '../license-ui.js';
import { isSupervisorLicense } from '../state.js';
import { langToggle } from './activation.js';

export default {
  render(container, ctx) {
    const st = ctx.state; const lic = st.license.payload;
    const students = st.profiles.filter((p) => p.role === 'student');
    const seatsFull = lic.seats && students.length >= lic.seats;

    const openProfile = async (p) => { await ctx.setProfile(p); ctx.navigate('home'); };

    const addStudent = () => {
      const name = h('input', { type: 'text', placeholder: tr('الاسم الكامل', 'Full name') });
      const sid = h('input', { type: 'text', placeholder: tr('الرقم الجامعي / رقم الموظف', 'Student / employee ID'), class: 'ltr' });
      const inst = h('input', { type: 'text', value: lic.name || '' });
      const cls = h('input', { type: 'text', placeholder: tr('رمز الفصل من المشرف (اختياري)', 'Class code from supervisor (optional)'), class: 'ltr' });
      const email = h('input', { type: 'email', placeholder: 'name@example.com', class: 'ltr' });
      modal({ title: tr('طالب / متدرب جديد', 'New student / trainee'), body: h('div', null,
        seatsFull ? h('div', { class: 'alert warn small', style: { marginBottom: '10px' } }, tr(`تجاوزت عدد المقاعد المرخّصة (${lic.seats}).`, `Licensed seats (${lic.seats}) exceeded.`)) : null,
        field(tr('الاسم', 'Name'), name), field(tr('الرقم الجامعي', 'Student ID'), sid), field(tr('الجهة / المؤسسة', 'Institution'), inst), field(tr('رمز الفصل', 'Class code'), cls), field(tr('البريد الإلكتروني (اختياري)', 'E-mail (optional)'), email)),
        actions: [{ label: t('cancel') }, { label: t('add'), primary: true, onClick: async () => {
          if (!name.value.trim()) { name.focus(); return false; }
          const p = await ctx.api.profiles.create({ name: name.value, studentId: sid.value, institution: inst.value, classCode: cls.value, email: email.value, role: 'student' });
          await ctx.reloadCore(); toast(t('saved'), 'ok'); openProfile(p);
        } }] });
      setTimeout(() => name.focus(), 30);
    };

    const supervisorLogin = async () => {
      const hasPin = await ctx.api.supervisor.hasPin();
      if (!hasPin) {
        const p1 = h('input', { type: 'password', class: 'ltr', placeholder: '••••' }); const p2 = h('input', { type: 'password', class: 'ltr', placeholder: '••••' }); const nm = h('input', { type: 'text', value: tr('المشرف', 'Supervisor') });
        modal({ title: tr('إنشاء رمز PIN للمشرف', 'Create supervisor PIN'), body: h('div', null, h('p', { class: 'muted small' }, tr('هذا الرمز يحمي لوحة المشرف على هذا الجهاز. لا تشاركه مع الطلاب.', 'This PIN protects the supervisor dashboard on this computer. Do not share it with students.')), field(tr('اسم المشرف', 'Supervisor name'), nm), field(tr('رمز PIN (4 أرقام أو أكثر)', 'PIN (4+ digits)'), p1), field(tr('تأكيد الرمز', 'Confirm PIN'), p2)),
          actions: [{ label: t('cancel') }, { label: t('save'), primary: true, onClick: async () => {
            if (p1.value.length < 4 || p1.value !== p2.value) { toast(tr('الرمزان غير متطابقين أو قصيران', 'PINs do not match or are too short'), 'crit'); return false; }
            await ctx.api.supervisor.setPin(p1.value);
            let sup = st.profiles.find((p) => p.role === 'supervisor');
            if (!sup) sup = await ctx.api.profiles.create({ name: nm.value || 'Supervisor', institution: lic.name || '', role: 'supervisor' });
            await ctx.reloadCore(); openProfile(sup);
          } }] });
        return;
      }
      const pin = await promptDialog({ title: tr('دخول المشرف', 'Supervisor sign-in'), label: tr('رمز PIN', 'PIN'), type: 'password' });
      if (pin === null) return;
      if (!(await ctx.api.supervisor.verifyPin(pin))) { toast(tr('رمز غير صحيح', 'Incorrect PIN'), 'crit'); return; }
      let sup = st.profiles.find((p) => p.role === 'supervisor');
      if (!sup) { sup = await ctx.api.profiles.create({ name: tr('المشرف', 'Supervisor'), institution: lic.name || '', role: 'supervisor' }); await ctx.reloadCore(); }
      openProfile(sup);
    };

    const removeStudent = async (p, e) => {
      e.stopPropagation();
      if (!(await confirmDialog(tr(`حذف الملف «${p.name}» وجميع نتائجه من هذا الجهاز؟`, `Delete “${p.name}” and all of their results from this computer?`), { danger: true }))) return;
      await ctx.api.profiles.remove(p.id); await ctx.reloadCore(); ctx.navigate('profiles');
    };

    const tiles = students.sort((a, b) => String(b.lastActiveAt).localeCompare(String(a.lastActiveAt))).map((p) => h('div', { class: 'profile-tile', onClick: () => openProfile(p) },
      h('div', { class: 'avatar' }, (p.name || '?').trim().charAt(0)),
      h('div', { style: { flex: 1 } }, h('div', null, h('strong', null, p.name)), h('div', { class: 'small muted' }, [p.studentId, p.classCode ? `${tr('فصل', 'class')} ${p.classCode}` : null, `${tr('آخر نشاط', 'last active')} ${fmtDate(p.lastActiveAt)}`].filter(Boolean).join(' · '))),
      isSupervisorLicense() ? h('button', { class: 'btn ghost sm', title: t('delete'), onClick: (e) => removeStudent(p, e) }, icon('trash', 14)) : null));

    const left = h('div', { class: 'side' },
      h('img', { src: 'assets/app-logo-256.png', alt: 'Duct Digital Twin', class: 'app-logo' }),
      h('h1', null, tr('مرحباً بك', 'Welcome')),
      h('div', null, h('div', { class: 'muted small' }, tr('الجهة المرخّصة', 'Licensed to')), h('strong', { style: { fontSize: '16px' } }, lic.name)),
      h('div', { class: 'row' }, h('span', { class: 'chip ok' }, licenseLong({ payload: lic, daysLeft: ctx.state.license && ctx.state.license.daysLeft })), lic.role === 'supervisor' ? h('span', { class: 'chip' }, icon('shield', 14), tr('ترخيص مشرف', 'Supervisor license')) : null, lic.seats ? h('span', { class: 'chip' }, `${students.length}/${lic.seats} ${tr('مقعد', 'seats')}`) : null),
      isSupervisorLicense() ? h('div', { class: 'card' }, h('h3', null, icon('shield', 18), ' ', tr('المشرف / المدرّس', 'Supervisor / teacher')), h('p', { class: 'muted small' }, tr('لوحة المشرف تعرض نتائج جميع الطلاب وتصدر التقارير وتدير الفصول.', 'The supervisor dashboard shows all students’ results, exports reports and manages classes.')), h('button', { class: 'btn primary', onClick: supervisorLogin }, icon('lock', 16), tr('دخول المشرف', 'Supervisor sign-in'))) : h('p', { class: 'muted small' }, tr('هذا ترخيص متدرب. للحصول على لوحة المشرف تواصل مع أصفان.', 'This is a trainee license. Contact ASFAN for a supervisor license.')),
      h('div', { class: 'grow', style: { flex: 1 } }), h('div', { class: 'row between' }, langToggle(ctx), h('div', { class: 'signature' }, tr('من إنتاج', 'Produced by'), h('img', { src: asfanLogo(), alt: 'ASFAN', class: 'asfan-sig' }))));
    const right = h('div', { class: 'form' },
      h('div', { class: 'row between' }, h('h2', null, tr('اختر ملفك', 'Choose your profile')), h('button', { class: 'btn primary', onClick: addStudent }, icon('plus', 16), tr('طالب جديد', 'New student'))),
      tiles.length ? h('div', { class: 'stack', style: { maxHeight: '60vh', overflow: 'auto' } }, tiles) : h('div', { class: 'alert info' }, icon('info'), h('div', null, tr('لا توجد ملفات بعد. أنشئ ملف طالب للبدء؛ تُحفظ نتائج كل طالب باسمه على هذا الجهاز.', 'No profiles yet. Create a student profile to start; each student’s results are saved under their name on this computer.'))));
    container.appendChild(h('div', { class: 'center-page' }, h('div', { class: 'auth-card' }, left, right)));
  },
};
