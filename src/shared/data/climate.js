'use strict';
/**
 * Design climate data for Arab cities.
 *  - source 'ASHRAE 2017' / 'ASHRAE 2009': values parsed from EnergyPlus weather-file headers declaring the ASHRAE
 *    Handbook—Fundamentals climatic design conditions (see source_url); station metadata (WMO, lat/lon, elevation)
 *    from the ASHRAE Climatic Design Conditions Station Finder 2021 list.
 *  - source 'approx': representative educational values (0.4% cooling DB / MCWB, 99.6% heating DB) to be verified
 *    against the ASHRAE tables for real projects. rh_summer_pct is a typical coincident summer relative humidity.
 */
const CITIES = [
  {"id":"riyadh","city_ar":"الرياض","city_en":"Riyadh","country_code":"SA","lat":24.722,"lon":46.725,"elevation_m":635,"cooling_db_0_4":44.7,"cooling_mcwb_0_4":19.3,"heating_db_99_6":5.9,"rh_summer_pct":15,"source":"ASHRAE 2017","station":"RIYADH KING SALMAN AB","wmo":"404380","cooling_wb_0_4":21.3,"source_url":"https://raw.githubusercontent.com/NatLabRockies/ComStock-Typical/main/data/weather/SAU_RI_Riyadh.AB.404380_TMYx.epw"},
  {"id":"jeddah","city_ar":"جدة","city_en":"Jeddah","country_code":"SA","lat":21.68,"lon":39.157,"elevation_m":15,"cooling_db_0_4":40.6,"cooling_mcwb_0_4":24.5,"heating_db_99_6":15.5,"rh_summer_pct":55,"source":"approx","station":"JEDDAH KING ABDULAZIZ INTL","wmo":"410240"},
  {"id":"dammam","city_ar":"الدمام","city_en":"Dammam","country_code":"SA","lat":26.433,"lon":49.8,"elevation_m":12,"cooling_db_0_4":45,"cooling_mcwb_0_4":22.5,"heating_db_99_6":8.5,"rh_summer_pct":40,"source":"approx","station":"DAMMAM KING FAHD INTL","wmo":"404150"},
  {"id":"dubai","city_ar":"دبي","city_en":"Dubai","country_code":"AE","lat":25.255,"lon":55.364,"elevation_m":10,"cooling_db_0_4":43.1,"cooling_mcwb_0_4":23.5,"heating_db_99_6":13.1,"rh_summer_pct":55,"source":"ASHRAE 2017","station":"DUBAI INTL","wmo":"411940","cooling_wb_0_4":30.4,"source_url":"https://raw.githubusercontent.com/NatLabRockies/openstudio-standards/master/data/weather/ARE_DU_Dubai.Intl.AP.411940_TMYx.ddy"},
  {"id":"abu_dhabi","city_ar":"أبوظبي","city_en":"Abu Dhabi","country_code":"AE","lat":24.433,"lon":54.651,"elevation_m":27,"cooling_db_0_4":44.1,"cooling_mcwb_0_4":22.9,"heating_db_99_6":12.5,"rh_summer_pct":55,"source":"approx","station":"ABU DHABI INTL","wmo":"412170"},
  {"id":"doha","city_ar":"الدوحة","city_en":"Doha","country_code":"QA","lat":25.261,"lon":51.565,"elevation_m":11,"cooling_db_0_4":44.4,"cooling_mcwb_0_4":22.2,"heating_db_99_6":12,"rh_summer_pct":50,"source":"approx","station":"DOHA INTL","wmo":"411700"},
  {"id":"kuwait","city_ar":"الكويت","city_en":"Kuwait City","country_code":"KW","lat":29.227,"lon":47.969,"elevation_m":63,"cooling_db_0_4":47.4,"cooling_mcwb_0_4":20.7,"heating_db_99_6":5.5,"rh_summer_pct":20,"source":"approx","station":"KUWAIT INTL","wmo":"405820"},
  {"id":"muscat","city_ar":"مسقط","city_en":"Muscat","country_code":"OM","lat":23.6086,"lon":58.2614,"elevation_m":8,"cooling_db_0_4":42.9,"cooling_mcwb_0_4":24.1,"heating_db_99_6":15.6,"rh_summer_pct":55,"source":"approx","station":"MUSCAT INTL","wmo":"412560"},
  {"id":"manama","city_ar":"المنامة","city_en":"Manama","country_code":"BH","lat":26.2618,"lon":50.6433,"elevation_m":2,"cooling_db_0_4":41.9,"cooling_mcwb_0_4":24.6,"heating_db_99_6":12,"rh_summer_pct":55,"source":"approx","station":"BAHRAIN INTL","wmo":"411500"},
  {"id":"amman","city_ar":"عمّان","city_en":"Amman","country_code":"JO","lat":31.723,"lon":35.993,"elevation_m":730,"cooling_db_0_4":36.1,"cooling_mcwb_0_4":18.3,"heating_db_99_6":1.2,"rh_summer_pct":30,"source":"approx","station":"QUEEN ALIA INTL","wmo":"402720"},
  {"id":"aqaba","city_ar":"العقبة","city_en":"Aqaba","country_code":"JO","lat":29.612,"lon":35.018,"elevation_m":53,"cooling_db_0_4":41.4,"cooling_mcwb_0_4":20,"heating_db_99_6":8,"rh_summer_pct":25,"source":"approx","station":"AQABA KING HUSSEIN INTL","wmo":"403400"},
  {"id":"cairo","city_ar":"القاهرة","city_en":"Cairo","country_code":"EG","lat":30.122,"lon":31.406,"elevation_m":116,"cooling_db_0_4":38.2,"cooling_mcwb_0_4":21.2,"heating_db_99_6":7.9,"rh_summer_pct":35,"source":"ASHRAE 2017","station":"CAIRO INTL","wmo":"623660","cooling_wb_0_4":25.2,"source_url":"https://raw.githubusercontent.com/LoftyTao/ladybug-tools-mcp/main/src/ladybug_tools_mcp/resources/weather/EGY_QH_Cairo.Intl.AP.623660_TMYx.2004-2018/EGY_QH_Cairo.Intl.AP.623660_TMYx.2004-2018.ddy"},
  {"id":"alexandria","city_ar":"الإسكندرية","city_en":"Alexandria","country_code":"EG","lat":31.184,"lon":29.949,"elevation_m":-2,"cooling_db_0_4":33,"cooling_mcwb_0_4":22.2,"heating_db_99_6":6.9,"rh_summer_pct":65,"source":"ASHRAE 2009","station":"ALEXANDRIA INTL","wmo":"623180","cooling_wb_0_4":25.2,"source_url":"https://raw.githubusercontent.com/tayor/epw-weather/master/data/EGY_Alexandria.623180_ETMY.epw"},
  {"id":"baghdad","city_ar":"بغداد","city_en":"Baghdad","country_code":"IQ","lat":33.267,"lon":44.233,"elevation_m":35,"cooling_db_0_4":46.4,"cooling_mcwb_0_4":21.5,"heating_db_99_6":2.2,"rh_summer_pct":15,"source":"approx","station":"BAGHDAD INTL","wmo":"406500"},
  {"id":"basra","city_ar":"البصرة","city_en":"Basra","country_code":"IQ","lat":30.549,"lon":47.662,"elevation_m":3,"cooling_db_0_4":47.6,"cooling_mcwb_0_4":21.8,"heating_db_99_6":4.5,"rh_summer_pct":20,"source":"approx","station":"BASRAH INTL","wmo":"406890"},
  {"id":"beirut","city_ar":"بيروت","city_en":"Beirut","country_code":"LB","lat":33.821,"lon":35.488,"elevation_m":27,"cooling_db_0_4":32.6,"cooling_mcwb_0_4":24.5,"heating_db_99_6":7.6,"rh_summer_pct":65,"source":"approx","station":"BEIRUT RAFIC HARIRI INTL","wmo":"401000"},
  {"id":"damascus","city_ar":"دمشق","city_en":"Damascus","country_code":"SY","lat":33.412,"lon":36.516,"elevation_m":616,"cooling_db_0_4":39.3,"cooling_mcwb_0_4":18.6,"heating_db_99_6":-1.5,"rh_summer_pct":25,"source":"approx","station":"DAMASCUS INTL","wmo":"400800"},
  {"id":"casablanca","city_ar":"الدار البيضاء","city_en":"Casablanca","country_code":"MA","lat":33.557,"lon":-7.66,"elevation_m":62,"cooling_db_0_4":31.8,"cooling_mcwb_0_4":21.2,"heating_db_99_6":6.4,"rh_summer_pct":65,"source":"approx","station":"CASABLANCA ANFA","wmo":"601550"},
  {"id":"algiers","city_ar":"الجزائر","city_en":"Algiers","country_code":"DZ","lat":36.6897,"lon":3.2166,"elevation_m":25,"cooling_db_0_4":35.2,"cooling_mcwb_0_4":22.2,"heating_db_99_6":1.9,"rh_summer_pct":60,"source":"ASHRAE 2009","station":"DAR EL BEIDA","wmo":"603900","cooling_wb_0_4":25.5,"source_url":"https://raw.githubusercontent.com/tayor/epw-weather/master/data/DZA_Algiers.603900_IWEC.epw"},
  {"id":"tunis","city_ar":"تونس","city_en":"Tunis","country_code":"TN","lat":36.8509,"lon":10.2145,"elevation_m":7,"cooling_db_0_4":38.6,"cooling_mcwb_0_4":22.2,"heating_db_99_6":4.6,"rh_summer_pct":55,"source":"approx","station":"TUNIS CARTHAGE","wmo":"607150"},
  {"id":"tripoli","city_ar":"طرابلس","city_en":"Tripoli","country_code":"LY","lat":32.664,"lon":13.159,"elevation_m":80,"cooling_db_0_4":40.1,"cooling_mcwb_0_4":22.8,"heating_db_99_6":5.5,"rh_summer_pct":55,"source":"approx","station":"TRIPOLI INTL","wmo":"620100"},
  {"id":"khartoum","city_ar":"الخرطوم","city_en":"Khartoum","country_code":"SD","lat":15.589,"lon":32.553,"elevation_m":386,"cooling_db_0_4":43.7,"cooling_mcwb_0_4":19.7,"heating_db_99_6":13.9,"rh_summer_pct":20,"source":"approx","station":"KHARTOUM INTL","wmo":"627210"},
  {"id":"sanaa","city_ar":"صنعاء","city_en":"Sana'a","country_code":"YE","lat":15.476,"lon":44.22,"elevation_m":2206,"cooling_db_0_4":31.2,"cooling_mcwb_0_4":13.9,"heating_db_99_6":3.5,"rh_summer_pct":25,"source":"approx","station":"SANA'A INTL","wmo":"414040"},
  {"id":"erbil","city_ar":"أربيل","city_en":"Erbil","country_code":"IQ","lat":36.233,"lon":43.967,"elevation_m":409,"cooling_db_0_4":43.8,"cooling_mcwb_0_4":20.1,"heating_db_99_6":-0.5,"rh_summer_pct":15,"source":"approx","station":"ERBIL INTL","wmo":"406356"},
  {"id":"sharjah","city_ar":"الشارقة","city_en":"Sharjah","country_code":"AE","lat":25.329,"lon":55.517,"elevation_m":34,"station":"SHARJAH INTL","wmo":"411960","cooling_db_0_4":43.6,"cooling_mcwb_0_4":23,"heating_db_99_6":11.5,"rh_summer_pct":55,"source":"approx"},
  {"id":"marrakech","city_ar":"مراكش","city_en":"Marrakech","country_code":"MA","lat":31.607,"lon":-8.036,"elevation_m":468,"station":"MARRAKECH MENARA","wmo":"602300","cooling_db_0_4":40.6,"cooling_mcwb_0_4":19.5,"heating_db_99_6":3.5,"rh_summer_pct":25,"source":"approx"},
];
function cityById(id) { return CITIES.find((c) => c.id === id) || CITIES[0]; }
/** Simple diurnal ambient temperature model around the design day: peak at 15:00, min at 05:00. */
function ambientAt(city, hour, { swing = 12 } = {}) {
  const peak = city.cooling_db_0_4;
  const phase = ((hour - 15) / 24) * 2 * Math.PI;
  return peak - swing / 2 + (swing / 2) * Math.cos(phase);
}
module.exports = { CITIES, cityById, ambientAt };
