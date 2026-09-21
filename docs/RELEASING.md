# النشر والتحديث التلقائي — Releasing & auto-update

## خطوات إصدار نسخة جديدة
1. عدّل `version` في `package.json` (مثل `1.0.1`) واكتب ملاحظات الإصدار في `RELEASE_NOTES.md` بالعربية والإنجليزية (تظهر للعميل في إشعار التحديث).
2. `git commit -am "release: v1.0.1"`
3. `git tag v1.0.1 && git push origin main --tags` (أو الفرع الذي تعمل عليه + الوسم).
4. تفتح GitHub → Actions → «Build Windows installer & publish release». بعد نحو 8–15 دقيقة يظهر إصدار جديد في Releases الخاصة بمستودع `duct-releases` يحوي:
   - `ASFAN-Duct-Digital-Twin-Setup.exe` (المثبّت — اسم ثابت)
   - `latest.yml` و `ASFAN-Duct-Digital-Twin-Setup.exe.blockmap` (يحتاجهما محدّث البرنامج)
5. النسخ المثبتة تكتشف التحديث تلقائياً (عند التشغيل ثم كل 6 ساعات) وتظهر شارة «يتوفر تحديث جديد»؛ يُنزَّل في الخلفية ثم «إعادة التشغيل والتثبيت».

يمكن أيضاً تشغيل البناء يدوياً من Actions (workflow_dispatch) مع خيار النشر أو بدونه (يُرفع المثبّت كـ Artifact).

## رابط التحميل الواحد للعميل
```
https://github.com/asfantrading-create/duct-releases/releases/latest/download/ASFAN-Duct-Digital-Twin-Setup.exe
```
يشير دائماً إلى أحدث إصدار منشور في مستودع النشر العام.

## بنية المستودعين
- `asfantrading-create/Duct` **خاص**: الكود المصدري، ويعمل فيه خط البناء (Actions).
- `asfantrading-create/duct-releases` **عام**: لا يحوي كوداً، فقط ملفات الإصدارات (`.exe`, `latest.yml`, `.blockmap`). يقرأ منه العملاء والمحدّث التلقائي.

### الإعداد لمرة واحدة
1. أنشئ المستودع العام `duct-releases` من GitHub → **New repository** مع تفعيل **Add a README file** (لا يمكن إنشاء إصدارات في مستودع فارغ تماماً).
2. أنشئ Personal Access Token (classic) بصلاحية `repo` من **Settings → Developer settings → Personal access tokens → Tokens (classic)**.
3. في مستودع الكود `Duct`: **Settings → Secrets and variables → Actions → New repository secret** باسم `RELEASES_TOKEN` وقيمته الرمز.
4. `publish.repo` في `electron-builder.yml` مضبوط على `duct-releases`.

### إصدار نسخة جديدة (من المتصفح)
1. عدّل `version` في `package.json` و`RELEASE_NOTES.md` على الفرع `main`.
2. **Actions → Build Windows installer & publish release → Run workflow**، اختر `main` وفعّل خيار **Publish**، ثم **Run workflow**.
3. بعد نحو 10–15 دقيقة يظهر الإصدار في `duct-releases/releases` وتراه النسخ المثبتة كتحديث تلقائي.

## توقيع الكود (اختياري)
بدون شهادة توقيع يعرض ويندوز تحذير SmartScreen عند أول تشغيل. لإزالته اشترِ شهادة Code Signing (OV/EV) وأضف السرّين `WIN_CSC_LINK` (ملف .pfx مشفّر base64) و`WIN_CSC_KEY_PASSWORD`؛ سيوقّع electron-builder المثبّت تلقائياً.

## البناء محلياً على ويندوز
```bash
npm install
npm run dist      # يُنتج release/ASFAN-Duct-Digital-Twin-Setup.exe بدون نشر
```
