import { useId, type ComponentType } from 'react';
import { GAME_TOPICS, gamesOfTopic, type Game, type GameTopic } from '../../domain/games.ts';
import { useI18n } from '../../i18n/context.ts';
import { CapitalIcon, FlagIcon, ShapeIcon } from '../components/icons.tsx';
import { LanguageSwitch } from '../components/LanguageSwitch.tsx';
import { Logo } from '../components/Logo.tsx';
import { ScreenTitle } from '../components/ScreenTitle.tsx';
import { toneClasses } from '../components/tones.ts';
import { isPlayable, type PlayableGame } from '../games.ts';

interface HomeScreenProps {
  onOpenGame: (game: PlayableGame) => void;
}

const TOPIC_ICONS: Record<GameTopic, ComponentType<{ size?: number }>> = {
  flags: FlagIcon,
  capitals: CapitalIcon,
  shapes: ShapeIcon,
};

/** Home screen: the six games grouped by topic (GAME-01). */
export function HomeScreen({ onOpenGame }: HomeScreenProps) {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pt-5 pb-6">
      <header>
        <Logo />
      </header>
      <main className="flex flex-col gap-4">
        <ScreenTitle className="mt-2 text-3xl">{t('home.title')}</ScreenTitle>
        {GAME_TOPICS.map((topic) => (
          <TopicSection key={topic} topic={topic} onOpenGame={onOpenGame} />
        ))}
      </main>
      <footer className="mt-auto pt-4 text-center">
        <LanguageSwitch />
      </footer>
    </div>
  );
}

function TopicSection({ topic, onOpenGame }: { topic: GameTopic } & HomeScreenProps) {
  const { t } = useI18n();
  const headingId = useId();
  const Icon = TOPIC_ICONS[topic];

  return (
    <section
      aria-labelledby={headingId}
      className={`flex flex-col gap-3 rounded-block border-3 border-ink p-3 shadow-block ${toneClasses[topic]}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-lg border-2 border-ink bg-paper">
          <Icon size={20} />
        </span>
        <h2 id={headingId} className="font-display text-2xl leading-tight">
          {t(`topic.${topic}`)}
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {gamesOfTopic(topic).map((game) => (
          <GameButton key={game.id} game={game} onOpenGame={onOpenGame} />
        ))}
      </div>
    </section>
  );
}

/**
 * A game: its direction ("Bandera → País") and its question. The accessible name is the whole visible
 * text, "Pronto" included, so it matches what is on screen (WCAG 2.5.3).
 */
function GameButton({ game, onOpenGame }: { game: Game } & HomeScreenProps) {
  const { t } = useI18n();
  const playable = isPlayable(game);

  return (
    <button
      type="button"
      disabled={!playable}
      onClick={() => {
        if (isPlayable(game)) onOpenGame(game);
      }}
      className={[
        'flex min-h-16 flex-col items-start justify-center gap-0.5 px-2.5 py-2 text-left',
        'rounded-xl border-3 border-ink bg-paper shadow-block-sm',
        'motion-safe:transition-[translate,box-shadow] motion-safe:duration-75',
        'enabled:active:translate-x-0.5 enabled:active:translate-y-0.5 enabled:active:shadow-none',
        'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:border-dashed disabled:shadow-none',
      ].join(' ')}
    >
      <span className="text-[13px] font-black text-ink-muted">{t(`game.${game.id}.name`)}</span>{' '}
      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span className="text-base leading-snug font-black">{t(`game.${game.id}.question`)}</span>{' '}
        {!playable && (
          <span className="rounded-full border-2 border-ink bg-sun px-2 text-xs font-black">
            {t('home.soon')}
          </span>
        )}
      </span>
    </button>
  );
}
