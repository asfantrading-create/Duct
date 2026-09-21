// Bilingual helpers. Arabic is the default; numbers use Western digits (engineering convention).
let lang = 'ar';
const listeners = new Set();
export function getLang() { return lang; }
export function setLang(l) {
  lang = l === 'en' ? 'en' : 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  listeners.forEach((cb) => cb(lang));
}
export function onLang(cb) { listeners.add(cb); return () => listeners.delete(cb); }
/** Pick a language from {ar, en} (strings pass through). */
export const L = (obj) => (obj == null ? '' : typeof obj === 'string' ? obj : (obj[lang] ?? obj.en ?? obj.ar ?? ''));
export const tr = (ar, en) => (lang === 'ar' ? ar : en);
export function fmtNum(n, digits = 1) {
  if (n === null || n === undefined || !isFinite(n)) return '—';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}
export function fmtInt(n) { return fmtNum(n, 0); }
export function fmtPct(n, digits = 0) { return fmtNum(n, digits) + '%'; }
export function fmtDate(iso, withTime = false) {
  if (!iso) return '—';
  const d = new Date(iso); if (isNaN(d)) return String(iso);
  const date = d.toISOString().slice(0, 10);
  return withTime ? `${date} ${d.toTimeString().slice(0, 5)}` : date;
}
export function fmtDuration(sec) {
  sec = Math.max(0, Math.round(sec || 0));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
export const DICT = {
  appName: { ar: 'التوأم الرقمي لمجاري الهواء', en: 'Duct Digital Twin' },
  company: { ar: 'شركة أصفان', en: 'ASFAN Trading Co.' },
  nav_home: { ar: 'الرئيسية', en: 'Home' }, nav_learn: { ar: 'المكتبة التعليمية', en: 'Learning Library' }, nav_design: { ar: 'مختبر التصميم', en: 'Design Lab' },
  nav_factory: { ar: 'توأم المصنع', en: 'Factory Twin' }, nav_building: { ar: 'توأم شبكة الدكت', en: 'Duct Network Twin' }, nav_fab: { ar: 'التصنيع وضبط الجودة', en: 'Fabrication & QC' },
  nav_quiz: { ar: 'الاختبارات', en: 'Assessments' }, nav_dir: { ar: 'دليل المصانع', en: 'Factory Directory' }, nav_sup: { ar: 'لوحة المشرف', en: 'Supervisor Dashboard' },
  nav_settings: { ar: 'الإعدادات', en: 'Settings' }, nav_about: { ar: 'حول البرنامج', en: 'About' }, nav_modules: { ar: 'الوحدات', en: 'Modules' }, nav_system: { ar: 'النظام', en: 'System' },
  save: { ar: 'حفظ', en: 'Save' }, cancel: { ar: 'إلغاء', en: 'Cancel' }, close: { ar: 'إغلاق', en: 'Close' }, ok: { ar: 'موافق', en: 'OK' }, back: { ar: 'رجوع', en: 'Back' }, next: { ar: 'التالي', en: 'Next' },
  delete: { ar: 'حذف', en: 'Delete' }, edit: { ar: 'تعديل', en: 'Edit' }, add: { ar: 'إضافة', en: 'Add' }, export: { ar: 'تصدير', en: 'Export' }, exportCsv: { ar: 'تصدير CSV', en: 'Export CSV' }, exportJson: { ar: 'تصدير JSON', en: 'Export JSON' }, exportPdf: { ar: 'تصدير PDF', en: 'Export PDF' },
  yes: { ar: 'نعم', en: 'Yes' }, no: { ar: 'لا', en: 'No' }, confirm: { ar: 'تأكيد', en: 'Confirm' }, search: { ar: 'بحث…', en: 'Search…' }, all: { ar: 'الكل', en: 'All' }, none: { ar: 'لا شيء', en: 'None' },
  student: { ar: 'طالب / متدرب', en: 'Student / trainee' }, supervisor: { ar: 'مشرف (سوبر أدمن)', en: 'Supervisor (super admin)' },
  locked: { ar: 'غير مشمول بالترخيص', en: 'Not included in license' }, lockedMsg: { ar: 'هذه الوحدة غير مشمولة بترخيصك الحالي. للتفعيل تواصل مع شركة أصفان.', en: 'This module is not included in your current license. Contact ASFAN to enable it.' },
  saved: { ar: 'تم الحفظ', en: 'Saved' }, exported: { ar: 'تم التصدير', en: 'Exported' }, error: { ar: 'حدث خطأ', en: 'An error occurred' },
  lifetime: { ar: 'مدى الحياة', en: 'Lifetime' }, subscription: { ar: 'محدد المدة', en: 'Time-limited' }, daysLeft: { ar: 'يوم متبقٍ', en: 'days left' },
  switchProfile: { ar: 'تبديل المستخدم', en: 'Switch user' }, logout: { ar: 'خروج', en: 'Sign out' },
  updAvailable: { ar: 'يتوفر تحديث جديد', en: 'A new update is available' }, updDownload: { ar: 'تنزيل التحديث', en: 'Download update' }, updInstall: { ar: 'إعادة التشغيل والتثبيت', en: 'Restart & install' }, updDownloading: { ar: 'جارٍ التنزيل', en: 'Downloading' }, updLater: { ar: 'لاحقاً', en: 'Later' },
  updCheck: { ar: 'التحقق من التحديثات', en: 'Check for updates' }, updUpToDate: { ar: 'لديك أحدث إصدار', en: 'You have the latest version' }, updChecking: { ar: 'جارٍ التحقق…', en: 'Checking…' }, updDisabled: { ar: 'التحديثات التلقائية تعمل في النسخة المثبتة فقط', en: 'Auto-update works in the installed build only' },
  contact: { ar: 'تواصل معنا', en: 'Contact us' }, whatsapp: { ar: 'واتساب', en: 'WhatsApp' }, email: { ar: 'البريد الإلكتروني', en: 'E-mail' },
};
export const t = (key) => L(DICT[key]) || key;
