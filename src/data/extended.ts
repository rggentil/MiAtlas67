import type { Articles, ExtendedEntity, Localized, Region } from '../domain/entity.ts';

/**
 * The extended set of level 4 Experto (spec §13.2, Appendix A): 52 territories, states with limited recognition
 * and autonomous regions, reviewed by the product owner in #93 (D30).
 *
 * - Codes: ISO 3166-1 alpha-2 where one exists (Taiwán TW, Groenlandia GL), otherwise ISO 3166-2 (Escocia
 *   GB-SCT, Bonaire BQ-BO) or a custom code starting with X (Somalilandia XS) (DATA-01).
 * - Each entity belongs to the region where it is located (DATA-04): Groenlandia → América, Abjasia → Asia like
 *   Georgia, Puntland → África.
 * - Capitals (D30): Malvinas «Puerto Argentino/Stanley» in Spanish and «Stanley» in English; Montserrat its de
 *   facto capital, Brades. Gibraltar, Hong Kong, Macao and Tokelau have none (CAP-02); Chipre del Norte has
 *   Nicosia del Norte, apart from Chipre's Nicosia (D32).
 *   Inglaterra (Londres), San Eustaquio (Oranjestad), Isla Norfolk (Kingston) and Islas Caimán (George Town,
 *   like Georgetown in Guyana) share a quiz capital with a country, so a Capitals question never offers both
 *   (CAP-03).
 * - Articles in sentences (DATA-09, D30): «la» Isla de Man, Isla Norfolk and Polinesia Francesa, «el» Sahara
 *   Occidental and Kurdistán iraquí; the plural names go without one, as in D18 («de Bermudas»).
 * - Every entity is asked only at level 4, where tiers do not choose the entities (LVL-07): they all have tier 3.
 * - Every entity has a silhouette, reviewed in D31, except Puntland and Jubalandia (SHAPE-04).
 * - Azores and Madeira are left out (D30, Appendix A.4).
 */

type Pair = readonly [es: string, en: string];

interface Extra {
  article?: Articles;
  otherCapitals?: readonly Pair[];
  /** `false` keeps the entity out of Shapes games (SHAPE-04). */
  shapeEligible?: false;
}

const localized = ([es, en]: Pair): Localized => ({ es, en });

function x(
  code: string,
  category: ExtendedEntity['category'],
  name: Pair,
  capital: Pair | null,
  region: Region,
  status: Pair,
  extra: Extra = {},
): ExtendedEntity {
  return {
    code,
    name: localized(name),
    ...(extra.article ? { article: extra.article } : {}),
    capital: capital ? localized(capital) : null,
    otherCapitals: (extra.otherCapitals ?? []).map(localized),
    region,
    category,
    tier: 3,
    shapeEligible: extra.shapeEligible ?? true,
    status: localized(status),
  };
}

// Statuses (DATA-08), shared by several entities.
const LIMITED: Pair = ['Estado con reconocimiento limitado', 'State with limited recognition'];
const DE_FACTO: Pair = [
  'Estado de facto con reconocimiento limitado',
  'De facto state with limited recognition',
];
const DANISH: Pair = ['Territorio autónomo de Dinamarca', 'Self-governing territory of Denmark'];
const BRITISH_OVERSEAS: Pair = ['Territorio británico de ultramar', 'British Overseas Territory'];
const CROWN: Pair = ['Dependencia de la Corona británica', 'British Crown Dependency'];
const US_TERRITORY: Pair = [
  'Territorio no incorporado de los Estados Unidos',
  'Unincorporated territory of the United States',
];
const DUTCH_COUNTRY: Pair = [
  'País constituyente del Reino de los Países Bajos',
  'Constituent country of the Kingdom of the Netherlands',
];
const DUTCH_MUNICIPALITY: Pair = [
  'Municipio especial de los Países Bajos',
  'Special municipality of the Netherlands',
];
const FRENCH_OVERSEAS: Pair = [
  'Colectividad de ultramar de Francia',
  'Overseas collectivity of France',
];
const CHINESE_SAR: Pair = [
  'Región administrativa especial de China',
  'Special administrative region of China',
];
const NZ_ASSOCIATED: Pair = [
  'Estado en libre asociación con Nueva Zelanda',
  'State in free association with New Zealand',
];
const UK_COUNTRY: Pair = [
  'País constituyente del Reino Unido',
  'Constituent country of the United Kingdom',
];
const SOMALI_STATE: Pair = ['Estado federado de Somalia', 'Federal member state of Somalia'];
const THE: Articles = { en: 'the' };

export const extendedEntities: readonly ExtendedEntity[] = [
  // ── A.1 States with limited recognition (8) ─────────────────────────────
  x('XK', 'limited-recognition', ['Kosovo', 'Kosovo'], ['Pristina', 'Pristina'], 'europe', LIMITED),
  x('TW', 'limited-recognition', ['Taiwán', 'Taiwan'], ['Taipéi', 'Taipei'], 'asia', LIMITED),
  x(
    'EH',
    'limited-recognition',
    ['Sahara Occidental', 'Western Sahara'],
    ['El Aaiún', 'Laayoune'],
    'africa',
    ['Territorio en disputa', 'Disputed territory'],
    { article: { es: 'el' } },
  ),
  x(
    'GE-AB',
    'limited-recognition',
    ['Abjasia', 'Abkhazia'],
    ['Sujumi', 'Sukhumi'],
    'asia',
    DE_FACTO,
  ),
  x(
    'XO',
    'limited-recognition',
    ['Osetia del Sur', 'South Ossetia'],
    ['Tsjinvali', 'Tskhinvali'],
    'asia',
    DE_FACTO,
  ),
  x(
    'MD-SN',
    'limited-recognition',
    ['Transnistria', 'Transnistria'],
    ['Tiráspol', 'Tiraspol'],
    'europe',
    ['Estado de facto sin reconocimiento', 'Unrecognized de facto state'],
  ),
  // Its capital is the northern half of the divided city of Nicosia (Lefkoşa), named apart from Chipre's (D32).
  x(
    'XC',
    'limited-recognition',
    ['Chipre del Norte', 'Northern Cyprus'],
    ['Nicosia del Norte', 'North Nicosia'],
    'europe',
    ['Estado de facto reconocido solo por Turquía', 'De facto state recognized only by Turkey'],
  ),
  x(
    'XS',
    'limited-recognition',
    ['Somalilandia', 'Somaliland'],
    ['Hargeisa', 'Hargeisa'],
    'africa',
    DE_FACTO,
  ),

  // ── A.2 Territories (31) ────────────────────────────────────────────────
  // Europa (5)
  x(
    'FO',
    'territory',
    ['Islas Feroe', 'Faroe Islands'],
    ['Tórshavn', 'Tórshavn'],
    'europe',
    DANISH,
    {
      article: THE,
    },
  ),
  x('GI', 'territory', ['Gibraltar', 'Gibraltar'], null, 'europe', BRITISH_OVERSEAS),
  x('IM', 'territory', ['Isla de Man', 'Isle of Man'], ['Douglas', 'Douglas'], 'europe', CROWN, {
    article: { es: 'la', en: 'the' },
  }),
  x('JE', 'territory', ['Jersey', 'Jersey'], ['Saint Helier', 'Saint Helier'], 'europe', CROWN),
  x(
    'GG',
    'territory',
    ['Guernsey', 'Guernsey'],
    ['Saint Peter Port', 'Saint Peter Port'],
    'europe',
    CROWN,
  ),
  // América (14)
  x('GL', 'territory', ['Groenlandia', 'Greenland'], ['Nuuk', 'Nuuk'], 'americas', DANISH),
  x(
    'PR',
    'territory',
    ['Puerto Rico', 'Puerto Rico'],
    ['San Juan', 'San Juan'],
    'americas',
    US_TERRITORY,
  ),
  x('AW', 'territory', ['Aruba', 'Aruba'], ['Oranjestad', 'Oranjestad'], 'americas', DUTCH_COUNTRY),
  x(
    'CW',
    'territory',
    ['Curazao', 'Curaçao'],
    ['Willemstad', 'Willemstad'],
    'americas',
    DUTCH_COUNTRY,
  ),
  x(
    'SX',
    'territory',
    ['Sint Maarten', 'Sint Maarten'],
    ['Philipsburg', 'Philipsburg'],
    'americas',
    DUTCH_COUNTRY,
  ),
  x(
    'BM',
    'territory',
    ['Bermudas', 'Bermuda'],
    ['Hamilton', 'Hamilton'],
    'americas',
    BRITISH_OVERSEAS,
  ),
  x(
    'KY',
    'territory',
    ['Islas Caimán', 'Cayman Islands'],
    ['George Town', 'George Town'],
    'americas',
    BRITISH_OVERSEAS,
    { article: THE },
  ),
  x(
    'VG',
    'territory',
    ['Islas Vírgenes Británicas', 'British Virgin Islands'],
    ['Road Town', 'Road Town'],
    'americas',
    BRITISH_OVERSEAS,
    { article: THE },
  ),
  x(
    'VI',
    'territory',
    ['Islas Vírgenes de los Estados Unidos', 'United States Virgin Islands'],
    ['Charlotte Amalie', 'Charlotte Amalie'],
    'americas',
    US_TERRITORY,
    { article: THE },
  ),
  x(
    'TC',
    'territory',
    ['Islas Turcas y Caicos', 'Turks and Caicos Islands'],
    ['Cockburn Town', 'Cockburn Town'],
    'americas',
    BRITISH_OVERSEAS,
    { article: THE },
  ),
  x(
    'AI',
    'territory',
    ['Anguila', 'Anguilla'],
    ['The Valley', 'The Valley'],
    'americas',
    BRITISH_OVERSEAS,
  ),
  // Plymouth, the official capital, was buried by the volcano in 1997: Brades is the de facto one (D30).
  x(
    'MS',
    'territory',
    ['Montserrat', 'Montserrat'],
    ['Brades', 'Brades'],
    'americas',
    BRITISH_OVERSEAS,
    {
      otherCapitals: [['Plymouth', 'Plymouth']],
    },
  ),
  x(
    'FK',
    'territory',
    ['Islas Malvinas', 'Falkland Islands'],
    ['Puerto Argentino/Stanley', 'Stanley'],
    'americas',
    [
      'Territorio británico de ultramar, reclamado por Argentina',
      'British Overseas Territory, claimed by Argentina',
    ],
    { article: THE },
  ),
  x(
    'PM',
    'territory',
    ['San Pedro y Miquelón', 'Saint Pierre and Miquelon'],
    ['San Pedro', 'Saint-Pierre'],
    'americas',
    FRENCH_OVERSEAS,
  ),
  // Asia (2)
  x('HK', 'territory', ['Hong Kong', 'Hong Kong'], null, 'asia', CHINESE_SAR),
  x('MO', 'territory', ['Macao', 'Macau'], null, 'asia', CHINESE_SAR),
  // África (1): the island of Saint Helena alone, without Ascension and Tristan da Cunha.
  x(
    'SH-HL',
    'territory',
    ['Santa Elena', 'Saint Helena'],
    ['Jamestown', 'Jamestown'],
    'africa',
    BRITISH_OVERSEAS,
  ),
  // Oceanía (9)
  // Two flags in official use: the Kanak one; the French one is already France's (D30).
  x('NC', 'territory', ['Nueva Caledonia', 'New Caledonia'], ['Numea', 'Nouméa'], 'oceania', [
    'Colectividad especial de Francia',
    'Special collectivity of France',
  ]),
  x(
    'PF',
    'territory',
    ['Polinesia Francesa', 'French Polynesia'],
    ['Papeete', 'Papeete'],
    'oceania',
    FRENCH_OVERSEAS,
    { article: { es: 'la' } },
  ),
  x('GU', 'territory', ['Guam', 'Guam'], ['Agaña', 'Hagåtña'], 'oceania', US_TERRITORY),
  x(
    'AS',
    'territory',
    ['Samoa Americana', 'American Samoa'],
    ['Pago Pago', 'Pago Pago'],
    'oceania',
    US_TERRITORY,
  ),
  x(
    'MP',
    'territory',
    ['Islas Marianas del Norte', 'Northern Mariana Islands'],
    ['Saipán', 'Saipan'],
    'oceania',
    ['Estado libre asociado a los Estados Unidos', 'Commonwealth of the United States'],
    { article: THE },
  ),
  x(
    'CK',
    'territory',
    ['Islas Cook', 'Cook Islands'],
    ['Avarua', 'Avarua'],
    'oceania',
    NZ_ASSOCIATED,
    {
      article: THE,
    },
  ),
  x('NU', 'territory', ['Niue', 'Niue'], ['Alofi', 'Alofi'], 'oceania', NZ_ASSOCIATED),
  // No capital: the seat of government rotates between its three atolls (CAP-02).
  x('TK', 'territory', ['Tokelau', 'Tokelau'], null, 'oceania', [
    'Territorio dependiente de Nueva Zelanda',
    'Dependent territory of New Zealand',
  ]),
  x(
    'NF',
    'territory',
    ['Isla Norfolk', 'Norfolk Island'],
    ['Kingston', 'Kingston'],
    'oceania',
    ['Territorio externo de Australia', 'External territory of Australia'],
    { article: { es: 'la' } },
  ),

  // ── A.3 Constituent countries and autonomous regions (13) ───────────────
  // Europa (5)
  x(
    'GB-ENG',
    'subnational',
    ['Inglaterra', 'England'],
    ['Londres', 'London'],
    'europe',
    UK_COUNTRY,
  ),
  x(
    'GB-SCT',
    'subnational',
    ['Escocia', 'Scotland'],
    ['Edimburgo', 'Edinburgh'],
    'europe',
    UK_COUNTRY,
  ),
  x('GB-WLS', 'subnational', ['Gales', 'Wales'], ['Cardiff', 'Cardiff'], 'europe', UK_COUNTRY),
  x('AX', 'subnational', ['Åland', 'Åland'], ['Mariehamn', 'Mariehamn'], 'europe', [
    'Región autónoma de Finlandia',
    'Autonomous region of Finland',
  ]),
  x('MD-GA', 'subnational', ['Gagauzia', 'Gagauzia'], ['Comrat', 'Comrat'], 'europe', [
    'Unidad territorial autónoma de Moldavia',
    'Autonomous territorial unit of Moldova',
  ]),
  // América (3): the Caribbean Netherlands
  x(
    'BQ-BO',
    'subnational',
    ['Bonaire', 'Bonaire'],
    ['Kralendijk', 'Kralendijk'],
    'americas',
    DUTCH_MUNICIPALITY,
  ),
  x(
    'BQ-SE',
    'subnational',
    ['San Eustaquio', 'Sint Eustatius'],
    ['Oranjestad', 'Oranjestad'],
    'americas',
    DUTCH_MUNICIPALITY,
  ),
  x(
    'BQ-SA',
    'subnational',
    ['Saba', 'Saba'],
    ['The Bottom', 'The Bottom'],
    'americas',
    DUTCH_MUNICIPALITY,
  ),
  // Asia (1)
  x(
    'IQ-KR',
    'subnational',
    ['Kurdistán iraquí', 'Kurdistan Region'],
    ['Erbil', 'Erbil'],
    'asia',
    ['Región autónoma de Irak', 'Autonomous region of Iraq'],
    { article: { es: 'el', en: 'the' } },
  ),
  // África (3). Puntland and Jubalandia have no undisputed boundary (SHAPE-04).
  x('XP', 'subnational', ['Puntland', 'Puntland'], ['Garowe', 'Garowe'], 'africa', SOMALI_STATE, {
    shapeEligible: false,
  }),
  x(
    'XJ',
    'subnational',
    ['Jubalandia', 'Jubaland'],
    ['Kismayo', 'Kismayo'],
    'africa',
    SOMALI_STATE,
    {
      shapeEligible: false,
    },
  ),
  x(
    'XZ',
    'subnational',
    ['Zanzíbar', 'Zanzibar'],
    ['Ciudad de Zanzíbar', 'Zanzibar City'],
    'africa',
    ['Región semiautónoma de Tanzania', 'Semi-autonomous region of Tanzania'],
  ),
  // Oceanía (1). Buka is the provisional capital; Arawa, the planned one.
  x(
    'PG-NSB',
    'subnational',
    ['Bougainville', 'Bougainville'],
    ['Buka', 'Buka'],
    'oceania',
    ['Región autónoma de Papúa Nueva Guinea', 'Autonomous region of Papua New Guinea'],
    { otherCapitals: [['Arawa', 'Arawa']] },
  ),
];
