# Extra pass: duct manufacturers in Jordan, Sudan, Palestine, Syria, Yemen

Verified on 2026-09-21. Output: `research/factories-extra.json` (append-ready, **1 entry**, valid JSON, same schema as
`factories.json`, no id collision).

## Constraints that shaped this pass (read first)

- **WebSearch was unavailable**: the session's search budget was already exhausted (200/200 calls) before this pass
  began, so every WebSearch call returned "budget used" and nothing else.
- **WebFetch and curl were blocked** by the egress proxy for every relevant host (Google/Bing/DuckDuckGo/Brave/Yandex and
  a dozen other engines, archive.org, Wikipedia, LinkedIn/Facebook, Kompass, Europages, TradeKey, Alibaba, OpenCorporates,
  the Amman/Jordan/Zarqa chambers of industry, JIEC, Jordan Yellow Pages, OSM/Nominatim/Overpass, r.jina.ai, etc.).
  Only `api.github.com` (through the GitHub MCP tools), `raw.githubusercontent.com`, npm and PyPI were reachable.
- Therefore the **only indexed corpus available was GitHub code search** (~70 queries, Arabic and English), followed by
  reading the matched files in full via `raw.githubusercontent.com`. GitHub code search is a substring search, so
  Arabic `دكت` also matches `دكتور` (doctor) and `دكتات` matches `دكتاتور` (dictator); duct-specific compounds
  (`تصنيع الدكت`, `دكتات التكييف`, `مجاري الهواء`, `قنوات الهواء`) were used to cut that noise.
- Company websites named or found could not be opened, so nothing below is verified against a live site. Every
  `sources` URL is a GitHub page pinned to a commit SHA whose text was downloaded and read in full.

## Searches run (GitHub code search unless stated)

Jordan: `"مصنع دكت"`, `"دكت" "الأردن"`, `"مجاري الهواء" "الأردن"`, `"مجاري هواء" "الأردن"`, `"دكتات" "الأردن"`,
`"الدكت" "الأردن"`, `"تصنيع الدكت" "الأردن"`, `"دكت التكييف" "الأردن"`, `"قنوات الهواء" "الأردن"`, `"دكتات" "عمان"`,
`"الدكت" "عمان"`, `"مصنع الدكت" "عمان"`, `"مجاري هواء" "عمان"`, `"مجاري الهواء" "مصنع" "عمان"`, `"تصنيع مجاري الهواء" "عمان"`,
`"مجاري الهواء" "سحاب"`, `"سحاب" "دكت"`, `"Sahab Industrial" HVAC`, `duct Sahab Jordan`, `ductwork Amman Jordan`,
`"air duct" Amman Jordan`, `"ducts" "Amman" "Jordan"`, `"ducting" Amman Jordan`, `"duct factory" Jordan`,
`"duct fabrication" Jordan Amman`, `"اتقان للمعدات الصناعية"`; repository searches `jordan companies directory`,
`jordan yellow pages scraper`, `amman business dataset`, `jordan industrial factories dataset`, `openstreetmap jordan poi extract`.
Sudan: `duct Khartoum Sudan HVAC`, `"ducts" "Khartoum"`, `"دكت" "الخرطوم"`, `"مجاري الهواء" "السودان"`, `"تصنيع مجاري الهواء" "الخرطوم"`;
repository search `sudan companies dataset`.
Palestine: `duct Ramallah Palestine HVAC`, `"دكت" "فلسطين"`, `"دكتات" "فلسطين"`, `"دكتات" "غزة"`, `"مجاري الهواء" "فلسطين"`;
repository search `palestine companies directory dataset`.
Syria: `duct Damascus Syria HVAC`, `"ducts" "Damascus" HVAC`, `"دكت" "دمشق"`, `"دكتات" "دمشق"`, `"دكتات" "سوريا"`, `"دكتات" "حلب"`,
`"مجاري الهواء" "سوريا"`, `"حورانية" "دكتات"`, `houranieh`, `repo:Eng-Ahmed-Ibrahim/CMS-Dashboard duct|FAAT`.
Yemen: `duct Sanaa Yemen HVAC`, `"دكت" "صنعاء"`, `"مجاري الهواء" "اليمن"`, `"تصنيع مجاري الهواء" "صنعاء"`.
Cross-country: `"دكتات التكييف"`, `"دكتات الهواء"`, `"مصنع الدكت" "عمان"`, `"الشرق الاوسط للهندسه والتكييف"`,
`"الشرق الأوسط للهندسة والتكييف"`, `"Middle East Engineering" "Air Conditioning" duct`, `"صناعات التكييف والتبريد" "مجاري الهواء"`;
repository searches `arab middle east manufacturers directory dataset`, `hvac companies dataset middle east`.
Reachability probes (curl): ~90 hosts, all blocked except GitHub, npm, PyPI.

## Found and included (1)

### Houranieh Co. for Iron Trading (شركة حورانية لتجارة الحديد) - Damascus, Syria - confidence: medium

Evidence: six independent GitHub-hosted pages (SEO scrape sites that reproduce the company's own website copy, cited with
commit SHAs) carry consistent first-person text: founded 1949, "active member of the Syrian market", trades stainless,
oiled, painted and galvanized sheet; "in 2008 we introduced machinery to manufacture central-AC ducts, the only one in
[Syria]"; "duct production line ... we have the equipment to manufacture the best round and rectangular air ducts
automatically"; address "Syria, Damascus, Zoqaq al-Jin, Abdul Rahman bin Qasim Avenue"; a retail outlet in the New
Industrial Zone of Damascus; agencies for Haxin (2000) and Angang ductile-iron pipe (2010); email fragment
"houraniehcompany@gmail". Products recorded as rectangular and round ducts (round mapped to `spiral_round_duct`, the
convention used in the main file); duct material is not stated, so `materials` is left empty; `website` is null because
the domain could not be confirmed.

Why only medium: the text is the company's own but reaches us through third-party copies, undated, and the live site
could not be opened; whether the duct line still operates after 2011 is unknown.

Compliance flag to verify separately: EU sanctions data (regulation 2018/1542 as amended 14.11.2022, mirrored in the
opensanctions and legalize-eu repositories) lists "MHD Nazier Houranieh & Sons Co", a Damascus metals-industry company,
and its co-owners. It is **not established** that this is the same legal entity as Houranieh Co. for Iron Trading; it is
noted here only because the names and sector coincide.

## Excluded (found but not qualifying)

- **FAAT Engineering / FAAT MEP / "FAAT HVAC Division"** (Damascus, Rahwanji Building, Fawzi Al-Ghazi Street, faateng.com;
  site source in `Eng-Ahmed-Ibrahim/CMS-Dashboard`): HVAC/fire/lifts distributor, MEP contractor and maintenance firm; its
  HVAC pages are Carrier, AHI Carrier, Fujitsu, LNX and Rosenberg product lines. No duct fabrication anywhere in the source.
- **Etqan for Industrial Equipment (شركة اتقان للمعدات الصناعية)** (Amman, Abu Alanda, Abdul Karim Al-Hadid St.): hydraulic/
  pneumatic spare-parts and tools supplier that lists "تمديدات دكتات هواء" (air-duct *installation*) among services; not a manufacturer.
- **"The Middle East Engineering & Air Conditioning" (الشرق الأوسط للهندسة والتكييف)**: fragments state it "owns more than 20
  machines for producing air ducts" from galvanized sheet, but no fragment names a city or country. Worth a live search.
- **"Air Conditioning & Refrigeration Industries Co." (شركة صناعات التكييف والتبريد)**: fragments list a duct-fabrication
  line of 18 t/day (540 t/month) beside chiller and FCU lines, but no country is given. Worth a live search.
- **Volkano House (فولكن)**: has a "Duct Manufacturing" page, but its phone numbers are +966 (Saudi Arabia) - out of scope.
- **Techno Metal (تكنو ميتال), Obour City, Cairo** and an Egyptian **"Aerodyne" duct factory**: Egypt, out of scope; noted for a
  future Egypt pass (neither is in `factories.json`).
- **A CV fragment** mentioning installation of air-distribution ducts at the Alebtex spinning mill, Aleppo: an installer's CV, not a manufacturer.
- Jordanian names supplied in the brief (Petra Engineering, MECCO, CCC, Al-Manaseer, Kawar, Nuqul, Sigma, Salfiti, Alhomsi,
  Zaid Al Kilani, "Jordan Duct Factory", "Amman Duct", "Middle East Duct", "Arabian Duct", "United Duct", "Jordan Sheet Metal
  Works"): none appears in any GitHub-indexed text together with duct manufacturing; they could not be checked against the
  web in this session.
- **Jordan, Sudan, Palestine, Yemen: zero verifiable duct manufacturers** in the reachable corpus.

## Recommended follow-up when web access is restored

1. Raise `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION` (or start a fresh session) and run the Jordan queries from the brief
   plus: `site:aci.org.jo تكييف` (Amman Chamber of Industry member directory), `site:jci.org.jo دكت`, `"سحاب" "دكت"`,
   `"القسطل" "دكت"`, `"ماركا" "مجاري هواء"`, `"الموقر" "تكييف" مصنع`, `"duct" site:jo`, `"ductwork" "Amman" factory`.
2. Verify Houranieh directly (`houranieh` + Damascus; try `houranieh.com`/`.sy`), confirm the duct line is current, and
   resolve the sanctions-name coincidence.
3. Locate the two anonymous duct-line companies above by exact Arabic name.
