// Screenshot helper: node test/e2e/shot.mjs <route> [view,view,...]  → OUT_DIR/<route>-<view>.png (browser mock API)
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..'); const dist = path.join(root, 'dist', 'renderer');
const OUT = process.env.OUT_DIR || path.join(root, '.playwright-out'); fs.mkdirSync(OUT, { recursive: true });
const [route = 'factory', viewsArg = 'overview', langArg = 'ar'] = process.argv.slice(2); const views = viewsArg.split(',');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(dist, p); if (!f.startsWith(dist) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => server.listen(0, '127.0.0.1', r)); const url = `http://127.0.0.1:${server.address().port}/`;
const key = execFileSync(process.execPath, ['tools/issue-license.mjs', '--name', 'Shot University', ...(process.env.SHOT_LICENSE || '--type lifetime --supervisor').split(' '), '--out', path.join(OUT, 'shot.lic')], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n')[0];
const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => path.join('/opt/pw-browsers', d, 'chrome-linux', 'chrome')).find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } }); const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url); await page.waitForSelector('.auth-card');
await page.evaluate(async (k) => { const s = JSON.parse(localStorage.getItem('duct.mock.state') || '{}'); s.settings = Object.assign({ lang: 'ar', units: 'si', theme: 'dark', city: 'riyadh' }, s.settings || {}); localStorage.setItem('duct.mock.state', JSON.stringify(s)); }, key);
await page.locator('textarea').fill(key); await page.getByRole('button', { name: /تفعيل|Activate/ }).first().click(); await page.waitForSelector('.profile-tile, .alert.info');
await page.getByRole('button', { name: /طالب جديد|New student/ }).click(); await page.locator('.modal input[type=text]').first().fill('Screenshot Student'); await page.locator('.modal .btn.primary').click(); await page.waitForSelector('.module-card');
await page.waitForTimeout(900); { const skip = page.locator('.modal .btn', { hasText: /تخطّي|Skip/ }); if (await skip.count()) { await skip.click(); await page.waitForTimeout(300); } }
if (langArg === 'en') { await page.locator('.topbar .btn', { hasText: /^EN$/ }).click(); await page.waitForTimeout(500); }
const NAV = { factory: /توأم المصنع|Factory Twin/, building: /شبكة الدكت|Duct Network/, home: /الرئيسية|Home/, learn: /المكتبة|Learning/, design: /التصميم|Design/, fabrication: /التصنيع|Fabrication/, assessment: /الاختبارات|Assessments/, directory: /دليل|Directory/, settings: /الإعدادات|Settings/, about: /حول|About/, guide: /دليل الاستخدام|User Guide/, gallery: /معرض الدكت|Duct 3D Gallery/ };
await page.locator('.nav-item', { hasText: NAV[route] }).first().click(); await page.waitForTimeout(1500); { const skip = page.locator('.modal .btn', { hasText: /تخطّي|Skip/ }); if (await skip.count()) { await skip.click(); await page.waitForTimeout(300); } }
if (route === 'factory' || route === 'building') { const run = page.getByRole('button', { name: /^(تشغيل|Run)$/ }); if (await run.count()) await run.first().click(); }
for (const v of views) { if (v.startsWith('chip:')) { await page.locator('.gallery-chips .chip').nth(parseInt(v.slice(5), 10)).click(); } else if (v.startsWith('tool:')) { const b = page.locator('.scene-tools .btn', { hasText: new RegExp(v.slice(5), 'i') }); if (await b.count()) await b.first().click(); } else if (v !== 'default') { const b = page.locator('.scene-tabs .btn', { hasText: new RegExp(v, 'i') }); if (await b.count()) await b.first().click(); } await page.waitForTimeout(parseInt(process.env.SETTLE_MS || '2600', 10)); await page.screenshot({ path: path.join(OUT, `${route}-${String(views.indexOf(v) + 1).padStart(2, "0")}.png`) }); console.log("shot", views.indexOf(v) + 1, v); }
await browser.close(); server.close(); if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(1); }
