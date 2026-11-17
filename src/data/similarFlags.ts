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
