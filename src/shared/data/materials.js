'use strict';
/** Duct materials — physical properties and indicative unit costs (editable in the UI). */
const MATERIALS = [
  { id: 'gi', ar: 'صاج مجلفن (GI) DX51D+Z275', en: 'Galvanized steel (GI) DX51D+Z275', density: 7850, k: 50, roughness: 'medium_smooth', costPerKgUSD: 1.25, notes: { ar: 'الأكثر شيوعاً؛ طلاء زنك 275 غ/م² (Z275) يقاوم التآكل؛ درجة حرارة تشغيل حتى ~200°م.', en: 'Most common; 275 g/m² zinc coating (Z275) resists corrosion; service up to ~200 °C.' } },
  { id: 'aluminium', ar: 'ألمنيوم 1050/3003', en: 'Aluminium 1050/3003', density: 2700, k: 200, roughness: 'smooth', costPerKgUSD: 4.2, notes: { ar: 'خفيف ومقاوم للتآكل؛ يُستخدم في البيئات الرطبة والمسابح والمطابخ (غير الدهنية).', en: 'Light and corrosion resistant; used in humid areas, pools and some kitchens.' } },
  { id: 'ss304', ar: 'ستانلس ستيل 304', en: 'Stainless steel 304', density: 7900, k: 16, roughness: 'smooth', costPerKgUSD: 5.5, notes: { ar: 'لمداخن المطابخ التجارية وعوادم المختبرات والبيئات الكيميائية.', en: 'Commercial kitchen exhaust, laboratory exhaust and chemical environments.' } },
  { id: 'ss316', ar: 'ستانلس ستيل 316', en: 'Stainless steel 316', density: 8000, k: 16, roughness: 'smooth', costPerKgUSD: 7.5, notes: { ar: 'مقاومة أعلى للكلوريدات (المناطق الساحلية، المسابح).', en: 'Higher chloride resistance (coastal areas, pools).' } },
  { id: 'pir_panel', ar: 'لوح PIR مسبق العزل (20 مم)', en: 'PIR pre-insulated panel (20 mm)', density: 52, k: 0.022, roughness: 'smooth', costPerM2USD: 28, notes: { ar: 'رغوة PIR بين طبقتي ألمنيوم 80 ميكرون؛ خفيف (~1.5 كغ/م²) وعزل مدمج؛ يُقطّع ويُجمّع في الموقع أو المصنع.', en: 'PIR foam between two 80 µm aluminium facings; light (~1.5 kg/m²) with built-in insulation; cut and assembled in shop or on site.' } },
  { id: 'phenolic_panel', ar: 'لوح فينولي مسبق العزل (22 مم)', en: 'Phenolic pre-insulated panel (22 mm)', density: 60, k: 0.021, roughness: 'smooth', costPerM2USD: 34, notes: { ar: 'أداء حريق عالٍ (Class 0)، يُستخدم في المشاريع الفاخرة والمستشفيات.', en: 'High fire performance (Class 0); used in premium projects and hospitals.' } },
  { id: 'flex_insulated', ar: 'دكت مرن معزول (UL 181)', en: 'Insulated flexible duct (UL 181)', density: null, k: 0.04, roughness: 'medium_rough', costPerMUSD: 9, notes: { ar: 'للوصلات النهائية القصيرة (≤ 1.5–2 م) إلى المخارج؛ احتكاك عالٍ إن لم يُشدّ.', en: 'Short final connections (≤ 1.5–2 m) to outlets; high friction when not fully stretched.' } },
  { id: 'fabric', ar: 'دكت قماشي (Fabric duct)', en: 'Fabric duct', density: null, k: null, roughness: 'medium_smooth', costPerMUSD: 45, notes: { ar: 'توزيع هواء منتظم في الصالات والمصانع والمساجد الكبيرة؛ قابل للغسل.', en: 'Even air distribution in halls, factories and large mosques; washable.' } },
];

const SEALANTS = [
  { id: 'water_based', ar: 'مانع تسرب مائي (Duct sealant)', en: 'Water-based duct sealant', notes: { ar: 'للوصلات العرضية والطولية؛ مطلوب لفئة الإحكام A/B.', en: 'Transverse joints and longitudinal seams; required for seal class A/B.' } },
  { id: 'mastic', ar: 'ماستيك + شريط تقوية', en: 'Mastic + reinforcing tape', notes: { ar: 'للفجوات الكبيرة وزوايا TDF.', en: 'Larger gaps and TDF corners.' } },
  { id: 'gasket', ar: 'حشوة (Gasket) للفلنجات', en: 'Flange gasket', notes: { ar: 'شريط بيوتيل أو نيوبرين بين فلنجات TDF/TDC.', en: 'Butyl or neoprene tape between TDF/TDC flanges.' } },
  { id: 'foil_tape', ar: 'شريط ألمنيوم', en: 'Aluminium foil tape', notes: { ar: 'لتغطية وصلات العزل الخارجي والدكت مسبق العزل، ليس بديلاً عن المانع.', en: 'Covers external insulation joints and pre-insulated duct; not a substitute for sealant.' } },
];

module.exports = { MATERIALS, SEALANTS };
