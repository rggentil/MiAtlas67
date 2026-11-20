import { useId } from 'react';
import type { Entity } from '../../domain/entity.ts';
import { formatProgress } from '../../domain/progress.ts';
import type { RoundSettings } from '../../domain/questions.ts';
import type { RoundResult, Stars } from '../../domain/round.ts';
import { useI18n } from '../../i18n/context.ts';
import { useOnBack } from '../navigation/useOnBack.ts';
import type { MessageKey } from '../../i18n/dictionaries.ts';
import { Button } from '../components/Button.tsx';
import { Chip } from '../components/Chip.tsx';
import { FlagImage } from '../components/FlagImage.tsx';
import { NextIcon, StarIcon } from '../components/icons.tsx';
import { ScreenTitle } from '../components/ScreenTitle.tsx';
import { ShapeImage } from '../components/ShapeImage.tsx';
import type { PlayableGame } from '../games.ts';
import { LEVEL_NAMES } from '../labels.ts';

interface SummaryScreenProps {
  game: PlayableGame;
  settings: RoundSettings;
  result: RoundResult;
  /** The score beats the player's best in this game, region and level (RND-08, D23). It may arrive a moment later. */
  newRecord: boolean;
  onPlayAgain: () => void;
  onMenu: () => void;
}

/** Always encouraging, never "you failed" (spec §15). */
const TITLES: Record<Stars, MessageKey> = {
  0: 'summary.title.0',
  1: 'summary.title.1',
  2: 'summary.title.2',
  3: 'summary.title.3',
};

/**
 * End of a round (RND-08): the score (SCR-01), the stars (SCR-02), "¡Nuevo récord!" when the player beat their
 * best (D23), what to review — each missed entity with its correct answer — and the way on: "Jugar otra vez"
 * or "Menú". "Level unlocked" arrives with epic 6.
 */
export function SummaryScreen({
  game,
  settings,
  result,
  newRecord,
  onPlayAgain,
  onMenu,
}: SummaryScreenProps) {
  const { t } = useI18n();
  const reviewId = useId();
  // The phone's back button goes home, like "Menú" (NAV-01).
  useOnBack(onMenu);
  const perfect = result.score === result.total;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pt-6 pb-8">
      <main className="flex flex-col gap-5">
        <section className="relative flex flex-col items-center gap-3 rounded-block border-3 border-ink bg-sun px-4 pt-6 pb-5 text-center shadow-block">
          {perfect && <Celebration label={t('summary.perfect')} />}
          <ScreenTitle className="text-4xl">{t(TITLES[result.stars])}</ScreenTitle>
          <StarRating stars={result.stars} label={t('summary.stars', { n: result.stars })} />
          {/*
            A live region from the start, in the accessibility tree even while empty (only visually hidden), so
            screen readers announce the record found a moment after the summary opens.
          */}
          <p role="status" className="empty:sr-only">
            {newRecord && (
              <span className="inline-flex items-center gap-2 rounded-full border-3 border-ink bg-paper px-4 py-1 font-display text-xl shadow-block-sm">
                <StarIcon size={22} filled />
                {t('summary.record')}
              </span>
            )}
          </p>
          <p className="flex items-baseline gap-2">
            <span className="font-display text-6xl leading-none">
              {formatProgress(result.score, result.total)}
            </span>
            <span className="text-lg font-black">{t('summary.correct')}</span>
          </p>
          <ul aria-label={t('round.settings')} className="flex flex-wrap justify-center gap-2">
            <li>
              <Chip tone={game.topic}>{t(`topic.${game.topic}`)}</Chip>
            </li>
            <li>
              <Chip>{t(`region.${settings.region}`)}</Chip>
            </li>
            <li>
              <Chip>{t(LEVEL_NAMES[settings.level])}</Chip>
            </li>
          </ul>
        </section>

        {result.missed.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 id={reviewId} className="font-display text-2xl">
              {t('summary.review')}
            </h2>
            <ul aria-labelledby={reviewId} className="flex flex-col gap-2">
              {result.missed.map((entity) => (
                <li
                  key={entity.code}
                  className="flex items-center gap-3 rounded-block border-3 border-ink bg-paper p-2 shadow-block-sm"
                >
                  <span className="w-16 flex-none">
                    {/* The picture of the topic: the silhouette in the Shapes games, the flag otherwise. */}
                    {game.topic === 'shapes' ? (
                      <ShapeImage entity={entity} alt="" />
                    ) : (
                      <FlagImage entity={entity} alt="" className="rounded-md" />
                    )}
                  </span>
                  <MissedText game={game} entity={entity} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="mt-auto flex flex-col gap-3">
        <Button className="w-full" onClick={onPlayAgain}>
          {t('summary.playAgain')}
          <NextIcon />
        </Button>
        <Button variant="secondary" className="w-full" onClick={onMenu}>
          {t('summary.menu')}
        </Button>
      </footer>
    </div>
  );
}

/** 0–3 stars (SCR-02), read out as one image: "2 de 3 estrellas". */
function StarRating({ stars, label }: { stars: Stars; label: string }) {
  return (
    <p
      role="img"
      aria-label={label}
      className="flex gap-2 rounded-full border-3 border-ink bg-ink px-4 py-2 shadow-block-sm"
    >
      {[1, 2, 3].map((star) => (
        <StarIcon key={star} size={40} filled={star <= stars} />
      ))}
    </p>
  );
}

const CONFETTI = [
  'bg-accent',
  'bg-topic-capitals',
  'bg-paper',
  'bg-topic-shapes',
  'bg-topic-flags',
];

/** A burst of confetti for a perfect round; still (but there) when the device asks for reduced motion. */
function Celebration({ label }: { label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {Array.from({ length: 14 }, (_, piece) => (
        <span
          key={piece}
          className={`absolute top-0 block size-3 rounded-sm border-2 border-ink motion-safe:animate-confetti ${CONFETTI[piece % CONFETTI.length] ?? ''}`}
          style={{
            left: `${String(4 + ((piece * 37) % 92))}%`,
            top: `${String(4 + ((piece * 23) % 30))}%`,
            rotate: `${String((piece * 47) % 360)}deg`,
            animationDelay: `${String((piece % 5) * 90)}ms`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * What a missed question teaches (RND-08): the country, and in the Capitals games its capital too. In CAP-B the
 * capital was the question, so it comes first and the country under it.
 */
function MissedText({ game, entity }: { game: PlayableGame; entity: Entity }) {
  const { language } = useI18n();
  const country = entity.name[language];
  const capital = game.topic === 'capitals' ? entity.capital?.[language] : undefined;
  const [main, extra] = game.id === 'CAP-B' && capital ? [capital, country] : [country, capital];

  return (
    <span className="flex flex-col">
      <span className="text-lg leading-tight font-black">{main}</span>
      {extra && <span className="leading-tight font-bold text-ink-muted">{extra}</span>}
    </span>
  );
}
