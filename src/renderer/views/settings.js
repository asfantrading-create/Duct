import { h, icon, toast, confirmDialog, modal, field, select, pageHead } from '../ui.js';
import { t, tr, fmtDate } from '../i18n.js';
import { licenseLong } from '../license-ui.js';
import { isSupervisorSession } from '../state.js';
import { CITIES } from '../../shared/data/climate.js';

export default {
  render(container, ctx) {
    const st = ctx.state; const s = st.settings; const info = st.info || {}; const lic = st.license;
    container.appendChild(pageHead(t('nav_settings'), tr('التفضيلات، الفصل الدراسي، التحديثات، الترخيص', 'Preferences, classroom, updates, license')));

    // preferences
    const prefs = h('div', { class: 'card' }, h('h3', null, tr('التفضيلات', 'Preferences')), h('div', { class: 'grid cols-2' },
      field(tr('اللغة', 'Language'), select([{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }], s.lang, (v) => ctx.setSetting({ lang: v }).then(() => ctx.navigate('settings')))),
      field(tr('المظهر', 'Theme'), select([{ value: 'dark', label: tr('ليلي', 'Dark') }, { value: 'light', label: tr('نهاري', 'Light') }], s.theme, (v) => ctx.setSetting({ theme: v }))),
      field(tr('وحدات العرض الإضافية', 'Secondary units'), select([{ value: 'si', label: tr('النظام الدولي فقط (SI)', 'SI only') }, { value: 'ip', label: tr('إظهار الوحدات الإنجليزية أيضاً (CFM, in. w.g., fpm)', 'Also show IP units (CFM, in. w.g., fpm)') }], s.units, (v) => ctx.setSetting({ units: v }))),
      field(tr('المدينة الافتراضية (مناخ التصميم)', 'Default city (design climate)'), select(CITIES.map((c) => ({ value: c.id, label: `${tr(c.city_ar, c.city_en)} — ${c.country_code}` })), s.city, (v) => ctx.setSetting({ city: v })))));
    container.appendChild(prefs);

    // classroom
    const classroom = h('div', { class: 'card' });
    const renderClassroom = async () => {
      const cs = await ctx.api.classroom.status();
      classroom.replaceChildren(h('h3', null, icon('folder', 16), ' ', tr('مجلد الفصل المشترك', 'Shared classroom folder')),
        h('p', { class: 'small muted' }, tr('عند تحديد مجلد مشترك (على الشبكة مثل \\\\server\\duct أو مجلد سحابي متزامن) تُنسخ نتائج كل طالب إليه تلقائياً، فيستطيع المشرف على جهاز آخر رؤية جميع الطلاب من لوحة المشرف. اختر المجلد نفسه على أجهزة الطلاب والمشرف.', 'When a shared folder is set (a network share such as \\\\server\\duct or a synced cloud folder), each student’s results are mirrored to it automatically, so a supervisor on another PC sees all students in the dashboard. Choose the same folder on the students’ and the supervisor’s computers.')),
        !ctx.isElectron ? h('div', { class: 'alert info small' }, tr('متاح في النسخة المثبتة على ويندوز.', 'Available in the installed Windows build.')) :
        h('div', { class: 'row' }, h('code', { style: { flex: 1 } }, cs.configured ? cs.folder : tr('غير محدد', 'Not set')),
          cs.configured ? h('span', { class: `badge ${cs.writable ? 'ok' : 'crit'}` }, cs.writable ? tr('متاح للكتابة', 'writable') : tr('غير متاح', 'unavailable')) : null,
          cs.configured ? h('span', { class: 'badge' }, `${cs.files} ${tr('ملف نتائج', 'result files')}`) : null,
          h('button', { class: 'btn sm', onClick: async () => { await ctx.api.classroom.chooseFolder(); renderClassroom(); } }, icon('folder', 14), tr('اختيار مجلد', 'Choose folder')),
          cs.configured ? h('button', { class: 'btn sm', onClick: async () => { const r = await ctx.api.classroom.syncNow(); toast(`${tr('تمت مزامنة', 'Synced')} ${r.mirrored}`, 'ok'); renderClassroom(); } }, icon('refresh', 14), tr('مزامنة الآن', 'Sync now')) : null,
          cs.configured ? h('button', { class: 'btn sm danger', onClick: async () => { await ctx.api.classroom.setFolder(null); renderClassroom(); } }, icon('x', 14), tr('إلغاء', 'Clear')) : null));
    };
    renderClassroom();
    container.appendChild(classroom);

    // updates
    const upd = h('div', { class: 'card' });
    const renderUpd = () => {
      const u = st.updates || {};
      const statusText = { disabled: t('updDisabled'), idle: tr('لم يتم التحقق بعد', 'Not checked yet'), checking: t('updChecking'), 'up-to-date': t('updUpToDate'), available: `${t('updAvailable')} — v${u.version}`, downloading: `${t('updDownloading')} ${u.percent || 0}%`, downloaded: tr('تم تنزيل التحديث — أعد التشغيل للتثبيت', 'Update downloaded — restart to install'), error: `${t('error')}: ${u.error || ''}` }[u.status] || u.status;
      upd.replaceChildren(h('h3', null, icon('download', 16), ' ', tr('التحديثات', 'Updates')),
        h('div', { class: 'row between' }, h('div', null, h('div', null, `${tr('الإصدار الحالي', 'Current version')}: `, h('strong', { class: 'ltr' }, `v${info.version || ''}`)), h('div', { class: 'small muted' }, statusText), u.lastCheck ? h('div', { class: 'tiny muted' }, `${tr('آخر تحقق', 'Last check')}: ${fmtDate(u.lastCheck, true)}`) : null),
          h('div', { class: 'row' },
            u.status === 'available' ? h('button', { class: 'btn primary', onClick: () => ctx.api.updates.download() }, icon('download', 14), t('updDownload')) : null,
            u.status === 'downloaded' ? h('button', { class: 'btn primary', onClick: () => ctx.api.updates.install() }, icon('refresh', 14), t('updInstall')) : null,
            h('button', { class: 'btn', disabled: u.status === 'disabled' || u.status === 'checking', onClick: async () => { await ctx.api.updates.check(); toast(t('updChecking')); } }, icon('refresh', 14), t('updCheck')))),
        h('label', { class: 'check', style: { marginTop: '10px' } }, h('input', { type: 'checkbox', checked: !!s.autoDownloadUpdates, onChange: (e) => ctx.setSetting({ autoDownloadUpdates: e.target.checked }) }), tr('تنزيل التحديثات تلقائياً في الخلفية (يُطلب منك إعادة التشغيل فقط)', 'Download updates automatically in the background (you are only asked to restart)')),
        h('p', { class: 'tiny muted', style: { marginTop: '8px' } }, tr('يتحقق البرنامج من التحديثات عند التشغيل ثم كل 6 ساعات عبر GitHub Releases الخاصة بأصفان.', 'The app checks for updates at start-up and every 6 hours via ASFAN’s GitHub Releases.')));
    };
    renderUpd();
    container.appendChild(upd);

    // license
    const p = lic.payload;
    container.appendChild(h('div', { class: 'card' }, h('h3', null, icon('key', 16), ' ', tr('الترخيص', 'License')),
      h('div', { class: 'grid cols-2' },
        kv(tr('الجهة', 'Licensee'), p.name), kv(tr('النوع', 'Type'), licenseLong(lic)),
        kv(tr('معرّف الترخيص', 'License ID'), h('code', { class: 'small' }, p.id)), kv(tr('معرّف هذا الجهاز', 'This machine ID'), h('code', null, info.machineId)),
        kv(tr('تاريخ التفعيل', 'Activated on'), fmtDate(lic.activatedAt)), kv(tr('البريد', 'E-mail'), p.email || '—')),
      h('div', { class: 'row', style: { marginTop: '10px' } },
        h('button', { class: 'btn', onClick: () => { navigator.clipboard.writeText(info.machineId || ''); toast(tr('تم النسخ', 'Copied'), 'ok'); } }, tr('نسخ معرّف الجهاز', 'Copy machine ID')),
        h('button', { class: 'btn', onClick: () => { ctx.navigate('activation'); } }, icon('key', 14), tr('إدخال مفتاح آخر', 'Enter another key')),
        h('button', { class: 'btn danger', onClick: async () => { if (await confirmDialog(tr('إزالة الترخيص من هذا الجهاز؟ ستحتاج المفتاح لإعادة التفعيل.', 'Remove the license from this computer? You will need the key to activate again.'), { danger: true })) { await ctx.api.license.remove(); await ctx.reloadCore(); await ctx.setProfile(null); ctx.navigate('activation'); } } }, icon('trash', 14), tr('إزالة الترخيص', 'Remove license')))));

    // supervisor PIN
    if (isSupervisorSession()) container.appendChild(h('div', { class: 'card' }, h('h3', null, icon('shield', 16), ' ', tr('رمز المشرف', 'Supervisor PIN')),
      h('button', { class: 'btn', onClick: () => {
        const p1 = h('input', { type: 'password', class: 'ltr' }); const p2 = h('input', { type: 'password', class: 'ltr' });
        modal({ title: tr('تغيير رمز PIN', 'Change PIN'), body: h('div', null, field(tr('الرمز الجديد', 'New PIN'), p1), field(tr('تأكيد', 'Confirm'), p2)), actions: [{ label: t('cancel') }, { label: t('save'), primary: true, onClick: async () => { if (p1.value.length < 4 || p1.value !== p2.value) { toast(tr('غير متطابق', 'Mismatch'), 'crit'); return false; } await ctx.api.supervisor.setPin(p1.value); toast(t('saved'), 'ok'); } }] });
      } }, tr('تغيير الرمز', 'Change PIN'))));

    // storage
    container.appendChild(h('div', { class: 'card' }, h('h3', null, icon('folder', 16), ' ', tr('التخزين والملفات', 'Storage & files')),
      h('div', { class: 'grid cols-2' }, kv(tr('مجلد التصدير الافتراضي', 'Default export folder'), h('code', { class: 'small' }, info.exportsDir || '')), kv(tr('مجلد بيانات البرنامج', 'App data folder'), h('code', { class: 'small' }, info.userData || ''))),
      ctx.isElectron ? h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn sm', onClick: () => ctx.api.app.openPath(info.exportsDir) }, icon('folder', 14), tr('فتح مجلد التصدير', 'Open exports folder')), h('button', { class: 'btn sm', onClick: () => ctx.api.app.openPath(info.userData) }, icon('folder', 14), tr('فتح مجلد البيانات', 'Open data folder'))) : null));
  },
};
function kv(k, v) { return h('div', null, h('div', { class: 'small muted' }, k), h('div', null, v)); }
