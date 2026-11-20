import { useEffect, useId, useState } from 'react';
import { allEntities } from '../../data/rounds.ts';
import { GAMES, type GameId } from '../../domain/games.ts';
import { masteryOf, type AnsweredRound, type Mastery } from '../../domain/mastery.ts';
import {
  progressOf,
  totalStars,
  type GameProgress,
  type PlayedResult,
} from '../../domain/playerProgress.ts';
import { LEVELS, REGION_CHOICES } from '../../domain/questions.ts';
import type { Stars } from '../../domain/round.ts';
import { useI18n } from '../../i18n/context.ts';
import { IconButton } from '../components/IconButton.tsx';
import { BackIcon, StarIcon } from '../components/icons.tsx';
import { ScreenTitle } from '../components/ScreenTitle.tsx';
import { isPlayable } from '../games.ts';
import { LEVEL_NAMES } from '../labels.ts';
import { useOnBack } from '../navigation/useOnBack.ts';

interface ProgressScreenProps {
  /** Reads the rounds of the player who plays. */
  loadRounds: () => Promise<readonly (PlayedResult & AnsweredRound)[]>;
  onBack: () => void;
}

/** The games the progress lists: the ones that can be played so far. */
const PROGRESS_GAMES = GAMES.filter(isPlayable).map((game) => game.id);

/**
 * "Progreso" (HIS-03): the total stars of the player who plays, and one table per game with the best stars of
 * every region and level (SCR-03, GAME-02), or "Sin jugar". A screen reader reads "Europa, Fácil, 3 de 3
 * estrellas"; the stars are drawn and also written. Each game says how many countries are mastered and, apart,
 * how many extended entities (HIS-04).
 */
export function ProgressScreen({ loadRounds, onBack }: ProgressScreenProps) {
  const { t } = useI18n();
  const [progress, setProgress] = useState<readonly GameProgress[] | null>(null);
  const [mastery, setMastery] = useState<ReadonlyMap<GameId, GameMastery>>(new Map());

  useOnBack(onBack);

  useEffect(() => {
    let live = true;
    // When the rounds cannot be read, the tables show "Sin jugar" rather than nothing.
    void loadRounds()
      .catch(() => [])
      .then((rounds) => {
        if (!live) return;
        setProgress(progressOf(rounds, PROGRESS_GAMES));
        setMastery(
          new Map(
            PROGRESS_GAMES.map((game) => [
              game,
              {
                countries: masteryOf(rounds, game, allEntities, 'countries'),
                extended: masteryOf(rounds, game, allEntities, 'extended'),
              },
            ]),
          ),
        );
      });
    return () => {
      live = false;
    };
  }, [loadRounds]);

  const total = progress ? totalStars(progress) : 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pt-5 pb-6">
      <header className="flex items-center gap-3">
        <IconButton label={t('nav.back')} icon={<BackIcon />} onClick={onBack} />
      </header>
      <main className="flex flex-col gap-5">
        <ScreenTitle className="text-4xl">{t('progress.title')}</ScreenTitle>
        {progress && (
          <>
            <p className="flex items-center gap-2 self-start rounded-full border-3 border-ink bg-ink py-1 pr-4 pl-2 font-display text-xl text-paper shadow-block-sm">
              <StarIcon size={24} filled />
              {total === 1 ? t('progress.totalOne') : t('progress.total', { n: total })}
            </p>
            {progress.map((game) => (
              <ProgressTable key={game.game} progress={game} mastery={mastery.get(game.game)} />
            ))}
          </>
        )}
      </main>
    </div>
  );
}

/** A game's countries mastered and, apart, its extended entities mastered (HIS-04). */
interface GameMastery {
  readonly countries: Mastery;
  readonly extended: Mastery;
}

/** One game: a heading that names its table, a row per region and a column per level. */
function ProgressTable({ progress, mastery }: { progress: GameProgress; mastery?: GameMastery }) {
  const { t } = useI18n();
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h2 id={headingId} className="font-display text-2xl">
        {t(`game.${progress.game}.name`)}
      </h2>
      {mastery && (
        <div className="text-base font-extrabold text-ink-muted tabular-nums">
          <p>
            {t('progress.mastered', {
              n: mastery.countries.mastered,
              total: mastery.countries.total,
            })}
          </p>
          <p>
            {t('progress.masteredExtended', {
              n: mastery.extended.mastered,
              total: mastery.extended.total,
            })}
          </p>
        </div>
      )}
      <div className="overflow-hidden rounded-block border-3 border-ink bg-paper shadow-block-sm">
        <table aria-labelledby={headingId} className="w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-sun">
              <th scope="col" className="w-[30%] px-2 py-2 text-left text-sm font-black">
                {t('progress.region')}
              </th>
              {LEVELS.map((level) => (
                <th key={level} scope="col" className="px-1 py-2 text-center text-sm font-black">
                  {t(LEVEL_NAMES[level])}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REGION_CHOICES.map((region) => (
              <tr key={region} className="border-t-2 border-ink">
                <th
                  scope="row"
                  className="border-t-2 border-ink px-2 py-2 text-left text-sm font-extrabold"
                >
                  {t(`region.${region}`)}
                </th>
                {LEVELS.map((level) => {
                  const cell = progress.cells.find(
                    (entry) => entry.region === region && entry.level === level,
                  );
                  return (
                    <td key={level} className="border-t-2 border-ink px-1 py-2 text-center">
                      <CellStars stars={cell?.stars ?? null} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** The best stars of a cell, drawn and written ("2 de 3 estrellas"), or "Sin jugar". */
function CellStars({ stars }: { stars: Stars | null }) {
  const { t } = useI18n();

  if (stars === null) {
    return <span className="text-xs font-bold text-ink-muted">{t('progress.notPlayed')}</span>;
  }
  return (
    <span className="inline-flex gap-px rounded-full bg-ink px-1.5 py-1">
      {[1, 2, 3].map((star) => (
        <StarIcon key={star} size={14} filled={star <= stars} />
      ))}
      <span className="sr-only">{t('summary.stars', { n: stars })}</span>
    </span>
  );
}
