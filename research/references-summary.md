# Reference dataset for the Duct Digital Twin — summary & caveats

Compiled 2026-09-21 inside a sandbox whose egress proxy **blocked every primary publisher**
(ashrae-meteo.info, climate.onebuilding.org, energyplus.net, ashrae.org, smacna.org,
engineeringtoolbox.com, all manufacturer sites, Wikipedia, archive.org, …). Only GitHub
(raw files, git partial clones, code search), PyPI and npm were reachable. Every number in
the two JSON files therefore comes from a GitHub-hosted file that was actually opened, and
each record carries the exact URL. Nothing was invented; unverifiable values are `null` and
flagged.

## Part A — `climate.json` (27 records)

**Station metadata (WMO, name, lat, lon, elevation) is verified for all 27 cities** from the
official ASHRAE *Climatic Design Conditions Station Finder* 2021 station list
(`klimaat/StationFinder/js/stations_2021.json`, © ASHRAE).

**ASHRAE design temperatures were found for 5 cities only:**

| City | Station / WMO | Edition | Htg 99.6 % DB | Clg 0.4 % DB / MCWB | Clg 0.4 % WB | Source |
|---|---|---|---|---|---|---|
| Riyadh | Riyadh AB (King Salman AB) 404380 | 2017 | 5.9 °C | 44.7 / 19.3 °C | 21.3 °C | EPW header, ComStock-Typical repo |
| Dubai | Dubai Intl 411940 | 2017 | 13.1 °C | 43.1 / 23.5 °C | 30.4 °C | TMYx DDY, openstudio-standards repo (EPW cross-check) |
| Cairo | Cairo Intl 623660 | 2017 | 7.9 °C | 38.2 / 21.2 °C | 25.2 °C | TMYx DDY (2009 IWEC EPW cross-check) |
| Alexandria | Alexandria Intl 623180 | 2009 | 6.9 °C | 33.0 / 22.2 °C | 25.2 °C | ETMY EPW header |
| Algiers | Dar El Beida 603900 | 2009 | 1.9 °C | 35.2 / 22.2 °C | 25.5 °C | IWEC EPW header |

These come from EnergyPlus weather files (TMYx from Climate.OneBuilding.Org, IWEC/ETMY from
energyplus.net) whose `DESIGN CONDITIONS` header / DDY comments explicitly declare
"2017 ASHRAE Handbook — Fundamentals, Chapter 14" or "Climate Design Data 2009 ASHRAE
Handbook" as the data source. Values are parsed programmatically from the files, not retyped.

**22 cities have `null` design values** (Jeddah, Dammam, Abu Dhabi, Sharjah, Doha, Kuwait,
Muscat, Manama, Amman, Aqaba, Baghdad, Basra, Beirut, Damascus, Casablanca, Marrakech,
Tunis, Tripoli, Khartoum, Sana'a, Jerusalem/Ramallah, Erbil). No GitHub-hosted DDY/EPW/STAT
for those WMO stations exists in the code-search index or in the seven weather-file mirrors
that were cloned and listed. Each null record includes the exact ashrae-meteo.info station URL
to open once network access is available (`candidate_source_not_opened`).

Caveats: Riyadh values are for Riyadh AB (old airport), not King Khalid Intl (404370, metadata
only). Alexandria/Algiers are the 2009 edition (2017/2021 not reachable). The Jerusalem IWEC and
MSI files contain no ASHRAE design conditions (`DESIGN CONDITIONS,0`); their weather-file-derived
statistics were deliberately not used.

## Part B — `engineering-references.json` (items 1–10)

| # | Item | Status |
|---|---|---|
| 1 | ASHRAE roughness classes 0.03 / 0.09 / 0.15 / 0.9 / 3.0 mm | Verified (medium): values + example materials from an open-source duct kit reproducing the ASHRAE categories; 0.09 mm galvanized corroborated by two calculators. Full ASHRAE material list not opened. |
| 2 | Altshul-Tsal | Verified (high): `f' = 0.11(ε/Dh + 68/Re)^0.25`, `f = f'` if ≥ 0.018 else `0.85 f' + 0.0028`; fluids library (Tsal 1989 ref) + Revit MEP project citing ASHRAE Ch. 21 Eq. 32 + two more. |
| 3 | Huebscher | Verified (high): `De = 1.30 (ab)^0.625 / (a+b)^0.25` (ASHRAE Ch. 21 Eq. 31), three sources. |
| 4 | SMACNA leakage class | Formula verified (high) incl. California Mechanical Code §603.9.2 (`Lmax = CL·P^0.65`, CL = 6) and US DoD UFGS 23 05 93 max classes (round 3 / rect 4 at ≥ 4 in.; 4/8 at 2–3 in.; 8/16 at 1 in.) and UFGS 23 30 00 (Seal Class A). The classic seal-class→CL table (6/12/24/48 rect, 3/6/12/30 round) is **unverified**. |
| 5 | Galvanized gauge table | Verified (high): 26→0.0217 in (0.551 mm) … 16→0.0635 in (1.613 mm), two independent tables. |
| 6 | SMACNA pressure classes & 2 in. gauge summary | Classes ½–10 in. w.g. verified; gauge bands (≤12 in. 26 ga, 13–30 24 ga, 31–54 22 ga, 55–84 20 ga, 85–96 18 ga) are contractor/software summaries (medium); official SMACNA table not opened. |
| 7 | Recommended velocities | Medium: main 700–1200 fpm (3.6–6.1 m/s), branch 600–900 fpm (3.0–4.6 m/s), residential 600–900 fpm; commercial main < 8 m/s, branch < 5 m/s — all secondary tool sources. |
| 8 | Air at 20 °C | High: CoolProp 8.0.0 computed (1.2046 kg/m³, 1.8206e-5 Pa·s, 1.5114e-5 m²/s, 1006 J/kg·K) + three published tables (1.204 / 1.825e-5 / 1.516e-5 / 1005–1007). |
| 9 | Insulation | Medium/high: Armacell AF/ArmaFlex EPD λ 0.033 W/mK @ 0 °C; Stiferite PIR duct panel 22 mm, λ 0.021 W/mK, 80 µm foil; ASHRAE 2005 HOF glass fibre 0.036 W/mK; 32 kg/m³ glasswool duct wrap 0.032 W/mK @ 20 °C (25–100 mm). **KoolDuct not verified** (null). |
| 10 | Machine speeds | Medium: SBKJ (manufacturer site source) — Pittsburgh lock former 10–14 m/min, plasma table 7–8 m/min (0.4–4 mm), coil line 18 m/min / 800–2,500 m²/day, spiral tubeformer 35 m/min strip feed (~2,400 m per 8-h shift), duct zipper 15 m/min, TDF former speed not published. Lockformer/Mestek/Iowa Precision/Spiro figures **unverified** (search snippets only). |

## How to improve when network access is available
1. Open the `candidate_source_not_opened` URL in each null climate record (ashrae-meteo.info)
   or download the TMYx `.ddy` from climate.onebuilding.org for the listed WMO number.
2. Replace secondary sources for items 1, 4, 6, 7 with ASHRAE Fundamentals Ch. 21 (Table 1,
   Eqs. 31–32) and SMACNA HVAC-DCS Tables 2-x / Air Duct Leakage Test Manual Table 4-1.
3. Open Kingspan KoolDuct and Armacell datasheets for panel thicknesses, and Mestek/Lockformer
   spec sheets for US machine speeds.
