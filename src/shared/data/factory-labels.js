'use strict';
/** Labels for the factory directory enums. */
const PRODUCT_LABELS = {
  rectangular_gi_duct: { ar: 'دكت مستطيل مجلفن', en: 'Rectangular GI duct' }, spiral_round_duct: { ar: 'دكت دائري حلزوني', en: 'Spiral round duct' }, oval_duct: { ar: 'دكت بيضاوي', en: 'Flat-oval duct' },
  pre_insulated_pir_duct: { ar: 'دكت PIR مسبق العزل', en: 'PIR pre-insulated duct' }, pre_insulated_phenolic_duct: { ar: 'دكت فينولي مسبق العزل', en: 'Phenolic pre-insulated duct' }, flexible_duct: { ar: 'دكت مرن', en: 'Flexible duct' },
  fire_rated_duct: { ar: 'دكت مقاوم للحريق', en: 'Fire-rated duct' }, dampers: { ar: 'دامبرات', en: 'Dampers' }, grilles_diffusers: { ar: 'شبكات ومخارج هواء', en: 'Grilles & diffusers' }, sound_attenuators: { ar: 'مخمدات صوت', en: 'Sound attenuators' },
  kitchen_exhaust_duct: { ar: 'دكت عادم مطابخ', en: 'Kitchen exhaust duct' }, stainless_duct: { ar: 'دكت ستانلس', en: 'Stainless duct' }, aluminium_duct: { ar: 'دكت ألمنيوم', en: 'Aluminium duct' }, duct_accessories: { ar: 'إكسسوارات دكت', en: 'Duct accessories' },
  ahu_fcu: { ar: 'وحدات مناولة هواء', en: 'AHU / FCU' }, other: { ar: 'منتجات أخرى', en: 'Other' },
};
const STANDARD_LABELS = { SMACNA: 'SMACNA', 'DW/144': 'DW/144', ASHRAE: 'ASHRAE', UL_181: 'UL 181', EN_1507: 'EN 1507', EN_12237: 'EN 12237', ISO_9001: 'ISO 9001', ISO_14001: 'ISO 14001', ISO_45001: 'ISO 45001', DCL: 'DCL (Dubai)', Eurovent: 'Eurovent', other: { ar: 'أخرى', en: 'Other' } };
const COUNTRY_LABELS = {
  SA: { ar: 'السعودية', en: 'Saudi Arabia' }, AE: { ar: 'الإمارات', en: 'UAE' }, QA: { ar: 'قطر', en: 'Qatar' }, KW: { ar: 'الكويت', en: 'Kuwait' }, OM: { ar: 'عُمان', en: 'Oman' }, BH: { ar: 'البحرين', en: 'Bahrain' },
  JO: { ar: 'الأردن', en: 'Jordan' }, EG: { ar: 'مصر', en: 'Egypt' }, IQ: { ar: 'العراق', en: 'Iraq' }, LB: { ar: 'لبنان', en: 'Lebanon' }, SY: { ar: 'سوريا', en: 'Syria' }, PS: { ar: 'فلسطين', en: 'Palestine' },
  MA: { ar: 'المغرب', en: 'Morocco' }, DZ: { ar: 'الجزائر', en: 'Algeria' }, TN: { ar: 'تونس', en: 'Tunisia' }, LY: { ar: 'ليبيا', en: 'Libya' }, SD: { ar: 'السودان', en: 'Sudan' }, YE: { ar: 'اليمن', en: 'Yemen' },
};
/** Approximate label anchor positions for the map (lon, lat). */
const COUNTRY_ANCHORS = { SA: [45, 24], AE: [54.5, 23.8], QA: [51.2, 25.3], KW: [47.6, 29.4], OM: [56.5, 21.5], BH: [50.55, 26.05], JO: [36.5, 31.3], EG: [30, 27], IQ: [43.5, 33.2], LB: [35.9, 33.9], SY: [38.5, 35], PS: [35.2, 31.9], MA: [-6.5, 32], DZ: [2.5, 28], TN: [9.5, 34.5], LY: [17.5, 27.5], SD: [30, 15.5], YE: [47.5, 15.5] };
module.exports = { PRODUCT_LABELS, STANDARD_LABELS, COUNTRY_LABELS, COUNTRY_ANCHORS };
