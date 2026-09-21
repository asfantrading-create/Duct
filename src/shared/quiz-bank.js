'use strict';
/**
 * Assessment question bank (bilingual). Types: mcq (options, answer index), tf (answer boolean),
 * numeric (generator → { params, answer, tolerancePct }). Each question has moduleId and difficulty 1–3.
 */
const E = require('./engineering');

const Q = [];
let n = 0;
const mcq = (moduleId, difficulty, text, options, answer, explain) => Q.push({ id: `q${++n}`, type: 'mcq', moduleId, difficulty, text, options, answer, explain });
const tf = (moduleId, difficulty, text, answer, explain) => Q.push({ id: `q${++n}`, type: 'tf', moduleId, difficulty, text, answer, explain });
const num = (moduleId, difficulty, text, unit, generate, explain, tolerancePct = 5) => Q.push({ id: `q${++n}`, type: 'numeric', moduleId, difficulty, text, unit, generate, explain, tolerancePct });
const B = (ar, en) => ({ ar, en });
const rnd = (a, b, step = 1) => a + Math.round(Math.random() * ((b - a) / step)) * step;

// ---------------- LEARN (fundamentals, types, materials, standards)
mcq('LEARN', 1, B('ما الوظيفة الأساسية لمجاري الهواء (Duct) في نظام التكييف؟', 'What is the primary function of ducts in an HVAC system?'),
  [B('نقل الهواء المعالَج من وحدة المناولة إلى الفضاءات وإعادته', 'Transport conditioned air from the AHU to the spaces and back'), B('تبريد الهواء بالمبرِّد', 'Cool the air with refrigerant'), B('تصفية الماء', 'Filter water'), B('توليد الضغط الاستاتيكي', 'Generate static pressure')], 0,
  B('الدكت قناة نقل؛ المروحة تولّد الضغط والملف يبرّد.', 'Ducts are the transport path; the fan generates pressure and the coil cools.'));
mcq('LEARN', 1, B('أي شكل من أشكال الدكت يعطي أقل احتكاك وأقل تسرباً لنفس المساحة؟', 'Which duct shape gives the lowest friction and leakage for the same area?'),
  [B('مستطيل بنسبة أبعاد 4:1', 'Rectangular 4:1'), B('دائري حلزوني', 'Spiral round'), B('مرن مضغوط', 'Compressed flexible'), B('مستطيل مربع', 'Square')], 1,
  B('الدائري له أصغر محيط لنفس المساحة ووصلة حلزونية محكمة.', 'Round duct has the smallest perimeter for a given area and a tight spiral seam.'));
mcq('LEARN', 2, B('نسبة الأبعاد الموصى بها كحد أقصى للدكت المستطيل هي:', 'The recommended maximum aspect ratio for rectangular duct is:'),
  [B('1:1', '1:1'), B('2:1', '2:1'), B('4:1', '4:1'), B('8:1', '8:1')], 2, B('≤ 4:1 والأفضل ≤ 3:1 لتقليل الصاج والاحتكاك.', '≤ 4:1, preferably ≤ 3:1, to limit metal and friction.'));
mcq('LEARN', 1, B('ماذا يعني الرمز Z275 في مواصفة الصاج المجلفن؟', 'What does Z275 mean in a galvanized sheet specification?'),
  [B('سماكة الصاج 2.75 مم', 'Sheet thickness 2.75 mm'), B('275 غ/م² طلاء زنك على الوجهين', '275 g/m² zinc coating on both faces'), B('حد الخضوع 275 ميغاباسكال', 'Yield strength 275 MPa'), B('طول اللفة 275 م', 'Coil length 275 m')], 1,
  B('Z275 هي كتلة طلاء الزنك الإجمالية للوجهين.', 'Z275 is the total zinc coating mass for both faces.'));
mcq('LEARN', 2, B('السماكة الاسمية لصاج مجلفن قياس 24 (24 gauge) هي تقريباً:', 'The nominal thickness of 24-gauge galvanized sheet is about:'),
  [B('0.55 مم', '0.55 mm'), B('0.70 مم', '0.70 mm'), B('0.85 مم', '0.85 mm'), B('1.00 مم', '1.00 mm')], 1, B('24 ga = 0.70 مم (0.0276 بوصة).', '24 ga = 0.70 mm (0.0276 in).'));
mcq('LEARN', 2, B('فئة الضغط SMACNA الشائعة للدكت الرئيسي في المباني التجارية بالخليج:', 'The common SMACNA pressure class for commercial supply mains in the Gulf:'),
  [B('½" w.g. (125 باسكال)', '½" w.g. (125 Pa)'), B('2" w.g. (500 باسكال)', '2" w.g. (500 Pa)'), B('6" w.g. (1500 باسكال)', '6" w.g. (1500 Pa)'), B('10" w.g. (2500 باسكال)', '10" w.g. (2500 Pa)')], 1, B('2" w.g. = 500 باسكال.', '2" w.g. = 500 Pa.'));
mcq('LEARN', 2, B('مواصفة DW/144 صادرة عن:', 'DW/144 is published by:'),
  [B('SMACNA (الولايات المتحدة)', 'SMACNA (USA)'), B('BESA/HVCA (المملكة المتحدة)', 'BESA/HVCA (UK)'), B('ASHRAE', 'ASHRAE'), B('CEN (أوروبا)', 'CEN (Europe)')], 1, B('DW/144 مواصفة بريطانية للدكت المعدني.', 'DW/144 is the UK sheet-metal ductwork specification.'));
mcq('LEARN', 3, B('أي معيار يغطي الدكت المرن ووصلاته وشرائط الإحكام؟', 'Which standard covers flexible ducts, connectors and closure tapes?'),
  [B('UL 181', 'UL 181'), B('EN 1506', 'EN 1506'), B('NFPA 96', 'NFPA 96'), B('ISO 9001', 'ISO 9001')], 0, B('UL 181/181A/181B.', 'UL 181/181A/181B.'));
mcq('LEARN', 2, B('في SMACNA، فئة الإحكام A تعني إحكام:', 'In SMACNA, Seal Class A means sealing:'),
  [B('الوصلات العرضية فقط', 'Transverse joints only'), B('الوصلات العرضية والطولية', 'Transverse joints and longitudinal seams'), B('جميع الوصلات والاختراقات', 'All joints, seams and wall penetrations'), B('لا شيء', 'Nothing')], 2, B('الفئة A الأشمل؛ C الأقل.', 'Class A is the most complete; C the least.'));
tf('LEARN', 1, B('الألمنيوم أثقل من الفولاذ المجلفن لنفس الحجم.', 'Aluminium is heavier than galvanized steel for the same volume.'), false, B('كثافة الألمنيوم 2700 مقابل 7850 كغ/م³.', 'Aluminium 2700 vs steel 7850 kg/m³.'));
tf('LEARN', 2, B('يُشترط في عوادم المطابخ التجارية بحسب NFPA 96 لحام مستمر محكم للسوائل.', 'NFPA 96 requires continuous liquid-tight welds for commercial kitchen exhaust.'), true, B('لمنع تسرب الشحوم.', 'To prevent grease leakage.'));
tf('LEARN', 1, B('الدكت المرن مناسب للمسارات الطويلة بديلاً عن الدكت المعدني.', 'Flexible duct is suitable for long runs instead of metal duct.'), false, B('يُحدّ بـ 1.5–2 م للوصلات النهائية فقط.', 'Limited to 1.5–2 m final connections only.'));
mcq('LEARN', 3, B('كثافة الهواء في صنعاء (ارتفاع ≈ 2200 م) مقارنة بمستوى البحر عند نفس درجة الحرارة:', 'Air density in Sana’a (≈ 2200 m) compared with sea level at the same temperature:'),
  [B('أعلى بنحو 20%', 'About 20% higher'), B('أقل بنحو 20%', 'About 20% lower'), B('متساوية', 'The same'), B('أقل بنحو 50%', 'About 50% lower')], 1, B('الضغط الجوي ≈ 77 كيلوباسكال → ρ ≈ 0.95 كغ/م³.', 'Barometric pressure ≈ 77 kPa → ρ ≈ 0.95 kg/m³.'));

// ---------------- DESIGN_LAB (airflow, friction, sizing)
mcq('DESIGN_LAB', 1, B('معادلة الاستمرارية للتدفق في الدكت هي:', 'The continuity equation for duct flow is:'),
  [B('Q = V × A', 'Q = V × A'), B('Q = P / A', 'Q = P / A'), B('Q = ρ × V', 'Q = ρ × V'), B('Q = A / V', 'Q = A / V')], 0, B('التدفق الحجمي = السرعة × المساحة.', 'Volumetric flow = velocity × area.'));
mcq('DESIGN_LAB', 2, B('ضغط السرعة Pv للهواء (ρ = 1.2) عند 8 م/ث يساوي تقريباً:', 'Velocity pressure Pv of air (ρ = 1.2) at 8 m/s is about:'),
  [B('9.6 باسكال', '9.6 Pa'), B('38 باسكال', '38 Pa'), B('77 باسكال', '77 Pa'), B('192 باسكال', '192 Pa')], 1, B('Pv = 0.5 × 1.2 × 64 = 38.4 باسكال.', 'Pv = 0.5 × 1.2 × 64 = 38.4 Pa.'));
mcq('DESIGN_LAB', 2, B('معدل الاحتكاك النموذجي المستخدم في طريقة الاحتكاك المتساوي للمباني التجارية:', 'Typical friction rate used in the equal-friction method for commercial buildings:'),
  [B('0.1 باسكال/م', '0.1 Pa/m'), B('0.8–1.0 باسكال/م', '0.8–1.0 Pa/m'), B('5 باسكال/م', '5 Pa/m'), B('20 باسكال/م', '20 Pa/m')], 1, B('0.8–1.0 Pa/m يوازن الحجم والضجيج والطاقة.', '0.8–1.0 Pa/m balances size, noise and energy.'));
mcq('DESIGN_LAB', 3, B('صيغة Huebscher للقطر المكافئ للدكت المستطيل هي:', 'The Huebscher equivalent-diameter formula for rectangular duct is:'),
  [B('De = 2ab/(a+b)', 'De = 2ab/(a+b)'), B('De = 1.30 (ab)^0.625 / (a+b)^0.25', 'De = 1.30 (ab)^0.625 / (a+b)^0.25'), B('De = √(ab)', 'De = √(ab)'), B('De = (a+b)/2', 'De = (a+b)/2')], 1, B('القطر الهيدروليكي 2ab/(a+b) يختلف عن القطر المكافئ للاحتكاك.', 'The hydraulic diameter 2ab/(a+b) differs from the friction-equivalent diameter.'));
mcq('DESIGN_LAB', 2, B('معامل الفقد C لكوع حاد 90° بدون ريش توجيه مقارنة بكوع ناعم:', 'The loss coefficient C of a 90° mitred elbow without vanes compared with a smooth elbow:'),
  [B('أقل', 'Lower'), B('متساوٍ', 'Equal'), B('أعلى بنحو 8 مرات', 'About 8 times higher'), B('صفر', 'Zero')], 2, B('≈ 1.2 مقابل ≈ 0.15.', '≈ 1.2 versus ≈ 0.15.'));
mcq('DESIGN_LAB', 2, B('خشونة السطح ε للصاج المجلفن بوصلات كل 1.2 م (فئة ASHRAE متوسطة الملاسة):', 'Surface roughness ε for galvanized steel with 1.2 m joints (ASHRAE medium smooth):'),
  [B('0.03 مم', '0.03 mm'), B('0.09 مم', '0.09 mm'), B('0.9 مم', '0.9 mm'), B('3.0 مم', '3.0 mm')], 1, B('0.09 مم هو المرجع الشائع.', '0.09 mm is the usual reference.'));
mcq('DESIGN_LAB', 3, B('في طريقة استرداد الضغط الاستاتيكي (Static regain):', 'In the static regain method:'),
  [B('تبقى السرعة ثابتة في كل المقاطع', 'Velocity stays constant in all sections'), B('يُستردّ جزء من ضغط السرعة كضغط استاتيكي عند التفرعات فيتساوى الضغط عند المخارج', 'Part of the velocity pressure is recovered as static pressure at branches so outlet pressures are nearly equal'), B('يُستخدم دامبر عند كل مخرج فقط', 'Only a damper at each outlet is used'), B('تُصغَّر الأقطار في الأطراف', 'Diameters are reduced at the extremities')], 1, B('مناسبة لأنظمة VAV الطويلة.', 'Suited to long VAV systems.'));
mcq('DESIGN_LAB', 1, B('1 بوصة عمود ماء (in. w.g.) تساوي تقريباً:', '1 inch of water gauge equals approximately:'),
  [B('25 باسكال', '25 Pa'), B('100 باسكال', '100 Pa'), B('249 باسكال', '249 Pa'), B('1000 باسكال', '1000 Pa')], 2, B('1 in. w.g. = 249 Pa.', '1 in. w.g. = 249 Pa.'));
mcq('DESIGN_LAB', 1, B('1 CFM (قدم مكعب/دقيقة) يساوي تقريباً:', '1 CFM equals approximately:'),
  [B('0.472 لتر/ث', '0.472 L/s'), B('1.7 لتر/ث', '1.7 L/s'), B('28 لتر/ث', '28 L/s'), B('0.028 لتر/ث', '0.028 L/s')], 0, B('1 CFM = 0.472 L/s = 1.7 م³/س.', '1 CFM = 0.472 L/s = 1.7 m³/h.'));
tf('DESIGN_LAB', 2, B('بحسب قوانين المراوح، تتناسب قدرة المروحة مع مكعب السرعة الدورانية.', 'By the fan laws, fan power is proportional to the cube of rotational speed.'), true, B('Q ∝ N، Δp ∝ N²، P ∝ N³.', 'Q ∝ N, Δp ∝ N², P ∝ N³.'));
tf('DESIGN_LAB', 2, B('تقليل سرعة المروحة 20% يوفر نحو 20% من طاقتها.', 'Reducing fan speed by 20% saves about 20% of its power.'), false, B('0.8³ = 0.51 → توفير ≈ 49%.', '0.8³ = 0.51 → ≈ 49% saving.'));
tf('DESIGN_LAB', 3, B('يجب ترك مسافة مستقيمة بعد مخرج المروحة قبل أول كوع لتجنب تأثير النظام.', 'A straight length should be left after the fan outlet before the first elbow to avoid system effect.'), true, B('≥ 2.5–3 أقطار مكافئة.', '≥ 2.5–3 equivalent diameters.'));
num('DESIGN_LAB', 1, B('احسب سرعة الهواء (م/ث) في دكت دائري قطره {d} مم يحمل {q} لتر/ث.', 'Calculate the air velocity (m/s) in a {d} mm round duct carrying {q} L/s.'), 'm/s',
  () => { const d = [250, 315, 400, 500][rnd(0, 3)]; const q = rnd(300, 2000, 50); const v = (q / 1000) / E.roundArea(d / 1000); return { params: { d, q }, answer: v }; },
  B('V = Q / A حيث A = πD²/4.', 'V = Q / A with A = πD²/4.'), 4);
num('DESIGN_LAB', 2, B('احسب ضغط السرعة (باسكال) لهواء كثافته 1.2 كغ/م³ يتحرك بسرعة {v} م/ث.', 'Calculate the velocity pressure (Pa) of air with density 1.2 kg/m³ moving at {v} m/s.'), 'Pa',
  () => { const v = rnd(3, 12, 0.5); return { params: { v }, answer: 0.5 * 1.2 * v * v }; }, B('Pv = ½ ρ V².', 'Pv = ½ ρ V².'), 4);
num('DESIGN_LAB', 2, B('احسب القطر المكافئ (مم) بصيغة Huebscher لدكت مستطيل {a}×{b} مم.', 'Calculate the Huebscher equivalent diameter (mm) of a {a}×{b} mm rectangular duct.'), 'mm',
  () => { const a = rnd(400, 1000, 50); const b = rnd(200, 500, 50); return { params: { a, b }, answer: E.equivalentDiameter(a, b) }; }, B('De = 1.30 (ab)^0.625 / (a+b)^0.25.', 'De = 1.30 (ab)^0.625 / (a+b)^0.25.'), 3);
num('DESIGN_LAB', 2, B('دكت مستطيل {a}×{b} مم يحمل {q} لتر/ث. ما مساحة مقطعه (م²) وسرعة الهواء؟ أدخل السرعة (م/ث).', 'A {a}×{b} mm rectangular duct carries {q} L/s. Enter the air velocity (m/s).'), 'm/s',
  () => { const a = rnd(300, 900, 50); const b = rnd(200, 450, 50); const q = rnd(300, 2500, 50); return { params: { a, b, q }, answer: (q / 1000) / ((a / 1000) * (b / 1000)) }; }, B('V = Q/(a×b).', 'V = Q/(a×b).'), 4);
num('DESIGN_LAB', 3, B('فقد فتنغز: {n} أكواع ناعمة (C = 0.15) ومخرج (C = 1.0) عند ضغط سرعة {pv} باسكال. ما مجموع فقد الفتنغز (باسكال)?', 'Fitting losses: {n} smooth elbows (C = 0.15) and an exit (C = 1.0) at a velocity pressure of {pv} Pa. Total fitting loss (Pa)?'), 'Pa',
  () => { const nE = rnd(2, 6); const pv = rnd(15, 60, 5); return { params: { n: nE, pv }, answer: (nE * 0.15 + 1.0) * pv }; }, B('Δp = ΣC × Pv.', 'Δp = ΣC × Pv.'), 3);
num('DESIGN_LAB', 3, B('مروحة تدفع {q} م³/ث عند ضغط كلي {dp} باسكال بكفاءة كلية {eta}%. احسب القدرة (كيلوواط).', 'A fan moves {q} m³/s at {dp} Pa total pressure with {eta}% overall efficiency. Calculate the power (kW).'), 'kW',
  () => { const q = rnd(1, 6, 0.5); const dp = rnd(400, 1200, 50); const eta = rnd(50, 70, 5); return { params: { q, dp, eta }, answer: (q * dp) / (eta / 100) / 1000 }; }, B('P = Q Δp / η.', 'P = Q Δp / η.'), 3);
num('DESIGN_LAB', 3, B('بقوانين المراوح: مروحة تستهلك {p} كيلوواط عند 100% سرعة. ما قدرتها عند {n}% من السرعة (كيلوواط)?', 'Fan laws: a fan draws {p} kW at 100% speed. What is its power at {n}% speed (kW)?'), 'kW',
  () => { const p = rnd(2, 15, 0.5); const nn = rnd(50, 90, 5); return { params: { p, n: nn }, answer: p * Math.pow(nn / 100, 3) }; }, B('P ∝ N³.', 'P ∝ N³.'), 3);

// ---------------- FABRICATION_QC (leakage, insulation, fabrication, installation)
mcq('FABRICATION_QC', 2, B('معادلة SMACNA للتسرب F = CL × P^0.65، ماذا يمثل CL؟', 'In the SMACNA leakage equation F = CL × P^0.65, what is CL?'),
  [B('طول الدكت', 'Duct length'), B('فئة التسرب (التسرب عند 1 بوصة ماء لكل 100 قدم²)', 'Leakage class (leakage at 1 in. w.g. per 100 ft²)'), B('معامل الاحتكاك', 'Friction factor'), B('فئة الضغط', 'Pressure class')], 1, B('CL هو معدل التسرب المرجعي.', 'CL is the reference leakage rate.'));
mcq('FABRICATION_QC', 2, B('فئة التسرب النموذجية لدكت مستطيل بإحكام فئة A هي:', 'The typical leakage class for rectangular duct with Seal Class A is:'),
  [B('3', '3'), B('6', '6'), B('24', '24'), B('48', '48')], 1, B('مستطيل: A=6، B=12، C=24، بدون إحكام 48؛ الدائري نصف هذه القيم.', 'Rectangular: A=6, B=12, C=24, unsealed 48; round is half.'));
mcq('FABRICATION_QC', 1, B('الوصلة الطولية الأكثر شيوعاً في الدكت المستطيل هي:', 'The most common longitudinal seam in rectangular duct is:'),
  [B('قفل بيتسبرغ (Pittsburgh lock)', 'Pittsburgh lock'), B('لحام مستمر', 'Continuous weld'), B('برشام', 'Riveting'), B('شريط ألمنيوم', 'Aluminium tape')], 0, B('يُشكَّل على ماكينة Lock former.', 'Formed on a lock former.'));
mcq('FABRICATION_QC', 2, B('TDF/TDC هي:', 'TDF/TDC is:'),
  [B('نوع من العزل', 'A type of insulation'), B('فلنجة عرضية مدمجة تُشكَّل على نهايات القطعة', 'An integral transverse flange formed on the piece ends'), B('ماكينة قطع بالليزر', 'A laser cutting machine'), B('معيار أوروبي', 'A European standard')], 1, B('تُوصل بزوايا وحشوة ومسامير.', 'Joined with corners, gasket and bolts.'));
mcq('FABRICATION_QC', 2, B('لماذا يُشترط شفط موضعي عند قطع الصاج المجلفن بالبلازما؟', 'Why is local extraction required when plasma-cutting galvanized sheet?'),
  [B('لتبريد الشعلة', 'To cool the torch'), B('بسبب أبخرة أكسيد الزنك الضارة', 'Because of harmful zinc-oxide fumes'), B('لتقليل الضجيج', 'To reduce noise'), B('لا يُشترط', 'It is not required')], 1, B('حمى أبخرة المعادن.', 'Metal fume fever.'));
mcq('FABRICATION_QC', 2, B('أقصى تباعد نموذجي لحمالات دكت مستطيل حتى 750 مم بحسب SMACNA/DW144:', 'Typical maximum hanger spacing for rectangular duct up to 750 mm per SMACNA/DW144:'),
  [B('1 م', '1 m'), B('2.4–3.0 م', '2.4–3.0 m'), B('5 م', '5 m'), B('8 م', '8 m')], 1, B('يقل التباعد مع زيادة المقاس والوزن.', 'Spacing reduces with size and weight.'));
mcq('FABRICATION_QC', 3, B('أين يُركَّب دامبر الحريق (Fire damper)؟', 'Where is a fire damper installed?'),
  [B('عند مخرج المروحة', 'At the fan outlet'), B('عند اختراق الدكت للجدران والأسقف المقاومة للحريق', 'Where the duct penetrates fire-rated walls and floors'), B('عند كل مخرج هواء', 'At every diffuser'), B('داخل الفلتر', 'Inside the filter')], 1, B('بغلاف وزوايا تثبيت وباب فحص (UL 555).', 'With a sleeve, retaining angles and access door (UL 555).'));
mcq('FABRICATION_QC', 3, B('نقطة الندى لهواء عند 35°م ورطوبة 60% تقريباً:', 'The dew point of air at 35 °C and 60% RH is about:'),
  [B('12°م', '12 °C'), B('20°م', '20 °C'), B('26°م', '26 °C'), B('33°م', '33 °C')], 2, B('≈ 26°م بصيغة Magnus؛ أي سطح أبرد يتكاثف عليه الماء.', '≈ 26 °C by the Magnus formula; any colder surface will sweat.'));
mcq('FABRICATION_QC', 2, B('معامل U التقريبي لدكت مجلفن بلا عزل:', 'Approximate U-value of bare galvanized duct:'),
  [B('0.7 واط/م²·ك', '0.7 W/m²·K'), B('1.3 واط/م²·ك', '1.3 W/m²·K'), B('6.5–7 واط/م²·ك', '6.5–7 W/m²·K'), B('50 واط/م²·ك', '50 W/m²·K')], 2, B('عزل 25 مم يخفضه إلى ≈ 1.3.', '25 mm insulation lowers it to ≈ 1.3.'));
mcq('FABRICATION_QC', 3, B('OEE لمصنع بتوافر 90% وأداء 85% وجودة 97% يساوي:', 'OEE for a factory with 90% availability, 85% performance and 97% quality is:'),
  [B('≈ 74%', '≈ 74%'), B('≈ 91%', '≈ 91%'), B('≈ 85%', '≈ 85%'), B('≈ 97%', '≈ 97%')], 0, B('0.9 × 0.85 × 0.97 = 0.742.', '0.9 × 0.85 × 0.97 = 0.742.'));
tf('FABRICATION_QC', 1, B('شريط الألمنيوم بديل مقبول عن مانع التسرب على وصلات الصاج.', 'Aluminium foil tape is an acceptable substitute for sealant on sheet-metal joints.'), false, B('يُستخدم لتغطية وصلات العزل فقط.', 'It only covers insulation joints.'));
tf('FABRICATION_QC', 2, B('يُجرى اختبار تسرب الدكت بعد إغلاق الأسقف المستعارة.', 'The duct leakage test is carried out after suspended ceilings are closed.'), false, B('قبل العزل وإغلاق الأسقف ليمكن الإصلاح.', 'Before insulation and ceiling closure so repairs are possible.'));
tf('FABRICATION_QC', 2, B('يمكن تعليق حمالات الدكت على أنابيب السباكة القريبة عند الضرورة.', 'Duct hangers may be attached to nearby plumbing pipes when necessary.'), false, B('يُمنع التعليق على أنظمة أخرى.', 'Never hang from other systems.'));
tf('FABRICATION_QC', 1, B('حد التعرض للضجيج في المصانع عادةً 85 dB(A) لثماني ساعات.', 'The usual occupational noise exposure limit is 85 dB(A) over 8 hours.'), true, B('يلزم واقيات أذن فوقه.', 'Hearing protection is required above it.'));
num('FABRICATION_QC', 2, B('احسب وزن قطعة دكت مستطيلة {a}×{b} مم بطول {l} م وسماكة {t} مم (كثافة 7850، معامل هدر 1.12). أدخل الوزن (كغ).', 'Calculate the weight of a {a}×{b} mm rectangular duct piece, {l} m long, {t} mm thick (density 7850, waste factor 1.12). Enter the weight (kg).'), 'kg',
  () => { const a = rnd(300, 1200, 50); const b = rnd(200, 600, 50); const l = [1.2, 1.5][rnd(0, 1)]; const t = [0.55, 0.7, 0.85, 1.0][rnd(0, 3)]; return { params: { a, b, l, t }, answer: E.ductWeightKg({ shape: 'rectangular', aMm: a, bMm: b, lengthM: l, thicknessMm: t }) }; }, B('الوزن = المحيط × الطول × السماكة × 7850 × 1.12.', 'Weight = perimeter × length × thickness × 7850 × 1.12.'), 3);
num('FABRICATION_QC', 3, B('احسب التسرب المسموح (لتر/ث) لدكت مستطيل بمساحة سطح {area} م² عند ضغط اختبار {p} باسكال وفئة تسرب CL = {cl}. (لتر/ث لكل م² = 0.001407 × CL × P^0.65)', 'Calculate the allowable leakage (L/s) for rectangular duct with {area} m² surface at {p} Pa test pressure and leakage class CL = {cl}. (L/s per m² = 0.001407 × CL × P^0.65)'), 'L/s',
  () => { const area = rnd(50, 400, 10); const p = [250, 500, 750, 1000][rnd(0, 3)]; const cl = [6, 12, 24][rnd(0, 2)]; return { params: { area, p, cl }, answer: E.leakageLps(cl, area, p) }; }, B('اضرب المعدل في المساحة.', 'Multiply the rate by the area.'), 3);
num('FABRICATION_QC', 3, B('احسب مساحة سطح الدكت (م²) لقطعة مستطيلة {a}×{b} مم بطول {l} م (لأغراض العزل).', 'Calculate the surface area (m²) of a {a}×{b} mm rectangular piece {l} m long (for insulation).'), 'm²',
  () => { const a = rnd(300, 1200, 50); const b = rnd(200, 600, 50); const l = rnd(1, 3, 0.5); return { params: { a, b, l }, answer: 2 * ((a + b) / 1000) * l }; }, B('المساحة = المحيط × الطول.', 'Area = perimeter × length.'), 3);

// ---------------- FACTORY_TWIN / BUILDING_TWIN (digital twin concepts)
mcq('FACTORY_TWIN', 1, B('التوأم الرقمي هو:', 'A digital twin is:'),
  [B('رسم ثنائي الأبعاد للمصنع', 'A 2D drawing of the factory'), B('نموذج رقمي حي يُغذَّى ببيانات حقيقية للتحليل والتنبؤ', 'A live digital model fed with real data for analysis and prediction'), B('نسخة احتياطية من البرامج', 'A software backup'), B('روبوت صناعي', 'An industrial robot')], 1, B('يرتبط بالأصل الفيزيائي عبر الحساسات.', 'Linked to the physical asset through sensors.'));
mcq('FACTORY_TWIN', 2, B('في حساب OEE، «التوافر» يساوي:', 'In OEE, “availability” equals:'),
  [B('القطع السليمة / إجمالي القطع', 'Good pieces / total pieces'), B('وقت التشغيل / الوقت المخطط', 'Run time / planned time'), B('الإنتاج الفعلي / الإنتاج النظري', 'Actual / ideal output'), B('الطاقة / القطع', 'Energy / pieces')], 1, B('يتأثر بالأعطال والتوقفات.', 'Affected by breakdowns and stoppages.'));
mcq('FACTORY_TWIN', 2, B('أكبر مستهلكَين للطاقة في مصنع الدكت عادةً:', 'The two largest energy consumers in a duct factory are usually:'),
  [B('الإنارة والمكاتب', 'Lighting and offices'), B('قطع البلازما وضاغط الهواء', 'Plasma cutting and the air compressor'), B('ماكينة بيتسبرغ والطي', 'Pittsburgh former and folder'), B('الرافعة الجسرية', 'The overhead crane')], 1, B('40–70 كW للبلازما و15–37 كW للضاغط.', '40–70 kW for plasma and 15–37 kW for the compressor.'));
mcq('FACTORY_TWIN', 3, B('المحطة التي تتراكم أمامها أكبر كمية من العمل الجاري (WIP) تُسمى:', 'The station with the largest work-in-progress queue in front of it is the:'),
  [B('المحطة النهائية', 'Final station'), B('عنق الزجاجة (Bottleneck)', 'Bottleneck'), B('محطة الجودة', 'QC station'), B('المخزن', 'The warehouse')], 1, B('تحدد إنتاجية الخط كله.', 'It sets the throughput of the whole line.'));
mcq('FACTORY_TWIN', 2, B('البروتوكول الشائع لربط PLC الآلات بمنصات الصناعة 4.0:', 'A common protocol linking machine PLCs to Industry 4.0 platforms:'),
  [B('OPC-UA', 'OPC-UA'), B('HTML', 'HTML'), B('SMTP', 'SMTP'), B('USB', 'USB')], 0, B('OPC-UA وMQTT وModbus.', 'OPC-UA, MQTT and Modbus.'));
tf('FACTORY_TWIN', 2, B('يمكن تقدير الإنتاج الشهري لمصنع الدكت بالأطنان من عدد القطع ووزن القطعة.', 'A duct factory’s monthly output in tonnes can be estimated from piece count and piece weight.'), true, B('قطعة 600×400×1200 بسماكة 0.7 ≈ 15 كغ.', 'A 600×400×1200 piece at 0.7 mm ≈ 15 kg.'));
mcq('BUILDING_TWIN', 2, B('ارتفاع فرق ضغط الفلتر تدريجياً مع الوقت في توأم شبكة الدكت يشير إلى:', 'A gradual rise in filter ΔP over time in the network twin indicates:'),
  [B('تسرب في الدكت', 'Duct leakage'), B('تلوث الفلتر وحاجته للاستبدال', 'Filter loading — replacement due'), B('عطل في الحساس', 'Sensor fault'), B('زيادة كثافة الهواء', 'Higher air density')], 1, B('نمط FDD كلاسيكي.', 'A classic FDD pattern.'));
mcq('BUILDING_TWIN', 2, B('إغلاق دامبر فرع جزئياً في شبكة ذات مروحة ثابتة السرعة يؤدي إلى:', 'Partially closing one branch damper in a constant-speed fan system causes:'),
  [B('انخفاض تدفق هذا الفرع وارتفاع تدفق الفروع الأخرى', 'Lower flow in that branch and higher flow in the others'), B('انخفاض تدفق كل الفروع بالتساوي', 'Equal reduction in all branches'), B('لا تأثير', 'No effect'), B('توقف المروحة', 'The fan stops')], 0, B('إعادة توزيع الضغط بين المسارات المتوازية.', 'Pressure redistributes between parallel paths.'));
mcq('BUILDING_TWIN', 3, B('الحد الأدنى النموذجي للضغط الاستاتيكي المطلوب عند مدخل صندوق VAV:', 'Typical minimum static pressure required at a VAV box inlet:'),
  [B('5–10 باسكال', '5–10 Pa'), B('60–125 باسكال', '60–125 Pa'), B('500 باسكال', '500 Pa'), B('2000 باسكال', '2000 Pa')], 1, B('حسب الشركة الصانعة.', 'Per manufacturer data.'));
tf('BUILDING_TWIN', 2, B('التسرب في دكت الإمداد داخل فراغ سقف حار يزيد حِمل التبريد وطاقة المروحة معاً.', 'Leakage from supply duct into a hot ceiling void increases both cooling load and fan energy.'), true, B('هواء مبرَّد مهدور + تدفق إضافي للمروحة.', 'Wasted cooled air + extra fan flow.'));
num('BUILDING_TWIN', 3, B('دكت بمساحة سطح {a} م² ومعامل U = {u} واط/م²·ك يحمل هواءً عند 13°م داخل فراغ حرارته {t}°م. قدّر الاكتساب الحراري التقريبي (كيلوواط) بافتراض فرق حرارة ثابت.', 'A duct with {a} m² surface and U = {u} W/m²·K carries 13 °C air through a {t} °C void. Estimate the approximate heat gain (kW) assuming a constant temperature difference.'), 'kW',
  () => { const a = rnd(20, 120, 5); const u = [0.7, 1.3, 6.9][rnd(0, 2)]; const t = rnd(30, 48, 1); return { params: { a, u, t }, answer: (u * a * (t - 13)) / 1000 }; }, B('q = U × A × ΔT.', 'q = U × A × ΔT.'), 4);

// ---------------- ASSESSMENT-general (mixed quick)
mcq('ASSESSMENT', 1, B('أي جهاز يُستخدم لقياس تدفق مخرج الهواء مباشرة أثناء الموازنة؟', 'Which instrument measures outlet airflow directly during balancing?'),
  [B('غطاء التدفق (Flow hood)', 'Flow hood'), B('ميزان حرارة', 'Thermometer'), B('مقياس الضجيج', 'Sound level meter'), B('مقياس الرطوبة', 'Hygrometer')], 0, B('الأسرع لموازنة المخارج.', 'Fastest for balancing outlets.'));
mcq('ASSESSMENT', 2, B('التفاوت المقبول عادةً لتدفق المخارج بعد الموازنة (TAB):', 'Usual acceptable tolerance for outlet flows after TAB:'),
  [B('±1%', '±1%'), B('±10%', '±10%'), B('±30%', '±30%'), B('±50%', '±50%')], 1, B('±10% من التصميم.', '±10% of design.'));
mcq('ASSESSMENT', 2, B('من يستخدم أنبوب بيتو في الدكت؟', 'A pitot tube in a duct measures:'),
  [B('درجة الحرارة', 'Temperature'), B('ضغط السرعة لحساب السرعة والتدفق', 'Velocity pressure to compute velocity and flow'), B('الرطوبة', 'Humidity'), B('التسرب', 'Leakage')], 1, B('V = √(2Pv/ρ).', 'V = √(2Pv/ρ).'));
num('ASSESSMENT', 3, B('مسح بيتو أعطى ضغط سرعة متوسطاً {pv} باسكال عند كثافة {rho} كغ/م³ في دكت {a}×{b} مم. احسب التدفق (م³/ث).', 'A pitot traverse gave a mean velocity pressure of {pv} Pa at density {rho} kg/m³ in a {a}×{b} mm duct. Calculate the flow (m³/s).'), 'm³/s',
  () => { const pv = rnd(10, 60, 5); const rho = [1.1, 1.15, 1.2][rnd(0, 2)]; const a = rnd(400, 1000, 100); const b = rnd(300, 500, 50); const v = Math.sqrt(2 * pv / rho); return { params: { pv, rho, a, b }, answer: v * (a / 1000) * (b / 1000) }; }, B('V = √(2Pv/ρ)، Q = V × A.', 'V = √(2Pv/ρ), Q = V × A.'), 4);

/** Builds an exam: picks `count` questions filtered by modules and difficulty, shuffled; numeric questions get generated params. */
function buildExam({ count = 15, moduleIds = null, maxDifficulty = 3, seedShuffle = true } = {}) {
  let pool = Q.filter((q) => (!moduleIds || moduleIds.length === 0 || moduleIds.includes(q.moduleId)) && q.difficulty <= maxDifficulty);
  pool = pool.slice();
  if (seedShuffle) for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, Math.min(count, pool.length)).map((q) => {
    if (q.type === 'numeric') { const g = q.generate(); return { ...q, generate: undefined, params: g.params, answer: g.answer }; }
    if (q.type === 'mcq') { // shuffle options, track correct index
      const idx = q.options.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      return { ...q, options: idx.map((i) => q.options[i]), answer: idx.indexOf(q.answer) };
    }
    return { ...q };
  });
}

function fillTemplate(text, params) { return String(text).replace(/\{(\w+)\}/g, (_, k) => (params && k in params ? params[k] : `{${k}}`)); }

/** Grades one response. Returns { correct:boolean, points } */
function grade(q, response) {
  if (response === null || response === undefined || response === '') return { correct: false, points: 0 };
  if (q.type === 'mcq') return { correct: Number(response) === q.answer, points: Number(response) === q.answer ? q.difficulty : 0 };
  if (q.type === 'tf') return { correct: Boolean(response) === q.answer, points: Boolean(response) === q.answer ? q.difficulty : 0 };
  if (q.type === 'numeric') {
    const v = parseFloat(String(response).replace(/,/g, '.')); if (!isFinite(v)) return { correct: false, points: 0 };
    const ok = Math.abs(v - q.answer) <= Math.abs(q.answer) * (q.tolerancePct / 100) + 1e-9;
    return { correct: ok, points: ok ? q.difficulty : 0 };
  }
  return { correct: false, points: 0 };
}

module.exports = { QUESTIONS: Q, buildExam, grade, fillTemplate };
