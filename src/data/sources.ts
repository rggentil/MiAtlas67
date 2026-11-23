// The sources of the bundled flags, silhouettes and avatars, with their licences, as the "Acerca de" screen
// shows them (DATA-05, D33). The long record of each file stays in the SOURCES.md of its assets folder; an
// integrity test keeps the two in step.

/**
 * A licence, by the name its licensor gives it. Public domain is not a licence name, so the screen says it in
 * the player's language.
 */
export type Licence =
  'public-domain' | 'CC0' | 'MIT' | 'CC BY-SA 4.0' | 'CC BY-SA 3.0' | 'ODbL' | 'OGL-om 1.0';

/** The text of the licences that ask for it to be named with an address (CC BY-SA, ODbL, OGL-om). */
export const LICENCE_ADDRESSES: Readonly<Partial<Record<Licence, string>>> = {
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
  ODbL: 'https://opendatacommons.org/licenses/odbl/',
  'OGL-om 1.0': 'https://www.oman.om/en/home-footer-level/faq/open-government-licence-oman',
};

/** The full name of a licence where its short name is not what its licensor calls it. */
export const LICENCE_NAMES: Readonly<Partial<Record<Licence, string>>> = {
  'OGL-om 1.0': 'Open Government Licence – Oman 1.0',
};

/** A source of many files. */
export interface Source {
  readonly name: string;
  readonly licence: Licence;
  /** The credit line the licensor asks for, kept in its original wording in both languages. */
  readonly credit?: string;
  readonly address: string;
}

/**
 * Every flag (D39, `scripts/sync-flags.ts`): public domain or CC0, but for the {@link NAMED_FLAGS}, whose licence
 * asks for them to be named.
 */
export const WIKIMEDIA_COMMONS: Source = {
  name: 'Wikimedia Commons',
  licence: 'public-domain',
  address: 'https://commons.wikimedia.org/',
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

/** A flag file whose licence asks for it to be named on "Acerca de" (DATA-05, D39). */
export interface NamedFlag {
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
 * The three flags named on "Acerca de" (D39): the licence of every other flag file asks for no credit. The full
 * list, file by file, is `src/assets/flags/SOURCES.md`; an integrity test keeps the two in step.
 */
export const NAMED_FLAGS: readonly NamedFlag[] = [
  { code: 'OM', licence: 'OGL-om 1.0', address: `${COMMONS}Flag_of_Oman.svg` },
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
];
