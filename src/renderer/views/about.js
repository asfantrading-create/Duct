import { h, icon, pageHead, asfanLogo } from '../ui.js';
import { t, tr } from '../i18n.js';
import { contactBlock } from '../app.js';

export default {
  render(container, ctx) {
    const info = ctx.state.info || {};
    container.appendChild(pageHead(t('nav_about'), 'ASFAN Duct Digital Twin'));
    container.appendChild(h('div', { class: 'card', style: { textAlign: 'center', padding: '30px' } },
      h('img', { src: 'assets/app-logo-256.png', alt: 'Duct Digital Twin', style: { height: '110px', borderRadius: '24px' } }),
      h('h2', { style: { marginTop: '14px' } }, t('appName')),
      h('div', { class: 'row', style: { justifyContent: 'center', gap: '8px', color: 'var(--muted)' } }, tr('من إنتاج', 'Produced by'), h('img', { src: asfanLogo(), alt: 'ASFAN', style: { height: '26px' } })),
      h('p', { class: 'muted' }, tr('برنامج تعليمي لمحاكاة مصانع وشبكات مجاري الهواء (Duct) لأنظمة التكييف — توأم رقمي ببيانات هندسية حقيقية.', 'Educational simulator for HVAC duct factories and duct networks — a digital twin built on real engineering data.')),
      h('div', { class: 'row', style: { justifyContent: 'center' } }, h('span', { class: 'chip' }, `v${info.version || ''}`), info.electron ? h('span', { class: 'chip' }, `Electron ${info.electron}`) : null, info.chrome ? h('span', { class: 'chip' }, `Chromium ${info.chrome}`) : null, h('span', { class: 'chip' }, `${info.platform || ''} ${info.arch || ''}`)),
      h('div', { style: { marginTop: '16px', display: 'inline-block', textAlign: 'start' } }, contactBlock()),
      h('p', { class: 'muted small', style: { marginTop: '16px' } }, '© 2026 ASFAN Trading Co. — شركة أصفان. ', tr('جميع الحقوق محفوظة.', 'All rights reserved.'))));
    container.appendChild(h('div', { class: 'grid cols-2', style: { marginTop: '14px' } },
      h('div', { class: 'card' }, h('h3', null, tr('المراجع الهندسية', 'Engineering references')), h('ul', { class: 'small' },
        h('li', null, 'ASHRAE Handbook — Fundamentals, Duct Design chapter (Altshul–Tsal friction factor, Huebscher equivalent diameter, roughness classes).'),
        h('li', null, 'SMACNA HVAC Duct Construction Standards — Metal and Flexible; SMACNA HVAC Air Duct Leakage Test Manual (leakage & seal classes).'),
        h('li', null, 'BESA/HVCA DW/144 Specification for Sheet Metal Ductwork (pressure classes, sheet thickness).'),
        h('li', null, 'EN 1507 / EN 12237 (duct strength and leakage), EN 1506 (round duct dimensions), UL 181 (air ducts and connectors).'),
        h('li', null, tr('بيانات مناخ التصميم: ASHRAE Climatic Design Conditions (قيم تقريبية للأغراض التعليمية).', 'Climate design data: ASHRAE Climatic Design Conditions (approximate values for educational use).')))),
      h('div', { class: 'card' }, h('h3', null, tr('إخلاء مسؤولية', 'Disclaimer')), h('p', { class: 'small muted' }, tr('المحاكاة والحسابات والبيانات المرجعية مقدَّمة للتعليم والتدريب فقط، وليست بديلاً عن التصميم الهندسي المعتمد أو المواصفات الرسمية. النموذج ثلاثي الأبعاد للمصنع تمثيل نموذجي لمصنع دكت وليس مخططاً هندسياً لمصنع معيّن. بيانات دليل المصانع جُمعت من مصادر منشورة علناً بتاريخ التحديث المذكور وقد تتغير.', 'The simulation, calculations and reference data are for education and training only and are not a substitute for certified engineering design or the official standards. The 3D factory is a representative model of a duct factory, not the engineering drawing of a specific plant. Factory directory data was collected from publicly published sources on the stated date and may change.')),
        h('h3', { style: { marginTop: '12px' } }, tr('مكونات مفتوحة المصدر', 'Open-source components')), h('p', { class: 'small muted ltr' }, 'Electron, electron-updater, three.js, esbuild — under their respective licenses.'))));
  },
};
