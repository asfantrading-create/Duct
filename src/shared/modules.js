'use strict';
/**
 * Licensable modules of the ASFAN Duct Digital Twin.
 * The license payload may carry `modules: [ids]`; when absent, all modules are licensed.
 * Keep IDs stable: they are embedded in customers' license keys.
 */
const MODULES = [
  { id: 'LEARN',          ar: 'المكتبة التعليمية',            en: 'Learning Library',         icon: 'book' },
  { id: 'DESIGN_LAB',     ar: 'مختبر تصميم الدكت',            en: 'Duct Design Lab',          icon: 'ruler' },
  { id: 'FACTORY_TWIN',   ar: 'التوأم الرقمي لمصنع الدكت',     en: 'Factory Digital Twin',     icon: 'factory' },
  { id: 'BUILDING_TWIN',  ar: 'التوأم الرقمي لشبكة الدكت',    en: 'Duct Network Digital Twin', icon: 'building' },
  { id: 'FABRICATION_QC', ar: 'التصنيع والتركيب وضبط الجودة', en: 'Fabrication, Installation & QC', icon: 'wrench' },
  { id: 'ASSESSMENT',     ar: 'الاختبارات والتقييم',          en: 'Assessments',              icon: 'clipboard' },
];

const MODULE_IDS = MODULES.map((m) => m.id);

function isModuleLicensed(licensePayload, moduleId) {
  if (!licensePayload) return false;
  const list = licensePayload.modules;
  if (!Array.isArray(list) || list.length === 0) return true; // all modules
  return list.includes(moduleId);
}

module.exports = { MODULES, MODULE_IDS, isModuleLicensed };
