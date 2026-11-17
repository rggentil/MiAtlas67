import { useState } from 'react';
import { formatProgress } from '../../domain/progress.ts';
import type { Question, RoundSettings } from '../../domain/questions.ts';
import { startRound } from '../../domain/round.ts';
import { useI18n } from '../../i18n/context.ts';
import { Chip } from '../components/Chip.tsx';
import { ProgressBar } from '../components/ProgressBar.tsx';
import { ScreenTitle } from '../components/ScreenTitle.tsx';
import type { PlayableGame } from '../games.ts';
import { LEVEL_NAMES } from '../labels.ts';

interface RoundScreenProps {
  game: PlayableGame;
  settings: RoundSettings;
  questions: readonly Question[];
}

/** A round of 10 questions (spec §8): the topic, region and level, and the progress (RND-06). */
export function RoundScreen({ game, settings, questions }: RoundScreenProps) {
  const { t } = useI18n();
  const [state] = useState(() => startRound(questions));
  const number = state.current + 1;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pt-5 pb-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <ProgressBar value={number} max={questions.length} label={t('round.progress')} />
          <span className="font-display text-2xl">{formatProgress(number, questions.length)}</span>
        </div>
        <ul aria-label={t('round.settings')} className="flex flex-wrap gap-2">
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
      </header>
      <main>
        <ScreenTitle className="text-3xl">{t(`game.${game.id}.question`)}</ScreenTitle>
      </main>
    </div>
  );
}
