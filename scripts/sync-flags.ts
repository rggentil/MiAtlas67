// Copies the flag of every country in the dataset from flag-icons (MIT) into src/assets/flags,
// so the flags are bundled with the app (DATA-05). Run with: npm run data:flags
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { countries } from '../src/data/countries.ts';
import { flagFileName } from '../src/domain/entity.ts';

const root = join(import.meta.dirname, '..');
const source = join(root, 'node_modules', 'flag-icons', 'flags', '4x3');
const target = join(root, 'src', 'assets', 'flags');

mkdirSync(target, { recursive: true });

const missing: string[] = [];
for (const entity of countries) {
  const file = flagFileName(entity);
  const from = join(source, file);
  if (existsSync(from)) {
    copyFileSync(from, join(target, file));
  } else {
    missing.push(entity.code);
  }
}

if (missing.length > 0) {
  console.error(`Not found in flag-icons: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`Copied ${String(countries.length)} flags to src/assets/flags`);
