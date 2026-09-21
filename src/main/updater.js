'use strict';
/**
 * Auto-update via electron-updater + GitHub Releases (see electron-builder.yml `publish`).
 * The renderer receives 'updates:event' messages: { type, version, notes, percent, error }.
 */
const { app } = require('electron');

let autoUpdater = null;
let state = { status: app.isPackaged ? 'idle' : 'disabled', version: null, notes: null, percent: 0, error: null, currentVersion: app.getVersion(), lastCheck: null };
let send = () => {};
let timer = null;

function emit(type, extra = {}) {
  state = { ...state, ...extra, status: type };
  send({ type, ...state });
}

function init({ getSettings, sendToRenderer }) {
  send = sendToRenderer;
  if (!app.isPackaged) return state;
  try {
    ({ autoUpdater } = require('electron-updater'));
  } catch (e) {
    state.status = 'disabled'; state.error = String(e && e.message); return state;
  }
  autoUpdater.autoDownload = !!getSettings().autoDownloadUpdates;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.on('checking-for-update', () => emit('checking', { lastCheck: new Date().toISOString() }));
  autoUpdater.on('update-available', (info) => emit('available', { version: info.version, notes: normaliseNotes(info.releaseNotes), percent: 0 }));
  autoUpdater.on('update-not-available', (info) => emit('up-to-date', { version: info && info.version }));
  autoUpdater.on('download-progress', (p) => emit('downloading', { percent: Math.round(p.percent || 0) }));
  autoUpdater.on('update-downloaded', (info) => emit('downloaded', { version: info.version, percent: 100 }));
  autoUpdater.on('error', (err) => emit('error', { error: (err && err.message) || String(err) }));
  // first check shortly after start, then every 6 hours
  setTimeout(() => check(), 8000);
  timer = setInterval(() => check(), 6 * 3600 * 1000);
  return state;
}
function normaliseNotes(notes) {
  if (!notes) return null;
  if (typeof notes === 'string') return notes;
  if (Array.isArray(notes)) return notes.map((n) => (typeof n === 'string' ? n : n.note)).join('\n');
  return String(notes);
}
async function check() {
  if (!autoUpdater) return state;
  try { await autoUpdater.checkForUpdates(); } catch (e) { emit('error', { error: e.message }); }
  return state;
}
async function download() {
  if (!autoUpdater) return state;
  try { emit('downloading', { percent: 0 }); await autoUpdater.downloadUpdate(); } catch (e) { emit('error', { error: e.message }); }
  return state;
}
function install() {
  if (!autoUpdater) return false;
  setImmediate(() => autoUpdater.quitAndInstall(false, true));
  return true;
}
function setAutoDownload(v) { if (autoUpdater) autoUpdater.autoDownload = !!v; }
function getState() { return state; }
function dispose() { if (timer) clearInterval(timer); }

module.exports = { init, check, download, install, getState, setAutoDownload, dispose };
