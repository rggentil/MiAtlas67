/**
 * Groups of flags that are easy to confuse, for the "tricky" wrong options of level 3 Flags games (LVL-06).
 * A country can be in more than one group. Reviewed by the product owner in #37 (D15).
 */
export const similarFlagGroups: readonly (readonly string[])[] = [
  ['TD', 'RO', 'AD', 'MD'], // blue-yellow-red vertical
  ['ID', 'MC', 'PL', 'MT', 'SG'], // red and white
  ['NL', 'LU', 'PY', 'RU', 'SK', 'SI', 'RS'], // white, blue and red horizontal (the Slavic ones and more)
  ['IE', 'CI', 'IT', 'MX'], // green, white and orange or red, vertical
  ['ML', 'GN', 'SN', 'CM', 'BO', 'GH', 'LT'], // green, yellow and red
  ['AU', 'NZ', 'FJ', 'TV'], // the Union Jack in the corner
  ['NO', 'IS', 'DK', 'FI', 'SE'], // Nordic cross
  ['CO', 'EC', 'VE'], // yellow-blue-red horizontal
  ['HN', 'NI', 'SV', 'AR', 'UY'], // light blue and white
  ['EG', 'SY', 'IQ', 'YE', 'JO', 'PS', 'SD', 'KW', 'AE'], // pan-Arab red, white, black and green
  ['QA', 'BH'], // white and red with a serrated edge
  ['HT', 'LI'], // blue over red
  ['AT', 'LV'], // red-white-red horizontal
  ['HU', 'BG', 'TJ'], // red, white and green horizontal
  ['BE', 'DE'], // black, yellow and red
  ['TH', 'CR'], // five red, white and blue stripes
  ['JP', 'BD', 'PW'], // a single disc
  ['NE', 'IN'], // orange-white-green with a disc
  ['MY', 'US', 'LR'], // red and white stripes with a blue canton
  ['TR', 'TN'], // red with a white crescent and star
  ['CZ', 'PH'], // blue triangle at the hoist
  ['PE', 'CA'], // red-white-red vertical
  ['KE', 'SS'], // black, red and green with white edges
  ['CN', 'VN'], // red with yellow stars
  ['AL', 'ME'], // red with a double-headed eagle
];

/**
 * Groups of similar flags with the extended entities, used only at level 4 Experto together with
 * `similarFlagGroups` (LVL-06). Reviewed by the product owner in #93 (D30). A group that extends one of level 3
 * lists it whole.
 */
export const extendedFlagGroups: readonly (readonly string[])[] = [
  // the Union Jack in the corner, with the British territories, Islas Cook and Niue
  ['AU', 'NZ', 'FJ', 'TV', 'KY', 'VG', 'TC', 'AI', 'MS', 'FK', 'SH-HL', 'BM', 'CK', 'NU'],
  ['NO', 'IS', 'DK', 'FI', 'SE', 'FO', 'AX'], // Nordic cross
  ['EG', 'SY', 'IQ', 'YE', 'JO', 'PS', 'SD', 'KW', 'AE', 'EH'], // pan-Arab
  ['AT', 'LV', 'PF'], // red-white-red horizontal
  // every flag with a crescent and a star (the product owner's choice in D30)
  ['TR', 'TN', 'XC', 'DZ', 'AZ', 'MR', 'PK', 'MY', 'SG', 'TM', 'UZ', 'LY', 'KM', 'EH'],
  ['CZ', 'PH', 'SX'], // blue triangle at the hoist
  ['HU', 'BG', 'TJ', 'IQ-KR'], // red, white and green horizontal
  ['NL', 'LU', 'PY', 'RU', 'SK', 'SI', 'RS', 'MD-GA'], // white, blue and red horizontal
  ['CU', 'PR'], // the same design with the colours swapped
  ['AW', 'CW'], // blue with yellow stripes and stars
  ['TZ', 'XZ'], // Zanzíbar carries the flag of Tanzania
  ['GB-ENG', 'GG', 'GE', 'JE'], // a red cross on white
  ['SO', 'XP'], // Puntland carries the flag of Somalia
  ['XK', 'BA'], // blue with stars and a map
];
