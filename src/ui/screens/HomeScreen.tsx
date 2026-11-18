import { useId, type ComponentType } from 'react';
import { GAME_TOPICS, gamesOfTopic, type Game, type GameTopic } from '../../domain/games.ts';
import { useI18n } from '../../i18n/context.ts';
import type { Player } from '../../storage/store.ts';
import { AvatarImage } from '../components/AvatarImage.tsx';
import { Button } from '../components/Button.tsx';
import { CapitalIcon, FlagIcon, ShapeIcon, SwitchIcon } from '../components/icons.tsx';
import { LanguageSwitch } from '../components/LanguageSwitch.tsx';
import { Logo } from '../components/Logo.tsx';
import { ScreenTitle } from '../components/ScreenTitle.tsx';
import { toneClasses } from '../components/tones.ts';
import { isPlayable, type PlayableGame } from '../games.ts';
import { useOnBack } from '../navigation/useOnBack.ts';

interface HomeScreenProps {
  /** Who plays (PRF-01). */
  player: Player;
  onOpenGame: (game: PlayableGame) => void;
  /** The player button: "¿Quién juega?", to hand the phone to someone else (PRF-03). */
  onSwitchPlayer: () => void;
  /** "Historial": the rounds of the player who plays (HIS-02). */
  onOpenHistory: () => void;
  /** "Progreso": the best stars of the player who plays (HIS-03). */
  onOpenProgress: () => void;
  /** The phone's back button: back to "¿Quién juega?" (NAV-01, D22). */
  onBack: () => void;
}

const TOPIC_ICONS: Record<GameTopic, ComponentType<{ size?: number }>> = {
  flags: FlagIcon,
  capitals: CapitalIcon,
  shapes: ShapeIcon,
};

/**
 * Home screen: who plays, and the six games grouped by topic (GAME-01). The player button switches player
 * (PRF-03); Back goes to "¿Quién juega?" too (D22).
 */
export function HomeScreen({
  player,
  onOpenGame,
  onSwitchPlayer,
  onOpenHistory,
  onOpenProgress,
  onBack,
}: HomeScreenProps) {
  const { t } = useI18n();

  useOnBack(onBack);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pt-5 pb-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Logo />
        <CurrentPlayer player={player} onSwitch={onSwitchPlayer} />
      </header>
      <main className="flex flex-col gap-4">
        <ScreenTitle className="mt-2 text-3xl">{t('home.title')}</ScreenTitle>
        {GAME_TOPICS.map((topic) => (
          <TopicSection key={topic} topic={topic} onOpenGame={onOpenGame} />
        ))}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onOpenProgress}>
            {t('home.progress')}
          </Button>
          <Button variant="secondary" onClick={onOpenHistory}>
            {t('home.history')}
          </Button>
        </div>
      </main>
      <footer className="mt-auto pt-4 text-center">
        <LanguageSwitch />
      </footer>
    </div>
  );
}

/**
 * Who plays: a button with the avatar, named after its animal, the nickname and the switch arrows (PRF-03).
 * Its name is the nickname written on it; "Cambiar de jugador" is its description, kept out of the "Jugador"
 * group so the group's text is the nickname alone.
 */
function CurrentPlayer({ player, onSwitch }: { player: Player; onSwitch: () => void }) {
  const { t } = useI18n();
  const nicknameId = useId();
  const hintId = useId();

  return (
    <>
      <div role="group" aria-label={t('player.current')} className="min-w-0">
        <button
          type="button"
          aria-labelledby={nicknameId}
          aria-describedby={hintId}
          onClick={onSwitch}
          className={[
            'flex min-h-12 min-w-0 items-center gap-2 py-1 pr-3 pl-1 text-left',
            'rounded-full border-3 border-ink bg-paper shadow-block-sm',
            'motion-safe:transition-[translate,box-shadow] motion-safe:duration-75',
            'active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
            'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent',
          ].join(' ')}
        >
          <AvatarImage avatar={player.avatar} size={36} />
          <span id={nicknameId} className="min-w-0 font-display text-xl leading-tight break-words">
            {player.nickname}
          </span>
          <SwitchIcon size={18} className="flex-none" />
        </button>
      </div>
      <span id={hintId} hidden>
        {t('player.switch')}
      </span>
    </>
  );
}

type GameOpener = Pick<HomeScreenProps, 'onOpenGame'>;

function TopicSection({ topic, onOpenGame }: { topic: GameTopic } & GameOpener) {
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
function GameButton({ game, onOpenGame }: { game: Game } & GameOpener) {
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
