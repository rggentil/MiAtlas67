# Flag sources

The SVG flags in this folder are copied by `npm run data:flags` (`scripts/sync-flags.ts`). Do not edit them
by hand. The script skips the overrides listed below, so they survive a re-sync.

| Files | Source | Licence |
|---|---|---|
| Countries (ISO 3166-1 alpha-2 codes) | [flag-icons](https://github.com/lipis/flag-icons) 7.6.0, `flags/4x3` | MIT, © 2013 Panayiotis Lipiridis |

## Overrides

Flags where flag-icons does not show the flag in de facto use today (spec DATA-05). Each file is the Commons
artwork unchanged, placed on a 4:3 canvas (white margin above and below) to match the other flags.

| File | Why | Source | Licence |
|---|---|---|---|
| `af.svg` | Afghanistan: flag of the Islamic Emirate, in use since 2021 (decision D13) | [File:Flag of the Taliban.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Taliban.svg), Wikimedia Commons | Public domain |

Flags of the extended set that are missing in flag-icons will also come from Wikimedia Commons and be listed
here with their source and licence.
