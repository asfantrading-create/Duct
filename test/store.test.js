'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Store } = require('../src/main/store');
const { Classroom } = require('../src/main/classroom');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'duct-store-'));

test('profiles, attempts, sessions and lessons persist', () => {
  const dir = tmp(); const s = new Store(dir);
  const p = s.createProfile({ name: 'أحمد', studentId: '2021001', institution: 'جامعة اليرموك', classCode: 'ab12cd' });
  assert.equal(p.classCode, 'AB12CD');
  s.saveAttempt(p.id, { percent: 80, score: 8, maxScore: 10, moduleIds: ['LEARN'] });
  s.saveSession(p.id, { type: 'factory', durationSec: 120, kpis: { oee: 0.7 } });
  s.markLessonCompleted(p.id, 'intro'); s.markLessonCompleted(p.id, 'intro');
  const again = new Store(dir); const r = again.getResults(p.id);
  assert.equal(r.attempts.length, 1); assert.equal(r.sessions.length, 1); assert.deepEqual(r.lessonsCompleted, ['intro']); assert.equal(r.profile.name, 'أحمد');
  assert.equal(again.listProfiles().length, 1);
  again.removeProfile(p.id); assert.equal(again.listProfiles().length, 0); assert.equal(fs.existsSync(again.resultsPath(p.id)), false);
});

test('supervisor pin hashing', () => {
  const s = new Store(tmp());
  assert.equal(s.hasPin(), false); assert.equal(s.verifyPin('1234'), false);
  s.setPin('1234'); assert.equal(s.hasPin(), true); assert.equal(s.verifyPin('1234'), true); assert.equal(s.verifyPin('0000'), false);
  s.clearPin(); assert.equal(s.hasPin(), false);
});

test('clock rollback detection', () => {
  const s = new Store(tmp());
  assert.equal(s.touch().rolledBack, false);
  s.state.meta.lastSeen = new Date(Date.now() + 3 * 86400000).toISOString(); s.save();
  assert.equal(s.touch().rolledBack, true);
});

test('classes get codes; settings merge', () => {
  const s = new Store(tmp());
  const c = s.createClass({ name: 'HVAC 301', institution: 'JUST' });
  assert.match(c.code, /^[0-9A-F]{6}$/);
  s.setSettings({ lang: 'en' }); assert.equal(s.getSettings().lang, 'en'); assert.equal(s.getSettings().units, 'si');
});

test('classroom mirror, readShared and merge', () => {
  const shared = tmp();
  const a = new Store(tmp()); a.setSettings({ classroomFolder: shared }); const ca = new Classroom(a);
  const p = a.createProfile({ name: 'Student A', institution: 'Uni X' });
  const out = a.saveAttempt(p.id, { percent: 90 }); assert.equal(ca.mirror(out.results), true);
  const b = new Store(tmp()); b.setSettings({ classroomFolder: shared }); const cb = new Classroom(b);
  const st = cb.status(); assert.equal(st.configured, true); assert.equal(st.files, 1);
  const list = cb.readShared(); assert.equal(list.length, 1); assert.equal(list[0].profile.name, 'Student A'); assert.equal(list[0].source, 'classroom');
  const merged = Classroom.merge(list, b.allLocalResults()); assert.equal(merged.length, 1);
  const imported = cb.importFiles([list[0].sourceFile]); assert.equal(imported.length, 1);
  assert.equal(new Classroom(new Store(tmp())).status().configured, false);
});
