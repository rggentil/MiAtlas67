// The sources of the bundled flags, silhouettes and avatars, with their licences, as the "Acerca de" screen
// shows them (DATA-05, D33). The long record of each file stays in the SOURCES.md of its assets folder; an
// integrity test keeps the two in step.

/**
 * A licence, by the name its licensor gives it. Public domain is not a licence name, so the screen says it in
 * the player's language.
 */
export type Licence = 'public-domain' | 'MIT' | 'CC BY-SA 4.0' | 'CC BY-SA 3.0' | 'ODbL';

/** The text of the licences that ask for it to be named with an address (CC BY-SA, ODbL). */
export const LICENCE_ADDRESSES: Readonly<Partial<Record<Licence, string>>> = {
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
  ODbL: 'https://opendatacommons.org/licenses/odbl/',
};

/** A source of many files. */
export interface Source {
  readonly name: string;
  readonly licence: Licence;
  /** The credit line the licensor asks for, kept in its original wording in both languages. */
  readonly credit?: string;
  readonly address: string;
}

/** Every flag that is not in {@link COMMONS_FLAGS} (`scripts/sync-flags.ts`). */
export const FLAG_ICONS: Source = {
  name: 'flag-icons',
  licence: 'MIT',
  credit: '© 2013 Panayiotis Lipiridis',
  address: 'https://github.com/lipis/flag-icons',
};

/** Every silhouette but the ones of {@link OPENSTREETMAP_SHAPES}. */
export const NATURAL_EARTH: Source = {
  name: 'Natural Earth',
  licence: 'public-domain',
  address: 'https://www.naturalearthdata.com/',
};

export const OPENSTREETMAP: Source = {
  name: 'OpenStreetMap',
  licence: 'ODbL',
  credit: '© OpenStreetMap contributors',
  address: 'https://www.openstreetmap.org/copyright',
};

/** The entities whose silhouette is drawn from OpenStreetMap: Ciudad del Vaticano (D25). */
export const OPENSTREETMAP_SHAPES: readonly string[] = ['VA'];

/** The 11 avatars (D21). */
export const OPENMOJI: Source = {
  name: 'OpenMoji',
  licence: 'CC BY-SA 4.0',
  credit: 'All emojis designed by OpenMoji – the open-source emoji and icon project',
  address: 'https://openmoji.org/',
};

/** A flag file taken from Wikimedia Commons instead of flag-icons (DATA-05, D13). */
export interface CommonsFlag {
  /** The entity whose flag it is. */
  readonly code: string;
  readonly licence: Licence;
  /** The author, where the licence asks for one. */
  readonly author?: string;
  /** The page of the file on Wikimedia Commons. */
  readonly address: string;
}

const COMMONS = 'https://commons.wikimedia.org/wiki/File:';

/**
 * The flags where flag-icons does not show the flag in use today (Afganistán, D13) or has none (the extended
 * entities). `scripts/sync-flags.ts` leaves these files alone.
 */
export const COMMONS_FLAGS: readonly CommonsFlag[] = [
  { code: 'AF', licence: 'public-domain', address: `${COMMONS}Flag_of_the_Taliban.svg` },
  {
    code: 'GE-AB',
    licence: 'public-domain',
    address: `${COMMONS}Flag_of_the_Republic_of_Abkhazia.svg`,
  },
  { code: 'XO', licence: 'public-domain', address: `${COMMONS}Flag_of_South_Ossetia.svg` },
  {
    code: 'MD-SN',
    licence: 'public-domain',
    address: `${COMMONS}Flag_of_Transnistria_(state).svg`,
  },
  {
    code: 'XC',
    licence: 'public-domain',
    address: `${COMMONS}Flag_of_the_Turkish_Republic_of_Northern_Cyprus.svg`,
  },
  { code: 'XS', licence: 'public-domain', address: `${COMMONS}Flag_of_Somaliland.svg` },
  { code: 'MD-GA', licence: 'public-domain', address: `${COMMONS}Flag_of_Gagauzia.svg` },
  { code: 'BQ-BO', licence: 'public-domain', address: `${COMMONS}Flag_of_Bonaire.svg` },
  {
    code: 'BQ-SE',
    licence: 'CC BY-SA 4.0',
    author: 'Andrwsc',
    address: `${COMMONS}Flag_of_Sint_Eustatius.svg`,
  },
  {
    code: 'BQ-SA',
    licence: 'CC BY-SA 3.0',
    author: 'Mysid',
    address: `${COMMONS}Flag_of_Saba.svg`,
  },
  { code: 'IQ-KR', licence: 'public-domain', address: `${COMMONS}Flag_of_Kurdistan.svg` },
  { code: 'XP', licence: 'public-domain', address: `${COMMONS}Flag_of_Puntland.svg` },
  { code: 'XJ', licence: 'public-domain', address: `${COMMONS}Flag_of_Jubaland.svg` },
  { code: 'XZ', licence: 'public-domain', address: `${COMMONS}Flag_of_Zanzibar.svg` },
  { code: 'PG-NSB', licence: 'public-domain', address: `${COMMONS}Flag_of_Bougainville.svg` },
];
