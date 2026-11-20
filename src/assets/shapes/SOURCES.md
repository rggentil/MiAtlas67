# Silhouette sources

The SVG silhouettes in this folder are built by `npm run data:shapes` (`scripts/build-shapes.ts`, rules in
`scripts/shapes.ts`). Do not edit them by hand: change the rules or the overrides and rebuild.

| Files | Source | Licence |
|---|---|---|
| Countries (ISO 3166-1 alpha-2 codes) and the extended entities that world-atlas has (Groenlandia, Puerto Rico, Hong Kong…; Kosovo, Chipre del Norte, Somalilandia and Santa Elena by name) | [Natural Earth](https://www.naturalearthdata.com/) 1:10m admin-0 countries, via [world-atlas](https://github.com/topojson/world-atlas) 2.0.2 (`countries-10m.json`) | Public domain (Natural Earth); world-atlas packaging ISC |
| `va.svg` (Vatican City) | [OpenStreetMap](https://www.openstreetmap.org/relation/36989), relation 36989, main polygon, in `scripts/data/va-osm.json` | © OpenStreetMap contributors, [ODbL](https://opendatacommons.org/licenses/odbl/) |
| `gb-eng.svg`, `gb-sct.svg`, `gb-wls.svg`, `ge-ab.svg`, `xo.svg`, `md-sn.svg`, `md-ga.svg`, `bq-bo.svg`, `bq-se.svg`, `bq-sa.svg`, `iq-kr.svg`, `xz.svg`, `pg-nsb.svg`, `tk.svg` | Natural Earth 1:10m admin-1 states and provinces, and admin-0 disputed areas (South Ossetia only), in `scripts/data/extended-ne.json` (see below) | Public domain (Natural Earth) |
| `ma.svg` (Morocco), `eh.svg` (Western Sahara) | world-atlas Morocco and "W. Sahara", split at 27° 40′ N (D31), in `scripts/data/western-sahara.json` (see below) | Public domain (Natural Earth); world-atlas packaging ISC |

Each silhouette is drawn in a 200 × 200 box with an equal-area projection centred on the country, keeps only
the main territory (SHAPE-02, with the exceptions of D25 and D31) and is simplified so it stays small. Small islands
get an outline, so each one shows at least as a dot (SHAPE-01); Spain draws the Canary Islands in a framed box.

## `scripts/data/extended-ne.json`

The 14 extended entities that world-atlas does not have, from Natural Earth
[v5.1.2](https://github.com/nvkelso/natural-earth-vector/tree/v5.1.2) (commit `f1890d9f152c896d250a77557a5751a93d494776`),
GeoJSON layers:

| Layer | SHA-256 of the file |
|---|---|
| [`ne_10m_admin_1_states_provinces.geojson`](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_1_states_provinces.geojson) | `22d0e3ad85eb3e27f17cabf8ba2d50e554fbc27a87796ff891d958185da62fb5` |
| [`ne_10m_admin_0_disputed_areas.geojson`](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_disputed_areas.geojson) | `9cafef8b7dfb6b164dc58f218f981f4ace9f716f6c03795d4c62d1ac9f3d50f5` |

| Code | Entity | Natural Earth units | Units |
|---|---|---|---|
| GB-ENG | Inglaterra | admin-1, `adm0_a3 = GBR` and `geonunit = England` | 152 |
| GB-SCT | Escocia | admin-1, `adm0_a3 = GBR` and `geonunit = Scotland` | 32 |
| GB-WLS | Gales | admin-1, `adm0_a3 = GBR` and `geonunit = Wales` | 22 |
| GE-AB | Abjasia | admin-1, `adm1_code = GEO-3015` | 1 |
| XO | Osetia del Sur | disputed areas, `BRK_A3 = B37` (admin-1 has no unit for it) | 1 |
| MD-SN | Transnistria | admin-1, `adm1_code` in `MDA-1652`, `MDA-1645`, `MDA-1628`, `MDA-1637`, `MDA-1638`, `MDA-1650`: the left bank of the Dniester and Bender (D31) | 6 |
| MD-GA | Gagauzia | admin-1, `adm0_a3 = MDA` and `iso_3166_2 = MD-GA` | 1 |
| BQ-BO | Bonaire | admin-1, `adm1_code = NLD-5149` | 1 |
| BQ-SE | San Eustaquio | admin-1, `adm1_code = NLD-5148` | 1 |
| BQ-SA | Saba | admin-1, `adm1_code = NLD-5147` | 1 |
| IQ-KR | Kurdistán iraquí | admin-1, `adm0_a3 = IRQ` and `geonunit = Iraqi Kurdistan` (Halabja lies inside As-Sulaymaniyah) | 3 |
| XZ | Zanzíbar | admin-1, `adm0_a3 = TZA` and `geonunit = Zanzibar` | 5 |
| PG-NSB | Bougainville | admin-1, `adm1_code = PNG-1245` | 1 |
| TK | Tokelau | admin-1, `adm1_code = NZL-5472`: only 2 of the 3 atolls, Nukunonu is missing (D31) | 1 |

The units of each code were dissolved with [mapshaper](https://github.com/mbloch/mapshaper) 0.8.6:
`mapshaper -i <units>.json -dissolve -o <CODE>.json format=geojson gj2008 precision=0.0001` (coordinates rounded to
about 11 m, no simplification; `gj2008` keeps the clockwise winding that d3-geo expects). Each feature of the file has
`properties: { code, layer, parts }`, `parts` naming the Natural Earth units merged.

## `scripts/data/western-sahara.json`

Natural Earth draws the de facto line: its "W. Sahara" is only the strip east of the berm, and its Morocco takes in
the rest of the territory. The product owner chose the Western Sahara whole and Morocco without it (D25, D31), split
at 27° 40′ N (27.6667°), the line between the two on maps. From world-atlas Morocco (`504`) and "W. Sahara" (`732`)
as GeoJSON, with mapshaper 0.8.6:

1. Morocco: `mapshaper -i ma.json -clip bbox=-20,27.6667,0,37 -o ma-north.json format=geojson gj2008 precision=0.0001`.
2. Western Sahara: the south of Morocco (`-clip bbox=-18,20,-8.6,27.6667`) and "W. Sahara", merged with `-dissolve`,
   `precision=0.0001`.

The file holds the outer ring of each one, `{ "MA": [...], "EH": [...] }`, drawn through the `outline` override.
