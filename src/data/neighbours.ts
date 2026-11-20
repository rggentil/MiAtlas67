import type { BorderPair } from '../domain/relations.ts';

/**
 * Land borders between the 195 countries, one pair per border (codes sorted: "AD-ES"). Used for the
 * "tricky" wrong options of level 3 (LVL-06). Curated by hand and reviewed by the product owner (#37).
 *
 * Rules:
 * - A territory counts when it is part of the country inside the EU (D15): France–Brazil and France–Suriname
 *   (French Guiana), Spain–Morocco (Ceuta and Melilla). Dependent territories outside the EU do not:
 *   United Kingdom–Spain (Gibraltar), Denmark–Canada (Greenland), United Kingdom–Cyprus (sovereign base areas).
 * - De facto lines: China–Pakistan counts, India–Afghanistan does not (both through Kashmir).
 * - Only the 195 countries: Kosovo, Western Sahara and other extended entities are not in this list,
 *   so Albania–Serbia and Morocco–Mauritania are not neighbours here. Their borders come with the extended set
 *   (level 4, D15).
 */
// prettier-ignore
export const landBorders: readonly string[] = [
  // Europe (82)
  'AD-ES', 'AD-FR', 'AL-GR', 'AL-ME', 'AL-MK', 'AT-CH', 'AT-CZ', 'AT-DE', 'AT-HU', 'AT-IT',
  'AT-LI', 'AT-SI', 'AT-SK', 'BA-HR', 'BA-ME', 'BA-RS', 'BE-DE', 'BE-FR', 'BE-LU', 'BE-NL',
  'BG-GR', 'BG-MK', 'BG-RO', 'BG-RS', 'BY-LT', 'BY-LV', 'BY-PL', 'BY-RU', 'BY-UA', 'CH-DE',
  'CH-FR', 'CH-IT', 'CH-LI', 'CZ-DE', 'CZ-PL', 'CZ-SK', 'DE-DK', 'DE-FR', 'DE-LU', 'DE-NL',
  'DE-PL', 'EE-LV', 'EE-RU', 'ES-FR', 'ES-PT', 'FI-NO', 'FI-RU', 'FI-SE', 'FR-IT', 'FR-LU',
  'FR-MC', 'GB-IE', 'GR-MK', 'HR-HU', 'HR-ME', 'HR-RS', 'HR-SI', 'HU-RO', 'HU-RS', 'HU-SI',
  'HU-SK', 'HU-UA', 'IT-SI', 'IT-SM', 'IT-VA', 'LT-LV', 'LT-PL', 'LT-RU', 'LV-RU', 'MD-RO',
  'MD-UA', 'ME-RS', 'MK-RS', 'NO-RU', 'NO-SE', 'PL-RU', 'PL-SK', 'PL-UA', 'RO-RS', 'RO-UA',
  'RU-UA', 'SK-UA',
  // Africa (105)
  'AO-CD', 'AO-CG', 'AO-NA', 'AO-ZM', 'BF-BJ', 'BF-CI', 'BF-GH', 'BF-ML', 'BF-NE', 'BF-TG',
  'BI-CD', 'BI-RW', 'BI-TZ', 'BJ-NE', 'BJ-NG', 'BJ-TG', 'BW-NA', 'BW-ZA', 'BW-ZM', 'BW-ZW',
  'CD-CF', 'CD-CG', 'CD-RW', 'CD-SS', 'CD-TZ', 'CD-UG', 'CD-ZM', 'CF-CG', 'CF-CM', 'CF-SD',
  'CF-SS', 'CF-TD', 'CG-CM', 'CG-GA', 'CI-GH', 'CI-GN', 'CI-LR', 'CI-ML', 'CM-GA', 'CM-GQ',
  'CM-NG', 'CM-TD', 'DJ-ER', 'DJ-ET', 'DJ-SO', 'DZ-LY', 'DZ-MA', 'DZ-ML', 'DZ-MR', 'DZ-NE',
  'DZ-TN', 'EG-LY', 'EG-SD', 'ER-ET', 'ER-SD', 'ET-KE', 'ET-SD', 'ET-SO', 'ET-SS', 'GA-GQ',
  'GH-TG', 'GM-SN', 'GN-GW', 'GN-LR', 'GN-ML', 'GN-SL', 'GN-SN', 'GW-SN', 'KE-SO', 'KE-SS',
  'KE-TZ', 'KE-UG', 'LR-SL', 'LS-ZA', 'LY-NE', 'LY-SD', 'LY-TD', 'LY-TN', 'ML-MR', 'ML-NE',
  'ML-SN', 'MR-SN', 'MW-MZ', 'MW-TZ', 'MW-ZM', 'MZ-SZ', 'MZ-TZ', 'MZ-ZA', 'MZ-ZM', 'MZ-ZW',
  'NA-ZA', 'NA-ZM', 'NE-NG', 'NE-TD', 'NG-TD', 'RW-TZ', 'RW-UG', 'SD-SS', 'SD-TD', 'SS-UG',
  'SZ-ZA', 'TZ-UG', 'TZ-ZM', 'ZA-ZW', 'ZM-ZW',
  // Americas (36)
  'AR-BO', 'AR-BR', 'AR-CL', 'AR-PY', 'AR-UY', 'BO-BR', 'BO-CL', 'BO-PE', 'BO-PY', 'BR-CO',
  'BR-GY', 'BR-PE', 'BR-PY', 'BR-SR', 'BR-UY', 'BR-VE', 'BZ-GT', 'BZ-MX', 'CA-US', 'CL-PE',
  'CO-EC', 'CO-PA', 'CO-PE', 'CO-VE', 'CR-NI', 'CR-PA', 'DO-HT', 'EC-PE', 'GT-HN', 'GT-MX',
  'GT-SV', 'GY-SR', 'GY-VE', 'HN-NI', 'HN-SV', 'MX-US',
  // Asia (76)
  'AE-OM', 'AE-SA', 'AF-CN', 'AF-IR', 'AF-PK', 'AF-TJ', 'AF-TM', 'AF-UZ', 'AM-AZ', 'AM-GE',
  'AM-IR', 'AM-TR', 'AZ-GE', 'AZ-IR', 'AZ-TR', 'BD-IN', 'BD-MM', 'BN-MY', 'BT-CN', 'BT-IN',
  'CN-IN', 'CN-KG', 'CN-KP', 'CN-KZ', 'CN-LA', 'CN-MM', 'CN-MN', 'CN-NP', 'CN-PK', 'CN-TJ',
  'CN-VN', 'GE-TR', 'ID-MY', 'ID-TL', 'IL-JO', 'IL-LB', 'IL-PS', 'IL-SY', 'IN-MM', 'IN-NP',
  'IN-PK', 'IQ-IR', 'IQ-JO', 'IQ-KW', 'IQ-SA', 'IQ-SY', 'IQ-TR', 'IR-PK', 'IR-TM', 'IR-TR',
  'JO-PS', 'JO-SA', 'JO-SY', 'KG-KZ', 'KG-TJ', 'KG-UZ', 'KH-LA', 'KH-TH', 'KH-VN', 'KP-KR',
  'KW-SA', 'KZ-TM', 'KZ-UZ', 'LA-MM', 'LA-TH', 'LA-VN', 'LB-SY', 'MM-TH', 'MY-TH', 'OM-SA',
  'OM-YE', 'QA-SA', 'SA-YE', 'SY-TR', 'TJ-UZ', 'TM-UZ',
  // Across regions (14)
  'AZ-RU', 'BG-TR', 'BR-FR', 'CN-RU', 'EG-IL', 'EG-PS', 'ES-MA', 'FR-SR', 'GE-RU', 'GR-TR',
  'ID-PG', 'KP-RU', 'KZ-RU', 'MN-RU',
];

/**
 * Land borders of the extended entities, used only at level 4 Experto together with `landBorders` (LVL-06).
 * Reviewed by the product owner in #93 (D15, D30), with the same rules:
 * - De facto lines: Abjasia and Osetia del Sur with Georgia and Rusia, Transnistria with Moldavia and Ucrania,
 *   the Green Line of Chipre, Somalilandia with Puntland.
 * - An entity borders the rest of its country (Abjasia–Georgia, Hong Kong–China, Puntland–Somalia), but
 *   Inglaterra borders Escocia and Gales, not the Reino Unido, which is made of them.
 * - A territory inside the EU counts as its country: Sint Maarten borders Francia (the French Saint-Martin).
 * - Islands and island territories have none (Taiwán, Islas Feroe, Groenlandia, the Caribbean, Oceanía).
 */
// prettier-ignore
export const extendedLandBorders: readonly BorderPair[] = [
  ['XK', 'AL'], ['XK', 'RS'], ['XK', 'ME'], ['XK', 'MK'],
  ['EH', 'MA'], ['EH', 'MR'], ['EH', 'DZ'],
  ['GE-AB', 'GE'], ['GE-AB', 'RU'],
  ['XO', 'GE'], ['XO', 'RU'],
  ['MD-SN', 'MD'], ['MD-SN', 'UA'],
  ['XC', 'CY'],
  ['XS', 'SO'], ['XS', 'ET'], ['XS', 'DJ'], ['XS', 'XP'],
  ['XP', 'SO'], ['XP', 'ET'],
  ['XJ', 'SO'], ['XJ', 'KE'], ['XJ', 'ET'],
  ['MD-GA', 'MD'], ['MD-GA', 'UA'],
  ['IQ-KR', 'IQ'], ['IQ-KR', 'IR'], ['IQ-KR', 'TR'], ['IQ-KR', 'SY'],
  ['GB-ENG', 'GB-SCT'], ['GB-ENG', 'GB-WLS'],
  ['GI', 'ES'],
  ['HK', 'CN'],
  ['MO', 'CN'],
  ['SX', 'FR'],
];
