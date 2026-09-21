'use strict';
/**
 * Classroom sync: mirrors each student's results file into a shared folder (local path or network share,
 * e.g. \\server\duct-twin) so a supervisor on another PC can aggregate them. Also imports exported JSON files.
 */
const fs = require('node:fs');
const path = require('node:path');
const { Store } = require('./store');

const SUBDIR = 'ASFAN-Duct-Twin';

function slug(s) { return String(s || 'general').trim().replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 60) || 'general'; }

class Classroom {
  constructor(store) { this.store = store; }
  folder() { return this.store.getSettings().classroomFolder || null; }
  root() { const f = this.folder(); return f ? path.join(f, SUBDIR) : null; }

  status() {
    const root = this.root();
    if (!root) return { configured: false };
    let writable = false, exists = false, files = 0;
    try { exists = fs.existsSync(root); } catch (_) {}
    try { fs.mkdirSync(path.join(root, 'results'), { recursive: true }); fs.accessSync(root, fs.constants.W_OK); writable = true; exists = true; } catch (_) {}
    try { files = this._resultFiles(root).length; } catch (_) {}
    return { configured: true, folder: this.folder(), root, exists, writable, files };
  }

  /** Mirror one results record to the shared folder (best effort, never throws). */
  mirror(results) {
    const root = this.root();
    if (!root || !results || !results.profile) return false;
    try {
      const dir = path.join(root, 'results', slug(results.profile.institution));
      Store.writeJsonAtomic(path.join(dir, `${results.profileId}.json`), results);
      return true;
    } catch (_) { return false; }
  }
  mirrorAll() { let n = 0; for (const r of this.store.allLocalResults()) if (this.mirror(r)) n++; return n; }

  _resultFiles(root) {
    const out = [];
    const walk = (dir, depth) => {
      if (depth > 4) return;
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p, depth + 1);
        else if (ent.isFile() && ent.name.endsWith('.json')) out.push(p);
      }
    };
    const resDir = path.join(root, 'results');
    if (fs.existsSync(resDir)) walk(resDir, 0);
    return out;
  }

  /** Reads all results from the shared folder (returns [] when not configured). */
  readShared() {
    const root = this.root();
    if (!root) return [];
    const out = [];
    try {
      for (const f of this._resultFiles(root)) {
        try {
          const data = JSON.parse(fs.readFileSync(f, 'utf8'));
          if (data && data.app === 'asfan-duct-digital-twin' && data.profileId) { data.source = 'classroom'; data.sourceFile = f; out.push(data); }
        } catch (_) {}
      }
    } catch (_) {}
    return out;
  }

  /** Imports one or more results/export JSON files chosen by the supervisor. */
  importFiles(files) {
    const imported = [];
    for (const f of files) {
      try {
        const data = JSON.parse(fs.readFileSync(f, 'utf8'));
        const list = Array.isArray(data) ? data : Array.isArray(data.students) ? data.students : [data];
        for (const rec of list) if (rec && rec.profileId && Array.isArray(rec.attempts)) { rec.source = 'import'; rec.sourceFile = f; imported.push(rec); }
      } catch (_) {}
    }
    return imported;
  }

  /** Merge local + shared + imported by profileId (latest updatedAt wins). */
  static merge(...lists) {
    const map = new Map();
    for (const list of lists) for (const rec of list) {
      const prev = map.get(rec.profileId);
      if (!prev || String(rec.updatedAt || '') >= String(prev.updatedAt || '')) map.set(rec.profileId, rec);
    }
    return [...map.values()];
  }
}

module.exports = { Classroom, SUBDIR };
