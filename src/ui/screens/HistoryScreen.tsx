import { useEffect, useId, useState } from 'react';
import { GAMES, type GameId } from '../../domain/games.ts';
import type { Stars } from '../../domain/round.ts';
import { useI18n } from '../../i18n/context.ts';
import { formatPlayedAt } from '../../i18n/format.ts';
import type { SavedRound } from '../../storage/store.ts';
import { IconButton } from '../components/IconButton.tsx';
import { BackIcon, StarIcon } from '../components/icons.tsx';
import { ScreenTitle } from '../components/ScreenTitle.tsx';
import { isPlayable } from '../games.ts';
import { LEVEL_NAMES } from '../labels.ts';
import { useOnBack } from '../navigation/useOnBack.ts';

interface HistoryScreenProps {
  /** Reads the rounds of the player who plays, newest first (HIS-02). */
  loadRounds: () => Promise<readonly SavedRound[]>;
  onBack: () => void;
}

type Filter = 'all' | GameId;

/** The games the filter offers: the ones that can be played so far. */
const FILTER_GAMES = GAMES.filter(isPlayable).map((game) => game.id);

/**
 * "Historial" (HIS-02): the completed rounds of the player who plays, newest first, each with its date and
 * time, game, region and level, score and stars (HIS-01). A filter shows one game, or "Todos".
 */
export function HistoryScreen({ loadRounds, onBack }: HistoryScreenProps) {
  const { t, language } = useI18n();
  const filterName = useId();
  const [rounds, setRounds] = useState<readonly SavedRound[] | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  useOnBack(onBack);

  useEffect(() => {
    let live = true;
    // When the rounds cannot be read, the screen says there are none rather than staying blank.
    void loadRounds()
      .catch(() => [])
      .then((loaded) => {
        if (live) setRounds(loaded);
      });
    return () => {
      live = false;
    };
  }, [loadRounds]);

  const shown = rounds?.filter((round) => filter === 'all' || round.game === filter) ?? [];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pt-5 pb-6">
      <header className="flex items-center gap-3">
        <IconButton label={t('nav.back')} icon={<BackIcon />} onClick={onBack} />
      </header>
      <main className="flex flex-col gap-4">
        <ScreenTitle className="text-4xl">{t('history.title')}</ScreenTitle>
        {rounds?.length === 0 && (
          <p className="text-lg font-extrabold text-ink-muted">{t('history.empty')}</p>
        )}
        {rounds !== null && rounds.length > 0 && (
          <>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-black text-ink-muted">
                {t('history.filter')}
              </legend>
              <div className="flex flex-wrap gap-2">
                {(['all', ...FILTER_GAMES] as const).map((option) => (
                  <label key={option} className="cursor-pointer">
                    <input
                      type="radio"
                      name={filterName}
                      value={option}
                      checked={filter === option}
                      onChange={() => {
                        setFilter(option);
                      }}
                      className="peer sr-only"
                    />
                    <span
                      className={[
                        'inline-flex min-h-12 items-center justify-center px-4',
                        'rounded-full border-3 border-ink bg-paper font-black shadow-block-sm',
                        'peer-checked:bg-sun',
                        'peer-focus-visible:outline-4 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
                      ].join(' ')}
                    >
                      {option === 'all' ? t('history.all') : t(`game.${option}.name`)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            {shown.length === 0 ? (
              <p className="text-lg font-extrabold text-ink-muted">{t('history.emptyGame')}</p>
            ) : (
              <ol aria-label={t('history.rounds')} className="flex flex-col gap-3">
                {shown.map((round) => (
                  <li
                    key={round.id}
                    className="flex items-center justify-between gap-3 rounded-block border-3 border-ink bg-paper p-3 shadow-block-sm"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <time
                        dateTime={new Date(round.playedAt).toISOString()}
                        className="text-sm font-black text-ink-muted"
                      >
                        {formatPlayedAt(round.playedAt, language)}
                      </time>
                      <span className="font-display text-xl leading-tight">
                        {t(`game.${round.game}.name`)}
                      </span>
                      <span className="font-extrabold">
                        {t(`region.${round.region}`)} · {t(LEVEL_NAMES[round.level])}
                      </span>
                    </div>
                    <div className="flex flex-none flex-col items-end gap-1">
                      <span className="font-display text-2xl">
                        {round.score}/{round.total}
                      </span>
                      <RoundStars
                        stars={round.stars}
                        label={t('summary.stars', { n: round.stars })}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/** 0–3 stars (SCR-02), read out as one image: "2 de 3 estrellas". */
function RoundStars({ stars, label }: { stars: Stars; label: string }) {
  return (
    <span role="img" aria-label={label} className="flex gap-0.5 rounded-full bg-ink px-2 py-1">
      {[1, 2, 3].map((star) => (
        <StarIcon key={star} size={16} filled={star <= stars} />
      ))}
    </span>
  );
}
