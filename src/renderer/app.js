// Application shell: boot, routing, top bar, sidebar, update banner.
import { api, isElectron } from './api.js';
import { getState, setState, subscribe, isSupervisorLicense, isSupervisorSession, moduleLicensed } from './state.js';
import { t, L, tr, setLang, getLang, fmtNum } from './i18n.js';
import { h, clear, icon, toast, modal, asfanLogo } from './ui.js';
import activation from './views/activation.js';
import profiles from './views/profiles.js';
import home from './views/home.js';
import learn from './views/learn.js';
import design from './views/design.js';
import factory from './views/factory.js';
import building from './views/building.js';
import fabrication from './views/fabrication.js';
import assessment from './views/assessment.js';
import directory from './views/directory.js';
import supervisor from './views/supervisor.js';
import settings from './views/settings.js';
import about from './views/about.js';
import guide from './views/guide.js';
import gallery from './views/gallery.js';
import { showHelp } from './help.js';

const VIEWS = { activation, profiles, home, learn, design, factory, building, fabrication, assessment, directory, supervisor, settings, about, guide, gallery };
const ROUTE_MODULE = { learn: 'LEARN', gallery: 'LEARN', design: 'DESIGN_LAB', factory: 'FACTORY_TWIN', building: 'BUILDING_TWIN', fabrication: 'FABRICATION_QC', assessment: 'ASSESSMENT' };
const NAV = [
  { section: 'nav_modules' },
  { route: 'home', icon: 'home', label: 'nav_home' },
  { route: 'learn', icon: 'book', label: 'nav_learn' },
  { route: 'gallery', icon: 'layers', label: 'nav_gallery' },
  { route: 'design', icon: 'ruler', label: 'nav_design' },
  { route: 'factory', icon: 'factory', label: 'nav_factory' },
  { route: 'building', icon: 'building', label: 'nav_building' },
  { route: 'fabrication', icon: 'wrench', label: 'nav_fab' },
  { route: 'assessment', icon: 'clipboard', label: 'nav_quiz' },
  { route: 'directory', icon: 'map', label: 'nav_dir' },
  { section: 'nav_system' },
  { route: 'guide', icon: 'book', label: 'nav_guide' },
  { route: 'supervisor', icon: 'users', label: 'nav_sup', supervisorOnly: true },
  { route: 'settings', icon: 'settings', label: 'nav_settings' },
  { route: 'about', icon: 'info', label: 'nav_about' },
];

let currentView = null;
let mainEl = null;
const appEl = document.getElementById('app');

const ctx = {
  api, isElectron, navigate, t, L, tr,
  get state() { return getState(); },
  async reloadCore() {
    const [license, profilesList, settingsObj, info] = await Promise.all([api.license.get(), api.profiles.list(), api.settings.get(), api.app.getInfo()]);
    setState({ license, profiles: profilesList, settings: settingsObj, info });
    return getState();
  },
  async setProfile(profile) {
    setState({ profile });
    if (profile) { const results = await api.results.get(profile.id); setState({ results }); api.profiles.update(profile.id, { lastActiveAt: new Date().toISOString() }); }
    else setState({ results: null });
  },
  async refreshResults() { const p = getState().profile; if (p) setState({ results: await api.results.get(p.id) }); return getState().results; },
  async setSetting(patch) {
    const s = await api.settings.set(patch); setState({ settings: s }); applyPrefs();
    const st = getState();
    if (patch && 'lang' in patch && st.route) await navigate(st.route, st.routeParams); // re-render everything in the new language
    else renderShell();
    return s;
  },
  async setZoom(dir) {
    const cur = Number(getState().settings.uiZoom) || 1;
    const next = dir === 0 ? 1 : Math.min(1.6, Math.max(0.8, Math.round((cur + dir * 0.1) * 10) / 10));
    await api.settings.set({ uiZoom: next }); setState({ settings: { ...getState().settings, uiZoom: next } }); applyPrefs();
  },
  lockedModal(moduleId) {
    modal({ title: t('locked'), body: h('div', { class: 'stack' }, h('p', null, t('lockedMsg')), contactBlock()), actions: [{ label: t('close'), primary: true }] });
  },
};

export function contactBlock() {
  const c = (getState().info && getState().info.company) || { email: 'info@asfanco.com', whatsapp: '+962776140404', whatsappUrl: 'https://wa.me/962776140404' };
  return h('div', { class: 'contact' },
    h('a', { href: '#', onClick: (e) => { e.preventDefault(); api.app.openExternal(c.whatsappUrl); } }, icon('phone', 16), h('span', { class: 'ltr' }, `WhatsApp ${c.whatsapp}`)),
    h('a', { href: '#', onClick: (e) => { e.preventDefault(); api.app.openExternal('mailto:' + c.email); } }, icon('mail', 16), h('span', { class: 'ltr' }, c.email)));
}

function applyPrefs() {
  const s = getState().settings || {};
  setLang(s.lang || 'ar');
  document.documentElement.dataset.theme = s.theme === 'light' ? 'light' : 'dark';
  document.body.style.zoom = String(Number(s.uiZoom) || 1);
}
// Ctrl+= / Ctrl+- / Ctrl+0 keyboard zoom
window.addEventListener('keydown', (e) => { if (!e.ctrlKey) return; if (e.key === '=' || e.key === '+') { e.preventDefault(); ctx.setZoom(1); } else if (e.key === '-') { e.preventDefault(); ctx.setZoom(-1); } else if (e.key === '0') { e.preventDefault(); ctx.setZoom(0); } });

function licenseChip() {
  const lic = getState().license;
  if (!lic || !lic.ok) return h('span', { class: 'chip crit' }, icon('lock', 14), tr('غير مفعّل', 'Not activated'));
  const p = lic.payload;
  if (p.type === 'lifetime') return h('span', { class: 'chip ok', title: p.name }, icon('key', 14), t('lifetime'));
  const cls = lic.daysLeft <= 14 ? 'warn' : 'ok';
  return h('span', { class: `chip ${cls}`, title: p.name }, icon('timer', 14), `${lic.daysLeft} ${t('daysLeft')}`);
}

function updateChip() {
  const u = getState().updates || {};
  if (u.status === 'available') return h('button', { class: 'chip brand', onClick: () => api.updates.download() }, icon('download', 14), `${t('updAvailable')} v${u.version}`);
  if (u.status === 'downloading') return h('span', { class: 'chip' }, icon('download', 14), `${t('updDownloading')} ${u.percent || 0}%`);
  if (u.status === 'downloaded') return h('button', { class: 'chip brand', onClick: () => api.updates.install() }, icon('refresh', 14), t('updInstall'));
  return null;
}

function renderShell() {
  const st = getState();
  const route = st.route;
  const noShell = route === 'activation' || route === 'profiles';
  const hadShell = !!appEl.querySelector('.sidebar');
  if (!noShell && hadShell && mainEl && mainEl.isConnected) {
    // rebuild only the chrome (top bar + sidebar), keep the rendered main pane
    appEl.querySelector('.topbar').replaceWith(buildTopbar(st));
    appEl.querySelector('.sidebar').replaceWith(buildSidebar(st, route));
    return;
  }
  clear(appEl);
  appEl.className = `app ${noShell ? 'no-shell' : ''}`;
  if (noShell) { mainEl = h('div', { class: 'main flush' }); appEl.appendChild(mainEl); return; }
  mainEl = h('div', { class: 'main' });
  appEl.append(buildTopbar(st), buildSidebar(st, route), mainEl);
}
function buildTopbar(st) {
  const profile = st.profile;
  return h('div', { class: 'topbar' },
    h('div', { class: 'brand' }, h('img', { src: 'assets/app-logo-128.png', alt: 'Duct Digital Twin' }), h('span', null, t('appName')), h('small', null, `v${(st.info && st.info.version) || ''}`), h('img', { src: asfanLogo(), alt: 'ASFAN', class: 'asfan-sig', title: tr('من إنتاج شركة أصفان', 'Produced by ASFAN') })),
    h('div', { class: 'spacer' }),
    h('button', { class: 'btn ghost sm', title: tr('تصغير الخط', 'Smaller text'), onClick: () => ctx.setZoom(-1) }, 'A−'),
    h('button', { class: 'btn ghost sm', title: tr('تكبير الخط', 'Larger text'), onClick: () => ctx.setZoom(1) }, 'A+'),
    h('button', { class: 'btn ghost sm', title: tr('شرح هذه الشاشة', 'Explain this screen'), onClick: () => showHelp(getState().route) }, icon('info', 16), tr('شرح الشاشة', 'This screen')),
    h('button', { class: 'btn ghost sm', title: tr('دليل الاستخدام', 'User guide'), onClick: () => navigate('guide') }, icon('book', 16), tr('الدليل', 'Guide')),
    updateChip(), licenseChip(),
    profile ? h('span', { class: 'chip', title: profile.institution }, icon(profile.role === 'supervisor' ? 'shield' : 'users', 14), profile.name) : null,
    h('button', { class: 'btn ghost sm', title: tr('English', 'العربية'), onClick: () => ctx.setSetting({ lang: getLang() === 'ar' ? 'en' : 'ar' }) }, icon('globe', 16), getLang() === 'ar' ? 'EN' : 'ع'),
    h('button', { class: 'btn ghost sm', title: tr('الوضع الليلي/النهاري', 'Toggle theme'), onClick: () => ctx.setSetting({ theme: (st.settings.theme || 'dark') === 'dark' ? 'light' : 'dark' }) }, icon(st.settings.theme === 'light' ? 'moon' : 'sun', 16)),
    h('button', { class: 'btn ghost sm', title: t('switchProfile'), onClick: async () => { await ctx.setProfile(null); navigate('profiles'); } }, icon('logout', 16)));
}
function buildSidebar(st, route) {
  const side = h('nav', { class: 'sidebar' });
  for (const item of NAV) {
    if (item.section) { side.appendChild(h('div', { class: 'nav-section' }, t(item.section))); continue; }
    if (item.supervisorOnly && !isSupervisorSession()) continue;
    const mod = ROUTE_MODULE[item.route];
    const locked = mod && !moduleLicensed(mod);
    side.appendChild(h('button', { class: `nav-item ${route === item.route ? 'active' : ''} ${locked ? 'locked' : ''}`, onClick: () => navigate(item.route) }, icon(item.icon), h('span', null, t(item.label)), locked ? h('span', { class: 'lock' }, icon('lock', 14)) : null));
  }
  side.appendChild(h('div', { class: 'grow' }));
  side.appendChild(h('div', { class: 'sidebar-footer' }, h('img', { src: asfanLogo(), alt: 'ASFAN' }), h('div', null, tr('من إنتاج شركة أصفان', 'Produced by ASFAN Trading Co.')), h('div', { class: 'ltr' }, 'info@asfanco.com'), h('div', { class: 'ltr' }, '+962 77 614 0404')));
  return side;
}

function updateBanner() {
  const u = getState().updates || {};
  if (u.status !== 'available' && u.status !== 'downloaded' && u.status !== 'downloading') return null;
  const actions = u.status === 'available' ? [h('button', { class: 'btn sm', onClick: () => api.updates.download() }, icon('download', 14), t('updDownload'))]
    : u.status === 'downloaded' ? [h('button', { class: 'btn sm', onClick: () => api.updates.install() }, icon('refresh', 14), t('updInstall'))]
    : [h('span', null, `${u.percent || 0}%`)];
  return h('div', { class: 'update-banner' }, icon('download', 18), h('strong', null, `${t('updAvailable')} — v${u.version || ''}`), u.notes ? h('span', { class: 'small', style: { opacity: .85 } }, String(u.notes).slice(0, 140)) : null, h('span', { class: 'spacer', style: { flex: 1 } }), ...actions);
}

export async function navigate(route, params = {}) {
  const st = getState();
  // guards
  if (route !== 'activation' && (!st.license || !st.license.ok)) route = 'activation';
  else if (route !== 'activation' && route !== 'profiles' && !st.profile) route = 'profiles';
  if (route === 'supervisor' && !isSupervisorSession()) route = 'home';
  const mod = ROUTE_MODULE[route];
  if (mod && !moduleLicensed(mod)) { ctx.lockedModal(mod); if (!st.route) route = 'home'; else return; }
  if (currentView && currentView.destroy) { try { currentView.destroy(); } catch (e) { console.error(e); } }
  setState({ route, routeParams: params });
  renderShell();
  const view = VIEWS[route] || home;
  currentView = view;
  clear(mainEl); mainEl.classList.remove('flush'); if (route === 'activation' || route === 'profiles') mainEl.classList.add('flush');
  const banner = route !== 'activation' && route !== 'profiles' ? updateBanner() : null;
  if (banner) mainEl.appendChild(banner);
  try {
    await view.render(mainEl, ctx, params);
  } catch (e) {
    console.error(e);
    mainEl.appendChild(h('div', { class: 'alert crit' }, icon('alert'), h('div', null, h('strong', null, t('error')), h('div', { class: 'small mono' }, String(e && e.message)))));
  }
  if (route === 'factory' || route === 'building' || route === 'gallery') mainEl.classList.add('flush');
}

async function boot() {
  try {
    await ctx.reloadCore();
    applyPrefs();
    const st = getState();
    setState({ updates: await api.updates.getState() });
    api.updates.onEvent((ev) => {
      setState({ updates: ev });
      if (ev.type === 'available') toast(`${t('updAvailable')} — v${ev.version}`, 'ok', 6000);
      if (ev.type === 'downloaded') toast(t('updInstall'), 'ok', 8000);
      if (ev.type === 'error' && st.route === 'settings') toast(`${t('error')}: ${ev.error}`, 'warn');
      if (getState().route && getState().route !== 'activation' && getState().route !== 'profiles') { const r = getState().route; navigate(r, getState().routeParams); }
    });
    document.getElementById('splash')?.remove();
    if (!st.license || !st.license.ok) await navigate('activation');
    else await navigate('profiles');
  } catch (e) {
    console.error(e);
    document.getElementById('splash')?.remove();
    appEl.appendChild(h('div', { class: 'center-page' }, h('div', { class: 'card' }, h('h2', null, 'Startup error'), h('pre', { class: 'mono small' }, String(e && e.stack || e)))));
  }
}
window.addEventListener('error', (e) => console.error('window error', e.error || e.message));
boot();
