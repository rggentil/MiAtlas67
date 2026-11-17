import type { Game } from '../../domain/games.ts';
import { useI18n } from '../../i18n/context.ts';
import { Chip } from '../components/Chip.tsx';
import { IconButton } from '../components/IconButton.tsx';
import { BackIcon } from '../components/icons.tsx';
import { ScreenTitle } from '../components/ScreenTitle.tsx';

interface GameSetupScreenProps {
  game: Game;
  onBack: () => void;
}

/** The screen of a game, opened from the home screen (GAME-01). Region and level come next (LVL-01). */
export function GameSetupScreen({ game, onBack }: GameSetupScreenProps) {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pt-5 pb-6">
      <header className="flex items-center gap-3">
        <IconButton label={t('nav.back')} icon={<BackIcon />} onClick={onBack} />
        <Chip tone={game.topic}>{t(`topic.${game.topic}`)}</Chip>
      </header>
      <main className="flex flex-col gap-1">
        <ScreenTitle className="text-4xl">{t(`game.${game.id}.name`)}</ScreenTitle>
        <p className="text-lg font-extrabold text-ink-muted">{t(`game.${game.id}.question`)}</p>
      </main>
    </div>
  );
}
