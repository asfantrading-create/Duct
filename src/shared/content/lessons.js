'use strict';
/** Bilingual learning library. Body text is mini-markdown (headings, lists, tables, $$ formula blocks). */
const LESSONS = [
{
  id: 'intro', order: 1, minutes: 12, title: { ar: 'مقدمة: دور مجاري الهواء (Duct) في أنظمة التكييف', en: 'Introduction: the role of ducts in HVAC systems' },
  body: {
ar: `## ما هي مجاري الهواء ولماذا نهتم بها؟
مجاري الهواء (Ducts) هي شبكة القنوات التي تنقل الهواء المعالَج (المبرَّد أو المسخَّن أو المفلتر) من وحدة مناولة الهواء (AHU) أو وحدة التكييف إلى الفضاءات المكيَّفة، وتعيد الهواء الراجع (Return) وتطرد هواء العادم (Exhaust) وتجلب الهواء النقي (Fresh air). قد يبدو الدكت مجرد "صندوق صاج"، لكنه يحدد راحة المستخدم، وجودة الهواء الداخلي، واستهلاك الطاقة، ومستوى الضجيج في المبنى.

### مكونات نظام توزيع الهواء
- **المروحة (Fan)** داخل وحدة مناولة الهواء: تولّد فرق الضغط الذي يدفع الهواء.
- **الدكت الرئيسي والفروع**: مقاطع مستطيلة أو دائرية أو بيضاوية.
- **الفتنغز (Fittings)**: أكواع، انتقالات، تفرعات (Tee/Wye)، وصلات مرنة.
- **أجهزة التحكم**: دامبرات ضبط الحجم (VCD)، دامبرات الحريق والدخان، صناديق الحجم المتغير (VAV).
- **المخارج (Terminals)**: مخارج هواء (Diffusers)، شبكات (Grilles)، وفتحات الراجع.
- **العزل والإحكام**: عزل حراري خارجي أو بطانة داخلية، ومانع تسرب على جميع الوصلات.

### لماذا يهم التصميم والتصنيع الجيد؟
| الجانب | أثر الدكت الجيد | أثر الدكت الرديء |
|---|---|---|
| الراحة | توزيع منتظم لدرجة الحرارة والهواء | مناطق حارة/باردة، تيارات هوائية |
| الطاقة | فقد ضغط منخفض وتسرب أقل من 3% | تسرب 15–25% في الشبكات غير المحكمة، ومروحة تستهلك طاقة أكثر بنسبة 20–40% |
| الجودة الداخلية IAQ | هواء نقي كافٍ، لا يجرّ هواء الأسقف المغبّر | سحب هواء من فراغات الأسقف ونمو الفطريات عند التكاثف |
| الضجيج | سرعات معتدلة وأكواع ناعمة | صفير عند الدامبرات والمخارج (NC عالٍ) |

### أنواع أنظمة توزيع الهواء
- **حجم ثابت (CAV)**: تدفق ثابت وتحكم بدرجة الحرارة عبر ملف التبريد.
- **حجم متغير (VAV)**: صناديق VAV تغيّر التدفق حسب حِمل كل منطقة؛ تتطلب ضغطاً استاتيكياً مضبوطاً ومروحة بسرعة متغيرة (VFD).
- **ضغط منخفض/متوسط/عالٍ**: بحسب SMACNA تُصنَّف الشبكات بفئات ضغط من 125 إلى 2500 باسكال (½ إلى 10 بوصة ماء).

### سياق الوطن العربي
درجات الحرارة التصميمية في مدن الخليج تتجاوز 44–47°م مع رطوبة عالية على السواحل، وتصل الحمولة الغبارية إلى مستويات مرتفعة. هذا يفرض: عزلاً سميكاً بحاجز بخار محكم لتجنب التكاثف على دكت الهواء البارد (13–16°م)، وإحكاماً عالياً للتسرب لأن الهواء المتسرب في فراغ سقف حرارته 35–40°م يُهدر طاقة تبريد مكلفة، وفلاتر ذات مراحل متعددة. كذلك يُعدّ قطاع تصنيع الدكت من أكبر قطاعات تصنيع المعادن الخفيفة في المنطقة، وتوجد عشرات المصانع في السعودية والإمارات وقطر ومصر وغيرها (انظر «دليل المصانع»).

> **خلاصة**: الدكت الجيد = حسابات صحيحة + تصنيع دقيق وفق المعايير + إحكام وعزل + تركيب واختبار سليم.`,
en: `## What are ducts and why do they matter?
Ducts are the network of channels that move conditioned air (cooled, heated or filtered) from the air-handling unit (AHU) to the occupied spaces, bring the air back (return), remove exhaust air and introduce fresh air. A duct may look like a simple “sheet-metal box”, but it determines comfort, indoor air quality, energy use and noise in a building.

### Components of an air distribution system
- **Fan** inside the AHU: generates the pressure difference that moves the air.
- **Main duct and branches**: rectangular, round or flat-oval sections.
- **Fittings**: elbows, transitions, tees/wyes, flexible connections.
- **Control devices**: volume control dampers (VCD), fire and smoke dampers, variable-air-volume (VAV) boxes.
- **Terminals**: diffusers, grilles and return openings.
- **Insulation and sealing**: external insulation or internal lining, sealant on every joint.

### Why good design and fabrication matter
| Aspect | Good ductwork | Poor ductwork |
|---|---|---|
| Comfort | Even temperature and air distribution | Hot/cold spots, draughts |
| Energy | Low pressure loss, leakage < 3% | 15–25% leakage in unsealed systems, fan energy 20–40% higher |
| IAQ | Sufficient fresh air, no dusty ceiling air drawn in | Air pulled from ceiling voids, mould growth where condensation occurs |
| Noise | Moderate velocities, smooth elbows | Whistling at dampers and outlets (high NC) |

### Air distribution system types
- **Constant air volume (CAV)**: constant flow, temperature controlled at the cooling coil.
- **Variable air volume (VAV)**: VAV boxes vary the flow with each zone’s load; needs controlled static pressure and a variable-speed fan (VFD).
- **Low / medium / high pressure**: SMACNA pressure classes range from 125 to 2500 Pa (½ to 10 in. w.g.).

### The Arab-world context
Design temperatures in Gulf cities exceed 44–47 °C, with high coastal humidity and heavy dust loads. This demands thick insulation with a continuous vapour barrier to avoid condensation on cold-air ducts (13–16 °C), very tight sealing because air leaking into a 35–40 °C ceiling void wastes expensive cooling, and multi-stage filtration. Duct manufacturing is one of the largest light-metal industries in the region, with dozens of factories in Saudi Arabia, the UAE, Qatar, Egypt and elsewhere (see the Factory Directory).

> **Summary**: good ductwork = correct calculations + accurate fabrication to standards + sealing and insulation + proper installation and testing.`,
  },
},
{
  id: 'duct-types', order: 2, minutes: 12, title: { ar: 'أنواع وأشكال مجاري الهواء', en: 'Duct types and shapes' },
  body: {
ar: `## الأشكال الأساسية
| الشكل | المزايا | العيوب | الاستخدام النموذجي |
|---|---|---|---|
| **مستطيل** | يناسب الفراغات المحدودة فوق الأسقف، سهل التفرّع، أي نسبة أبعاد | محيط أكبر لنفس المساحة (وزن ومادة أكثر)، تسرب أعلى، يتطلب تقوية | الرئيسي والفروع في المباني التجارية |
| **دائري (حلزوني)** | أقل احتكاك وتسرب، أقوى إنشائياً، أقل وزناً، صوتياً أفضل | يحتاج ارتفاعاً أكبر، الفتنغز أغلى | الفروع، الأنظمة العالية الضغط، المكشوف المعماري |
| **بيضاوي مسطّح** | يجمع بعض مزايا الدائري مع ارتفاع أقل | صناعة خاصة، توفر محدود | ممرات بارتفاع محدود |
| **مرن (Flexible)** | سهولة التوصيل بالمخارج، يمتص الاهتزاز | احتكاك عالٍ جداً إن لم يُشدّ، يتلف بسهولة | الوصلات النهائية ≤ 1.5–2 م |
| **قماشي (Fabric)** | توزيع منتظم، لا تكاثف، خفيف وقابل للغسل | لا يناسب الراجع/العادم، مظهر معماري محدد | الصالات والمصانع والمساجد الكبيرة |
| **لوح مسبق العزل (PIR/فينولي)** | عزل مدمج، خفيف جداً، تركيب سريع، تسرب منخفض | حساس للصدمات، ضغط تشغيل محدود (≤ 1000–1500 باسكال حسب اللوح) | المشاريع التجارية والسكنية في الخليج |

## نسبة الأبعاد (Aspect ratio)
النسبة بين عرض المقطع وارتفاعه. كلما زادت النسبة زاد المحيط والوزن والاحتكاك لنفس التدفق. توصي معظم المراجع بنسبة **≤ 4:1** والأفضل **≤ 3:1**. مثال: مقطع 400×400 مم مساحته 0.16 م² ومحيطه 1.6 م؛ مقطع 800×200 مم له نفس المساحة لكن محيطه 2.0 م (+25% صاج) وقطره المكافئ أصغر (احتكاك أعلى).

## القطر المكافئ
لاستخدام مخططات الاحتكاك (المبنية للدكت الدائري) مع الدكت المستطيل نستخدم قطر **Huebscher** المكافئ الذي يعطي نفس فقد الاحتكاك لنفس التدفق:
$$
De = 1.30 × (a·b)^0.625 / (a+b)^0.25
$$
مثال: 600×300 مم → De ≈ 457 مم.

## المقاسات القياسية
- دائري (EN 1506 / الشائع): 100، 125، 160، 200، 250، 315، 400، 500، 630، 800، 1000، 1250 مم.
- مستطيل: بزيادات 50 مم عادةً (مثل 300×200، 600×400، 1000×500).
- الأطوال القياسية للقطع المستطيلة: 1.2 م (48 بوصة) أو 1.5 م حسب عرض اللفة.

## نصائح اختيار
- استخدم الدائري حيث يسمح الارتفاع؛ يوفر 15–30% من طاقة المروحة مقارنة بمستطيل بنسبة أبعاد عالية.
- حدّ طول الدكت المرن وشُدّه بالكامل؛ الدكت المرن المضغوط 30% قد يضاعف فقد الاحتكاك أربع مرات.
- في الأجواء الرطبة (جدة، دبي، الدوحة) فكّر في الألواح مسبقة العزل أو عزل سميك مع حاجز بخار متصل.`,
en: `## Basic shapes
| Shape | Advantages | Disadvantages | Typical use |
|---|---|---|---|
| **Rectangular** | Fits shallow ceiling voids, easy to branch, any aspect ratio | Larger perimeter for the same area (more metal), higher leakage, needs reinforcement | Mains and branches in commercial buildings |
| **Round (spiral)** | Lowest friction and leakage, structurally strongest, lightest, acoustically better | Needs more height, fittings cost more | Branches, high-pressure systems, exposed architectural duct |
| **Flat oval** | Some round advantages with less height | Special manufacture, limited availability | Corridors with limited height |
| **Flexible** | Easy connection to outlets, absorbs vibration | Very high friction if not stretched, easily damaged | Final connections ≤ 1.5–2 m |
| **Fabric** | Even distribution, no condensation, light and washable | Not for return/exhaust, specific look | Halls, factories, large mosques |
| **Pre-insulated panel (PIR/phenolic)** | Built-in insulation, very light, fast installation, low leakage | Impact-sensitive, limited operating pressure (≤ 1000–1500 Pa depending on panel) | Commercial and residential projects in the Gulf |

## Aspect ratio
The ratio of width to height. The higher the ratio, the larger the perimeter, weight and friction for the same flow. Most references recommend **≤ 4:1**, preferably **≤ 3:1**. Example: 400×400 mm has an area of 0.16 m² and a perimeter of 1.6 m; 800×200 mm has the same area but a 2.0 m perimeter (+25% metal) and a smaller equivalent diameter (more friction).

## Equivalent diameter
To use friction charts (built for round ducts) with rectangular ducts we use the **Huebscher** equivalent diameter, which gives the same friction loss for the same flow:
$$
De = 1.30 × (a·b)^0.625 / (a+b)^0.25
$$
Example: 600×300 mm → De ≈ 457 mm.

## Standard sizes
- Round (EN 1506 / common): 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250 mm.
- Rectangular: usually in 50 mm increments (e.g. 300×200, 600×400, 1000×500).
- Standard rectangular section lengths: 1.2 m (48 in) or 1.5 m depending on coil width.

## Selection tips
- Use round duct wherever the height allows; it saves 15–30% fan energy compared with a high-aspect-ratio rectangular duct.
- Limit flexible duct length and stretch it fully; 30% compressed flex can quadruple friction loss.
- In humid climates (Jeddah, Dubai, Doha) consider pre-insulated panels or thick insulation with a continuous vapour barrier.`,
  },
},
{
  id: 'materials-gauges', order: 3, minutes: 14, title: { ar: 'المواد والسماكات (Gauges) وفئات الضغط', en: 'Materials, gauges and pressure classes' },
  body: {
ar: `## المواد الشائعة
- **الصاج المجلفن (GI)**: الأكثر استخداماً (أكثر من 80% من الدكت في المنطقة). مواصفة شائعة DX51D+Z275 (EN 10346) أو ASTM A653 G90؛ Z275 تعني 275 غ/م² زنك على الوجهين. كثافة الفولاذ 7850 كغ/م³.
- **الألمنيوم**: كثافة 2700 كغ/م³ (ثلث وزن الفولاذ)، مقاوم للتآكل؛ يُستخدم للمسابح والمناطق الرطبة؛ أضعف إنشائياً فيُختار أسمك بدرجة.
- **الستانلس ستيل 304/316**: عوادم المطابخ التجارية (NFPA 96 يشترط لحاماً مستمراً)، المختبرات، البيئات الكيميائية والساحلية.
- **الألواح مسبقة العزل**: رغوة PIR بسماكة 20–30 مم (k ≈ 0.022 واط/م·ك) أو فينولي 22 مم (k ≈ 0.021) بين وجهَي ألمنيوم 80 ميكرون؛ وزن ≈ 1.5 كغ/م² مقابل ≈ 6–7 كغ/م² للصاج المجلفن 0.7 مم مع العزل.

## جدول السماكات (Gauge) للصاج المجلفن
| Gauge | السماكة (مم) | السماكة (بوصة) | الاستخدام النموذجي |
|---|---|---|---|
| 26 | 0.55 | 0.0217 | دكت صغير ≤ 300 مم، ضغط منخفض |
| 24 | 0.70 | 0.0276 | الفروع والرئيسي المتوسط (الأكثر شيوعاً) |
| 22 | 0.85 | 0.0336 | مقاطع 780–1370 مم أو ضغط متوسط |
| 20 | 1.00 | 0.0396 | مقاطع كبيرة 1400–2130 مم |
| 18 | 1.31 | 0.0516 | مقاطع ضخمة، مداخن، ضغط عالٍ |
| 16 | 1.61 | 0.0635 | تطبيقات صناعية |

## فئات الضغط بحسب SMACNA
| الفئة | الضغط الاستاتيكي | ملاحظات |
|---|---|---|
| ½" w.g. | 125 باسكال | راجع وعادم منخفض الضغط |
| 1" w.g. | 250 باسكال | إمداد منخفض الضغط (الأكثر شيوعاً في المساكن) |
| 2" w.g. | 500 باسكال | الإمداد التجاري القياسي؛ يحدد أغلب المواصفات الخليجية الدكت الرئيسي بهذه الفئة |
| 3"–4" w.g. | 750–1000 باسكال | أنظمة VAV متوسطة الضغط قبل الصناديق |
| 6"–10" w.g. | 1500–2500 باسكال | أنظمة عالية الضغط/الصناعية |

تحدد جداول SMACNA لكل فئة ضغط ولكل عرض مقطع **السماكة الدنيا** و**نوع التقوية ومسافاتها** (زوايا، قضبان شد Tie rods، خصور Beading). القاعدة: كلما زاد عرض المقطع أو الضغط زادت السماكة أو قلّت مسافة التقوية.

## مواصفة DW/144 (المملكة المتحدة – شائعة في الخليج)
تُصنّف الدكت إلى منخفض (حتى 500 باسكال)، متوسط (حتى 1000)، وعالي الضغط (حتى 2500)، مع جداول سماكة بحسب الضلع الأطول:
| الضلع الأطول (مم) | منخفض | متوسط | عالٍ |
|---|---|---|---|
| ≤ 400 | 0.6 | 0.6 | 0.8 |
| 401–600 | 0.6 | 0.8 | 0.8 |
| 601–800 | 0.8 | 0.8 | 1.0 |
| 801–1000 | 0.8 | 1.0 | 1.0 |
| 1001–1250 | 1.0 | 1.0 | 1.2 |
| 1251–2000 | 1.0 | 1.2 | 1.2 |
| 2001–3000 | 1.2 | 1.2–1.6 | 1.6 |
(قيم نموذجية تعليمية — راجع الجداول الرسمية للمشاريع.)

## حساب وزن الصاج
$$
الوزن (كغ) = المحيط (م) × الطول (م) × السماكة (م) × 7850 × معامل الهدر (1.10–1.15)
$$
مثال: قطعة 600×400 مم بطول 1.2 م وسماكة 0.7 مم: المحيط 2.0 م → 2.0 × 1.2 × 0.0007 × 7850 × 1.12 ≈ **14.8 كغ**.`,
en: `## Common materials
- **Galvanized steel (GI)**: the most used (over 80% of duct in the region). Common spec DX51D+Z275 (EN 10346) or ASTM A653 G90; Z275 means 275 g/m² of zinc on both faces. Steel density 7850 kg/m³.
- **Aluminium**: density 2700 kg/m³ (a third of steel), corrosion resistant; used for pools and humid areas; structurally weaker so one gauge heavier is chosen.
- **Stainless steel 304/316**: commercial kitchen exhaust (NFPA 96 requires continuous welding), laboratories, chemical and coastal environments.
- **Pre-insulated panels**: 20–30 mm PIR foam (k ≈ 0.022 W/m·K) or 22 mm phenolic (k ≈ 0.021) between two 80 µm aluminium facings; ≈ 1.5 kg/m² versus ≈ 6–7 kg/m² for 0.7 mm GI with insulation.

## Galvanized sheet gauge table
| Gauge | Thickness (mm) | Thickness (in) | Typical use |
|---|---|---|---|
| 26 | 0.55 | 0.0217 | Small duct ≤ 300 mm, low pressure |
| 24 | 0.70 | 0.0276 | Branches and medium mains (most common) |
| 22 | 0.85 | 0.0336 | 780–1370 mm sections or medium pressure |
| 20 | 1.00 | 0.0396 | Large sections 1400–2130 mm |
| 18 | 1.31 | 0.0516 | Very large sections, stacks, high pressure |
| 16 | 1.61 | 0.0635 | Industrial applications |

## SMACNA pressure classes
| Class | Static pressure | Notes |
|---|---|---|
| ½" w.g. | 125 Pa | Low-pressure return and exhaust |
| 1" w.g. | 250 Pa | Low-pressure supply (most residential) |
| 2" w.g. | 500 Pa | Standard commercial supply; most Gulf specifications put mains in this class |
| 3"–4" w.g. | 750–1000 Pa | Medium-pressure VAV systems upstream of boxes |
| 6"–10" w.g. | 1500–2500 Pa | High-pressure / industrial systems |

For each pressure class and duct width, the SMACNA tables give the **minimum gauge** and the **type and spacing of reinforcement** (angles, tie rods, beading). Rule: the wider the section or the higher the pressure, the thicker the sheet or the closer the reinforcement.

## DW/144 (UK – widely used in the Gulf)
Classifies ductwork as low (up to 500 Pa), medium (up to 1000) and high pressure (up to 2500), with thickness tables by longest side:
| Longest side (mm) | Low | Medium | High |
|---|---|---|---|
| ≤ 400 | 0.6 | 0.6 | 0.8 |
| 401–600 | 0.6 | 0.8 | 0.8 |
| 601–800 | 0.8 | 0.8 | 1.0 |
| 801–1000 | 0.8 | 1.0 | 1.0 |
| 1001–1250 | 1.0 | 1.0 | 1.2 |
| 1251–2000 | 1.0 | 1.2 | 1.2 |
| 2001–3000 | 1.2 | 1.2–1.6 | 1.6 |
(Typical educational values — consult the official tables for projects.)

## Sheet weight calculation
$$
Weight (kg) = perimeter (m) × length (m) × thickness (m) × 7850 × waste factor (1.10–1.15)
$$
Example: a 600×400 mm piece, 1.2 m long, 0.7 mm: perimeter 2.0 m → 2.0 × 1.2 × 0.0007 × 7850 × 1.12 ≈ **14.8 kg**.`,
  },
},
{
  id: 'standards', order: 4, minutes: 10, title: { ar: 'المعايير والمواصفات: SMACNA، DW/144، ASHRAE، EN', en: 'Standards: SMACNA, DW/144, ASHRAE, EN' },
  body: {
ar: `## لماذا المعايير؟
تحدد المعايير كيف يُصنَّع الدكت ويُقوَّى ويُحكَم ويُختبر، لتضمن أن ما يُحسب على الورق يعمل في الموقع. في مشاريع الوطن العربي تُذكر عادةً المواصفات الأمريكية (SMACNA/ASHRAE) والبريطانية (DW/144) معاً، إضافة إلى الأكواد المحلية.

## أهم المراجع
| المرجع | الجهة | ماذا يغطي |
|---|---|---|
| **SMACNA HVAC Duct Construction Standards – Metal & Flexible** | SMACNA (الولايات المتحدة) | فئات الضغط، السماكات، التقوية، الوصلات، الحمالات، فئات الإحكام |
| **SMACNA HVAC Air Duct Leakage Test Manual** | SMACNA | فئات التسرب (CL)، إجراءات الاختبار، حساب التسرب المسموح |
| **DW/144** | BESA (المملكة المتحدة) | مواصفة الدكت المعدني: الفئات منخفض/متوسط/عالٍ، السماكات، التقوية |
| **DW/143** | BESA | دليل اختبار تسرب الدكت |
| **ASHRAE Handbook – Fundamentals (فصل تصميم الدكت)** | ASHRAE | معادلات الاحتكاك، الخشونة، معاملات الفتنغز، طرق التحجيم |
| **ASHRAE 90.1 / 62.1** | ASHRAE | كفاءة الطاقة (إحكام وعزل الدكت)، معدلات التهوية |
| **EN 1507 / EN 12237** | CEN (أوروبا) | متانة وتسرب الدكت المستطيل/الدائري (فئات A–D) |
| **EN 1506** | CEN | أبعاد الدكت الدائري |
| **EN 13403** | CEN | الدكت غير المعدني (الألواح المعزولة) |
| **UL 181 / 181A / 181B** | UL | الدكت المرن والوصلات وشرائط الإحكام |
| **NFPA 90A / 96** | NFPA | الحماية من الحريق في أنظمة التكييف / عوادم المطابخ التجارية |

## الأكواد المحلية والاعتمادات
- **السعودية**: كود البناء السعودي (SBC 501 الميكانيكي، SBC 601 الطاقة) ويستند إلى IMC/ASHRAE؛ تشترط مشاريع أرامكو مواصفات SAES وتسجيل الموردين.
- **الإمارات**: لائحة المباني الخضراء في دبي، Estidama في أبوظبي، ومختبر دبي المركزي (DCL) لاعتماد منتجات مثل الألواح مسبقة العزل والدكت المقاوم للحريق.
- **قطر**: مواصفات الإنشاءات القطرية QCS (القسم 22 – الأنظمة الميكانيكية) تحيل إلى SMACNA وDW/144.
- **مصر**: الكود المصري لأسس تصميم وتنفيذ أعمال التكييف والتهوية.
- **الأردن**: كودات البناء الوطني الأردني (كود التدفئة والتهوية وتكييف الهواء) مع اعتماد ASHRAE.

## فئات الإحكام (SMACNA Seal Class)
| فئة الإحكام | ما يُحكَم | فئة الضغط المرتبطة |
|---|---|---|
| **A** | جميع الوصلات العرضية والطولية واختراقات الجدار | 1000 باسكال وأعلى (وتُشترط كثيراً لكل الفئات في الخليج) |
| **B** | الوصلات العرضية والطولية | 750 باسكال |
| **C** | الوصلات العرضية فقط | 500 باسكال وأقل |

> في معظم مواصفات المشاريع الحديثة يُطلب **Seal Class A** لكل الدكت بغض النظر عن الفئة، لأن التسرب يكلّف طاقة تبريد غالية.`,
en: `## Why standards?
Standards define how duct is fabricated, reinforced, sealed and tested, so that what is calculated on paper works on site. Arab-world projects usually cite the American (SMACNA/ASHRAE) and British (DW/144) references together, in addition to local codes.

## Key references
| Reference | Body | Scope |
|---|---|---|
| **SMACNA HVAC Duct Construction Standards – Metal & Flexible** | SMACNA (USA) | Pressure classes, gauges, reinforcement, joints, hangers, seal classes |
| **SMACNA HVAC Air Duct Leakage Test Manual** | SMACNA | Leakage classes (CL), test procedure, allowable leakage |
| **DW/144** | BESA (UK) | Sheet-metal ductwork specification: low/medium/high classes, thickness, stiffening |
| **DW/143** | BESA | Duct leakage testing guide |
| **ASHRAE Handbook – Fundamentals (Duct Design chapter)** | ASHRAE | Friction equations, roughness, fitting coefficients, sizing methods |
| **ASHRAE 90.1 / 62.1** | ASHRAE | Energy efficiency (duct sealing and insulation), ventilation rates |
| **EN 1507 / EN 12237** | CEN (Europe) | Strength and leakage of rectangular/round duct (classes A–D) |
| **EN 1506** | CEN | Round duct dimensions |
| **EN 13403** | CEN | Non-metallic ducts (insulated panels) |
| **UL 181 / 181A / 181B** | UL | Flexible ducts, connectors and closure tapes |
| **NFPA 90A / 96** | NFPA | Fire protection in HVAC systems / commercial kitchen exhaust |

## Local codes and approvals
- **Saudi Arabia**: Saudi Building Code (SBC 501 mechanical, SBC 601 energy) based on IMC/ASHRAE; Aramco projects require SAES specifications and vendor registration.
- **UAE**: Dubai Green Building Regulations, Estidama in Abu Dhabi, and Dubai Central Laboratory (DCL) certification for products such as pre-insulated panels and fire-rated ducts.
- **Qatar**: Qatar Construction Specifications QCS (Section 22 – mechanical) referring to SMACNA and DW/144.
- **Egypt**: Egyptian Code for HVAC design and execution.
- **Jordan**: Jordanian National Building Codes (HVAC code) adopting ASHRAE.

## SMACNA seal classes
| Seal class | What is sealed | Associated pressure class |
|---|---|---|
| **A** | All transverse joints, longitudinal seams and wall penetrations | 1000 Pa and above (often specified for all classes in the Gulf) |
| **B** | Transverse joints and longitudinal seams | 750 Pa |
| **C** | Transverse joints only | 500 Pa and below |

> Most modern project specifications require **Seal Class A** for all ductwork regardless of class, because leakage wastes expensive cooling energy.`,
  },
},
{
  id: 'airflow', order: 5, minutes: 12, title: { ar: 'أساسيات تدفق الهواء: التدفق، السرعة، الضغوط', en: 'Airflow fundamentals: flow, velocity, pressures' },
  body: {
ar: `## معادلة الاستمرارية
$$
Q = V × A
$$
Q التدفق الحجمي (م³/ث)، V السرعة (م/ث)، A مساحة المقطع (م²). مثال: 1000 لتر/ث (1 م³/ث) في دكت دائري 400 مم (A = 0.126 م²) → V ≈ 7.96 م/ث.

## الوحدات المستخدمة في المنطقة
| الكمية | SI | الوحدات الإنجليزية | التحويل |
|---|---|---|---|
| التدفق | لتر/ث، م³/س | CFM (قدم³/دقيقة) | 1 CFM = 0.472 لتر/ث؛ 1 م³/س = 0.278 لتر/ث |
| الضغط | باسكال | بوصة ماء (in. w.g.) | 1 in. w.g. = 249 باسكال |
| السرعة | م/ث | fpm (قدم/دقيقة) | 1 م/ث = 197 fpm |
| القدرة | كيلوواط | طن تبريد (TR) | 1 TR = 3.517 كW |

## أنواع الضغط في الدكت
- **الضغط الاستاتيكي (Ps)**: الضغط الذي يدفع على جدران الدكت في كل الاتجاهات؛ هو ما تقيسه فتحة جانبية، وهو الذي يسبب التسرب والانبعاج، وعليه تُبنى فئات الضغط.
- **ضغط السرعة (Pv)**: الطاقة الحركية للهواء:
$$
Pv = ½ × ρ × V²
$$
عند كثافة 1.2 كغ/م³ وسرعة 8 م/ث → Pv ≈ 38 باسكال.
- **الضغط الكلي (Pt)** = Ps + Pv. المروحة ترفع الضغط الكلي، والاحتكاك والفتنغز يخفضانه على طول المسار.

## كثافة الهواء
$$
ρ = P / (R × T)   حيث R = 287 J/(kg·K)
$$
عند 20°م وضغط بحري ρ = 1.204 كغ/م³. عند 45°م تنخفض إلى 1.11، وفي صنعاء (ارتفاع 2200 م) إلى نحو 0.95 كغ/م³ — أي أن نفس التدفق الحجمي يحمل كتلة هواء (وقدرة تبريد) أقل بنحو 20%، وينخفض فقد الضغط بنفس النسبة. في عمّان (700 م) الانخفاض حوالي 8%.

## عدد رينولدز
$$
Re = V × D / ν     (ν ≈ 1.5×10⁻⁵ م²/ث للهواء عند 20°م)
$$
في الدكت الفعلي Re عادةً 10⁵–10⁶ أي جريان مضطرب بالكامل، وهذا الافتراض هو أساس معادلات الاحتكاك في ASHRAE.

## مثال تطبيقي
دكت مستطيل 500×300 مم يحمل 700 لتر/ث:
- A = 0.15 م² → V = 0.7/0.15 = 4.67 م/ث.
- Pv = 0.5 × 1.2 × 4.67² ≈ 13 باسكال.
- De = 1.30 × (500×300)^0.625 / (800)^0.25 ≈ 420 مم.
هذه القيم هي مدخلات مخطط الاحتكاك في الدرس التالي.`,
en: `## Continuity equation
$$
Q = V × A
$$
Q volumetric flow (m³/s), V velocity (m/s), A cross-section area (m²). Example: 1000 L/s (1 m³/s) in a 400 mm round duct (A = 0.126 m²) → V ≈ 7.96 m/s.

## Units used in the region
| Quantity | SI | IP units | Conversion |
|---|---|---|---|
| Flow | L/s, m³/h | CFM | 1 CFM = 0.472 L/s; 1 m³/h = 0.278 L/s |
| Pressure | Pa | in. w.g. | 1 in. w.g. = 249 Pa |
| Velocity | m/s | fpm | 1 m/s = 197 fpm |
| Power | kW | tons of refrigeration (TR) | 1 TR = 3.517 kW |

## Pressures in a duct
- **Static pressure (Ps)**: the pressure pushing on the duct walls in all directions; measured by a side tap, it causes leakage and bulging and defines the pressure classes.
- **Velocity pressure (Pv)**: the kinetic energy of the air:
$$
Pv = ½ × ρ × V²
$$
At 1.2 kg/m³ and 8 m/s → Pv ≈ 38 Pa.
- **Total pressure (Pt)** = Ps + Pv. The fan raises total pressure; friction and fittings reduce it along the path.

## Air density
$$
ρ = P / (R × T)   with R = 287 J/(kg·K)
$$
At 20 °C and sea level ρ = 1.204 kg/m³. At 45 °C it drops to 1.11, and in Sana’a (2200 m altitude) to about 0.95 kg/m³ — the same volumetric flow carries about 20% less air mass (and cooling capacity), and pressure losses fall by the same proportion. In Amman (700 m) the reduction is about 8%.

## Reynolds number
$$
Re = V × D / ν     (ν ≈ 1.5×10⁻⁵ m²/s for air at 20 °C)
$$
In real ducts Re is usually 10⁵–10⁶, i.e. fully turbulent, which is the assumption behind the ASHRAE friction equations.

## Worked example
A 500×300 mm rectangular duct carrying 700 L/s:
- A = 0.15 m² → V = 0.7/0.15 = 4.67 m/s.
- Pv = 0.5 × 1.2 × 4.67² ≈ 13 Pa.
- De = 1.30 × (500×300)^0.625 / (800)^0.25 ≈ 420 mm.
These are the inputs to the friction chart in the next lesson.`,
  },
},
{
  id: 'friction-fittings', order: 6, minutes: 15, title: { ar: 'فقد الاحتكاك والفتنغز', en: 'Friction and fitting losses' },
  body: {
ar: `## فقد الاحتكاك (دارسي–فايسباخ)
$$
Δp_f = f × (L / D) × (ρ V² / 2)
$$
f معامل الاحتكاك، L الطول، D القطر (أو القطر المكافئ De للمستطيل). تستخدم ASHRAE معادلة **Altshul–Tsal** الصريحة:
$$
f' = 0.11 × (ε/D + 68/Re)^0.25
f = f'            إذا f' ≥ 0.018
f = 0.85 f' + 0.0028   إذا f' < 0.018
$$
ε الخشونة المطلقة للسطح الداخلي.

## فئات الخشونة (ASHRAE)
| الفئة | ε (مم) | المواد |
|---|---|---|
| أملس | 0.03 | ألمنيوم، PVC، فولاذ غير مطلي |
| متوسط الملاسة | 0.09 | **صاج مجلفن بوصلات كل 1.2 م** (المرجع الشائع) |
| متوسط | 0.15 | مجلفن حلزوني بوصلات كل 3 م |
| متوسط الخشونة | 0.9 | بطانة صوف زجاجي، دكت مرن مشدود بالكامل |
| خشن | 3.0 | دكت مرن معدني، دكت مرن غير مشدود |

## قاعدة عملية
عند سرعة 6–8 م/ث في دكت مجلفن بحجم 300–600 مم يكون فقد الاحتكاك نحو **1–2 باسكال/م**. يُصمَّم عادةً على 0.8–1.0 باسكال/م للأنظمة التجارية (أقل ضجيجاً وطاقة) وحتى 1.5–2.0 في الفراغات المحدودة.

## فقد الفتنغز
$$
Δp_fitting = C × Pv
$$
C معامل الفقد المحلي من قاعدة بيانات ASHRAE (Duct Fitting Database). قيم نموذجية:
| الفتنغ | C |
|---|---|
| كوع دائري أملس 90° نصف قطر 1.5 D | 0.15 |
| كوع دائري 90° نصف قطر 1.0 D | 0.22 |
| كوع حاد (Mitre) 90° بدون ريش | 1.2 |
| كوع مستطيل حاد مع ريش توجيه | 0.15–0.35 |
| انتقال تدريجي ≤ 20° | 0.05 |
| تفرّع T – خط الفرع | 0.5–1.0 (حسب نسبة التدفق) |
| تفرّع T – الخط المستقيم | 0.1–0.3 |
| دامبر فراشة مفتوح كلياً | 0.2 |
| دامبر فراشة عند 30° | ≈ 4.5 |
| دامبر فراشة عند 50° | ≈ 29 |
| مخرج إلى الغرفة | 1.0 (فقد كل Pv) |

> **ملاحظة**: كوع حاد بلا ريش يفقد ثمانية أضعاف كوع ناعم؛ في شبكة بعشرة أكواع قد يمثل الفرق 150–300 باسكال أي زيادة ملموسة في حجم المروحة وطاقتها.

## تأثير النظام (System Effect)
تنخفض قدرة المروحة إن رُكِّب كوع مباشرةً على مخرجها أو كان المدخل غير منتظم. توصي AMCA/SMACNA بترك مسافة مستقيمة ≥ 2.5–3 أقطار مكافئة بعد المروحة قبل أول كوع.

## مثال شامل
مسار: 20 م دكت 400 مم دائري، 1 م³/ث، 3 أكواع ناعمة (C=0.15)، مخرج (C=1.0):
- V = 7.96 م/ث، Pv = 38 باسكال، Δp/L ≈ 1.6 باسكال/م → احتكاك 32 باسكال.
- فتنغز: (3×0.15 + 1.0) × 38 ≈ 55 باسكال.
- المجموع ≈ **87 باسكال** لهذا المسار (بدون فلتر وملف).`,
en: `## Friction loss (Darcy–Weisbach)
$$
Δp_f = f × (L / D) × (ρ V² / 2)
$$
f friction factor, L length, D diameter (or equivalent diameter De for rectangular). ASHRAE uses the explicit **Altshul–Tsal** equation:
$$
f' = 0.11 × (ε/D + 68/Re)^0.25
f = f'            if f' ≥ 0.018
f = 0.85 f' + 0.0028   if f' < 0.018
$$
ε is the absolute roughness of the inner surface.

## Roughness classes (ASHRAE)
| Class | ε (mm) | Materials |
|---|---|---|
| Smooth | 0.03 | Aluminium, PVC, uncoated steel |
| Medium smooth | 0.09 | **Galvanized steel with joints every 1.2 m** (the usual reference) |
| Average | 0.15 | Galvanized spiral with joints every 3 m |
| Medium rough | 0.9 | Fibrous glass liner, flexible duct fully extended |
| Rough | 3.0 | Flexible metal duct, flexible duct not fully extended |

## Rule of thumb
At 6–8 m/s in 300–600 mm galvanized duct the friction loss is about **1–2 Pa/m**. Commercial systems are usually designed at 0.8–1.0 Pa/m (less noise and energy), up to 1.5–2.0 in tight spaces.

## Fitting losses
$$
Δp_fitting = C × Pv
$$
C is the local loss coefficient from the ASHRAE Duct Fitting Database. Typical values:
| Fitting | C |
|---|---|
| 90° smooth round elbow, radius 1.5 D | 0.15 |
| 90° round elbow, radius 1.0 D | 0.22 |
| 90° mitred elbow without vanes | 1.2 |
| 90° mitred rectangular elbow with turning vanes | 0.15–0.35 |
| Gradual transition ≤ 20° | 0.05 |
| Tee – branch path | 0.5–1.0 (depends on flow ratio) |
| Tee – straight path | 0.1–0.3 |
| Butterfly damper fully open | 0.2 |
| Butterfly damper at 30° | ≈ 4.5 |
| Butterfly damper at 50° | ≈ 29 |
| Exit to room | 1.0 (all Pv lost) |

> **Note**: a mitred elbow without vanes loses eight times more than a smooth one; in a system with ten elbows the difference can be 150–300 Pa — a noticeable increase in fan size and energy.

## System effect
Fan capacity drops if an elbow is fitted directly on the fan outlet or the inlet is disturbed. AMCA/SMACNA recommend ≥ 2.5–3 equivalent diameters of straight duct after the fan before the first elbow.

## Complete example
Path: 20 m of 400 mm round duct, 1 m³/s, 3 smooth elbows (C = 0.15), exit (C = 1.0):
- V = 7.96 m/s, Pv = 38 Pa, Δp/L ≈ 1.6 Pa/m → friction 32 Pa.
- Fittings: (3×0.15 + 1.0) × 38 ≈ 55 Pa.
- Total ≈ **87 Pa** for this path (excluding filter and coil).`,
  },
},
{
  id: 'sizing', order: 7, minutes: 15, title: { ar: 'طرق تحجيم الدكت', en: 'Duct sizing methods' },
  body: {
ar: `## 1) طريقة السرعة (Velocity method)
اختر سرعة مناسبة لكل جزء ثم احسب المساحة A = Q/V. سريعة وبسيطة لكنها لا توازن الضغوط بين الفروع.
| التطبيق | الرئيسي (م/ث) | الفروع (م/ث) |
|---|---|---|
| مساكن | 3.5–5 | 3–4 |
| مدارس ومكاتب ومباني عامة | 5–6.5 | 4–5 |
| مباني صناعية | 6–9 | 5–6 |
| أنظمة عالية السرعة | 10–20 | 8–12 |
عند المخارج تُحدَّد السرعة بمعيار الضجيج: 2–3 م/ث على وجه المخرج في المكاتب.

## 2) طريقة الاحتكاك المتساوي (Equal friction)
الأكثر شيوعاً في المباني التجارية: يُثبَّت معدل فقد الاحتكاك (مثلاً **0.8–1.0 باسكال/م**) لكل الشبكة، ويُختار مقاس كل قطعة بحيث يعطي هذا المعدل عند تدفقها. النتيجة: تنخفض السرعة تلقائياً كلما قلّ التدفق في الفروع، فيقلّ الضجيج بعيداً عن المروحة. تُوازَن الفروع القريبة (ذات المسار الأقصر) بدامبرات ضبط الحجم.

خطوات:
1. احسب تدفق كل مقطع (مجموع تدفقات المخارج التي يغذيها).
2. اختر معدل الاحتكاك؛ لكل مقطع احسب القطر الدائري الذي يحقق هذا المعدل (من المخطط أو المعادلة).
3. حوّل إلى مستطيل عبر القطر المكافئ إن لزم، مع نسبة أبعاد ≤ 3–4.
4. قرّب للمقاس القياسي الأعلى.
5. احسب فقد المسار الحرج (الأطول/الأعلى مقاومة) = احتكاك + فتنغز + مخرج + فلتر + ملف = الضغط الاستاتيكي المطلوب من المروحة.

## 3) طريقة استرداد الضغط الاستاتيكي (Static regain)
تُصمَّم المقاطع بحيث يُستردّ جزء من ضغط السرعة كضغط استاتيكي عند كل تفرّع (لأن السرعة تنخفض)، فيبقى الضغط الاستاتيكي شبه ثابت عند جميع المخارج — مناسبة لأنظمة VAV وشبكات الضغط العالي الطويلة. نتائجها شبكة أكبر حجماً في الأطراف.

## 4) طريقة T (T-method)
تحسين اقتصادي يوازن بين تكلفة الدكت الأولية وتكلفة طاقة المروحة على عمر النظام؛ تُستخدم في برامج التصميم.

## مثال (احتكاك متساوٍ عند 1.0 باسكال/م)
| المقطع | التدفق (ل/ث) | D دائري (مم) | مستطيل مكافئ | السرعة (م/ث) |
|---|---|---|---|---|
| الرئيسي | 2000 | ≈ 600 | 700×450 | 6.3 |
| بعد الفرع الأول | 1400 | ≈ 520 | 600×400 | 5.8 |
| فرع | 600 | ≈ 370 | 400×300 | 5.0 |
| ذراع مخرج | 200 | ≈ 240 | 250 دائري | 4.1 |

## ملاحظات تصميمية
- لا تُصغّر مقاس الدكت مباشرة بعد المروحة؛ استخدم انتقالاً تدريجياً.
- ضع دامبر ضبط حجم على كل فرع، قريباً من التفرّع وليس من المخرج (لتقليل الضجيج).
- في أنظمة VAV يجب أن يتوفر عند مدخل الصندوق ضغط استاتيكي أدنى (عادة 60–125 باسكال) عند أقل سرعة للمروحة.
- استخدم الحاسبة في «مختبر التصميم» لتجربة الطرق ومقارنة النتائج.`,
en: `## 1) Velocity method
Choose a suitable velocity for each part and calculate the area A = Q/V. Quick and simple but does not balance pressures between branches.
| Application | Mains (m/s) | Branches (m/s) |
|---|---|---|
| Residences | 3.5–5 | 3–4 |
| Schools, offices, public buildings | 5–6.5 | 4–5 |
| Industrial buildings | 6–9 | 5–6 |
| High-velocity systems | 10–20 | 8–12 |
At the outlets velocity is governed by noise: 2–3 m/s at the diffuser face in offices.

## 2) Equal friction method
The most common for commercial buildings: a fixed friction rate (e.g. **0.8–1.0 Pa/m**) is used for the whole system and each section is sized to give that rate at its flow. Velocity then falls automatically as branch flows reduce, so noise decreases away from the fan. Near branches (shorter paths) are balanced with volume dampers.

Steps:
1. Find each section’s flow (sum of the outlets it serves).
2. Choose the friction rate; for each section find the round diameter that gives it (chart or equation).
3. Convert to rectangular via equivalent diameter if needed, with aspect ratio ≤ 3–4.
4. Round up to the standard size.
5. Compute the critical path loss (longest / highest resistance) = friction + fittings + outlet + filter + coil = fan static pressure required.

## 3) Static regain method
Sections are sized so that part of the velocity pressure is recovered as static pressure at each branch (because velocity drops), keeping static pressure nearly constant at all outlets — suited to VAV and long high-pressure systems. It produces larger ducts at the extremities.

## 4) T-method
An economic optimisation balancing first cost of duct against fan energy over the system life; used in design software.

## Example (equal friction at 1.0 Pa/m)
| Section | Flow (L/s) | Round D (mm) | Rectangular equivalent | Velocity (m/s) |
|---|---|---|---|---|
| Main | 2000 | ≈ 600 | 700×450 | 6.3 |
| After first branch | 1400 | ≈ 520 | 600×400 | 5.8 |
| Branch | 600 | ≈ 370 | 400×300 | 5.0 |
| Outlet run-out | 200 | ≈ 240 | 250 round | 4.1 |

## Design notes
- Do not reduce the duct size immediately after the fan; use a gradual transition.
- Fit a volume damper on every branch, near the take-off rather than the outlet (less noise).
- In VAV systems a minimum inlet static pressure (usually 60–125 Pa) must be available at the box at the lowest fan speed.
- Use the Design Lab calculator to try the methods and compare results.`,
  },
},
{
  id: 'leakage', order: 8, minutes: 14, title: { ar: 'التسرب والإحكام واختبار التسرب', en: 'Leakage, sealing and leakage testing' },
  body: {
ar: `## لماذا التسرب مهم؟
كل لتر هواء مبرَّد يتسرب في فراغ السقف هو طاقة مدفوعة بلا فائدة. تُقدَّر خسائر الشبكات غير المحكمة بـ 15–25% من تدفق المروحة، بينما تصل الشبكات المحكمة جيداً (Seal Class A) إلى أقل من 2–3%.

## معادلة SMACNA للتسرب
$$
F = CL × P^0.65
$$
F معدل التسرب (CFM لكل 100 قدم² من سطح الدكت)، P الضغط الاستاتيكي للاختبار (بوصة ماء)، CL فئة التسرب. بوحدات SI:
$$
تسرب (ل/ث لكل م²) = 0.001407 × CL × P(باسكال)^0.65
$$

## فئات التسرب النموذجية
| فئة الإحكام | دائري CL | مستطيل CL |
|---|---|---|
| بدون إحكام | 30 | 48 |
| C | 12 | 24 |
| B | 6 | 12 |
| A | 3 | 6 |

## مثال
شبكة مستطيلة بمساحة سطح 200 م² عند ضغط 500 باسكال:
- CL = 6 (فئة A): 0.001407 × 6 × 500^0.65 × 200 ≈ **96 لتر/ث**.
- CL = 24 (فئة C): ≈ 383 لتر/ث.
- CL = 48 (بدون إحكام): ≈ 766 لتر/ث — أي ما يعادل تقريباً تدفق قاعة اجتماعات كاملة!

## طريقة الاختبار (SMACNA / DW/143)
1. عزل الجزء المُختبَر (عادة 10–25% من الشبكة، أو كلها للأنظمة عالية الضغط) وإغلاق النهايات بألواح محكمة.
2. توصيل جهاز الاختبار: مروحة + فوهة/أوريفس معايَر + مقياسا ضغط.
3. رفع الضغط إلى ضغط الاختبار (= فئة ضغط الدكت، مثلاً 500 باسكال) وتثبيته.
4. قراءة فرق الضغط عبر الفوهة → حساب تدفق التسرب الفعلي.
5. المقارنة مع المسموح: تسرب مسموح = المعادلة × مساحة السطح المُختبَرة. النجاح إن كان الفعلي ≤ المسموح.
6. عند الفشل: البحث عن مواقع التسرب (صابون/دخان/سماع)، الإحكام، إعادة الاختبار.

## أين يتسرب الدكت عادةً؟
- زوايا وصلات TDF/TDC غير المحكمة وزوايا الفلنجات.
- وصلات Slip & Drive الطولية ونهايات شرائح الـ S.
- اختراقات الدكت (مسامير أنابيب الحساسات، أذرع الدامبرات).
- وصلات الدكت المرن على الأطواق (Spigots) إن لم يُشدّ الرباط ويُختم.
- أبواب الفحص (Access doors) بحشوات متضررة.

## مواد الإحكام
- **مانع تسرب مائي (Water-based duct sealant)**: الوصلات العرضية والطولية، يُدهن قبل التجميع أو بعده.
- **ماستيك + شريط تقوية** للفجوات الأكبر.
- **حشوات فلنجات (Butyl/Neoprene)** بين فلنجات TDF.
- **شريط ألمنيوم**: يُستخدم لتغطية وصلات العزل والألواح مسبقة العزل، وليس بديلاً عن المانع في الصاج.

> في «توأم شبكة الدكت» يمكنك تبديل فئة الإحكام ومشاهدة أثرها على التدفق عند المخارج وقدرة المروحة.`,
en: `## Why leakage matters
Every litre of cooled air leaking into a ceiling void is paid-for energy wasted. Unsealed systems are estimated to lose 15–25% of fan flow, while well-sealed systems (Seal Class A) achieve under 2–3%.

## SMACNA leakage equation
$$
F = CL × P^0.65
$$
F leakage rate (CFM per 100 ft² of duct surface), P test static pressure (in. w.g.), CL leakage class. In SI units:
$$
leakage (L/s per m²) = 0.001407 × CL × P(Pa)^0.65
$$

## Typical leakage classes
| Seal class | Round CL | Rectangular CL |
|---|---|---|
| Unsealed | 30 | 48 |
| C | 12 | 24 |
| B | 6 | 12 |
| A | 3 | 6 |

## Example
A rectangular system with 200 m² of surface at 500 Pa:
- CL = 6 (class A): 0.001407 × 6 × 500^0.65 × 200 ≈ **96 L/s**.
- CL = 24 (class C): ≈ 383 L/s.
- CL = 48 (unsealed): ≈ 766 L/s — roughly the supply of an entire meeting hall!

## Test procedure (SMACNA / DW/143)
1. Isolate the section under test (usually 10–25% of the system, or all of it for high-pressure systems) and blank the ends with sealed plates.
2. Connect the test rig: fan + calibrated nozzle/orifice + two manometers.
3. Raise the pressure to the test pressure (= duct pressure class, e.g. 500 Pa) and hold it.
4. Read the pressure difference across the nozzle → calculate the actual leakage flow.
5. Compare with the allowable: allowable leakage = equation × tested surface area. Pass if actual ≤ allowable.
6. On failure: locate leaks (soap/smoke/listening), seal, retest.

## Where ducts usually leak
- Unsealed TDF/TDC corners and flange corners.
- Slip & drive longitudinal joints and the ends of S-cleats.
- Duct penetrations (sensor tubes, damper shafts).
- Flexible duct connections on spigots when the strap is not tightened and sealed.
- Access doors with damaged gaskets.

## Sealing materials
- **Water-based duct sealant**: transverse joints and longitudinal seams, applied before or after assembly.
- **Mastic + reinforcing tape** for larger gaps.
- **Flange gaskets (butyl/neoprene)** between TDF flanges.
- **Aluminium foil tape**: covers insulation joints and pre-insulated panels; not a substitute for sealant on sheet metal.

> In the Duct Network Twin you can switch the seal class and watch its effect on outlet flows and fan power.`,
  },
},
{
  id: 'insulation', order: 9, minutes: 13, title: { ar: 'العزل الحراري والتكاثف في المناخ الحار', en: 'Thermal insulation and condensation in hot climates' },
  body: {
ar: `## لماذا نعزل؟
1. **تقليل اكتساب الحرارة**: الهواء المبرَّد (13–16°م) يمرّ في فراغ سقف حرارته 32–40°م أو على سطح بحرارة 45–50°م.
2. **منع التكاثف**: عندما تكون درجة حرارة سطح الدكت أقل من نقطة الندى للهواء المحيط يتكاثف بخار الماء على السطح → تآكل، بقع في الأسقف، فطريات.
3. **التحكم بالضجيج** (البطانة الداخلية).

## معامل الانتقال الحراري الكلي U
$$
U = 1 / (1/h_داخلي + t/k + 1/h_خارجي)
$$
| الحالة | U (واط/م²·ك) تقريباً |
|---|---|
| دكت مجلفن بلا عزل | ≈ 6.5–7 |
| صوف زجاجي 25 مم (k = 0.040) | ≈ 1.3 |
| صوف زجاجي 50 مم | ≈ 0.7 |
| لوح PIR 20 مم (k = 0.022) | ≈ 0.95 |
| فينولي 22 مم (k = 0.021) | ≈ 0.85 |

## اكتساب الحرارة على طول الدكت
$$
T_خروج = T_محيط + (T_دخول − T_محيط) × exp(−U × A / (ṁ × cp))
$$
A مساحة سطح الدكت، ṁ = ρ Q كتلة الهواء، cp = 1006 J/kg·K.
مثال: دكت 600×400 مم بطول 20 م (A = 40 م²) يحمل 1 م³/ث عند 13°م في سطح بحرارة 45°م:
- بلا عزل (U ≈ 6.9): ارتفاع الحرارة ≈ 6.5°م → اكتساب ≈ 7.9 كW (أكثر من 2 طن تبريد مهدور!).
- عزل 25 مم (U ≈ 1.3): ارتفاع ≈ 1.4°م → ≈ 1.7 كW.
- عزل 50 مم (U ≈ 0.7): ارتفاع ≈ 0.75°م → ≈ 0.9 كW.

## نقطة الندى والتكاثف
تُحسب نقطة الندى بصيغة **Magnus**:
$$
γ = ln(RH/100) + 17.62 T / (243.12 + T)
T_ندى = 243.12 γ / (17.62 − γ)
$$
| المدينة | الهواء المحيط | نقطة الندى تقريباً |
|---|---|---|
| جدة/دبي/الدوحة (ساحلي) | 35°م، 60–70% | 26–29°م |
| الرياض (داخلي جاف) | 40°م، 15% | 9°م |
| عمّان | 32°م، 30% | 12°م |
على الساحل يتكاثف الماء على أي سطح أقل من ~28°م — أي على **كل** دكت هواء بارد غير معزول. لذلك يُشترط: سماكة عزل كافية بحيث تبقى درجة سطح العزل الخارجي فوق نقطة الندى + **حاجز بخار متصل** (رقائق ألمنيوم FSK/ASJ) مع إحكام كل الوصلات بشريط ألمنيوم، وغطاء (Cladding) للدكت المكشوف خارجياً.

## متطلبات الأكواد النموذجية
- ASHRAE 90.1 / IECC: دكت الإمداد في الفراغات غير المكيَّفة R-6 إلى R-8 (≈ 40–50 مم صوف زجاجي)؛ في الخارج R-8 وأعلى.
- كود البناء السعودي (SBC 601) ولوائح دبي الخضراء تضع حدوداً مشابهة وتمنع العزل غير المحمي خارجياً.
- الدكت الراجع داخل الفراغ المكيَّف قد لا يحتاج عزلاً حرارياً.

## البطانة الداخلية (Duct liner)
صوف زجاجي 25 مم بوجه مقاوم للتآكل يُثبت بغراء ومسامير لحام (Pinspotter)؛ يخفض الضجيج لكنه يزيد الاحتكاك (خشونة 0.9 مم) ويحتاج عناية لتجنب الرطوبة والغبار.

> جرّب في «توأم شبكة الدكت» تغيير سماكة العزل ونوعه ورطوبة المدينة لترى تحذير التكاثف.`,
en: `## Why insulate?
1. **Reduce heat gain**: cooled air (13–16 °C) travels through a 32–40 °C ceiling void or across a 45–50 °C roof.
2. **Prevent condensation**: when the duct surface temperature is below the dew point of the surrounding air, water vapour condenses on it → corrosion, ceiling stains, mould.
3. **Noise control** (internal lining).

## Overall heat transfer coefficient U
$$
U = 1 / (1/h_inside + t/k + 1/h_outside)
$$
| Case | U (W/m²·K) approx. |
|---|---|
| Bare galvanized duct | ≈ 6.5–7 |
| 25 mm glass wool (k = 0.040) | ≈ 1.3 |
| 50 mm glass wool | ≈ 0.7 |
| 20 mm PIR panel (k = 0.022) | ≈ 0.95 |
| 22 mm phenolic (k = 0.021) | ≈ 0.85 |

## Heat gain along a duct
$$
T_out = T_amb + (T_in − T_amb) × exp(−U × A / (ṁ × cp))
$$
A duct surface area, ṁ = ρ Q air mass flow, cp = 1006 J/kg·K.
Example: a 600×400 mm duct, 20 m long (A = 40 m²), carrying 1 m³/s at 13 °C over a 45 °C roof:
- Bare (U ≈ 6.9): temperature rise ≈ 6.5 °C → gain ≈ 7.9 kW (over 2 tons of cooling wasted!).
- 25 mm insulation (U ≈ 1.3): rise ≈ 1.4 °C → ≈ 1.7 kW.
- 50 mm insulation (U ≈ 0.7): rise ≈ 0.75 °C → ≈ 0.9 kW.

## Dew point and condensation
Dew point from the **Magnus** formula:
$$
γ = ln(RH/100) + 17.62 T / (243.12 + T)
T_dew = 243.12 γ / (17.62 − γ)
$$
| City | Ambient | Approx. dew point |
|---|---|---|
| Jeddah/Dubai/Doha (coastal) | 35 °C, 60–70% | 26–29 °C |
| Riyadh (dry inland) | 40 °C, 15% | 9 °C |
| Amman | 32 °C, 30% | 12 °C |
On the coast water condenses on any surface below ~28 °C — i.e. on **every** uninsulated cold-air duct. Hence: enough insulation thickness so the outer insulation surface stays above the dew point + a **continuous vapour barrier** (FSK/ASJ aluminium foil) with all joints taped, and cladding for exposed outdoor duct.

## Typical code requirements
- ASHRAE 90.1 / IECC: supply duct in unconditioned spaces R-6 to R-8 (≈ 40–50 mm glass wool); outdoors R-8 and above.
- The Saudi Building Code (SBC 601) and Dubai Green Building Regulations set similar limits and prohibit unprotected external insulation.
- Return duct inside the conditioned space may not need thermal insulation.

## Duct liner
25 mm glass wool with an erosion-resistant facing fixed with adhesive and welded pins (pinspotter); reduces noise but increases friction (0.9 mm roughness) and needs care to avoid moisture and dust.

> Try changing insulation thickness/type and the city humidity in the Duct Network Twin to see the condensation warning.`,
  },
},
{
  id: 'fabrication', order: 10, minutes: 16, title: { ar: 'عملية التصنيع في مصنع الدكت والآلات', en: 'The fabrication process and machines in a duct factory' },
  body: {
ar: `## من الرسم إلى القطعة الجاهزة
1. **الرسومات التنفيذية (Shop drawings)**: تُستخرج من نموذج BIM (Revit MEP) أو AutoCAD وتُفصَّل كل قطعة (Piece) برقم فريد وأبعاد وفلنجات ومواقع الدامبرات، عبر برامج CAD/CAM مثل Autodesk Fabrication CAMduct.
2. **التفريد (Nesting)**: يرتّب البرنامج القطع على اللفة/الألواح لتقليل الهدر (الهدف < 5–8%).
3. **القطع**: **خط اللفائف (Coil line)** يفرد الصاج من اللفة، يسوّيه، يحزّه ويقطعه بالبلازما، وقد يشكّل الفلنجات مباشرة. الفتنغز تُقطع على **طاولة بلازما CNC**.
4. **التشكيل**:
   - **قفل بيتسبرغ (Pittsburgh lock)**: الوصلة الطولية الأكثر شيوعاً.
   - **Snap lock**: بديل أسرع للسماكات الرفيعة والضغط المنخفض.
   - **TDF/TDC**: فلنجة عرضية مدمجة تُشكَّل على نهايات القطعة؛ تُوصل بزوايا (Corners) وحشوة ومسامير.
   - **Slip & Drive**: شرائح S وC للضغط المنخفض والمقاسات الصغيرة.
   - **الطي (Folding/Brake)**: تشكيل شكل L أو U.
   - **التخصير (Beading/Cross-breaking)**: للألواح العريضة لمنع الاهتزاز والطنين.
5. **التجميع**: إغلاق الوصلة الطولية، إدخال الزوايا، تركيب قضبان الشد (Tie rods) والزوايا المقوّية، وضع مانع التسرب.
6. **العزل** (إن كان في المصنع): لصق العزل الخارجي أو تثبيت البطانة الداخلية بالمسامير.
7. **ضبط الجودة**: الأبعاد، استقامة الفلنجات، الإحكام، الترقيم (Labels/QR)، واختبار تسرب لعينات.
8. **التغليف والشحن**: تجميع القطع بحسب المنطقة والطابق (Spool/Area) مع قائمة تعبئة.

## الآلات الرئيسية (قيم نموذجية)
| الآلة | الدور | سرعة/سعة نموذجية | القدرة |
|---|---|---|---|
| Decoiler | تغذية اللفة | لفة 5–10 طن | 3 كW |
| خط اللفائف + بلازما | قطع وحزّ وثقب | 6–12 م/د قطع | 40–70 كW |
| طاولة بلازما CNC | فتنغز | 4–10 م/د | 30–50 كW |
| Pittsburgh lock former | وصلة طولية | 12–18 م/د | 2.2 كW |
| TDF/TDC former | فلنجة عرضية | 10–15 م/د | 3 كW |
| ماكينة طي هيدروليكية | تشكيل الجسم | 4–10 ثنية/د | 7.5 كW |
| Spiral tubeformer | دكت دائري حلزوني | 20–60 م/د شريط | 11 كW |
| Pinspotter | مسامير البطانة | 20–40 مسمار/د | 4 كW |
| ضاغط هواء | بلازما وأدوات | 7–8 بار | 22 كW |
| شفط دخان | سلامة القطع | 3000–8000 م³/س | 7.5 كW |

## الدكت الدائري الحلزوني
شريط مجلفن بعرض ≈ 137 مم يُلفّ حلزونياً ويُقفل بوصلة رباعية الطبقات، بأقطار 80–1500 مم وسرعة إنتاج عالية جداً؛ الفتنغز (أكواع بقطع Gores، انتقالات، تفرعات) تُصنَّع على ماكينات مخصصة أو تُلحَم.

## الألواح مسبقة العزل
تُقطع الألواح (4000×1200 مم) بشفرات V-groove بزاوية 45°، تُطوى وتُلصق بغراء بولي يوريثان، وتُغطى الحواف بشريط ألمنيوم وبروفيلات؛ تُوصل القطع بفلنجات ألمنيوم غير مرئية (Invisible flange) أو مرئية مع مانع تسرب. لا تحتاج حمالات ثقيلة ولا عزل إضافي.

## مؤشرات أداء المصنع (KPIs)
- **الإنتاجية**: م² من سطح الدكت أو طن من الصاج لكل وردية/شهر (مصنع متوسط في الخليج: 100–300 طن/شهر؛ الكبير أكثر من 500).
- **OEE** = التوافر × الأداء × الجودة؛ القيم النموذجية 60–75%، والممتازة > 85%.
- **نسبة الهدر (Scrap)**: 3–6% من الصاج.
- **استهلاك الطاقة**: كيلوواط ساعة لكل م² (البلازما والضاغط هما الأكبر).
- **زمن التسليم (Lead time)** من استلام الرسم إلى الشحن: 3–10 أيام.

> «توأم المصنع» في هذا البرنامج يحاكي هذه المحطات بسرعاتها النموذجية ويحسب OEE والاختناقات والطاقة تفاعلياً.`,
en: `## From drawing to finished piece
1. **Shop drawings**: extracted from the BIM model (Revit MEP) or AutoCAD; every piece gets a unique number, dimensions, flanges and damper positions via CAD/CAM software such as Autodesk Fabrication CAMduct.
2. **Nesting**: the software arranges pieces on the coil/sheets to minimise waste (target < 5–8%).
3. **Cutting**: the **coil line** uncoils, levels, notches and plasma-cuts the sheet, and may form the flanges directly. Fittings are cut on a **CNC plasma table**.
4. **Forming**:
   - **Pittsburgh lock**: the most common longitudinal seam.
   - **Snap lock**: faster alternative for thin gauges and low pressure.
   - **TDF/TDC**: integral transverse flange formed on the piece ends; joined with corners, gasket and bolts.
   - **Slip & drive**: S and drive cleats for low pressure and small sizes.
   - **Folding (brake)**: forming the L or U shape.
   - **Beading / cross-breaking**: for wide panels to prevent drumming.
5. **Assembly**: closing the longitudinal seam, inserting corners, fitting tie rods and reinforcing angles, applying sealant.
6. **Insulation** (if done in the shop): bonding external insulation or pinning internal liner.
7. **Quality control**: dimensions, flange straightness, sealing, labels/QR codes, and leakage tests on samples.
8. **Packing and dispatch**: pieces grouped by zone and floor (spool/area) with a packing list.

## Main machines (typical values)
| Machine | Role | Typical speed/capacity | Power |
|---|---|---|---|
| Decoiler | Coil feeding | 5–10 t coil | 3 kW |
| Coil line + plasma | Cut, notch, punch | 6–12 m/min cutting | 40–70 kW |
| CNC plasma table | Fittings | 4–10 m/min | 30–50 kW |
| Pittsburgh lock former | Longitudinal seam | 12–18 m/min | 2.2 kW |
| TDF/TDC former | Transverse flange | 10–15 m/min | 3 kW |
| Hydraulic folding machine | Forming the body | 4–10 bends/min | 7.5 kW |
| Spiral tubeformer | Spiral round duct | 20–60 m/min strip | 11 kW |
| Pinspotter | Liner pins | 20–40 pins/min | 4 kW |
| Air compressor | Plasma and tools | 7–8 bar | 22 kW |
| Fume extraction | Cutting safety | 3000–8000 m³/h | 7.5 kW |

## Spiral round duct
A galvanized strip ≈ 137 mm wide is wound helically and locked with a four-ply seam, in diameters 80–1500 mm at very high production speed; fittings (gored elbows, transitions, tees) are made on dedicated machines or welded.

## Pre-insulated panels
Panels (4000×1200 mm) are cut with 45° V-groove blades, folded and bonded with polyurethane adhesive, edges covered with aluminium tape and profiles; pieces are joined with invisible or visible aluminium flanges and sealant. No heavy hangers or additional insulation are needed.

## Factory KPIs
- **Throughput**: m² of duct surface or tonnes of sheet per shift/month (a mid-size Gulf factory: 100–300 t/month; large ones over 500).
- **OEE** = availability × performance × quality; typical 60–75%, excellent > 85%.
- **Scrap rate**: 3–6% of sheet.
- **Energy**: kWh per m² (plasma and compressor dominate).
- **Lead time** from drawing receipt to dispatch: 3–10 days.

> The Factory Twin in this program simulates these stations at their typical speeds and computes OEE, bottlenecks and energy interactively.`,
  },
},
{
  id: 'installation', order: 11, minutes: 13, title: { ar: 'التركيب: الحمالات، الدامبرات، أفضل الممارسات', en: 'Installation: hangers, dampers and best practice' },
  body: {
ar: `## الحمالات والدعامات
| نوع الدكت | حمالة نموذجية | أقصى تباعد |
|---|---|---|
| مستطيل حتى 750 مم | شريط مجلفن أو قضيب ملولب 8 مم + زاوية سفلية (Trapeze) | 2.4–3.0 م |
| مستطيل 750–1500 مم | قضيبان ملولبان 10 مم + زاوية 40×40×4 | 2.4 م |
| مستطيل > 1500 مم | قضبان 12 مم + قناة/زاوية أثقل | 1.5–2.4 م |
| دائري حتى 500 مم | شريط مجلفن أو طوق (Band) | 3.0 م |
| دائري > 500 مم | طوق نصفي + قضيبان | 2.4–3.0 م |
(بحسب SMACNA/DW/144؛ تُقلَّل التباعدات عند الدامبرات والفتنغز الثقيلة، وتُضاف حمالة عند كل تغيير اتجاه.)

- المثبتات في الخرسانة: مثبتات تمدد أو مسامير مسحوقية بحسب الحمل؛ تُمنع المسامير الخشبية والحمالات على الأسقف المستعارة.
- الدكت المعزول يُحمل بحيث لا يُهرَس العزل (قطع خشبية أو حشوات صلبة تحت الزاوية) للحفاظ على حاجز البخار.

## الفتنغز والمواقع الحرجة
- **الوصلات المرنة (Flexible connections)** عند مخرج ومدخل وحدة المناولة لعزل الاهتزاز.
- **الطول المستقيم** بعد المروحة ≥ 2.5–3 أقطار قبل أول كوع (تأثير النظام).
- **دامبرات ضبط الحجم (VCD)**: على كل فرع قرب التفرّع، مع مؤشر موضع ومقبض يمكن قفله.
- **دامبرات الحريق (Fire dampers)**: عند اختراق الجدران والأسقف المقاومة للحريق، بغلاف (Sleeve) وزوايا تثبيت من الجهتين وباب فحص ≤ 300 مم من الدامبر (UL 555، NFPA 90A).
- **دامبرات الدخان** في أنظمة إدارة الدخان، مرتبطة بلوحة الإنذار.
- **أبواب الفحص (Access doors)** عند كل دامبر حريق/دخان، عند ملفات التسخين، وكل 6–8 م في عوادم المطابخ.
- **الدكت المرن**: ≤ 1.5–2 م، مشدود بالكامل، لا انحناء حاد، مثبت برباط ومحكم.

## خط سير الأعمال في الموقع
1. مراجعة الرسومات التنفيذية والتنسيق (BIM Clash detection) مع الكهرباء والسباكة والإنشائي.
2. تركيب الحمالات بعد ضبط المناسيب بالليزر.
3. رفع القطع وتجميعها على الأرض في مجموعات (Spools) ثم رفعها كوحدة عند الإمكان.
4. الإحكام أثناء التركيب (وليس بعده فقط)، ثم اختبار التسرب قبل العزل وإغلاق الأسقف.
5. العزل الميداني للوصلات وإكمال حاجز البخار.
6. تركيب المخارج، وثم الاختبار والموازنة (TAB).

## عوادم المطابخ التجارية (NFPA 96)
ستانلس أو فولاذ أسود بسماكة ≥ 1.2–1.4 مم، لحام مستمر سائل-محكم، انحدار نحو الخزان، أبواب تنظيف، خلوص عن المواد القابلة للاشتعال ≥ 450 مم أو غلاف مقاوم للحريق.

## الأخطاء الشائعة في المواقع
- أكواع حادة بلا ريش قرب المخارج.
- دكت مرن طويل ومضغوط خلف الأسقف.
- ترك الدامبرات بلا مؤشر أو بلا قفل بعد الموازنة.
- تلف العزل عند الحمالات دون إصلاح حاجز البخار.
- تركيب دامبر الحريق بلا غلاف أو بزوايا تثبيت من جهة واحدة.`,
en: `## Hangers and supports
| Duct type | Typical hanger | Maximum spacing |
|---|---|---|
| Rectangular up to 750 mm | Galvanized strap or 8 mm rod + bottom angle (trapeze) | 2.4–3.0 m |
| Rectangular 750–1500 mm | Two 10 mm rods + 40×40×4 angle | 2.4 m |
| Rectangular > 1500 mm | 12 mm rods + heavier channel/angle | 1.5–2.4 m |
| Round up to 500 mm | Galvanized strap or band | 3.0 m |
| Round > 500 mm | Half band + two rods | 2.4–3.0 m |
(Per SMACNA/DW/144; reduce spacing at dampers and heavy fittings, and add a hanger at every change of direction.)

- Anchors in concrete: expansion anchors or powder-actuated fasteners according to load; no wood screws and no hanging from suspended ceilings.
- Insulated duct is supported so the insulation is not crushed (timber blocks or rigid inserts under the angle) to preserve the vapour barrier.

## Fittings and critical locations
- **Flexible connections** at the AHU outlet and inlet to isolate vibration.
- **Straight length** after the fan ≥ 2.5–3 diameters before the first elbow (system effect).
- **Volume control dampers (VCD)**: on every branch near the take-off, with a position indicator and lockable handle.
- **Fire dampers**: at penetrations of fire-rated walls and floors, with a sleeve, retaining angles on both sides and an access door ≤ 300 mm from the damper (UL 555, NFPA 90A).
- **Smoke dampers** in smoke-management systems, connected to the fire alarm panel.
- **Access doors** at every fire/smoke damper, at heating coils, and every 6–8 m in kitchen exhaust.
- **Flexible duct**: ≤ 1.5–2 m, fully extended, no sharp bends, strapped and sealed.

## Site workflow
1. Review shop drawings and coordinate (BIM clash detection) with electrical, plumbing and structure.
2. Install hangers after setting levels with a laser.
3. Lift and assemble pieces on the floor into spools, then lift as a unit where possible.
4. Seal during installation (not only after), then leakage-test before insulating and closing ceilings.
5. Field-insulate the joints and complete the vapour barrier.
6. Install outlets, then test and balance (TAB).

## Commercial kitchen exhaust (NFPA 96)
Stainless or carbon steel ≥ 1.2–1.4 mm, continuous liquid-tight welds, slope towards the hood, cleanout doors, clearance to combustibles ≥ 450 mm or a fire-rated enclosure.

## Common site mistakes
- Mitred elbows without vanes near outlets.
- Long, compressed flexible duct above ceilings.
- Dampers left without indicators or locks after balancing.
- Insulation damaged at hangers without repairing the vapour barrier.
- Fire dampers installed without a sleeve or with retaining angles on one side only.`,
  },
},
{
  id: 'commissioning', order: 12, minutes: 12, title: { ar: 'الاختبار والموازنة (TAB) والتشغيل والصيانة', en: 'Testing, adjusting & balancing (TAB), commissioning and maintenance' },
  body: {
ar: `## تسلسل التشغيل (Commissioning)
1. **الفحص البصري** والتحقق من الحمالات والإحكام والعزل ومواقع الدامبرات.
2. **اختبار التسرب** للدكت (الدرس 8) قبل إغلاق الأسقف.
3. **تشغيل المروحة** والتحقق من الدوران والتيار والاهتزاز والوصلات المرنة.
4. **القياس والموازنة (TAB)**: ضبط تدفقات كل مخرج ضمن ±10% من التصميم.
5. **التحقق الوظيفي**: تشغيل صناديق VAV والدامبرات الآلية وتسلسلات BMS.
6. **التوثيق**: تقرير TAB، شهادات التسرب، الرسومات كما نُفِّذ (As-built)، دليل التشغيل والصيانة.

## أجهزة القياس
| الجهاز | ما يقيسه | ملاحظات |
|---|---|---|
| أنبوب بيتو + مانومتر | ضغط السرعة داخل الدكت → السرعة والتدفق | مسح (Traverse) بشبكة نقاط عبر المقطع؛ الأدق للدكت الرئيسي |
| مقياس السرعة الحراري/الدوّار (Anemometer) | سرعة الهواء عند الشبكات | متوسط عدة قراءات على الوجه |
| غطاء التدفق (Flow hood) | تدفق المخرج مباشرة (ل/ث) | الأسرع لموازنة المخارج |
| مانومتر رقمي | الضغط الاستاتيكي، فرق ضغط الفلتر | مراقبة تلوث الفلاتر |
| ميزان حرارة/رطوبة | درجة الإمداد ونقطة الندى | فحص التكاثف والأداء |
| مقياس الضجيج | مستوى الصوت (dB(A)/NC) | عند المخارج والغرف الحساسة |

## حساب التدفق من مسح بيتو
$$
V = √(2 × Pv / ρ)     ثم     Q = V_متوسط × A
$$
مثلاً Pv متوسط 25 باسكال عند ρ = 1.15 → V = 6.6 م/ث؛ في دكت 600×400 (A = 0.24 م²) → Q ≈ 1.58 م³/ث.

## إجراء الموازنة النسبية (Proportional balancing)
1. افتح كل الدامبرات واقرأ كل المخارج.
2. ابدأ بالفرع الأبعد؛ اجعل نسبة (المقاس/التصميم) متساوية بين مخارج الفرع بتضييق الأعلى.
3. كرر بين الفروع، ثم اضبط سرعة المروحة (VFD) لتحقيق التدفق الكلي، وأعد الفحص.
4. اقفل الدامبرات وعلّم مواضعها ودوّن القراءات.

## الصيانة الدورية
| المهمة | التكرار |
|---|---|
| فحص/تبديل الفلاتر (حسب فرق الضغط) | شهري–ربع سنوي؛ أكثر في مواسم الغبار |
| فحص سيور المروحة والمحامل والاهتزاز | ربع سنوي |
| فحص دامبرات الحريق (تشغيل تجريبي) | سنوي (أو حسب NFPA 80 كل 4 سنوات للبعض) |
| فحص العزل وحاجز البخار وآثار التكاثف | نصف سنوي |
| فحص الدكت المرن والوصلات والإحكام | سنوي |
| تنظيف الدكت (NADCA ACR) عند التلوث أو كل 3–5 سنوات | حسب الفحص |

## تشخيص المشاكل الشائعة
- **تدفق منخفض في كل المخارج** → فلتر مسدود، ملف متسخ، سير مرتخٍ، دامبر رئيسي مغلق.
- **مخرج واحد ضعيف** → دكت مرن مضغوط، دامبر مغلق، تسرب في الفرع.
- **ضجيج** → سرعة عالية، دامبر مغلق جزئياً قرب المخرج، اهتزاز مروحة.
- **بقع ماء على السقف** → تكاثف على دكت غير معزول أو حاجز بخار مقطوع.`,
en: `## Commissioning sequence
1. **Visual inspection** and check of hangers, sealing, insulation and damper positions.
2. **Duct leakage test** (lesson 8) before ceilings are closed.
3. **Fan start-up**: rotation, current, vibration and flexible connections.
4. **Testing, adjusting and balancing (TAB)**: set every outlet within ±10% of design.
5. **Functional testing**: VAV boxes, motorised dampers and BMS sequences.
6. **Documentation**: TAB report, leakage certificates, as-built drawings, O&M manual.

## Measuring instruments
| Instrument | Measures | Notes |
|---|---|---|
| Pitot tube + manometer | Velocity pressure in the duct → velocity and flow | Traverse over a grid of points; most accurate for mains |
| Thermal / vane anemometer | Air velocity at grilles | Average several face readings |
| Flow hood | Outlet flow directly (L/s) | Fastest for balancing outlets |
| Digital manometer | Static pressure, filter ΔP | Filter loading monitoring |
| Thermo-hygrometer | Supply temperature and dew point | Condensation and performance checks |
| Sound level meter | Noise (dB(A)/NC) | At outlets and sensitive rooms |

## Flow from a pitot traverse
$$
V = √(2 × Pv / ρ)     then     Q = V_mean × A
$$
E.g. mean Pv 25 Pa at ρ = 1.15 → V = 6.6 m/s; in a 600×400 duct (A = 0.24 m²) → Q ≈ 1.58 m³/s.

## Proportional balancing procedure
1. Open all dampers and read all outlets.
2. Start with the farthest branch; equalise the (measured/design) ratio between its outlets by throttling the highest ones.
3. Repeat between branches, then set the fan speed (VFD) for the total flow and re-check.
4. Lock the dampers, mark their positions and record the readings.

## Periodic maintenance
| Task | Frequency |
|---|---|
| Filter inspection/replacement (by ΔP) | Monthly–quarterly; more often in dust seasons |
| Fan belts, bearings, vibration | Quarterly |
| Fire damper inspection (drop test) | Annually (or per NFPA 80, every 4 years for some) |
| Insulation, vapour barrier and condensation signs | Semi-annually |
| Flexible duct, connections and sealing | Annually |
| Duct cleaning (NADCA ACR) when contaminated or every 3–5 years | By inspection |

## Troubleshooting common problems
- **Low flow at all outlets** → blocked filter, dirty coil, loose belt, closed main damper.
- **One weak outlet** → compressed flex duct, closed damper, branch leakage.
- **Noise** → high velocity, partly closed damper near the outlet, fan vibration.
- **Water stains on the ceiling** → condensation on uninsulated duct or a broken vapour barrier.`,
  },
},
{
  id: 'digital-twin', order: 13, minutes: 12, title: { ar: 'التوأم الرقمي والصناعة 4.0 في مصانع وأنظمة الدكت', en: 'Digital twins and Industry 4.0 for duct factories and systems' },
  body: {
ar: `## ما هو التوأم الرقمي؟
نموذج رقمي حي لأصل فيزيائي (مصنع، خط إنتاج، شبكة دكت في مبنى) يُغذَّى ببيانات حقيقية من الحساسات وأنظمة التحكم، ويستخدم نماذج فيزيائية وإحصائية للتنبؤ والتحليل واختبار سيناريوهات "ماذا لو" دون المخاطرة بالأصل الحقيقي.

## توأم مصنع الدكت
| مصدر البيانات | ما يُقاس | الفائدة |
|---|---|---|
| PLC للآلات (OPC-UA / Modbus) | حالة التشغيل، السرعة، الأعطال، عدّاد القطع | حساب OEE لحظياً واكتشاف الاختناقات |
| نظام CAM (CAMduct) | قوائم القطع، مساحة الصاج، زمن القطع المتوقع | جدولة الإنتاج ومقارنة المخطط بالفعلي |
| عدادات الطاقة | كيلوواط ساعة لكل آلة | تكلفة الطاقة لكل م² وتحديد الأحمال الكبرى (بلازما، ضاغط) |
| حساسات البيئة | حرارة ورطوبة الصالة، غبار | سلامة العمال (الإجهاد الحراري) وجودة الطلاء |
| باركود/RFID على القطع | تتبع كل قطعة من القطع إلى الشحن | زمن التسليم، تقليل الضياع، توثيق الجودة |

## مؤشرات الأداء وصيغها
$$
OEE = التوافر × الأداء × الجودة
التوافر = وقت التشغيل / الوقت المخطط
الأداء = (القطع المنتَجة × الزمن النظري للقطعة) / وقت التشغيل
الجودة = القطع السليمة / إجمالي القطع
$$
مثال: توافر 90%، أداء 85%، جودة 97% → OEE = 74%.

## توأم شبكة الدكت في المبنى
يربط نموذج الشبكة (الأقطار، الأطوال، الفتنغز) بقراءات حية: ضغط استاتيكي في الرئيسي، فرق ضغط الفلاتر، تدفق أو موضع صندوق كل VAV، درجات حرارة الإمداد والفراغ، سرعة المروحة (VFD) واستهلاكها. يمكّن ذلك من:
- **اكتشاف الأعطال (FDD)**: مثلاً ارتفاع ضغط الفلتر تدريجياً = تلوث؛ انخفاض تدفق مخرج مع ثبات الضغط = تسرب أو دامبر عالق.
- **ضبط الطاقة**: إعادة ضبط الضغط الاستاتيكي (Static pressure reset) لتقليل سرعة المروحة عند الأحمال الجزئية — طاقة المروحة تتناسب مع مكعب السرعة؛ تخفيض السرعة 20% يوفر نحو 49% من الطاقة.
- **التنبؤ بالصيانة**: توقيت تبديل الفلاتر وتنظيف الملفات بناءً على الاتجاه، لا على الجدول فقط.

## البروتوكولات والتكامل
- **BACnet/IP و Modbus** لأنظمة إدارة المباني (BMS).
- **OPC-UA وMQTT** لآلات المصانع وإنترنت الأشياء.
- **BIM (IFC)** كمرجع هندسي للنموذج.

## كيف يعمل هذا البرنامج؟
- يعتمد نماذج ASHRAE للضغط والاحتكاك وSMACNA للتسرب ومعادلات الانتقال الحراري لحساب حالة الشبكة لحظياً عند أي تغيير في المروحة أو الدامبرات أو الفلاتر أو العزل أو المناخ.
- يحاكي محطات مصنع الدكت بسرعاتها النموذجية مع أعطال عشوائية ليُظهر OEE والاختناقات والطاقة.
- يمكن تصدير الجلسات والنتائج كملفات CSV/JSON/PDF للتقارير.`,
en: `## What is a digital twin?
A live digital model of a physical asset (a factory, a production line, a building’s duct network) fed with real data from sensors and control systems, using physical and statistical models to predict, analyse and test “what-if” scenarios without risking the real asset.

## The duct factory twin
| Data source | What is measured | Benefit |
|---|---|---|
| Machine PLCs (OPC-UA / Modbus) | Run state, speed, faults, piece counters | Real-time OEE and bottleneck detection |
| CAM system (CAMduct) | Piece lists, sheet area, expected cutting time | Production scheduling; planned vs actual |
| Energy meters | kWh per machine | Energy cost per m²; identify the big loads (plasma, compressor) |
| Environmental sensors | Hall temperature, humidity, dust | Worker safety (heat stress) and coating quality |
| Barcode/RFID on pieces | Tracking each piece from cutting to dispatch | Lead time, fewer losses, quality records |

## KPIs and their formulas
$$
OEE = Availability × Performance × Quality
Availability = run time / planned time
Performance = (pieces produced × ideal cycle time) / run time
Quality = good pieces / total pieces
$$
Example: availability 90%, performance 85%, quality 97% → OEE = 74%.

## The building duct-network twin
Links the network model (sizes, lengths, fittings) with live readings: main static pressure, filter ΔP, flow or position of every VAV box, supply and space temperatures, fan speed (VFD) and power. This enables:
- **Fault detection and diagnostics (FDD)**: e.g. steadily rising filter ΔP = loading; an outlet losing flow while pressure stays constant = leakage or a stuck damper.
- **Energy tuning**: static pressure reset lowers fan speed at part load — fan power scales with the cube of speed; a 20% speed reduction saves about 49% energy.
- **Predictive maintenance**: filter change and coil cleaning timed by trend, not just by calendar.

## Protocols and integration
- **BACnet/IP and Modbus** for building management systems (BMS).
- **OPC-UA and MQTT** for factory machines and IoT.
- **BIM (IFC)** as the engineering reference for the model.

## How this program works
- Uses ASHRAE pressure/friction models, SMACNA leakage and heat-transfer equations to compute the network state instantly for any change of fan, dampers, filters, insulation or climate.
- Simulates the duct-factory stations at typical speeds with random breakdowns to show OEE, bottlenecks and energy.
- Sessions and results can be exported as CSV/JSON/PDF reports.`,
  },
},
{
  id: 'safety', order: 14, minutes: 10, title: { ar: 'السلامة والصحة المهنية في مصانع الدكت ومواقع التركيب', en: 'Health & safety in duct factories and on site' },
  body: {
ar: `## المخاطر الرئيسية في مصنع الدكت
| الخطر | المصدر | الوقاية |
|---|---|---|
| **الجروح والقطوع** | حواف الصاج الحادة، البرادة | قفازات مقاومة للقطع (EN 388 مستوى 4–5)، ثني الحواف (Hemming)، أكمام واقية |
| **أبخرة القطع** | أكسيد الزنك من قطع المجلفن بالبلازما → "حمى أبخرة المعادن" | شفط موضعي عند طاولة البلازما، تهوية عامة، كمامات P2/P3 |
| **الضوء والإشعاع** | قوس البلازما (أشعة فوق بنفسجية) | نظارات/دروع بظل مناسب، حواجز |
| **الضجيج** | ماكينات التشكيل، المطارق، الضاغط | حد التعرض 85 dB(A)/8 س؛ سدادات وواقيات أذن، عزل الضاغط |
| **الآلات** | نقاط الانحصار في اللفافات والمكابس | حواجز ثابتة، أزرار توقف طارئ، عزل الطاقة (LOTO) أثناء الصيانة |
| **المناولة اليدوية** | قطع 15–40 كغ | رافعات جسرية، عربات، رفع ثنائي، تدريب |
| **الرافعات والفوركلفت** | حركة اللفائف (5–10 طن) | سائقون مرخصون، مسارات مخططة، فحص دوري للرافعة |
| **الحريق** | الغراء والمذيبات، ألواح العزل | تخزين آمن، طفايات، منع اللحام قرب المواد القابلة للاشتعال |

## الإجهاد الحراري في المنطقة
تتجاوز حرارة صالات المصانع 40°م صيفاً. تطبق دول الخليج (الإمارات، السعودية، قطر، الكويت، عُمان، البحرين) **حظر العمل في الأماكن المكشوفة منتصف النهار** خلال أشهر الصيف (عادةً من 12:00 إلى 15:00 من يونيو إلى سبتمبر). داخل المصنع: تهوية وتبريد تبخيري، ماء بارد وأملاح إعاضة، فترات راحة، مراقبة مؤشر WBGT، وتدريب على أعراض الإجهاد الحراري (دوار، توقف التعرق، ارتباك).

## معدات الوقاية الشخصية الدنيا
خوذة (في الموقع)، نظارات، قفازات مقاومة للقطع، أحذية سلامة بمقدمة فولاذية، سترة عاكسة، واقيات أذن في المناطق الصاخبة، كمامة عند القطع والعزل (ألياف الصوف الزجاجي).

## السلامة في التركيب
- **العمل على ارتفاع**: سقالات مفحوصة، رافعات شخصية، أحزمة أمان مع نقاط تثبيت.
- **الحمالات**: لا تُعلَّق على أنظمة أخرى (أنابيب، كوابل، أسقف مستعارة).
- **الحرائق أثناء اللحام** (عوادم المطابخ الستانلس): تصريح عمل ساخن ومراقب حريق.
- **الفراغات المحصورة** عند دخول الدكت الكبير للتنظيف: تصريح دخول، فحص الهواء، مراقب.

## إدارة السلامة
- تحليل مخاطر لكل مهمة (JSA) وتوعية يومية (Toolbox talk).
- الإبلاغ عن الحوادث والحوادث الوشيكة، ومؤشرات LTIFR.
- الالتزام بأنظمة العمل المحلية (مثل نظام العمل السعودي ولوائح OSHA بالإمارات) ومعيار ISO 45001 حيث يُطبَّق.`,
en: `## Main hazards in a duct factory
| Hazard | Source | Prevention |
|---|---|---|
| **Cuts and lacerations** | Sharp sheet edges, swarf | Cut-resistant gloves (EN 388 level 4–5), hemmed edges, sleeves |
| **Cutting fumes** | Zinc oxide from plasma cutting galvanized steel → “metal fume fever” | Local extraction at the plasma table, general ventilation, P2/P3 respirators |
| **Light and radiation** | Plasma arc (UV) | Correctly shaded glasses/shields, screens |
| **Noise** | Forming machines, hammering, compressor | Exposure limit 85 dB(A)/8 h; ear plugs/muffs, enclosed compressor |
| **Machinery** | Nip points in rollers and presses | Fixed guards, emergency stops, lockout/tagout (LOTO) during maintenance |
| **Manual handling** | Pieces of 15–40 kg | Overhead cranes, trolleys, two-person lifts, training |
| **Cranes and forklifts** | Moving coils (5–10 t) | Licensed operators, planned routes, periodic crane inspection |
| **Fire** | Adhesives and solvents, insulation panels | Safe storage, extinguishers, no welding near combustibles |

## Heat stress in the region
Factory halls exceed 40 °C in summer. Gulf states (UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain) apply a **midday outdoor work ban** during the summer months (typically 12:00–15:00 from June to September). Inside the factory: ventilation and evaporative cooling, cold water and electrolytes, rest breaks, WBGT monitoring and training on heat-stress symptoms (dizziness, cessation of sweating, confusion).

## Minimum PPE
Helmet (on site), safety glasses, cut-resistant gloves, steel-toe safety shoes, high-visibility vest, hearing protection in noisy areas, respirator when cutting or handling insulation (glass-wool fibres).

## Installation safety
- **Work at height**: inspected scaffolds, mobile elevating platforms, harnesses with anchor points.
- **Hangers**: never hang from other systems (pipes, cables, suspended ceilings).
- **Fire during welding** (stainless kitchen exhaust): hot-work permit and fire watch.
- **Confined spaces** when entering large duct for cleaning: entry permit, air testing, attendant.

## Safety management
- Job safety analysis (JSA) for each task and daily toolbox talks.
- Incident and near-miss reporting; LTIFR indicators.
- Compliance with local labour regulations (e.g. Saudi labour law, UAE OSHAD) and ISO 45001 where applied.`,
  },
},
];
module.exports = { LESSONS };
