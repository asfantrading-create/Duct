'use strict';
/** File exports: CSV (UTF-8 BOM for Excel/Arabic), JSON, and PDF (rendered by a hidden window). */
const fs = require('node:fs');
const path = require('node:path');
const { app, dialog, BrowserWindow } = require('electron');

const { toCsv } = require('../shared/csv');

function defaultDir() {
  const d = path.join(app.getPath('documents'), 'ASFAN Duct Digital Twin');
  try { fs.mkdirSync(d, { recursive: true }); } catch (_) {}
  return d;
}
function safeName(s) { return String(s || 'export').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120); }

async function pickSavePath(win, filename, filters) {
  const { canceled, filePath } = await dialog.showSaveDialog(win, { defaultPath: path.join(defaultDir(), safeName(filename)), filters });
  return canceled ? null : filePath;
}

async function exportCsv(win, { filename, headers, rows }) {
  const file = await pickSavePath(win, filename.endsWith('.csv') ? filename : filename + '.csv', [{ name: 'CSV', extensions: ['csv'] }]);
  if (!file) return { ok: false, canceled: true };
  fs.writeFileSync(file, toCsv(headers, rows));
  return { ok: true, file };
}
async function exportJson(win, { filename, data }) {
  const file = await pickSavePath(win, filename.endsWith('.json') ? filename : filename + '.json', [{ name: 'JSON', extensions: ['json'] }]);
  if (!file) return { ok: false, canceled: true };
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return { ok: true, file };
}
async function exportPdf(win, { filename, html, landscape = false }) {
  const file = await pickSavePath(win, filename.endsWith('.pdf') ? filename : filename + '.pdf', [{ name: 'PDF', extensions: ['pdf'] }]);
  if (!file) return { ok: false, canceled: true };
  const buffer = await renderPdf(html, { landscape });
  fs.writeFileSync(file, buffer);
  return { ok: true, file };
}
async function renderPdf(html, { landscape = false } = {}) {
  const w = new BrowserWindow({ show: false, width: 1000, height: 1400, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, offscreen: true } });
  try {
    await w.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(html));
    await new Promise((r) => setTimeout(r, 250));
    return await w.webContents.printToPDF({ printBackground: true, pageSize: 'A4', landscape, margins: { marginType: 'default' } });
  } finally { w.destroy(); }
}
/** Saves a data-URL PNG (3D screenshot) through the save dialog. */
async function exportPng(win, { filename, dataUrl }) {
  const file = await pickSavePath(win, filename.endsWith('.png') ? filename : filename + '.png', [{ name: 'PNG image', extensions: ['png'] }]);
  if (!file) return { ok: false, canceled: true };
  const b64 = String(dataUrl).split(',')[1] || ''; fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  return { ok: true, file };
}
/** Write silently (no dialog) — used for automatic backups of results. */
function writeSilently(filename, content) {
  const file = path.join(defaultDir(), safeName(filename));
  fs.writeFileSync(file, content);
  return file;
}

module.exports = { exportCsv, exportJson, exportPdf, exportPng, toCsv, defaultDir, writeSilently, renderPdf };
