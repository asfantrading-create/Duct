# HVAC Duct Factory Directory (Arab countries) - Research Summary

Verified on 2026-09-21. Output: `research/factories.json` (88 entries, valid JSON, schema-checked).

## How verification was done (important caveat)

Direct page fetching (WebFetch / curl) was blocked by the sandbox egress proxy for every external domain, so
every company was verified through **domain-restricted web searches** whose results return the indexed text of the
company's own pages (title, URL and page content). Each `sources` URL is a page that the search engine returned
for that company and whose indexed content confirmed duct manufacturing. No page was rendered directly; figures are
quoted as they appeared in the indexed page text. The web-search budget (200 calls) was fully used.

Coordinates are approximations of the stated city or industrial area (see `location_note`). For 11 entries the
source pages do not name the factory city; those entries have `city_en: null` and use the **country centroid**,
which is stated explicitly in `location_note`.

## Entries per country

| Country | Code | Entries | high | medium |
|---|---|---|---|---|
| Saudi Arabia | SA | 24 | 14 | 10 |
| United Arab Emirates | AE | 23 | 16 | 7 |
| Qatar | QA | 9 | 5 | 4 |
| Kuwait | KW | 3 | 2 | 1 |
| Oman | OM | 2 | 2 | 0 |
| Bahrain | BH | 4 | 4 | 0 |
| Egypt | EG | 7 | 4 | 3 |
| Iraq | IQ | 2 | 0 | 2 |
| Lebanon | LB | 1 | 0 | 1 |
| Libya | LY | 3 | 0 | 3 |
| Morocco | MA | 3 | 1 | 2 |
| Algeria | DZ | 3 | 3 | 0 |
| Tunisia | TN | 4 | 4 | 0 |
| Jordan | JO | 0 | - | - |
| Sudan, Palestine, Syria, Yemen | SD/PS/SY/YE | 0 | - | - |
| **Total** | | **88** | **55** | **33** |

## Confidence meaning

- **high** (55): the company's own website (or the owning group's official site) explicitly describes a duct
  manufacturing plant/factory in that country, with a named city or industrial area.
- **medium** (33): one or more of: the manufacturer is primarily an HVAC contractor with an in-house duct workshop;
  the only source is a third-party directory (Egypt Yellow Pages, AEC Online, TradeKey); the factory city is not
  published; or product detail on the source page is thin.

### High-confidence entries
SA: saudi-duct-factory-riyadh, technical-duct-factory-riyadh, daymat-factory-huraymila, sharqawi-air-distribution-system-factory-jeddah,
safid-riyadh, alfaneyah-duct-factory-jeddah, saudi-akhwan-ducting-factory-alafco-riyadh, sara-international-duct-factory-jubail,
masarat-united-factory-riyadh, jamed-duct-division-jeddah, samman-hvac-duct-work-factory-jeddah, al-ahram-duct-factory-riyadh,
sdm-saudi-factory-for-ducts-riyadh, almalaz-alarabi-duct-factory-dammam.
AE: leminar-air-conditioning-industries-dubai, leminar-flexible-duct-factory-dubai, duct-fab-llc-abm-group-uae, alpha-ducts-dubai,
air-master-equipments-emirates-ajman, gulf-duct-industries-dubai, al-ajwaa-ac-systems-sharjah, pearl-industries-sharjah,
master-duct-air-condition-industries-uaq, delta-duct-air-conditioning-dubai, kad-air-conditioning-dubai,
emirates-air-conditioning-industry-abu-dhabi, gmamco-dubai, benair-duct-division-sharjah, duct-masters-abu-dhabi, hvac-industries-abu-dhabi.
QA: cat-duct-doha, dvac-duct-ventilation-air-conditioning-doha, arabian-duct-factory-doha, qad-duct-doha, leminar-air-conditioning-industries-qatar-doha.
KW: fawaz-trading-engineering-kuwait, al-mulla-industries-shuaiba-kuwait. OM: djs-oman-muscat, mectron-al-hajiry-muscat.
BH: almoayyed-air-ducts-factory-asker, grille-tech-bahrain-ras-zuwayed, airtech-wll-hidd, awal-products-apco-manama.
EG: duct-master-6th-october, duct-technology-cairo, egy-air-abu-rawash, al-ahram-duct-factory-cairo.
MA: cogeve-casablanca. DZ: nergyal-oran, socomaf-industries-algiers, sodinco-algiers.
TN: climr-industrie-rades, agt-aerau-gaine-thermique-sfax, stivi-industries-bizerte, clima-gaine-monastir.

### Medium-confidence entries
SA: faris-ducts-riyadh, omamah-air-conditioning-systems-ksa*, al-jazira-solutions-ac-duct-factory-ksa*, nefal-ac-riyadh,
mangeer-contracting-al-qunfudhah, hilal-projects-al-khobar, duct-star-riyadh, al-awad-air-conditioning-ksa*, mistyref-riyadh, fal-air-conditioning-riyadh.
AE: mbm-gulf-electromechanical-dubai, coolpro-duct-solutions-uae*, electro-rak-duct-fabrication-rak, pal-middle-east-pir-dubai (directories only),
rapid-cool-group-sharjah, al-qemah-ac-systems-uae*, insultherm-middle-east-uae*.
QA: taj-duct-fab-doha, al-maftol-doha, lunar-ac-duct-qatar*, refrigeration-world-doha. KW: cyberia-hvac-kuwait.
EG: meca-engineering-industries-abu-rawash (Yellow Pages), duct-house-6th-october (Yellow Pages), cdf-central-ac-air-ducts-factory-qalyub (Yellow Pages).
IQ: nasamat-alattar-erbil, actref-industrial-cooling-iraq*. LB: adf-duct-factory-mec-lebanon*.
LY: al-safa-international-tripoli, libya-hvac-benghazi, gauge-libya*. MA: ac-maroc-tangier, icat-international-casablanca.
(* = factory city not published; country centroid used.)

Note: `duct-fab-llc-abm-group-uae` is high confidence on existence/products but the emirate is not stated on the page (country centroid used).

## Companies looked for but NOT verified (excluded from the JSON)

Named in the brief:
- **Zamil Air Conditioners (KSA)** - site lists AC units, chillers, AHUs and ducted split units; no ductwork product line found.
- **Alfanar (KSA)** - manufacturing pages cover electrical/energy/water; no HVAC ductwork found.
- **Petra Engineering Industries (Jordan)** - AHUs, chillers, fan coils, rooftops; ducts are not a product.
- **Bahwan Engineering (Oman)** - distributes air-distribution products (grilles, dampers, VAV); no duct factory evidence.
- **Awal Gulf Manufacturing (Bahrain)** - makes AC units/AHUs/FCUs, not ducts (the related **Awal Products/APCO** duct factory IS included).
- **Faisal Jassim (UAE)** - ductwork is produced through its Alpha Ducts division, so it is captured under `alpha-ducts-dubai` rather than as a separate entry.
- **Al Shirawi Group (UAE)** - captured through its Leminar Industries / Leminar flexible-duct plants.
- **"Ductofab Systems"** - not found under that name; the verified UAE company is **Duct Fab LLC** (ABM Group), included.
- **"Gulf Duct Factory", "Emirates Duct", "Dubai Duct Factory", "National Duct Factory", "Doha Duct Factory", "Qatar Duct Factory"** - no companies verified under these exact names (Gulf Duct Industries, Emirates Air Conditioning Industry, Saudi Duct Factory and the Doha factories listed above are the verified equivalents).
- **Airtec/Airmaster KSA plant** - Airmaster states 8 GCC facilities but no KSA factory address was found; only the Ajman HQ is listed.
- **Kingspan KoolDuct fabricators** - no fabricator list found; Al Ajwaa (UAE) states it uses Kingspan panels.
- **Fawaz UAE** - its site says manufacturing is in Kuwait, so only the Kuwait plant is listed.

Found in searches but excluded for insufficient evidence:
- **A.I.G Factory (مصنع A.I.G لتصنيع مجاري الهواء)** - Facebook page only; the country/city could not be confirmed (it surfaced in Jordan, Egypt, Iraq and other Arabic searches alike).
- **Nakhoul Corporation (Lebanon)** - has an "HVAC duct" product page and Dbayeh/Gharzouz locations, but manufacturing was not explicit in the indexed text.
- **Alajam (Syria)** - HVAC contractor with duct projects; no factory evidence.
- **Ramallah Company for the Manufacture of Air Conditioning Supplies (Palestine)** - appears only in a trade database; product type unclear.
- **Al-Samhouri / Friends Factory (Jordan)** - manufactures diffusers, grilles, dampers, filters (not ducts).
- **Jordan House Factory (Jordan)** - manufactures central-AC air outlets, not ducts.
- **Muscat Matrix Solutions / Airmaster Oman** - grilles, diffusers, dampers, louvers only.
- **Dar Al Khaleej Steel Factory (Sharjah)** - general steel fabricator offering "ducting works" as a service.
- **Egy Cool, Plus Air, Duct Line, Khader Trust (Egypt)** - contractor/listing only, or no factory location/product evidence.
- **Diktat AC (Kuwait), Takyif wa Salama, Barad Al Saif, Nasmat, Rkkb (KSA)** - installer/service pages, factory not verified.
- **Silver Shield (Abu Dhabi), AIRPRO Industries (UAE), SJS Enersol (UAE), Laffan (Qatar), Al Mulla Industries UAE plant, Leminar Oman** - not verified as factories in-country (Leminar Oman is a sales office supplied from Dubai).
- **Sudan, Palestine, Syria, Yemen** - no verifiable duct factory found in English or Arabic searches.

## Field conventions used
- `products` only reflect product types named on the source pages; generic "duct" without a type is recorded as `other`.
- `standards` only when explicitly stated; unspecified "ISO-certified", AMCA, AHRI, BS 476, NFPA, UL listings, DCD/ADCD and EN 1505/1506 are recorded as `other`.
- `founded` is the year stated on the source; for divisions, the division/group year is used only when the page says so (see `notes`).
- `capacity_note` and `employees_note` are quoted as published.
