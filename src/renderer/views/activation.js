import { h, icon, toast, asfanLogo } from '../ui.js';
import { t, tr, L, fmtDate } from '../i18n.js';
import { contactBlock } from '../app.js';

const STATUS_MSG = {
  malformed: { ar: 'صيغة المفتاح غير صحيحة. تأكد من نسخ المفتاح كاملاً (يبدأ بـ ADDT1-).', en: 'The key format is invalid. Make sure you copied the whole key (it starts with ADDT1-).' },
  bad_signature: { ar: 'المفتاح غير صالح: التوقيع الرقمي لا يطابق. تواصل مع أصفان.', en: 'Invalid key: the digital signature does not match. Contact ASFAN.' },
  expired: { ar: 'انتهت صلاحية هذا الترخيص. للتجديد تواصل مع شركة أصفان.', en: 'This license has expired. Contact ASFAN to renew.' },
  not_yet_valid: { ar: 'تاريخ إصدار الترخيص لاحق لتاريخ اليوم. تحقق من ساعة الجهاز.', en: 'The license issue date is in the future. Check the computer clock.' },
  machine_mismatch: { ar: 'هذا الترخيص مربوط بجهاز آخر. أرسل معرّف جهازك إلى أصفان لإصدار ترخيص لهذا الجهاز.', en: 'This license is bound to another computer. Send your machine ID to ASFAN to issue a license for this device.' },
  clock_rollback: { ar: 'تم اكتشاف إرجاع ساعة النظام إلى الخلف. اضبط التاريخ والوقت الصحيحين ثم أعد تشغيل البرنامج.', en: 'The system clock appears to have been set back. Set the correct date and time, then restart.' },
  canceled: { ar: '', en: '' },
};

export default {
  render(container, ctx) {
    const st = ctx.state; const lic = st.license; const info = st.info || {};
    const keyInput = h('textarea', { placeholder: 'ADDT1-…', class: 'mono', style: { minHeight: '120px', direction: 'ltr' } });
    const msg = h('div', { class: 'small', style: { minHeight: '20px' } });
    const showStatus = (r) => {
      if (!r) return;
      if (r.ok) { msg.className = 'alert ok'; msg.textContent = tr('تم تفعيل الترخيص بنجاح', 'License activated successfully'); return; }
      if (r.status === 'canceled') return;
      msg.className = 'alert crit'; msg.textContent = L(STATUS_MSG[r.status] || { ar: t('error'), en: t('error') });
      if (r.status === 'expired' && r.payload) msg.textContent += ` (${fmtDate(r.payload.expires)})`;
    };
    const activate = async (key) => {
      const r = await ctx.api.license.activate(key);
      showStatus(r);
      if (r.ok) { toast(tr('تم التفعيل', 'Activated'), 'ok'); await ctx.reloadCore(); ctx.navigate('profiles'); }
    };
    const machine = info.machineId || '';
    const left = h('div', { class: 'side' },
      h('img', { src: 'assets/app-logo-256.png', alt: 'Duct Digital Twin', class: 'app-logo' }),
      h('h1', null, t('appName')), h('p', { class: 'muted' }, tr('محاكاة رقمية تعليمية لمصانع وشبكات مجاري الهواء (Duct) لأنظمة التكييف', 'Educational digital-twin simulator for HVAC duct factories and duct networks')),
      h('ul', null, [tr('توأم رقمي ثلاثي الأبعاد لمصنع الدكت وخط الإنتاج', '3D digital twin of a duct factory and its production line'), tr('محاكاة شبكة مجاري الهواء: ضغط، سرعة، تسرب، اكتساب حراري', 'Duct-network simulation: pressure, velocity, leakage, heat gain'), tr('مكتبة تعليمية واختبارات وتقارير للطلاب والمشرفين', 'Learning library, assessments and reports for students and supervisors'), tr('دليل مصانع الدكت في الوطن العربي وبيانات مناخ التصميم', 'Arab-world duct factory directory and climate design data')].map((x) => h('li', null, x))),
      h('div', { class: 'card', style: { padding: '10px 12px' } }, h('div', { class: 'small muted' }, tr('معرّف هذا الجهاز (أرسله لأصفان عند طلب ترخيص مربوط بالجهاز):', 'This machine ID (send it to ASFAN when requesting a machine-bound license):')), h('div', { class: 'row' }, h('code', { style: { fontSize: '15px' } }, machine), h('button', { class: 'btn sm', onClick: () => { navigator.clipboard.writeText(machine); toast(tr('تم نسخ معرّف الجهاز', 'Machine ID copied'), 'ok'); } }, tr('نسخ', 'Copy')))),
      h('div', null, h('h4', null, t('contact')), contactBlock()),
      h('div', { class: 'signature' }, tr('من إنتاج', 'Produced by'), h('img', { src: asfanLogo(), alt: 'ASFAN', class: 'asfan-sig' })));
    const right = h('div', { class: 'form' },
      h('div', { class: 'row between' }, h('h2', null, tr('تفعيل الترخيص', 'Activate license')), langToggle(ctx)),
      lic && !lic.ok && lic.status !== 'malformed' ? h('div', { class: 'alert crit', style: { marginBottom: '12px' } }, icon('alert'), h('div', null, h('strong', null, lic.payload ? lic.payload.name : ''), h('div', null, L(STATUS_MSG[lic.status] || {})), lic.payload && lic.payload.expires ? h('div', { class: 'small' }, `${tr('تاريخ الانتهاء', 'Expiry')}: ${fmtDate(lic.payload.expires)}`) : null)) : null,
      h('p', { class: 'muted small' }, tr('ألصق مفتاح الترخيص الذي استلمته من شركة أصفان، أو حمّل ملف الترخيص (.lic).', 'Paste the license key you received from ASFAN, or load the license file (.lic).')),
      keyInput, msg,
      h('div', { class: 'row', style: { marginTop: '12px' } },
        h('button', { class: 'btn primary lg', onClick: () => { const k = keyInput.value.trim(); if (!k) { showStatus({ status: 'malformed' }); return; } activate(k); } }, icon('key', 18), tr('تفعيل', 'Activate')),
        ctx.isElectron ? h('button', { class: 'btn lg', onClick: async () => { const r = await ctx.api.license.activateFile(); showStatus(r); if (r.ok) { await ctx.reloadCore(); ctx.navigate('profiles'); } } }, icon('file', 18), tr('تحميل ملف .lic', 'Load .lic file')) : null),
      h('p', { class: 'muted tiny', style: { marginTop: '18px' } }, tr('يمكن أن يكون الترخيص مدى الحياة أو محدداً بتاريخ انتهاء، وقد يكون مربوطاً بهذا الجهاز أو مقصوراً على وحدات معيّنة. يحدد ترخيص «المشرف» صلاحيات المدرّس لرؤية نتائج جميع الطلاب.', 'A license can be lifetime or time-limited, bound to this computer or restricted to certain modules. A “supervisor” license gives the teacher access to all students’ results.')));
    container.appendChild(h('div', { class: 'center-page' }, h('div', { class: 'auth-card' }, left, right)));
  },
};

export function langToggle(ctx) {
  return h('div', { class: 'row' },
    h('button', { class: 'btn ghost sm', onClick: () => ctx.setSetting({ lang: ctx.state.settings.lang === 'ar' ? 'en' : 'ar' }).then(() => ctx.navigate(ctx.state.route)) }, icon('globe', 14), ctx.state.settings.lang === 'ar' ? 'English' : 'العربية'),
    h('button', { class: 'btn ghost sm', onClick: () => ctx.setSetting({ theme: ctx.state.settings.theme === 'light' ? 'dark' : 'light' }).then(() => ctx.navigate(ctx.state.route)) }, icon(ctx.state.settings.theme === 'light' ? 'moon' : 'sun', 14)));
}
