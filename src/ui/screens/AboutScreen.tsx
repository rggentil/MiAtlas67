import { useId, useState, type ReactNode } from 'react';
import { countries } from '../../data/countries.ts';
import { extendedEntities } from '../../data/extended.ts';
import {
  COMMONS_FLAGS,
  FLAG_ICONS,
  LICENCE_ADDRESSES,
  NATURAL_EARTH,
  OPENMOJI,
  OPENSTREETMAP,
  OPENSTREETMAP_SHAPES,
  type Licence,
  type Source,
} from '../../data/sources.ts';
import type { Entity } from '../../domain/entity.ts';
import { useI18n } from '../../i18n/context.ts';
import type { MessageKey } from '../../i18n/dictionaries.ts';
import { IconButton } from '../components/IconButton.tsx';
import { BackIcon } from '../components/icons.tsx';
import { ScreenTitle } from '../components/ScreenTitle.tsx';
import { useOnBack } from '../navigation/useOnBack.ts';

interface AboutScreenProps {
  /** "Volver" and the phone's back button: to the screen it was opened from (NAV-01, D33). */
  onBack: () => void;
}

const ENTITIES: readonly Entity[] = [...countries, ...extendedEntities];

function entityOf(code: string): Entity {
  const entity = ENTITIES.find((candidate) => candidate.code === code);
  if (!entity) throw new Error(`No entity ${code}`);
  return entity;
}

/**
 * "Acerca de" (DATA-05, DATA-08, D33): where the flags, silhouettes and animals come from and under which
 * licences, and the neutrality statement. Every address is written out as text: nothing is fetched (NFR-04).
 */
export function AboutScreen({ onBack }: AboutScreenProps) {
  const { t, language } = useI18n();

  useOnBack(onBack);

  const licenceName = (licence: Licence) =>
    licence === 'public-domain' ? t('about.publicDomain') : licence;

  /** The lines of a source: its licence and credit, then its address and the licence's. */
  const sourceLines = (source: Source) => ({
    lines: [licenceName(source.licence), ...(source.credit ? [source.credit] : [])],
    addresses: [source.address, ...licenceAddress(source.licence)],
  });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pt-5 pb-6">
      <header className="flex items-center gap-3">
        <IconButton label={t('nav.back')} icon={<BackIcon />} onClick={onBack} />
      </header>
      <main className="flex flex-col gap-5">
        <ScreenTitle className="text-4xl">{t('about.title')}</ScreenTitle>

        <AboutSection title="about.flags">
          <ul className="flex flex-col gap-3">
            <Credit title={FLAG_ICONS.name} {...sourceLines(FLAG_ICONS)} />
          </ul>
          <CommonsFlags licenceName={licenceName} />
        </AboutSection>

        <AboutSection title="about.shapes">
          <ul className="flex flex-col gap-3">
            <Credit title={NATURAL_EARTH.name} {...sourceLines(NATURAL_EARTH)} />
            {OPENSTREETMAP_SHAPES.map((code) => {
              const { lines, addresses } = sourceLines(OPENSTREETMAP);
              return (
                <Credit
                  key={code}
                  title={entityOf(code).name[language]}
                  lines={[OPENSTREETMAP.name, ...lines]}
                  addresses={addresses}
                />
              );
            })}
          </ul>
        </AboutSection>

        <AboutSection title="about.animals">
          <ul className="flex flex-col gap-3">
            <Credit title={OPENMOJI.name} {...sourceLines(OPENMOJI)} />
          </ul>
        </AboutSection>

        <AboutSection title="about.territories">
          <p className="font-bold">{t('about.neutrality')}</p>
          <p className="font-bold">{t('about.names')}</p>
        </AboutSection>
      </main>
    </div>
  );
}

function licenceAddress(licence: Licence): string[] {
  const address = LICENCE_ADDRESSES[licence];
  return address ? [address] : [];
}

/** A section with its heading (h2), as a named region. */
function AboutSection({ title, children }: { title: MessageKey; children: ReactNode }) {
  const { t } = useI18n();
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-block border-3 border-ink bg-paper p-4 shadow-block"
    >
      <h2 id={headingId} className="font-display text-2xl leading-tight">
        {t(title)}
      </h2>
      {children}
    </section>
  );
}

interface CreditProps {
  title: string;
  lines: readonly string[];
  /** Written out as text, never a link: long addresses break anywhere so nothing scrolls sideways. */
  addresses: readonly string[];
}

/** One credit: what it is, then its licence, credit or author, then its addresses. */
function Credit({ title, lines, addresses }: CreditProps) {
  return (
    <li className="flex flex-col gap-0.5">
      <p className="text-lg font-black">{title}</p>
      {lines.map((line) => (
        <p key={line} className="font-bold">
          {line}
        </p>
      ))}
      {addresses.map((address) => (
        <p key={address} className="text-sm font-bold [overflow-wrap:anywhere] text-ink-muted">
          {address}
        </p>
      ))}
    </li>
  );
}

/**
 * The flags that come from Wikimedia Commons, one by one (DATA-05, D13): a list that opens and closes, so the
 * screen stays short. The button says whether it is open (NFR-05).
 */
function CommonsFlags({ licenceName }: { licenceName: (licence: Licence) => string }) {
  const { t, language } = useI18n();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const collator = new Intl.Collator(language);
  const flags = COMMONS_FLAGS.map((flag) => ({
    ...flag,
    name: entityOf(flag.code).name[language],
  })).sort((a, b) => collator.compare(a.name, b.name));

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setOpen((was) => !was);
        }}
        className={[
          'flex min-h-12 w-full items-center justify-between gap-2 px-3 py-2 text-left font-black',
          'rounded-xl border-3 border-ink bg-sky shadow-block-sm',
          'motion-safe:transition-[translate,box-shadow] motion-safe:duration-75',
          'active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
          'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent',
        ].join(' ')}
      >
        <span>{t('about.commonsCount', { n: flags.length })}</span>
        <span aria-hidden="true" className="flex-none text-xl leading-none">
          {open ? '▴' : '▾'}
        </span>
      </button>
      <ul
        id={listId}
        aria-label={t('about.commons')}
        hidden={!open}
        className="flex flex-col gap-3"
      >
        {flags.map((flag) => (
          <Credit
            key={flag.code}
            title={flag.name}
            lines={[
              licenceName(flag.licence),
              ...(flag.author ? [t('about.author', { name: flag.author })] : []),
            ]}
            addresses={[flag.address, ...licenceAddress(flag.licence)]}
          />
        ))}
      </ul>
    </div>
  );
}
