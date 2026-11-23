import { useEffect, useId, useState } from 'react';
import {
  familyRecordsOf,
  type FamilyRecord,
  type GameRecords,
  type RecordRound,
} from '../../domain/familyRecords.ts';
import { GAMES } from '../../domain/games.ts';
import { formatProgress } from '../../domain/progress.ts';
import { LEVELS, REGION_CHOICES } from '../../domain/questions.ts';
import { useI18n } from '../../i18n/context.ts';
import type { Player } from '../../storage/store.ts';
import { AvatarImage } from '../components/AvatarImage.tsx';
import { IconButton } from '../components/IconButton.tsx';
import { BackIcon } from '../components/icons.tsx';
import { ScreenTitle } from '../components/ScreenTitle.tsx';
import { isPlayable } from '../games.ts';
import { LEVEL_NAMES } from '../labels.ts';
import { useOnBack } from '../navigation/useOnBack.ts';

interface RecordsScreenProps {
  /** Reads the rounds of every player on the device. */
  loadRounds: () => Promise<readonly RecordRound[]>;
  /** The players on the device: who holds each record. */
  players: readonly Player[];
  onBack: () => void;
}

/** The games the records list: the ones that can be played. */
const RECORD_GAMES = GAMES.filter(isPlayable).map((game) => game.id);

/**
 * "Récords de la familia" (HIS-05, D28): one table per game with the best score of the family in every region
 * and level, and the nickname and avatar of the player who holds it, or "Sin récord". It does not depend on who
 * plays. A screen reader reads "Europa, Fácil, 9 de 10, Pablo".
 */
export function RecordsScreen({ loadRounds, players, onBack }: RecordsScreenProps) {
  const { t } = useI18n();
  const [records, setRecords] = useState<readonly GameRecords[] | null>(null);

  useOnBack(onBack);

  useEffect(() => {
    let live = true;
    const known = new Set(players.map((player) => player.id));
    // When the rounds cannot be read, the tables show "Sin récord" rather than nothing.
    void loadRounds()
      .catch(() => [])
      .then((rounds) => {
        // Only the players on the device: the rounds of a deleted player are gone with them (PRF-04).
        const kept = rounds.filter((round) => known.has(round.playerId));
        if (live) setRecords(familyRecordsOf(kept, RECORD_GAMES));
      });
    return () => {
      live = false;
    };
  }, [loadRounds, players]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pt-5 pb-6">
      <header className="flex items-center gap-3">
        <IconButton label={t('nav.back')} icon={<BackIcon />} onClick={onBack} />
      </header>
      <main className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <ScreenTitle className="text-4xl">{t('records.title')}</ScreenTitle>
          <p className="text-lg font-extrabold text-ink-muted">{t('records.intro')}</p>
        </div>
        {records?.map((game) => (
          <RecordsTable key={game.game} records={game} players={players} />
        ))}
      </main>
    </div>
  );
}

/** One game: a heading that names its table, a row per region and a column per level. */
function RecordsTable({ records, players }: { records: GameRecords; players: readonly Player[] }) {
  const { t } = useI18n();
  const headingId = useId();

  return (
    <section className="flex flex-col gap-2">
      <h2 id={headingId} className="font-display text-2xl">
        {t(`game.${records.game}.name`)}
      </h2>
      {/* The table fills a 360 px phone (20rem inside the box); with larger text it grows with it and scrolls inside its box,
          as a data table may (WCAG 1.4.10), instead of cutting its text off. */}
      <div className="overflow-x-auto rounded-block border-3 border-ink bg-paper shadow-block-sm">
        <table
          aria-labelledby={headingId}
          className="w-full min-w-[20rem] table-fixed border-collapse"
        >
          <thead>
            <tr className="bg-sun">
              <th scope="col" className="w-[24%] px-2 py-2 text-left text-sm font-black">
                {t('progress.region')}
              </th>
              {LEVELS.map((level) => (
                <th key={level} scope="col" className="px-0.5 py-2 text-center text-xs font-black">
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
                  const cell = records.cells.find(
                    (entry) => entry.region === region && entry.level === level,
                  );
                  return (
                    <td key={level} className="border-t-2 border-ink px-1 py-2 text-center">
                      <RecordCell record={cell?.record ?? null} players={players} />
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

/** The score and who holds it, the avatar above the nickname; or "Sin récord". */
function RecordCell({
  record,
  players,
}: {
  record: FamilyRecord | null;
  players: readonly Player[];
}) {
  const { t } = useI18n();
  const holder = record && players.find((player) => player.id === record.playerId);

  if (!record || !holder) {
    return <span className="text-xs font-bold text-ink-muted">{t('records.none')}</span>;
  }
  return (
    <span className="flex flex-col items-center gap-0.5">
      {/* "9/10" is drawn; a screen reader hears "9 de 10", not a date or a fraction. */}
      <span aria-hidden="true" className="font-display text-lg leading-none tabular-nums">
        {formatProgress(record.score, record.total)}
      </span>
      <span className="sr-only">
        {t('records.score', { n: record.score, total: record.total })}
      </span>
      {/* Stacked, so a nickname fits in the narrow columns of four levels; a long one ends in "…", with the
          whole nickname in its title (a screen reader reads it whole anyway). */}
      <span className="flex max-w-full flex-col items-center gap-0.5">
        <AvatarImage avatar={holder.avatar} size={20} decorative />
        <span title={holder.nickname} className="block max-w-full truncate text-xs font-extrabold">
          {holder.nickname}
        </span>
      </span>
    </span>
  );
}
