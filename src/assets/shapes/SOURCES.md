# Silhouette sources

The SVG silhouettes in this folder are built by `npm run data:shapes` (`scripts/build-shapes.ts`, rules in
`scripts/shapes.ts`). Do not edit them by hand: change the rules or the overrides and rebuild.

| Files | Source | Licence |
|---|---|---|
| Countries (ISO 3166-1 alpha-2 codes) | [Natural Earth](https://www.naturalearthdata.com/) 1:10m admin-0 countries, via [world-atlas](https://github.com/topojson/world-atlas) 2.0.2 (`countries-10m.json`) | Public domain (Natural Earth); world-atlas packaging ISC |

Each silhouette is drawn in a 200 × 200 box with an equal-area projection centred on the country, keeps only
the main territory (SHAPE-02) and is simplified so it stays small. Countries without a recognizable
silhouette are not shape-eligible and have no file (SHAPE-03).
