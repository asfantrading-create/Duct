'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const { Store } = require('./store');
const { Classroom } = require('./classroom');
const license = require('./license');
const exporter = require('./exporter');
const updater = require('./updater');

const APP_ID = 'com.asfanco.ductdigitaltwin';
const isDev = process.argv.includes('--dev') || !app.isPackaged;
const COMPANY = { name: 'ASFAN Trading Co.', nameAr: 'شركة أصفان', email: 'info@asfanco.com', whatsapp: '+962776140404', whatsappUrl: 'https://wa.me/962776140404', website: 'https://asfanco.com' };

let mainWindow = null;
let store = null;
let classroom = null;
let clockRolledBack = false;

app.setAppUserModelId(APP_ID);
if (!app.requestSingleInstanceLock()) { app.quit(); }

function rendererPath(...p) { return path.join(__dirname, '..', '..', 'dist', 'renderer', ...p); }

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1100, minHeight: 700,
    title: 'ASFAN Duct Digital Twin',
    backgroundColor: '#0b1020',
    show: false,
    autoHideMenuBar: true,
    icon: rendererPath('assets', 'icon-256.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: isDev,
    },
  });
  Menu.setApplicationMenu(null);
  mainWindow.loadFile(rendererPath('index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  mainWindow.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:')) { e.preventDefault(); shell.openExternal(url); } });
  if (isDev) mainWindow.webContents.on('before-input-event', (e, input) => { if (input.key === 'F12') mainWindow.webContents.toggleDevTools(); });
  mainWindow.on('closed', () => { mainWindow = null; });
}

function currentLicense() {
  const rec = store.getLicenseRecord();
  if (!rec || !rec.key) return null;
  const result = license.validateKey(rec.key);
  if (result.ok && clockRolledBack && result.payload.type === 'subscription') {
    return { ...result, ok: false, status: 'clock_rollback' };
  }
  return { ...result, activatedAt: rec.activatedAt };
}

function registerIpc() {
  ipcMain.handle('app:getInfo', () => ({
    version: app.getVersion(), platform: process.platform, arch: process.arch, isPackaged: app.isPackaged, electron: process.versions.electron, chrome: process.versions.chrome,
    machineId: license.getMachineId(), userData: app.getPath('userData'), exportsDir: exporter.defaultDir(), company: COMPANY, locale: app.getLocale(),
  }));
  ipcMain.handle('app:openExternal', (_e, url) => { if (/^(https?:|mailto:)/i.test(String(url))) return shell.openExternal(url); return false; });
  ipcMain.handle('app:openPath', (_e, p) => shell.openPath(String(p)));
  ipcMain.handle('app:showItemInFolder', (_e, p) => shell.showItemInFolder(String(p)));
  ipcMain.handle('app:relaunch', () => { app.relaunch(); app.exit(0); });

  // license
  ipcMain.handle('license:get', () => currentLicense());
  ipcMain.handle('license:machineId', () => license.getMachineId());
  ipcMain.handle('license:activate', (_e, key) => {
    const result = license.validateKey(String(key || ''));
    if (result.ok) store.setLicenseRecord({ key: result.key, activatedAt: new Date().toISOString() });
    return result;
  });
  ipcMain.handle('license:activateFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, { title: 'License file', filters: [{ name: 'License', extensions: ['lic', 'txt'] }], properties: ['openFile'] });
    if (canceled || !filePaths[0]) return { ok: false, status: 'canceled' };
    const raw = fs.readFileSync(filePaths[0], 'utf8');
    const result = license.validateKey(raw);
    if (result.ok) store.setLicenseRecord({ key: result.key, activatedAt: new Date().toISOString() });
    return result;
  });
  ipcMain.handle('license:remove', () => { store.setLicenseRecord(null); return true; });

  // settings
  ipcMain.handle('settings:get', () => store.getSettings());
  ipcMain.handle('settings:set', (_e, patch) => {
    const allowed = ['lang', 'units', 'theme', 'classroomFolder', 'autoDownloadUpdates', 'city', 'lastCheckedUpdate', 'uiZoom', 'tourDone'];
    const clean = {}; for (const k of allowed) if (patch && k in patch) clean[k] = patch[k];
    const s = store.setSettings(clean);
    if ('autoDownloadUpdates' in clean) updater.setAutoDownload(clean.autoDownloadUpdates);
    return s;
  });

  // profiles
  ipcMain.handle('profiles:list', () => store.listProfiles());
  ipcMain.handle('profiles:create', (_e, data) => store.createProfile(data || {}));
  ipcMain.handle('profiles:update', (_e, id, patch) => store.updateProfile(id, patch || {}));
  ipcMain.handle('profiles:remove', (_e, id) => store.removeProfile(id));

  // supervisor
  ipcMain.handle('supervisor:hasPin', () => store.hasPin());
  ipcMain.handle('supervisor:setPin', (_e, pin) => store.setPin(pin));
  ipcMain.handle('supervisor:verifyPin', (_e, pin) => store.verifyPin(pin));
  ipcMain.handle('supervisor:clearPin', () => { store.clearPin(); return true; });
  ipcMain.handle('supervisor:listClasses', () => store.listClasses());
  ipcMain.handle('supervisor:createClass', (_e, data) => store.createClass(data || {}));
  ipcMain.handle('supervisor:removeClass', (_e, id) => store.removeClass(id));
  ipcMain.handle('supervisor:allResults', () => {
    const local = store.allLocalResults().map((r) => ({ ...r, source: 'local' }));
    const shared = classroom.readShared();
    return Classroom.merge(shared, local);
  });

  // assigned exams
  const allAssignments = () => Classroom.mergeAssignments(classroom.readSharedAssignments(), store.listAssignments().map((a) => ({ ...a, source: 'local' })));
  ipcMain.handle('assignments:list', () => allAssignments());
  ipcMain.handle('assignments:create', (_e, data) => { const a = store.createAssignment(data || {}); classroom.mirrorAssignments(store.listAssignments()); return a; });
  ipcMain.handle('assignments:update', (_e, id, patch) => { const a = store.updateAssignment(id, patch || {}); classroom.mirrorAssignments(store.listAssignments()); return a; });
  ipcMain.handle('assignments:remove', (_e, id) => { store.removeAssignment(id); classroom.mirrorAssignments(store.listAssignments()); return true; });

  // results
  ipcMain.handle('results:get', (_e, profileId) => store.getResults(profileId));
  ipcMain.handle('results:saveAttempt', (_e, profileId, attempt) => { const out = store.saveAttempt(profileId, attempt || {}); classroom.mirror(out.results); return out; });
  ipcMain.handle('results:saveSession', (_e, profileId, session) => { const out = store.saveSession(profileId, session || {}); classroom.mirror(out.results); return out; });
  ipcMain.handle('results:markLesson', (_e, profileId, lessonId) => { const out = store.markLessonCompleted(profileId, lessonId); classroom.mirror(out); return out; });

  // classroom
  ipcMain.handle('classroom:status', () => classroom.status());
  ipcMain.handle('classroom:chooseFolder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory', 'createDirectory'] });
    if (canceled || !filePaths[0]) return classroom.status();
    store.setSettings({ classroomFolder: filePaths[0] });
    classroom.mirrorAll(); classroom.mirrorAssignments(store.listAssignments());
    return classroom.status();
  });
  ipcMain.handle('classroom:setFolder', (_e, folder) => { store.setSettings({ classroomFolder: folder || null }); if (folder) classroom.mirrorAll(); return classroom.status(); });
  ipcMain.handle('classroom:syncNow', () => ({ mirrored: classroom.mirrorAll(), ...classroom.status() }));
  ipcMain.handle('classroom:importFiles', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, { properties: ['openFile', 'multiSelections'], filters: [{ name: 'Results JSON', extensions: ['json'] }] });
    if (canceled) return [];
    return classroom.importFiles(filePaths);
  });

  // exports
  ipcMain.handle('export:csv', (_e, payload) => exporter.exportCsv(mainWindow, payload));
  ipcMain.handle('export:json', (_e, payload) => exporter.exportJson(mainWindow, payload));
  ipcMain.handle('export:pdf', (_e, payload) => exporter.exportPdf(mainWindow, payload));
  ipcMain.handle('export:png', (_e, payload) => exporter.exportPng(mainWindow, payload));
  ipcMain.handle('export:defaultDir', () => exporter.defaultDir());

  // updates
  ipcMain.handle('updates:getState', () => updater.getState());
  ipcMain.handle('updates:check', () => updater.check());
  ipcMain.handle('updates:download', () => updater.download());
  ipcMain.handle('updates:install', () => updater.install());
}

app.whenReady().then(() => {
  store = new Store(app.getPath('userData'));
  classroom = new Classroom(store);
  clockRolledBack = store.touch().rolledBack;
  registerIpc();
  createWindow();
  updater.init({ getSettings: () => store.getSettings(), sendToRenderer: (data) => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('updates:event', data); } });
  app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); } });
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { updater.dispose(); app.quit(); });
