// Contextual help content per screen (bilingual) + helper to show it in a modal.
import { h, icon, modal, renderMarkdown } from './ui.js';
import { t, tr, L } from './i18n.js';

export const HELP = {
  home: { title: { ar: 'الصفحة الرئيسية', en: 'Home' }, body: {
    ar: `## ماذا تفعل هنا؟
هذه لوحة البداية. تعرض ملخص نتائجك وبطاقات الوحدات الست. اضغط أي بطاقة لفتح الوحدة.

## المسار المقترح للمتدرب
1. **المكتبة التعليمية**: اقرأ الدروس بالترتيب واضغط «أكملت هذا الدرس».
2. **مختبر التصميم**: جرّب الحاسبات لتثبيت الفهم.
3. **توأم المصنع** و**توأم شبكة الدكت**: شغّل المحاكاة وغيّر المتغيرات وشاهد النتائج.
4. **الاختبارات**: أنجز الاختبار المكلَّف من المشرف أو اختباراً ذاتياً.

## للمشرف
افتح **لوحة المشرف** لإنشاء الفصول والاختبارات المكلَّفة ومتابعة الطلاب.`,
    en: `## What is this screen?
The start page: your results summary and the six module cards. Click a card to open the module.

## Suggested path for trainees
1. **Learning Library**: read the lessons in order and mark them complete.
2. **Design Lab**: try the calculators.
3. **Factory Twin** and **Duct Network Twin**: run the simulation, change variables, watch the results.
4. **Assessments**: take the exam assigned by your supervisor or a self-test.

## For supervisors
Open the **Supervisor Dashboard** to create classes, assign exams and track students.` } },
  learn: { title: { ar: 'المكتبة التعليمية', en: 'Learning Library' }, body: {
    ar: `## كيف تستخدمها
- القائمة على الجانب فيها 14 درساً مرتبة من الأساسيات إلى التوأم الرقمي. اضغط الدرس لقراءته.
- في نهاية كل درس اضغط **أكملت هذا الدرس** ليُسجَّل تقدمك، ويظهر للمشرف.
- زر **اختبر نفسي** يفتح اختباراً قصيراً في موضوع الدرس.
- بدّل اللغة من الزر العلوي (EN / ع) في أي وقت.`,
    en: `## How to use it
- The side list has 14 lessons ordered from fundamentals to digital twins. Click one to read it.
- At the end of each lesson click **Mark as completed** so your progress is recorded and visible to the supervisor.
- **Quiz me** opens a short quiz on the lesson topic.
- Switch language with the EN / ع button at the top at any time.` } },
  design: { title: { ar: 'مختبر التصميم', en: 'Design Lab' }, body: {
    ar: `## ست حاسبات هندسية
- **تحليل مقطع**: أدخل المقاس والتدفق والطول والفتنغز؛ تحصل على السرعة وضغط السرعة وفقد الاحتكاك والفقد الكلي والسماكة المناسبة.
- **تحجيم**: اختر طريقة الاحتكاك المتساوي أو السرعة؛ يقترح القطر الدائري القياسي والمقطع المستطيل المكافئ.
- **الوزن والتكلفة**: وزن الصاج ومساحة السطح وتكلفة تقديرية قابلة للتعديل.
- **العزل والتكاثف**: اختر المدينة والعزل؛ يحسب الاكتساب الحراري وخطر التكاثف.
- **المروحة**: قوانين المراوح وتوفير الطاقة عند تغيير السرعة.
- **تحويل الوحدات**: اكتب في أي خانة تتحدث البقية.

كل النتائج تتحدث فوراً عند تغيير أي رقم.`,
    en: `## Six engineering calculators
- **Segment analysis**: size, flow, length and fittings → velocity, velocity pressure, friction, total loss and gauge.
- **Sizing**: equal-friction or velocity method → standard round diameter and equivalent rectangle.
- **Weight & cost**: sheet weight, surface area and an editable cost estimate.
- **Insulation & condensation**: pick city and insulation → heat gain and condensation risk.
- **Fan**: fan laws and energy savings at reduced speed.
- **Unit converter**: type in any field and the others update.

Results update instantly when you change a number.` } },
  factory: { title: { ar: 'توأم المصنع', en: 'Factory Twin' }, body: {
    ar: `## الفكرة
نموذج ثلاثي الأبعاد لمصنع دكت مع محاكاة حية لخط الإنتاج بسبع محطات: مخزن اللفائف، القطع، التشكيل، التجميع، العزل، ضبط الجودة، الشحن.

## خطوات الاستخدام
1. **السيناريو**: اختر مصنعاً حقيقياً من الدليل أو ابقَ على المصنع النموذجي، واختر المدينة.
2. اضغط **تشغيل**. الزمن المحاكى يتقدم، وتتحرك القطع على الناقل، وتتغير مصابيح الحالة فوق المحطات: أخضر يعمل، أصفر خامل، أحمر عطل.
3. حرّك المتغيرات في **التحكم**: سرعة الآلات، العمالة، حصة العزل، الهدر، الهدف. شاهد أثرها على **OEE** والإنتاجية والطاقة.
4. انقر أي محطة في المشهد لعرض آلاتها وقراءاتها. الحلقة الحمراء النابضة تعني اختناقاً: تراكم عمل جارٍ أمام المحطة.
5. **حفظ الجلسة** يسجل النتائج باسمك ليطّلع عليها المشرف. **تصدير** ينتج CSV أو تقرير PDF.

## التحكم بالكاميرا
اسحب بالفأرة للتدوير، عجلة الفأرة للتقريب، الزر الأيمن للتحريك. أزرار المشاهد أسفل النموذج، وزر **السقف** يخفي السقف.`,
    en: `## The idea
A 3D duct factory with a live production-line simulation of seven stations: coil storage, cutting, forming, assembly, insulation, QC, dispatch.

## Steps
1. **Scenario**: pick a real factory from the directory or keep the generic one, and choose the city.
2. Press **Run**. Simulated time advances, pieces move on the conveyor and the status beacons change: green running, yellow idle, red breakdown.
3. Move the **Controls**: machine speed, operators, insulated share, scrap, target. Watch **OEE**, throughput and energy respond.
4. Click any station in the scene to see its machines and readings. A pulsing red ring marks a bottleneck: work piling up in front of a station.
5. **Save session** records the results under your name for the supervisor. **Export** produces CSV or a PDF report.

## Camera
Drag to orbit, wheel to zoom, right-drag to pan. View buttons are below the model; **Roof** hides the roof.` } },
  building: { title: { ar: 'توأم شبكة الدكت', en: 'Duct Network Twin' }, body: {
    ar: `## الفكرة
مبنى مكاتب فيه وحدة مناولة هواء على السطح تغذي ثلاثة فروع: A المكاتب، B قاعة الاجتماعات بصندوق VAV، C المعمل. الحاسب يحل الشبكة فورياً بمعادلات ASHRAE وSMACNA عند أي تغيير.

## خطوات الاستخدام
1. اختر **المدينة** وساعة اليوم؛ تتغير حرارة المحيط ومعها الاكتساب الحراري والتكاثف.
2. غيّر **سرعة المروحة**، **انسداد الفلتر**، و**الدامبرات** وشاهد التدفق عند كل مخرج في جدول المخارج والمشهد.
3. **موازنة تلقائية (TAB)** تضبط الدامبرات وسرعة المروحة ليصل كل مخرج إلى تدفق التصميم، كما يفعل فني الموازنة.
4. **حقن عطل** يطبّق عطلاً عشوائياً: فلتر مسدود، دامبر عالق، تسرب، عزل متضرر، سير مرتخٍ. حاول تشخيصه من القراءات ثم أصلحه.
5. **تشغيل الزمن الحي** يجعل الفلتر يتّسخ تدريجياً وتتغير الحرارة عبر اليوم، لترى الاتجاهات في الرسوم.
6. ألوان الدكت: اختر **الضغط** أو **السرعة** أو **الحرارة** من الأزرار أسفل المشهد. انقر أي دكت لقراءة حساساته.

## القراءات المهمة
الضغط الاستاتيكي مقابل فئة الضغط 500 باسكال، التسرب %، اكتساب الحرارة كW، قدرة المروحة مقابل المقنن، والتنبيهات.`,
    en: `## The idea
An office building with a rooftop AHU feeding three branches: A offices, B meeting hall with a VAV box, C laboratory. The solver recomputes the network instantly with ASHRAE and SMACNA equations on every change.

## Steps
1. Pick the **city** and hour of day; ambient temperature drives heat gain and condensation.
2. Change **fan speed**, **filter loading** and the **dampers** and watch each outlet's flow in the table and the scene.
3. **Auto-balance (TAB)** sets the dampers and fan speed so every outlet reaches design flow, like a balancing technician.
4. **Inject fault** applies a random fault: clogged filter, stuck damper, leakage, damaged insulation, slipping belt. Diagnose it from the readings, then fix it.
5. **Run live time** loads the filter gradually and changes temperature through the day so you can see trends.
6. Duct colours: choose **Pressure**, **Velocity** or **Temperature** below the scene. Click any duct to read its sensors.

## Key readings
Static pressure vs the 500 Pa class, leakage %, heat gain kW, fan power vs rating, and alarms.` } },
  fabrication: { title: { ar: 'التصنيع وضبط الجودة', en: 'Fabrication & QC' }, body: {
    ar: `- **اختبار التسرب**: أدخل مساحة الدكت وضغط الاختبار والتسرب المقاس؛ يخبرك بالمسموح والنتيجة ناجح/راسب.
- **السماكة والتقوية**: أدخل الضلع الأطول؛ تحصل على السماكة وفق SMACNA وDW/144.
- **الحمالات والوصلات**: جداول مرجعية.
- **الآلات وخط الإنتاج**: كتالوج الآلات بسرعاتها وقدراتها.
- **قائمة فحص الجودة**: علّم البنود واطبعها PDF لتستخدمها في المصنع أو الموقع.`,
    en: `- **Leakage test**: enter duct surface, test pressure and measured leakage → allowable and PASS/FAIL.
- **Gauge & reinforcement**: enter the longest side → SMACNA and DW/144 thickness.
- **Hangers & joints**: reference tables.
- **Machines & line**: machine catalogue with speeds and power.
- **QC checklist**: tick items and print a PDF for the shop or site.` } },
  assessment: { title: { ar: 'الاختبارات', en: 'Assessments' }, body: {
    ar: `## نوعان من الاختبارات
- **اختبار مكلَّف**: أنشأه المشرف وحدد عدد أسئلته ووقته ودرجة نجاحه. يظهر في أعلى الصفحة بعنوانه؛ اضغط **ابدأ** لتأديته. جميع الطلاب يحصلون على الأسئلة نفسها.
- **اختبار ذاتي**: تختار أنت الوحدات وعدد الأسئلة والوقت للتدريب.

## أثناء الاختبار
الأسئلة اختيار من متعدد أو صح/خطأ أو حسابية تكتب فيها رقماً. يمكنك التنقل بين الأسئلة قبل التسليم. المؤقت في الأعلى.

## بعد التسليم
تظهر النتيجة والإجابات الصحيحة، وتُحفظ باسمك ويراها المشرف. يمكنك تصدير التقرير PDF أو CSV.`,
    en: `## Two kinds of exams
- **Assigned exam**: created by your supervisor with a fixed number of questions, time and pass mark. It appears at the top with its title; press **Start**. All students get the same questions.
- **Self-test**: you choose modules, question count and time for practice.

## During the exam
Questions are multiple choice, true/false or numeric. You can move between questions before submitting. The timer is at the top.

## After submitting
You see the score and the correct answers; the attempt is saved under your name and visible to the supervisor. Export the report as PDF or CSV.` } },
  directory: { title: { ar: 'دليل المصانع', en: 'Factory Directory' }, body: {
    ar: `قائمة مصانع دكت حقيقية في الوطن العربي جُمعت من مصادر منشورة علناً مع روابط المصادر. استخدم الفلاتر بالدولة والمنتج والمعيار، وانقر نقطة على الخريطة للانتقال إلى المصنع. زر **محاكاة** يفتح توأم المصنع بسيناريو هذا المصنع ومناخ مدينته.`,
    en: `Real duct factories in the Arab world collected from publicly published sources with links. Filter by country, product and standard, or click a map dot. **Simulate** opens the Factory Twin with this factory's scenario and city climate.` } },
  supervisor: { title: { ar: 'لوحة المشرف', en: 'Supervisor Dashboard' }, body: {
    ar: `## ما تراه
كل الطلاب الذين استخدموا هذا الجهاز، وكل الطلاب على الأجهزة المرتبطة بمجلد الفصل المشترك، مع محاولاتهم وإجاباتهم ودروسهم وجلسات المحاكاة.

## كيف تختبر الطلاب
1. تبويب **الاختبارات المكلَّفة** → **اختبار جديد**: اختر العنوان والوحدات وعدد الأسئلة والوقت ودرجة النجاح وتاريخ الإغلاق.
2. يظهر الاختبار للطلاب في صفحة **الاختبارات** عندهم؛ كل طالب يدخل بملفه ويؤديه.
3. تظهر نتائج كل اختبار مكلَّف في تبويبه: من أنجز، ومن لم ينجز، والدرجات والإجابات.

## عدة أجهزة
في **الإعدادات** اختر **مجلد الفصل المشترك** على كل الأجهزة، أو استورد ملفات JSON التي يصدّرها الطلاب.

## التصدير
CSV لكل الطلاب لـ Excel، وتقرير PDF موجز، وتقرير PDF لكل محاولة.`,
    en: `## What you see
Every student who used this computer, plus students on computers linked to the shared classroom folder, with their attempts, answers, lessons and simulation sessions.

## How to test students
1. **Assigned exams** tab → **New exam**: title, modules, question count, time, pass mark and closing date.
2. The exam appears on the students' **Assessments** page; each student signs in with their profile and takes it.
3. Results per assigned exam appear in its tab: who finished, who did not, scores and answers.

## Several computers
In **Settings** choose the **shared classroom folder** on every computer, or import the JSON files students export.

## Export
CSV of all students for Excel, a summary PDF, and a PDF per attempt.` } },
  settings: { title: { ar: 'الإعدادات', en: 'Settings' }, body: { ar: `اللغة والمظهر وحجم الخط، المدينة الافتراضية للمناخ، مجلد الفصل المشترك لتجميع نتائج عدة أجهزة، التحديثات التلقائية، والترخيص.`, en: `Language, theme and text size, default climate city, the shared classroom folder for multi-PC results, automatic updates and the license.` } },
};

export function showHelp(route) {
  const hlp = HELP[route] || HELP.home;
  modal({ title: `${tr('مساعدة', 'Help')}: ${L(hlp.title)}`, wide: true, body: h('article', { class: 'prose', html: renderMarkdown(L(hlp.body)) }), actions: [{ label: t('close'), primary: true }] });
}
