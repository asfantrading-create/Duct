# النشر والتحديث التلقائي — Releasing & auto-update

## خطوات إصدار نسخة جديدة
1. عدّل `version` في `package.json` (مثل `1.0.1`) واكتب ملاحظات الإصدار في `RELEASE_NOTES.md` بالعربية والإنجليزية (تظهر للعميل في إشعار التحديث).
2. `git commit -am "release: v1.0.1"`
3. `git tag v1.0.1 && git push origin main --tags` (أو الفرع الذي تعمل عليه + الوسم).
4. تفتح GitHub → Actions → «Build Windows installer & publish release». بعد نحو 8–15 دقيقة يظهر إصدار جديد في Releases يحوي:
   - `ASFAN-Duct-Digital-Twin-Setup.exe` (المثبّت — اسم ثابت)
   - `latest.yml` و `ASFAN-Duct-Digital-Twin-Setup.exe.blockmap` (يحتاجهما محدّث البرنامج)
5. النسخ المثبتة تكتشف التحديث تلقائياً (عند التشغيل ثم كل 6 ساعات) وتظهر شارة «يتوفر تحديث جديد»؛ يُنزَّل في الخلفية ثم «إعادة التشغيل والتثبيت».

يمكن أيضاً تشغيل البناء يدوياً من Actions (workflow_dispatch) مع خيار النشر أو بدونه (يُرفع المثبّت كـ Artifact).

## رابط التحميل الواحد للعميل
```
https://github.com/asfantrading-create/Duct/releases/latest/download/ASFAN-Duct-Digital-Twin-Setup.exe
```
يشير دائماً إلى أحدث إصدار منشور.

### مهم: المستودع خاص
المستودع `asfantrading-create/Duct` **خاص** حالياً. روابط `releases/latest/download` والمحدّث التلقائي يعملان بلا تسجيل دخول فقط مع مستودع **عام**. خياران:
1. **جعل المستودع عاماً** (Settings → Danger zone → Change visibility). أبسط حل؛ لا يكشف المفتاح الخاص لأنه غير موجود في المستودع، لكنه يكشف الكود المصدري.
2. **مستودع نشر عام منفصل** (موصى به للكود المغلق): أنشئ مستودعاً عاماً فارغاً مثل `asfantrading-create/duct-releases`، ثم:
   - في `electron-builder.yml` غيّر `publish.repo` إلى `duct-releases`.
   - أنشئ Personal Access Token بصلاحية `repo` وأضفه كـ Secret باسم `RELEASES_TOKEN` في مستودع الكود.
   - رابط العميل يصبح `https://github.com/asfantrading-create/duct-releases/releases/latest/download/ASFAN-Duct-Digital-Twin-Setup.exe`.

## توقيع الكود (اختياري)
بدون شهادة توقيع يعرض ويندوز تحذير SmartScreen عند أول تشغيل. لإزالته اشترِ شهادة Code Signing (OV/EV) وأضف السرّين `WIN_CSC_LINK` (ملف .pfx مشفّر base64) و`WIN_CSC_KEY_PASSWORD`؛ سيوقّع electron-builder المثبّت تلقائياً.

## البناء محلياً على ويندوز
```bash
npm install
npm run dist      # يُنتج release/ASFAN-Duct-Digital-Twin-Setup.exe بدون نشر
```
