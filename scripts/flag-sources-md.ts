// The text of src/assets/flags/SOURCES.md: every flag file with its source and licence (DATA-05, D39).
import { countries } from '../src/data/countries.ts';
import { extendedEntities } from '../src/data/extended.ts';
import { FLAG_RATIOS } from '../src/data/flagRatios.ts';
import { LICENCE_NAMES, type Licence } from '../src/data/sources.ts';
import { flagFileName } from '../src/domain/entity.ts';
import { FLAG_FILES } from './flag-files.ts';

/** The page of a file on Wikimedia Commons, as Commons writes it. */
export function commonsAddress(file: string): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURI(file.replaceAll(' ', '_'))}`;
}

/** A licence as SOURCES.md names it. */
export function licenceLabel(licence: Licence): string {
  return licence === 'public-domain' ? 'Public domain' : (LICENCE_NAMES[licence] ?? licence);
}

export function flagSourcesMarkdown(): string {
  const rows = [...countries, ...extendedEntities]
    .map((entity) => ({ entity, file: flagFileName(entity) }))
    .sort((a, b) => a.file.localeCompare(b.file))
    .map(({ entity, file }) => {
      const source = FLAG_FILES[entity.code];
      if (source === undefined) throw new Error(`No flag file recorded for ${entity.code}`);
      const by = source.author === undefined ? '' : `, by ${source.author}`;
      return `| \`${file}\` | ${entity.name.en} | ${FLAG_RATIOS[entity.code] ?? ''} | [File:${source.file}](${commonsAddress(source.file)})${by} | ${licenceLabel(source.licence ?? 'public-domain')} |`;
    });
  return `# Flag sources

The SVG flags in this folder are downloaded from [Wikimedia Commons](https://commons.wikimedia.org/) and optimised
with svgo by \`npm run data:flags\` (\`scripts/sync-flags.ts\`). Do not edit them by hand: change
\`scripts/flag-files.ts\` (the file) or \`src/data/flagRatios.ts\` (the ratio, height:width) and run the script again.

Each flag is the file Wikipedia shows for the flag in de facto use (decision D13), in its real ratio (decision
D39). Optimising changes only how the drawing is written, not what it shows, so each file keeps its licence. The
files whose licence asks for a credit are also named on "Acerca de": Oman, Sint Eustatius and Saba.

| File | Entity | Ratio | Source | Licence |
|---|---|---|---|---|
${rows.join('\n')}
`;
}
