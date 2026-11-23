// Copies the flag of every country and extended entity from flag-icons (MIT) into src/assets/flags,
// so the flags are bundled with the app (DATA-05). Run with: npm run data:flags
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { countries } from '../src/data/countries.ts';
import { extendedEntities } from '../src/data/extended.ts';
import { COMMONS_FLAGS } from '../src/data/sources.ts';
import { flagFileName } from '../src/domain/entity.ts';

/**
 * Flags kept from Wikimedia Commons instead of flag-icons, because flag-icons does not show the flag in use
 * today (AF) or has none (the extended entities). They are credited on "Acerca de" from the same list
 * (src/data/sources.ts), and recorded with their source and licence in src/assets/flags/SOURCES.md.
 */
const OVERRIDES = new Set(COMMONS_FLAGS.map((flag) => flag.code));

const root = join(import.meta.dirname, '..');
const source = join(root, 'node_modules', 'flag-icons', 'flags', '4x3');
const target = join(root, 'src', 'assets', 'flags');

mkdirSync(target, { recursive: true });

const missing: string[] = [];
let copied = 0;
for (const entity of [...countries, ...extendedEntities]) {
  const file = flagFileName(entity);
  if (OVERRIDES.has(entity.code)) {
    if (!existsSync(join(target, file))) missing.push(`${entity.code} (override)`);
    continue;
  }
  const from = join(source, file);
  if (existsSync(from)) {
    copyFileSync(from, join(target, file));
    copied += 1;
  } else {
    missing.push(entity.code);
  }
}

if (missing.length > 0) {
  console.error(`Flags not found: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(
  `Copied ${String(copied)} flags from flag-icons; kept ${String(OVERRIDES.size)} override(s)`,
);
