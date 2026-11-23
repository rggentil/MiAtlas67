import { useId, useMemo, useState, type ReactNode } from 'react';
import { countries } from '../../data/countries.ts';
import { extendedEntities } from '../../data/extended.ts';
import { atlasOf } from '../../domain/atlas.ts';
import type { Entity, ExtendedEntity } from '../../domain/entity.ts';
import { REGION_CHOICES, type RegionChoice } from '../../domain/questions.ts';
import { useI18n } from '../../i18n/context.ts';
import { Button } from '../components/Button.tsx';
import { FlagImage } from '../components/FlagImage.tsx';
import { IconButton } from '../components/IconButton.tsx';
import { BackIcon } from '../components/icons.tsx';
import { ScreenTitle } from '../components/ScreenTitle.tsx';
import { ShapeImage } from '../components/ShapeImage.tsx';
import { useFocusOnMount } from '../components/useFocusOnMount.ts';
import { useOnBack } from '../navigation/useOnBack.ts';
import { hasShape } from '../shapes.ts';

interface AtlasScreenProps {
  /** "Volver" and Back on the regions: to the screen the Atlas was opened from (NAV-01, D34). */
  onBack: () => void;
}

/**
 * The Atlas (ATL-01, ATL-02, D34): choose a region, then browse its countries and its extended entities with
 * their flag, name, capital and silhouette. Nothing is scored or saved. "Volver" goes back one step.
 */
export function AtlasScreen({ onBack }: AtlasScreenProps) {
  const { t } = useI18n();
  const [region, setRegion] = useState<RegionChoice | null>(null);
  // The regions open with the screen, whose h1 takes the focus; after that each step takes it itself.
  const [moved, setMoved] = useState(false);

  function show(next: RegionChoice | null) {
    setMoved(true);
    setRegion(next);
  }

  function back() {
    if (region) show(null);
    else onBack();
  }
  useOnBack(back);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pt-5 pb-6">
      <header className="flex items-center gap-3">
        <IconButton label={t('nav.back')} icon={<BackIcon />} onClick={back} />
      </header>
      <main className="flex flex-col gap-5">
        <ScreenTitle className="text-4xl">{t('atlas.title')}</ScreenTitle>
        {region === null ? (
          <AtlasSection key="regions" title={t('atlas.region')} focusTitle={moved}>
            <div className="grid grid-cols-2 gap-3">
              {REGION_CHOICES.map((choice) => (
                <Button
                  key={choice}
                  variant="secondary"
                  onClick={() => {
                    show(choice);
                  }}
                >
                  {t(`region.${choice}`)}
                </Button>
              ))}
            </div>
          </AtlasSection>
        ) : (
          <RegionEntries key={region} region={region} />
        )}
      </main>
    </div>
  );
}

/** The countries of a region under its name, then «Territorios y otros» (D34). */
function RegionEntries({ region }: { region: RegionChoice }) {
  const { t, language } = useI18n();
  const atlas = useMemo(
    () => atlasOf(countries, extendedEntities, region, language),
    [region, language],
  );

  return (
    <>
      <AtlasSection title={t(`region.${region}`)} focusTitle>
        <EntryList entities={atlas.countries} />
      </AtlasSection>
      {atlas.others.length > 0 && (
        <AtlasSection title={t('atlas.others')} focusTitle={false}>
          <EntryList entities={atlas.others} />
        </AtlasSection>
      )}
    </>
  );
}

interface AtlasSectionProps {
  title: string;
  /** The title takes the focus when the section appears after a tap (NFR-05). */
  focusTitle: boolean;
  children: ReactNode;
}

function AtlasSection({ title, focusTitle, children }: AtlasSectionProps) {
  const headingId = useId();
  const ref = useFocusOnMount<HTMLHeadingElement>(focusTitle);

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2
        ref={ref}
        id={headingId}
        tabIndex={-1}
        className="font-display text-2xl leading-tight outline-none"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function EntryList({ entities }: { entities: readonly (Entity | ExtendedEntity)[] }) {
  return (
    // role="list": Safari drops the list role of a list without bullets, and VoiceOver would not count it.
    <ul role="list" className="flex flex-col gap-3">
      {entities.map((entity) => (
        <Entry key={entity.code} entity={entity} />
      ))}
    </ul>
  );
}

/**
 * One entity: flag, name, capital, other capitals (DATA-03), status (DATA-08) and silhouette. The pictures have
 * empty alt text, since the name is written beside them, and load only when they come near the screen
 * (NFR-03). An entity without a capital (CAP-02) or a silhouette (SHAPE-04) leaves it out, with no empty box.
 */
function Entry({ entity }: { entity: Entity | ExtendedEntity }) {
  const { t, language } = useI18n();
  const status = 'status' in entity ? entity.status[language] : null;

  return (
    <li className="flex items-center gap-3 rounded-block border-3 border-ink bg-paper p-3 shadow-block-sm">
      <div className="w-20 flex-none">
        <FlagImage entity={entity} alt="" lazy />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-lg leading-tight font-black break-words">{entity.name[language]}</p>
        {entity.capital && <p className="font-bold break-words">{entity.capital[language]}</p>}
        {entity.otherCapitals.length > 0 && (
          <p className="text-sm font-bold break-words text-ink-muted">
            {t('atlas.otherCapitals', {
              names: entity.otherCapitals.map((capital) => capital[language]).join(', '),
            })}
          </p>
        )}
        {status && <p className="text-sm font-bold break-words text-ink-muted">{status}</p>}
      </div>
      {hasShape(entity) && (
        <div className="w-14 flex-none">
          <ShapeImage entity={entity} alt="" lazy />
        </div>
      )}
    </li>
  );
}
