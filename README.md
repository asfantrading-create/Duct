<p align="center"><img src="assets/logo.png" alt="ASFAN" height="70"></p>

# ASFAN Duct Digital Twin — التوأم الرقمي لمجاري الهواء (Duct)

برنامج ويندوز تعليمي من **شركة أصفان (ASFAN)** لمحاكاة مصانع وشبكات مجاري الهواء (Duct) لأنظمة التكييف ببيانات هندسية حقيقية، مع مكتبة تعليمية ثنائية اللغة، اختبارات تقييم، لوحة مشرف، تراخيص موقّعة رقمياً، وتحديثات تلقائية.

An educational Windows application by **ASFAN Trading Co.** — a digital twin of HVAC duct factories and duct networks built on real engineering data, with a bilingual learning library, assessments, a supervisor dashboard, digitally signed licenses and automatic updates.

📧 info@asfanco.com · 📱 WhatsApp +962 77 614 0404

---

## المحتوى / Contents

| الوحدة | Module | الوصف |
|---|---|---|
| المكتبة التعليمية | Learning Library | 14 درساً (عربي/إنجليزي): الأنواع، المواد والسماكات، المعايير (SMACNA, DW/144, ASHRAE, EN)، الاحتكاك والفتنغز، التحجيم، التسرب، العزل، التصنيع، التركيب، TAB، التوأم الرقمي، السلامة |
| مختبر التصميم | Design Lab | تحليل مقطع، تحجيم (سرعة/احتكاك متساوٍ)، القطر المكافئ، السماكة، الوزن والتكلفة، العزل والتكاثف، قوانين المراوح، تحويل الوحدات |
| توأم المصنع | Factory Twin | نموذج 3D لمصنع دكت مع محاكاة خط الإنتاج (7 محطات)، OEE، الاختناقات، الطاقة، الأعطال؛ يمكن ربطه بمصنع حقيقي من الدليل |
| توأم شبكة الدكت | Duct Network Twin | شبكة مبنى 3D: مروحة VFD، فلتر، دامبرات، VAV، تسرب SMACNA، اكتساب حراري، تكاثف، موازنة تلقائية، حقن أعطال |
| التصنيع وضبط الجودة | Fabrication & QC | اختبار التسرب، جداول السماكة، الحمالات والوصلات، كتالوج الآلات، قائمة فحص PDF |
| الاختبارات | Assessments | 64 سؤالاً (اختيار متعدد، صح/خطأ، حسابية عشوائية) مع تقارير PDF/CSV/JSON |
| دليل المصانع | Factory Directory | 89 مصنع دكت في 14 دولة عربية (بيانات منشورة علناً ومُتحقَّق منها، مع المصادر) وخريطة |
| لوحة المشرف | Supervisor Dashboard | نتائج كل الطلاب، الاختبارات المكلَّفة (اختبار موحد لكل الطلاب)، الفصول، الاستيراد، التصدير، تقارير PDF |
| دليل الاستخدام | User Guide | شرح البرنامج خطوة بخطوة وشرح كل شاشة، مع جولة أولى وزر «شرح الشاشة» |

## البنية التقنية / Tech stack

- **Electron 44** (Windows x64, NSIS installer) · **three.js** (3D) · **esbuild** (renderer bundle) · vanilla JS, no framework.
- Main process: `src/main/` (license verification, JSON store, classroom sync, exports, auto-update).
- Shared engine: `src/shared/` (`engineering.js` physics, `network-sim.js`, `factory-sim.js`, `quiz-bank.js`, `content/lessons.js`, `data/*`).
- Renderer: `src/renderer/` (views, i18n, three.js scenes). Bundled to `dist/renderer/` by `scripts/build-renderer.mjs`.

## التطوير / Development

```bash
npm install
npm run dev            # bundles the renderer and starts Electron (F12 = DevTools)
npm run test:unit      # node --test (license, physics, store, classroom, sims, quiz, data)
node test/e2e/smoke.mjs                      # headless-Chromium UI smoke test (browser mock API)
xvfb-run -a node test/e2e/electron-smoke.mjs  # real Electron end-to-end test (Linux: needs xvfb)
```

In a plain browser (no Electron) the renderer runs against a localStorage mock so the UI can be developed and tested quickly.

## الإصدار والتحديثات التلقائية / Release & auto-update

1. Update `version` in `package.json` and write notes in `RELEASE_NOTES.md` (AR/EN).
2. Merge to `main`, then either push a tag (`git tag v1.0.1 && git push origin v1.0.1`) or open **Actions → Build Windows installer & publish release → Run workflow** with *Publish* ticked.
3. GitHub Actions (`.github/workflows/release.yml`) builds the installer on Windows, runs the tests and publishes a GitHub Release in `duct-releases` containing `ASFAN-Duct-Digital-Twin-Setup.exe`, `latest.yml` and the `.blockmap`.
4. Installed copies check GitHub Releases at start-up and every 6 hours; users see “update available”, download in the background and restart to install (electron-updater).

**Customer download link (fixed):** `https://github.com/asfantrading-create/duct-releases/releases/latest/download/ASFAN-Duct-Digital-Twin-Setup.exe`

> Installers are published to the separate **public** repository `asfantrading-create/duct-releases` (the source code in this repository stays private). The workflow needs a `RELEASES_TOKEN` secret (personal access token with `repo` scope) to upload there. See `docs/RELEASING.md`.

Optional: add `WIN_CSC_LINK` / `WIN_CSC_PASSWORD` secrets with a code-signing certificate to remove the Windows SmartScreen warning.

## التراخيص / Licensing

- Keys are ECDSA P-256 signatures of a JSON payload: `ADDT1-<payload>.<signature>` (same scheme as the ASFAN Renewable-Energy generator, new prefix and key pair).
- **Seller tools:** `tools/license-generator.html` (open in a browser; loads `tools/keys/private.jwk.json`) or `node tools/issue-license.mjs --name "..." [--type subscription --expires YYYY-MM-DD] [--supervisor] [--seats N] [--machine ID] [--modules A,B]`.
- Lifetime or time-limited keys, optional machine binding (machine ID shown in the app), optional module restriction, optional supervisor role and seat count.
- The private key is **not** in the repository (`tools/keys/private.jwk.json` is git-ignored). Keep a backup. To create a new pair (invalidates all existing keys): `node tools/generate-keys.mjs --force`, then rebuild/release. Details: `docs/LICENSING.md`.

## الفصول والمشرف / Classroom & supervisor

Supervisors create **assigned exams** (same seeded questions for every student, time limit, pass mark, closing date) from the dashboard; students see them on their Assessments page. Students’ results are stored locally (`%APPDATA%/asfan-duct-digital-twin`). A supervisor (teacher) license unlocks the PIN-protected dashboard; setting a **shared classroom folder** (network share or synced cloud folder) on all PCs mirrors every student’s results there, so the supervisor sees everyone. JSON exports can also be imported manually. See `docs/CLASSROOM.md`.

## البيانات والمراجع / Data & references

- Physics per ASHRAE Handbook—Fundamentals (Altshul–Tsal, Huebscher, roughness classes), SMACNA (leakage/seal classes, gauges, pressure classes), DW/144 thickness classes.
- Factory directory: `research/factories.json` (sources per entry, verified 2026-09-21); climate: `research/climate.json` (ASHRAE 2017 values for Riyadh, Dubai, Cairo; 2009 for Alexandria, Algiers; other cities approximate and flagged). Adding a factory: append to `src/shared/data/factories.json` following the existing schema.
- All content is educational and not a substitute for certified engineering design.

© 2026 ASFAN Trading Co. — شركة أصفان. All rights reserved.
