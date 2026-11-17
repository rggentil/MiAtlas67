/**
 * Groups of flags that are easy to confuse, for the "tricky" wrong options of level 3 Flags games (LVL-06).
 * A country can be in more than one group. Curated by hand and reviewed by the product owner (#37).
 */
export const similarFlagGroups: readonly (readonly string[])[] = [
  ['TD', 'RO', 'AD', 'MD'], // blue-yellow-red vertical
  ['ID', 'MC', 'PL'], // red and white
  ['NL', 'LU', 'PY'], // red-white-blue horizontal
  ['RU', 'SK', 'SI', 'RS'], // white-blue-red horizontal
  ['IE', 'CI', 'IT'], // green, white and orange or red, vertical
  ['IT', 'MX'], // green-white-red vertical
  ['ML', 'GN', 'SN', 'CM'], // green-yellow-red vertical
  ['BO', 'GH', 'LT'], // red, yellow and green horizontal
  ['AU', 'NZ'], // dark blue with the Union Jack and stars
  ['FJ', 'TV'], // light blue with the Union Jack
  ['NO', 'IS', 'DK', 'FI', 'SE'], // Nordic cross
  ['CO', 'EC', 'VE'], // yellow-blue-red horizontal
  ['HN', 'NI', 'SV'], // blue-white-blue horizontal
  ['AR', 'UY'], // light blue and white with the Sun of May
  ['EG', 'SY', 'IQ', 'YE'], // red-white-black horizontal
  ['JO', 'PS', 'SD'], // black-white-green with a red triangle
  ['KW', 'AE'], // red, green, white and black blocks
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
  ['SO', 'FM'], // light blue with white stars
  ['PE', 'CA'], // red-white-red vertical
  ['KE', 'SS'], // black, red and green with white edges
  ['CN', 'VN'], // red with yellow stars
  ['AL', 'ME'], // red with a double-headed eagle
];
