'use strict';
/** Small JSON persistence layer (atomic writes) for app state and per-profile results. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const DEFAULT_STATE = () => ({
  license: null, // { key, activatedAt }
  settings: { lang: 'ar', units: 'si', theme: 'dark', classroomFolder: null, autoDownloadUpdates: true, city: 'riyadh', lastCheckedUpdate: null, uiZoom: 1, tourDone: false },
  profiles: [],
  supervisor: null, // { salt, hash }
  classes: [],
  assignments: [],
  meta: { installedAt: null, lastSeen: null, runs: 0 },
});

class Store {
  constructor(userDataDir) {
    this.dir = userDataDir;
    this.statePath = path.join(this.dir, 'state.json');
    this.resultsDir = path.join(this.dir, 'results');
    fs.mkdirSync(this.resultsDir, { recursive: true });
    this.state = this._readJson(this.statePath, null);
    const fresh = DEFAULT_STATE();
    if (!this.state) { this.state = fresh; this.state.meta.installedAt = new Date().toISOString(); }
    // shallow-merge defaults for forward compatibility
    this.state.settings = { ...fresh.settings, ...(this.state.settings || {}) };
    this.state.meta = { ...fresh.meta, ...(this.state.meta || {}) };
    if (!Array.isArray(this.state.profiles)) this.state.profiles = [];
    if (!Array.isArray(this.state.classes)) this.state.classes = [];
    if (!Array.isArray(this.state.assignments)) this.state.assignments = [];
    this.save();
  }

  _readJson(file, fallback) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return fallback; }
  }
  static writeJsonAtomic(file, data) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = file + '.' + process.pid + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
  }
  save() { Store.writeJsonAtomic(this.statePath, this.state); }

  // ---- settings
  getSettings() { return { ...this.state.settings }; }
  setSettings(patch) { this.state.settings = { ...this.state.settings, ...patch }; this.save(); return this.getSettings(); }

  // ---- license
  getLicenseRecord() { return this.state.license; }
  setLicenseRecord(rec) { this.state.license = rec; this.save(); }

  // ---- clock / meta
  touch() {
    const now = Date.now();
    const last = this.state.meta.lastSeen ? Date.parse(this.state.meta.lastSeen) : null;
    const rolledBack = last !== null && now < last - 24 * 3600 * 1000;
    if (!rolledBack) this.state.meta.lastSeen = new Date(now).toISOString();
    this.state.meta.runs = (this.state.meta.runs || 0) + 1;
    this.save();
    return { rolledBack };
  }

  // ---- profiles
  listProfiles() { return this.state.profiles.map((p) => ({ ...p })); }
  createProfile({ name, studentId = '', institution = '', role = 'student', email = '', classCode = '' }) {
    const profile = { id: crypto.randomUUID(), name: String(name).trim(), studentId: String(studentId).trim(), institution: String(institution).trim(), role: role === 'supervisor' ? 'supervisor' : 'student', email: String(email).trim(), classCode: String(classCode).trim().toUpperCase(), createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString() };
    this.state.profiles.push(profile); this.save(); return { ...profile };
  }
  updateProfile(id, patch) {
    const p = this.state.profiles.find((x) => x.id === id); if (!p) return null;
    const allowed = ['name', 'studentId', 'institution', 'email', 'classCode', 'lastActiveAt', 'role'];
    for (const k of allowed) if (k in patch) p[k] = patch[k];
    this.save(); return { ...p };
  }
  removeProfile(id) {
    this.state.profiles = this.state.profiles.filter((x) => x.id !== id); this.save();
    try { fs.unlinkSync(this.resultsPath(id)); } catch (_) {}
    return true;
  }

  // ---- supervisor PIN
  hasPin() { return !!(this.state.supervisor && this.state.supervisor.hash); }
  setPin(pin) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(String(pin), salt, 32).toString('hex');
    this.state.supervisor = { salt, hash }; this.save(); return true;
  }
  verifyPin(pin) {
    if (!this.hasPin()) return false;
    const { salt, hash } = this.state.supervisor;
    const test = crypto.scryptSync(String(pin), salt, 32).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(test, 'hex'), Buffer.from(hash, 'hex'));
  }
  clearPin() { this.state.supervisor = null; this.save(); }

  // ---- classes (supervisor-created groups)
  listClasses() { return this.state.classes.map((c) => ({ ...c })); }
  createClass({ name, institution = '' }) {
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const cls = { id: crypto.randomUUID(), name: String(name).trim(), institution: String(institution).trim(), code, createdAt: new Date().toISOString() };
    this.state.classes.push(cls); this.save(); return { ...cls };
  }
  removeClass(id) { this.state.classes = this.state.classes.filter((c) => c.id !== id); this.save(); return true; }

  // ---- assigned exams (created by a supervisor)
  listAssignments() { return this.state.assignments.map((a) => ({ ...a })); }
  createAssignment({ title, moduleIds = [], count = 15, minutes = 20, passPct = 70, maxDifficulty = 3, dueDate = null, classCode = '', createdBy = '' }) {
    const a = { id: crypto.randomUUID(), title: String(title).trim(), moduleIds: Array.isArray(moduleIds) ? moduleIds : [], count: Math.max(3, Math.min(60, Number(count) || 15)), minutes: Math.max(0, Number(minutes) || 0), passPct: Math.max(1, Math.min(100, Number(passPct) || 70)), maxDifficulty: [1, 2, 3].includes(Number(maxDifficulty)) ? Number(maxDifficulty) : 3, dueDate: dueDate || null, classCode: String(classCode || '').toUpperCase(), createdBy: String(createdBy || ''), seed: crypto.randomInt(1, 2 ** 31 - 1), active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.state.assignments.push(a); this.save(); return { ...a };
  }
  updateAssignment(id, patch) { const a = this.state.assignments.find((x) => x.id === id); if (!a) return null; for (const k of ['title', 'dueDate', 'active', 'classCode']) if (k in patch) a[k] = patch[k]; a.updatedAt = new Date().toISOString(); this.save(); return { ...a }; }
  removeAssignment(id) { this.state.assignments = this.state.assignments.filter((x) => x.id !== id); this.save(); return true; }

  // ---- results
  resultsPath(profileId) { return path.join(this.resultsDir, `${profileId}.json`); }
  getResults(profileId) {
    const profile = this.state.profiles.find((p) => p.id === profileId) || null;
    const data = this._readJson(this.resultsPath(profileId), null) || { profileId, attempts: [], sessions: [], lessonsCompleted: [] };
    if (!Array.isArray(data.lessonsCompleted)) data.lessonsCompleted = [];
    data.profile = profile;
    return data;
  }
  _writeResults(profileId, data) {
    const profile = this.state.profiles.find((p) => p.id === profileId) || data.profile || null;
    const out = { ...data, profile, updatedAt: new Date().toISOString(), app: 'asfan-duct-digital-twin' };
    Store.writeJsonAtomic(this.resultsPath(profileId), out);
    if (profile) this.updateProfile(profileId, { lastActiveAt: out.updatedAt });
    return out;
  }
  saveAttempt(profileId, attempt) {
    const data = this.getResults(profileId);
    const rec = { id: crypto.randomUUID(), savedAt: new Date().toISOString(), ...attempt };
    data.attempts.push(rec);
    return { results: this._writeResults(profileId, data), attempt: rec };
  }
  saveSession(profileId, session) {
    const data = this.getResults(profileId);
    const rec = { id: crypto.randomUUID(), savedAt: new Date().toISOString(), ...session };
    data.sessions.push(rec);
    if (data.sessions.length > 500) data.sessions = data.sessions.slice(-500);
    return { results: this._writeResults(profileId, data), session: rec };
  }
  markLessonCompleted(profileId, lessonId) {
    const data = this.getResults(profileId);
    if (!data.lessonsCompleted.includes(lessonId)) data.lessonsCompleted.push(lessonId);
    return this._writeResults(profileId, data);
  }
  allLocalResults() {
    return this.state.profiles.map((p) => this.getResults(p.id));
  }
}

module.exports = { Store, DEFAULT_STATE };
