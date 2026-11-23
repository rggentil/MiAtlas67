import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { countries } from '../src/data/countries.ts';
import { extendedEntities } from '../src/data/extended.ts';
import { COMMONS_FLAGS, type Licence } from '../src/data/sources.ts';
import { flagFileName } from '../src/domain/entity.ts';

const root = join(import.meta.dirname, '..');
const flags = join(root, 'src', 'assets', 'flags');
const flagIcons = join(root, 'node_modules', 'flag-icons', 'flags', '4x3');
const entities = [...countries, ...extendedEntities];

/** The codes of the game's flag files that are not the flag-icons file of the same name. */
function flagsNotFromFlagIcons(): string[] {
  return entities
    .filter((entity) => {
      const file = flagFileName(entity);
      const original = join(flagIcons, file);
      return (
        !existsSync(original) || !readFileSync(join(flags, file)).equals(readFileSync(original))
      );
    })
    .map((entity) => entity.code);
}

interface RecordedOverride {
  code: string;
  address: string;
  licence: string;
  author: string | undefined;
}

/** The rows of the "Overrides" table of `src/assets/flags/SOURCES.md`. */
function recordedOverrides(): RecordedOverride[] {
  const text = readFileSync(join(flags, 'SOURCES.md'), 'utf8');
  const rows = text.split('\n').filter((line) => /^\| `[a-z-]+\.svg` \|/.test(line));
  return rows.map((row) => {
    const [file = '', , source = '', licence = ''] = row.split(' | ').map((cell) => cell.trim());
    // Lazy up to ".svg)", so a name with brackets such as "Transnistria_(state)" stays whole.
    const address = /\]\((https:\/\/commons\.wikimedia\.org\/\S+?\.svg)\)/.exec(source)?.[1] ?? '';
    const author = /, by ([^(,]+?)(?: \(|$)/.exec(source)?.[1];
    return {
      code: file.replace(/^\| /, '').replaceAll('`', '').replace('.svg', '').toUpperCase(),
      address,
      licence: licence.replace(/ \|$/, ''),
      author,
    };
  });
}

const LICENCE_NAMES: Record<Licence, string> = {
  'public-domain': 'Public domain',
  MIT: 'MIT',
  'CC BY-SA 4.0': 'CC BY-SA 4.0',
  'CC BY-SA 3.0': 'CC BY-SA 3.0',
  ODbL: 'ODbL',
};

describe('flag credits (DATA-05)', () => {
  it('DATA-05 every flag file of the game that is not from flag-icons is credited on "Acerca de"', () => {
    const credited = COMMONS_FLAGS.map((flag) => flag.code);

    expect(flagsNotFromFlagIcons().sort()).toEqual([...credited].sort());
  });

  it('DATA-05 every credited flag is the flag of an entity of the game, credited once', () => {
    const codes = COMMONS_FLAGS.map((flag) => flag.code);

    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) {
      expect(
        entities.some((entity) => entity.code === code),
        code,
      ).toBe(true);
    }
  });

  it('DATA-05 the credits of "Acerca de" match the overrides recorded in src/assets/flags/SOURCES.md', () => {
    const recorded = recordedOverrides();

    expect(recorded).toHaveLength(15);
    expect(recorded).toEqual(
      COMMONS_FLAGS.map((flag) => ({
        code: flag.code,
        address: flag.address,
        licence: LICENCE_NAMES[flag.licence],
        author: flag.author,
      })),
    );
  });
});
