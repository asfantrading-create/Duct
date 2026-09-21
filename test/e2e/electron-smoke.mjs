// Launches the real Electron app (main process + preload + IPC) under a virtual display and exercises
// activation, profile creation, the 3D twins and the assessment flow. Run: xvfb-run -a node test/e2e/electron-smoke.mjs
import { _electron as electron } from 'playwright-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = process.env.OUT_DIR || path.join(root, '.playwright-out'); fs.mkdirSync(OUT, { recursive: true });
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'duct-electron-'));
const key = execFileSync(process.execPath, ['tools/issue-license.mjs', '--name', 'Electron Test University', '--type', 'lifetime', '--supervisor', '--out', path.join(OUT, 'electron-test.lic')], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n')[0];

const app = await electron.launch({ args: ['.', '--dev', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', `--user-data-dir=${userData}`], cwd: root, env: { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: '1' } });
const errors = [];
app.on('console', (m) => { if (m.type() === 'error') errors.push('main console: ' + m.text()); });
app.process().stderr.on('data', (d) => { const s = String(d); if (/Error|TypeError|Unhandled/.test(s) && !/GPU|gl_|dri|Failed to connect to the bus|libva|MESA/.test(s)) errors.push('stderr: ' + s.trim().slice(0, 300)); });
const page = await app.firstWindow();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const shot = (n) => page.screenshot({ path: path.join(OUT, `electron-${n}.png`) });
const step = async (name, fn) => { try { await fn(); await shot(name); console.log('✓', name); } catch (e) { errors.push(`${name}: ${e.message}`); await shot(name + '-FAILED').catch(() => {}); console.log('✗', name, e.message.split('\n')[0]); } };

await step('01-window', async () => { await page.waitForSelector('.auth-card', { timeout: 30000 }); const title = await page.title(); if (!/ASFAN/.test(title)) throw new Error('title ' + title); });
await step('02-ipc', async () => {
  const info = await page.evaluate(() => window.duct.app.getInfo()); if (!info.machineId || !info.version) throw new Error('getInfo ' + JSON.stringify(info));
  const lic = await page.evaluate(() => window.duct.license.get()); if (lic !== null) throw new Error('license should be null before activation');
  const bad = await page.evaluate(() => window.duct.license.activate('ADDT1-garbage')); if (bad.ok || bad.status !== 'malformed') throw new Error('bad key accepted ' + JSON.stringify(bad));
  const upd = await page.evaluate(() => window.duct.updates.getState()); if (upd.status !== 'disabled') throw new Error('updater state ' + upd.status);
  const cs = await page.evaluate(() => window.duct.classroom.status()); if (cs.configured !== false) throw new Error('classroom ' + JSON.stringify(cs));
  console.log('   machineId', info.machineId, 'version', info.version, 'electron', info.electron, 'userData', info.userData);
});
await step('03-activate', async () => { await page.locator('textarea').fill(key); await page.getByRole('button', { name: /تفعيل|Activate/ }).first().click(); await page.waitForSelector('.profile-tile, .alert.info', { timeout: 15000 }); const lic = await page.evaluate(() => window.duct.license.get()); if (!lic.ok || lic.payload.role !== 'supervisor') throw new Error('license after activation ' + JSON.stringify(lic)); });
await step('04-student', async () => { await page.getByRole('button', { name: /طالب جديد|New student/ }).click(); await page.locator('.modal input[type=text]').first().fill('سارة محمد'); await page.locator('.modal .btn.primary').click(); await page.waitForSelector('.module-card', { timeout: 15000 }); });
const nav = async (label, waitFor) => { await page.locator('.nav-item', { hasText: label }).first().click(); await page.waitForSelector(waitFor, { timeout: 20000 }); await page.waitForTimeout(800); };
await step('05-factory', async () => { await nav(/توأم المصنع|Factory Twin/, '.twin canvas'); await page.getByRole('button', { name: /تشغيل|Run/ }).first().click(); await page.waitForTimeout(3000); });
await step('06-building', async () => { await nav(/شبكة الدكت|Duct Network/, '.twin canvas'); await page.getByRole('button', { name: /موازنة|Auto-balance/ }).click(); await page.waitForTimeout(800); });
await step('07-exam-and-persistence', async () => {
  await nav(/الاختبارات|Assessments/, '.card'); await page.locator('input[type=number]').first().fill('5'); await page.getByRole('button', { name: /ابدأ|Start/ }).click(); await page.waitForSelector('.q-card');
  for (let i = 0; i < 5; i++) { const opt = page.locator('.q-option').first(); if (await opt.count()) await opt.click(); else await page.locator('.q-card input[type=number]').fill('1'); const next = page.getByRole('button', { name: /^(التالي|Next)$/ }); if (await next.count()) await next.click(); else { await page.getByRole('button', { name: /إنهاء|Submit/ }).click(); const ok = page.locator('.modal .btn.primary'); if (await ok.count()) await ok.click(); } await page.waitForTimeout(150); }
  await page.waitForSelector('.score-ring', { timeout: 15000 });
  const profiles = await page.evaluate(() => window.duct.profiles.list()); const res = await page.evaluate((id) => window.duct.results.get(id), profiles[0].id);
  if (res.attempts.length !== 1) throw new Error('attempt not persisted'); const stateFile = path.join(userData, 'state.json'); if (!fs.existsSync(stateFile)) throw new Error('state.json missing in ' + userData); const resFiles = fs.readdirSync(path.join(userData, 'results')); if (!resFiles.length) throw new Error('no results file');
  console.log('   persisted:', stateFile, resFiles.join(','));
});
await step('08-settings', async () => { await nav(/الإعدادات|Settings/, '.card'); });
await app.close();
if (errors.length) { console.error('\nERRORS:\n' + errors.join('\n')); process.exit(1); } else console.log('\nELECTRON SMOKE TEST PASSED');
