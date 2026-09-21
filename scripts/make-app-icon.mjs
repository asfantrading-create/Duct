// Renders assets/app-logo.svg to PNG at several sizes with headless Chromium (no native image libs needed).
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = fs.readFileSync(path.join(root, 'assets', 'app-logo.svg'), 'utf8');
const exe = fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => path.join('/opt/pw-browsers', d, 'chrome-linux', 'chrome')).find((p) => fs.existsSync(p)) : undefined;
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
for (const size of [1024, 512, 256, 128, 64]) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body></html>`);
  await page.screenshot({ path: path.join(root, size === 1024 ? 'assets/app-logo-1024.png' : size === 512 ? 'build/icon.png' : `assets/app-logo-${size}.png`), omitBackground: true });
  await page.close();
}
await browser.close(); console.log('app icon PNGs rendered');
