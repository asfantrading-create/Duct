// UI smoke test: serves dist/renderer, drives the app in headless Chromium with the browser mock API,
// walks through activation → profile → every view, and fails on console/page errors. Screenshots go to OUT_DIR.
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = path.join(root, 'dist', 'renderer');
const OUT = process.env.OUT_DIR || path.join(root, '.playwright-out'); fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(dist, p); if (!f.startsWith(dist) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => server.listen(0, '127.0.0.1', r)); const port = server.address().port; const url = `http://127.0.0.1:${port}/`;

const role = process.env.ROLE || 'supervisor';
const keyArgs = ['tools/issue-license.mjs', '--name', 'جامعة الاختبار – Test University', '--type', 'subscription', '--expires', '2030-12-31', '--seats', '30', '--out', path.join(OUT, 'test.lic')]; if (role === 'supervisor') keyArgs.push('--supervisor');
const key = execFileSync(process.execPath, keyArgs, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n')[0];

const exe = fs.existsSync('/opt/pw-browsers/chromium') && fs.statSync('/opt/pw-browsers/chromium').isFile() ? '/opt/pw-browsers/chromium' : (fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => path.join('/opt/pw-browsers', d, 'chrome-linux', 'chrome')).find((p) => fs.existsSync(p)));
const browser = await chromium.launch({ executablePath: exe, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const shot = (name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });
const step = async (name, fn) => { try { await fn(); await shot(name); console.log('✓', name); } catch (e) { errors.push(`${name}: ${e.message}`); await shot(name + '-FAILED').catch(() => {}); console.log('✗', name, e.message); } };

await page.goto(url); await page.waitForSelector('.auth-card', { timeout: 15000 });
await step('01-activation', async () => { await page.locator('textarea').fill(key); await page.getByRole('button', { name: /تفعيل|Activate/ }).first().click(); await page.waitForSelector('.profile-tile, .alert.info', { timeout: 10000 }); });
await step('02-new-student', async () => { await page.getByRole('button', { name: /طالب جديد|New student/ }).click(); await page.locator('.modal input[type=text]').first().fill('أحمد علي'); await page.locator('.modal input[type=text]').nth(1).fill('2021001'); await page.locator('.modal .btn.primary').click(); await page.waitForSelector('.module-card', { timeout: 10000 }); });
const nav = async (label, waitFor) => { await page.locator('.nav-item', { hasText: label }).first().click(); await page.waitForSelector(waitFor, { timeout: 15000 }); await page.waitForTimeout(600); };
await step('03-home', async () => { await page.waitForSelector('.module-card'); });
await step('04-learn', async () => { await nav(/المكتبة|Learning/, '.prose'); await page.locator('.lesson-item').nth(5).click(); await page.waitForSelector('.prose table'); });
await step('05-design', async () => { await nav(/التصميم|Design/, '.kpi'); for (const tb of await page.locator('.tab').all()) { await tb.click(); await page.waitForTimeout(150); } await page.locator('.tab').first().click(); });
await step('06-factory', async () => { await nav(/توأم المصنع|Factory Twin/, '.twin canvas'); await page.getByRole('button', { name: /تشغيل|Run/ }).first().click(); await page.waitForTimeout(2500); await page.locator('.scene-tabs .btn').nth(1).click(); await page.waitForTimeout(800); });
await step('07-building', async () => { await nav(/شبكة الدكت|Duct Network/, '.twin canvas'); await page.getByRole('button', { name: /موازنة|Auto-balance/ }).click(); await page.waitForTimeout(500); await page.getByRole('button', { name: /حقن عطل|Inject fault/ }).click(); await page.waitForTimeout(500); await page.locator('.scene-tabs .btn', { hasText: /السرعة|Velocity/ }).click(); await page.waitForTimeout(800); });
await step('08-fabrication', async () => { await nav(/التصنيع|Fabrication/, '.kpi'); for (const tb of await page.locator('.tab').all()) { await tb.click(); await page.waitForTimeout(150); } });
await step('09-assessment', async () => { await nav(/الاختبارات|Assessments/, '.card'); await page.locator('input[type=number]').first().fill('6'); await page.getByRole('button', { name: /ابدأ|Start/ }).click(); await page.waitForSelector('.q-card');
  for (let i = 0; i < 6; i++) { const opt = page.locator('.q-option').first(); if (await opt.count()) await opt.click(); else await page.locator('.q-card input[type=number]').fill('1'); const next = page.getByRole('button', { name: /^(التالي|Next)$/ }); if (await next.count()) await next.click(); else { await page.getByRole('button', { name: /إنهاء|Submit/ }).click(); const ok = page.locator('.modal .btn.primary'); if (await ok.count()) await ok.click(); } await page.waitForTimeout(120); }
  await page.waitForSelector('.score-ring', { timeout: 10000 }); });
await step('10-directory', async () => { await nav(/دليل|Directory/, '.map-wrap svg'); await page.locator('select').nth(0).selectOption('AE'); await page.waitForTimeout(300); });
await step('11-settings', async () => { await nav(/الإعدادات|Settings/, '.card'); });
await step('12-about', async () => { await nav(/حول|About/, '.card'); });
await step('13-english', async () => { await page.locator('.topbar .btn', { hasText: /^EN$/ }).click(); await page.waitForSelector('.module-card, .card'); await page.waitForTimeout(400); });
if (role === 'supervisor') {
  await step('14-supervisor', async () => { await page.locator('.topbar .btn[title*="Switch"], .topbar .btn[title*="تبديل"]').first().click(); await page.waitForSelector('.auth-card'); await page.getByRole('button', { name: /Supervisor sign-in|دخول المشرف/ }).click(); await page.locator('.modal input[type=password]').nth(0).fill('1234'); await page.locator('.modal input[type=password]').nth(1).fill('1234'); await page.locator('.modal .btn.primary').click(); await page.waitForSelector('.module-card', { timeout: 10000 }); await page.locator('.nav-item', { hasText: /Supervisor|المشرف/ }).click(); await page.waitForSelector('table.tbl', { timeout: 10000 }); await page.getByRole('button', { name: /Details|التفاصيل/ }).first().click(); await page.waitForSelector('.modal'); });
}
await browser.close(); server.close();
if (errors.length) { console.error('\nERRORS:\n' + errors.join('\n')); process.exit(1); } else console.log('\nSMOKE TEST PASSED — screenshots in', OUT);
