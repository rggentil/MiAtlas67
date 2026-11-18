import { useId, useState, type ReactNode } from 'react';
import {
  LEVELS,
  REGION_CHOICES,
  type Level,
  type RegionChoice,
  type RoundSettings,
} from '../../domain/questions.ts';
import { useI18n } from '../../i18n/context.ts';
import { useOnBack } from '../navigation/useOnBack.ts';
import { Button } from '../components/Button.tsx';
import { Chip } from '../components/Chip.tsx';
import { IconButton } from '../components/IconButton.tsx';
import { BackIcon } from '../components/icons.tsx';
import { ScreenTitle } from '../components/ScreenTitle.tsx';
import { useFocusOnMount } from '../components/useFocusOnMount.ts';
import type { PlayableGame } from '../games.ts';
import { LEVEL_NAMES } from '../labels.ts';

interface GameSetupScreenProps {
  game: PlayableGame;
  onBack: () => void;
  onStart: (settings: RoundSettings) => void;
}

type Step = { readonly name: 'region' } | { readonly name: 'level'; readonly region: RegionChoice };

/**
 * Game → Region → Level (LVL-01): one decision per step, with big buttons. "Volver" goes back one step.
 * Every level is open until unlocking arrives (LVL-04, epic 6).
 */
export function GameSetupScreen({ game, onBack, onStart }: GameSetupScreenProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>({ name: 'region' });
  // The first step opens with the screen, whose h1 takes the focus; later steps take it themselves.
  const [moved, setMoved] = useState(false);

  function goTo(next: Step) {
    setMoved(true);
    setStep(next);
  }

  // "Volver" and the phone's back button (NAV-01) go back one step.
  function back() {
    if (step.name === 'level') goTo({ name: 'region' });
    else onBack();
  }
  useOnBack(back);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pt-5 pb-6">
      <header className="flex items-center gap-3">
        <IconButton label={t('nav.back')} icon={<BackIcon />} onClick={back} />
        <Chip tone={game.topic}>{t(`topic.${game.topic}`)}</Chip>
      </header>
      <main className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <ScreenTitle className="text-4xl">{t(`game.${game.id}.name`)}</ScreenTitle>
          <p className="text-lg font-extrabold text-ink-muted">{t(`game.${game.id}.question`)}</p>
        </div>

        {step.name === 'region' ? (
          <SetupStep key="region" title={t('setup.region')} focusTitle={moved}>
            <div className="grid grid-cols-2 gap-3">
              {REGION_CHOICES.map((region) => (
                <Button
                  key={region}
                  variant="secondary"
                  onClick={() => {
                    goTo({ name: 'level', region });
                  }}
                >
                  {t(`region.${region}`)}
                </Button>
              ))}
            </div>
          </SetupStep>
        ) : (
          <SetupStep
            key="level"
            title={t('setup.level')}
            focusTitle={moved}
            chip={<Chip>{t(`region.${step.region}`)}</Chip>}
          >
            <div className="flex flex-col gap-3">
              {LEVELS.map((level) => (
                <Button
                  key={level}
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    onStart({ topic: game.topic, region: step.region, level });
                  }}
                >
                  {t(LEVEL_NAMES[level])}
                  <LevelBars level={level} />
                </Button>
              ))}
            </div>
          </SetupStep>
        )}
      </main>
    </div>
  );
}

interface SetupStepProps {
  title: string;
  focusTitle: boolean;
  chip?: ReactNode;
  children: ReactNode;
}

function SetupStep({ title, focusTitle, chip, children }: SetupStepProps) {
  const headingId = useId();
  const ref = useFocusOnMount<HTMLHeadingElement>(focusTitle);

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {chip}
        <h2
          ref={ref}
          id={headingId}
          tabIndex={-1}
          className="font-display text-2xl leading-tight outline-none"
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

/** One to three bars: how hard the level is. Decorative, the level's name says it. */
function LevelBars({ level }: { level: Level }) {
  return (
    <span aria-hidden="true" className="flex items-end gap-1">
      {LEVELS.map((bar) => (
        <span
          key={bar}
          className={`w-2.5 rounded-sm border-2 border-ink ${bar <= level ? 'bg-sun' : 'bg-paper'}`}
          style={{ height: `${String(8 + bar * 6)}px` }}
        />
      ))}
    </span>
  );
}
