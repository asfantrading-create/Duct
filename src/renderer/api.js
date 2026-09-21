// Bridge to the Electron main process (window.duct from preload). In a plain browser (development / UI smoke
// tests) a localStorage-backed mock with genuine WebCrypto license verification is used instead.
import PUBLIC_JWK from '../shared/public-key.json';
import { parseKey, evaluatePayload } from '../shared/license-format.js';

const real = typeof window !== 'undefined' ? window.duct : null;
export const isElectron = !!(real && real.isElectron);

function createMock() {
  const KEY = 'duct.mock.state';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } };
  const save = (s) => localStorage.setItem(KEY, JSON.stringify(s));
  const st = Object.assign({ license: null, settings: { lang: 'ar', units: 'si', theme: 'dark', classroomFolder: null, autoDownloadUpdates: true, city: 'riyadh', uiZoom: 1, tourDone: false }, profiles: [], results: {}, pin: null, classes: [], assignments: [] }, load());
  const persist = () => save(st);
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
  const MACHINE = 'MOCK-0000-0000-0001';
  const listeners = new Set();
  async function validate(raw) {
    let parsed; try { parsed = parseKey(raw); } catch (e) { return { ok: false, status: 'malformed', error: e.message }; }
    try {
      const key = await crypto.subtle.importKey('jwk', PUBLIC_JWK, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, parsed.signatureBytes, parsed.payloadBytes);
      if (!ok) return { ok: false, status: 'bad_signature', payload: parsed.payload };
    } catch (e) { return { ok: false, status: 'bad_signature' }; }
    const ev = evaluatePayload(parsed.payload, { machineId: MACHINE });
    return { ok: ev.status === 'valid', status: ev.status, daysLeft: ev.daysLeft, payload: parsed.payload, key: parsed.clean };
  }
  const download = (name, content, type = 'text/plain') => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); return { ok: true, file: name }; };
  const results = (id) => { if (!st.results[id]) st.results[id] = { profileId: id, attempts: [], sessions: [], lessonsCompleted: [] }; const r = st.results[id]; r.profile = st.profiles.find((p) => p.id === id) || null; r.updatedAt = new Date().toISOString(); r.app = 'asfan-duct-digital-twin'; return r; };
  return {
    isElectron: false,
    app: { getInfo: async () => ({ version: '1.0.0-dev', platform: 'browser', isPackaged: false, machineId: MACHINE, userData: '(browser)', exportsDir: '(downloads)', company: { name: 'ASFAN Trading Co.', nameAr: 'شركة أصفان', email: 'info@asfanco.com', whatsapp: '+962776140404', whatsappUrl: 'https://wa.me/962776140404', website: 'https://asfanco.com' }, locale: navigator.language }), openExternal: async (u) => window.open(u, '_blank'), openPath: async () => false, showItemInFolder: async () => false, relaunch: async () => location.reload() },
    license: { get: async () => (st.license ? validate(st.license.key) : null), machineId: async () => MACHINE, activate: async (k) => { const r = await validate(k); if (r.ok) { st.license = { key: r.key, activatedAt: new Date().toISOString() }; persist(); } return r; }, activateFile: async () => ({ ok: false, status: 'canceled' }), remove: async () => { st.license = null; persist(); return true; } },
    settings: { get: async () => ({ ...st.settings }), set: async (p) => { Object.assign(st.settings, p); persist(); return { ...st.settings }; } },
    profiles: { list: async () => st.profiles.map((p) => ({ ...p })), create: async (d) => { const p = { id: uuid(), name: d.name, studentId: d.studentId || '', institution: d.institution || '', role: d.role === 'supervisor' ? 'supervisor' : 'student', email: d.email || '', classCode: (d.classCode || '').toUpperCase(), createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString() }; st.profiles.push(p); persist(); return { ...p }; }, update: async (id, patch) => { const p = st.profiles.find((x) => x.id === id); if (p) Object.assign(p, patch); persist(); return p; }, remove: async (id) => { st.profiles = st.profiles.filter((x) => x.id !== id); delete st.results[id]; persist(); return true; } },
    supervisor: { hasPin: async () => !!st.pin, setPin: async (pin) => { st.pin = String(pin); persist(); return true; }, verifyPin: async (pin) => st.pin === String(pin), clearPin: async () => { st.pin = null; persist(); return true; }, listClasses: async () => st.classes, createClass: async (d) => { const c = { id: uuid(), name: d.name, institution: d.institution || '', code: Math.random().toString(16).slice(2, 8).toUpperCase(), createdAt: new Date().toISOString() }; st.classes.push(c); persist(); return c; }, removeClass: async (id) => { st.classes = st.classes.filter((c) => c.id !== id); persist(); return true; }, allResults: async () => st.profiles.map((p) => ({ ...results(p.id), source: 'local' })) },
    assignments: { list: async () => (st.assignments || []).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))), create: async (d) => { const a = { id: uuid(), title: d.title, moduleIds: d.moduleIds || [], count: Number(d.count) || 15, minutes: Number(d.minutes) || 0, passPct: Number(d.passPct) || 70, maxDifficulty: Number(d.maxDifficulty) || 3, dueDate: d.dueDate || null, classCode: (d.classCode || '').toUpperCase(), createdBy: d.createdBy || '', seed: Math.floor(Math.random() * 2e9) + 1, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; st.assignments = st.assignments || []; st.assignments.push(a); persist(); return a; }, update: async (id, patch) => { const a = (st.assignments || []).find((x) => x.id === id); if (a) Object.assign(a, patch, { updatedAt: new Date().toISOString() }); persist(); return a; }, remove: async (id) => { st.assignments = (st.assignments || []).filter((x) => x.id !== id); persist(); return true; } },
    results: { get: async (id) => results(id), saveAttempt: async (id, a) => { const r = results(id); const rec = { id: uuid(), savedAt: new Date().toISOString(), ...a }; r.attempts.push(rec); persist(); return { results: r, attempt: rec }; }, saveSession: async (id, s) => { const r = results(id); const rec = { id: uuid(), savedAt: new Date().toISOString(), ...s }; r.sessions.push(rec); persist(); return { results: r, session: rec }; }, markLesson: async (id, l) => { const r = results(id); if (!r.lessonsCompleted.includes(l)) r.lessonsCompleted.push(l); persist(); return r; } },
    classroom: { status: async () => ({ configured: false }), chooseFolder: async () => ({ configured: false }), setFolder: async () => ({ configured: false }), syncNow: async () => ({ configured: false, mirrored: 0 }), importFiles: async () => [] },
    exporter: { csv: async ({ filename, headers, rows }) => { const esc = (v) => (v == null ? '' : /[",\n;]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v)); const body = [headers.map(esc).join(',')].concat(rows.map((r) => headers.map((hd, i) => esc(Array.isArray(r) ? r[i] : r[hd])).join(','))).join('\r\n'); return download(filename + (filename.endsWith('.csv') ? '' : '.csv'), '﻿' + body, 'text/csv'); }, json: async ({ filename, data }) => download(filename + (filename.endsWith('.json') ? '' : '.json'), JSON.stringify(data, null, 2), 'application/json'), pdf: async ({ filename, html }) => { const w = window.open('', '_blank'); if (!w) return { ok: false }; w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); return { ok: true, file: filename }; }, defaultDir: async () => '(downloads)' },
    updates: { getState: async () => ({ status: 'disabled', currentVersion: '1.0.0-dev' }), check: async () => ({ status: 'disabled' }), download: async () => ({ status: 'disabled' }), install: async () => false, onEvent: (cb) => { listeners.add(cb); return () => listeners.delete(cb); } },
  };
}

export const api = isElectron ? real : createMock();
