import { useEffect, useRef, useState, type Ref } from 'react';
import type { Entity } from '../../domain/entity.ts';
import { formatProgress } from '../../domain/progress.ts';
import type { Question, RoundSettings } from '../../domain/questions.ts';
import {
  answer,
  currentAnswer,
  currentQuestion,
  next,
  roundResult,
  score,
  startRound,
  type RoundResult,
} from '../../domain/round.ts';
import { useI18n } from '../../i18n/context.ts';
import type { Language } from '../../i18n/languages.ts';
import { nameInSentence, ofName, ofWords, wasWords } from '../../i18n/names.ts';
import { useOnBack } from '../navigation/useOnBack.ts';
import { Button } from '../components/Button.tsx';
import { Chip } from '../components/Chip.tsx';
import { FlagImage } from '../components/FlagImage.tsx';
import { IconButton } from '../components/IconButton.tsx';
import { CheckIcon, CloseIcon, NextIcon } from '../components/icons.tsx';
import { ProgressBar } from '../components/ProgressBar.tsx';
import { QuitDialog } from '../components/QuitDialog.tsx';
import { ScreenTitle } from '../components/ScreenTitle.tsx';
import { ShapeImage } from '../components/ShapeImage.tsx';
import type { PlayableGame } from '../games.ts';
import { LEVEL_NAMES } from '../labels.ts';

interface RoundScreenProps {
  game: PlayableGame;
  settings: RoundSettings;
  questions: readonly Question[];
  /** The player confirmed "Salir de la partida": the round ends without a result (RND-07). */
  onQuit: () => void;
  /** "Siguiente" after the last answer: the round is complete (RND-08). */
  onFinish: (result: RoundResult) => void;
}

/** The quiz capital of an entity in a Capitals round. */
function capitalOf(entity: Entity, language: Language): string {
  // CAP-02: the question generator never puts an entity without a quiz capital in a Capitals round.
  if (!entity.capital) throw new Error(`${entity.code} has no quiz capital`);
  return entity.capital[language];
}

/** The text of a text option: the country's name, or its quiz capital in CAP-A. */
function optionText(game: PlayableGame, option: Entity, language: Language): string {
  return game.id === 'CAP-A' ? capitalOf(option, language) : option.name[language];
}

/** How an option looks once the question is answered (RND-04). */
type OptionState = 'open' | 'correct' | 'wrong' | 'other';

function optionState(option: Entity, question: Question, chosen: string | null): OptionState {
  if (chosen === null) return 'open';
  if (option.code === question.entity.code) return 'correct';
  return option.code === chosen ? 'wrong' : 'other';
}

/**
 * A round of 10 questions (spec §8). The child answers, sees the feedback (RND-04) and taps "Siguiente"
 * when ready (RND-05): there is no timer (RND-03). Progress and score are always visible (RND-06).
 */
export function RoundScreen({ game, settings, questions, onQuit, onFinish }: RoundScreenProps) {
  const { t, language } = useI18n();
  const [state, setState] = useState(() => startRound(questions));
  const [quitting, setQuitting] = useState(false);
  const quitRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLUListElement>(null);
  const backFromDialog = useRef(false);

  const question = currentQuestion(state);
  const chosen = currentAnswer(state);
  const number = state.current + 1;
  const total = state.questions.length;

  // After answering, "Siguiente" is the only thing left to do: it takes the focus. The answers scroll up
  // above the feedback panel, so the ✓ and ✗ are never hidden behind it on a short screen.
  useEffect(() => {
    if (chosen === null) return;
    nextRef.current?.focus({ preventScroll: true });
    optionsRef.current?.scrollIntoView({ block: 'nearest' });
  }, [chosen]);

  // Back from the quit dialog, the focus returns to "Salir de la partida". It has to wait until the page
  // is no longer inert: focus() on inert content does nothing.
  useEffect(() => {
    if (quitting || !backFromDialog.current) return;
    backFromDialog.current = false;
    quitRef.current?.focus();
  }, [quitting]);

  // The phone's back button asks before quitting, like "Salir de la partida" (NAV-01, RND-07); pressed
  // again, it closes the question and the round goes on.
  useOnBack(() => {
    if (quitting) stay();
    else setQuitting(true);
  });

  function stay() {
    backFromDialog.current = true;
    setQuitting(false);
  }

  function goOn() {
    if (number === total) onFinish(roundResult(state));
    else setState(next(state));
  }

  return (
    <>
      <div
        inert={quitting}
        className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pt-5 pb-52"
      >
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <IconButton
              ref={quitRef}
              label={t('round.quit')}
              icon={<CloseIcon />}
              onClick={() => {
                setQuitting(true);
              }}
            />
            <ProgressBar value={number} max={total} label={t('round.progress')} />
            <span className="font-display text-2xl">{formatProgress(number, total)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
            <p className="ml-auto flex items-center gap-1 rounded-full border-2 border-ink bg-sun px-3 py-0.5 text-sm font-black">
              <CheckIcon size={14} />
              {t('round.score', { n: score(state) })}
            </p>
          </div>
        </header>

        {/* A new key per question: the new question's title takes the focus (NFR-05). */}
        <main key={state.current} className="flex flex-col gap-4">
          {game.id === 'FLAG-B' || game.id === 'SHAPE-B' ? (
            <>
              {/* FLAG-B, SHAPE-B: the country's name is the question, large, as in the «Bloques» mockup. */}
              <ScreenTitle className="flex flex-col gap-1">
                <span className="font-body text-lg font-extrabold text-ink-muted">
                  {t(`round.${game.id}.prompt`, { of: ofWords(question.entity, language) })}
                </span>{' '}
                <span className="text-4xl">
                  {t('round.askedName', { name: question.entity.name[language] })}
                </span>
              </ScreenTitle>
              <ul
                ref={optionsRef}
                aria-label={t('round.options')}
                className="grid scroll-mb-56 grid-cols-2 gap-4"
              >
                {question.options.map((option, index) => (
                  <ImageOption
                    key={option.code}
                    option={option}
                    shape={game.id === 'SHAPE-B'}
                    label={t('round.option', { n: index + 1 })}
                    state={optionState(option, question, chosen)}
                    onChoose={() => {
                      setState(answer(state, option.code));
                    }}
                  />
                ))}
              </ul>
            </>
          ) : (
            <>
              {game.id === 'CAP-A' ? (
                <ScreenTitle className="flex flex-col gap-1">
                  <span className="font-body text-lg font-extrabold text-ink-muted">
                    {t('round.CAP-A.prompt', { of: ofWords(question.entity, language) })}
                  </span>{' '}
                  <span className="flex items-center gap-3 text-4xl">
                    {/* CAP-01: at level 1 the flag next to the name is a visual hint. */}
                    {settings.level === 1 && (
                      <span className="w-16 flex-none">
                        <FlagImage entity={question.entity} alt="" className="rounded-md" />
                      </span>
                    )}
                    {t('round.askedName', { name: question.entity.name[language] })}
                  </span>
                </ScreenTitle>
              ) : game.id === 'CAP-B' ? (
                <ScreenTitle className="flex flex-col gap-1">
                  <span className="font-body text-lg font-extrabold text-ink-muted">
                    {t('round.CAP-B.prompt')}
                  </span>{' '}
                  <span className="text-4xl">
                    {t('round.askedName', { name: capitalOf(question.entity, language) })}
                  </span>
                </ScreenTitle>
              ) : game.id === 'SHAPE-A' ? (
                <>
                  <ScreenTitle className="text-2xl">{t('round.SHAPE-A.prompt')}</ScreenTitle>
                  <div className="mx-auto w-full max-w-56 rounded-block border-3 border-ink bg-paper p-3 shadow-block">
                    <ShapeImage entity={question.entity} alt={t('round.shapeAlt')} />
                  </div>
                </>
              ) : (
                <>
                  <ScreenTitle className="text-2xl">{t('round.FLAG-A.prompt')}</ScreenTitle>
                  <div className="mx-auto w-full max-w-56 rounded-block border-3 border-ink bg-paper p-3 shadow-block">
                    <FlagImage entity={question.entity} alt={t('round.flagAlt')} />
                  </div>
                </>
              )}
              <ul
                ref={optionsRef}
                aria-label={t('round.options')}
                className="flex scroll-mb-56 flex-col gap-3"
              >
                {question.options.map((option) => (
                  <TextOption
                    key={option.code}
                    text={optionText(game, option, language)}
                    flag={game.id === 'CAP-B' && settings.level === 1 ? option : null}
                    state={optionState(option, question, chosen)}
                    onChoose={() => {
                      setState(answer(state, option.code));
                    }}
                  />
                ))}
              </ul>
            </>
          )}
        </main>

        <Feedback game={game} question={question} chosen={chosen} nextRef={nextRef} onNext={goOn} />
      </div>

      {quitting && <QuitDialog onStay={stay} onQuit={onQuit} />}
    </>
  );
}

const OPTION_TONES: Record<OptionState, string> = {
  open: 'bg-paper shadow-block active:translate-x-1 active:translate-y-1 active:shadow-none',
  correct: 'bg-success shadow-block',
  wrong: 'bg-error shadow-block',
  other: 'bg-paper opacity-50',
};

/** A country or capital name as a large button (GAME-03); once answered, its ✓ or ✗ mark sits beside it (RND-04). */
function TextOption({
  text,
  flag,
  state,
  onChoose,
}: {
  text: string;
  /** CAP-01: in CAP-B at level 1, the country's flag sits next to its name as a hint. */
  flag: Entity | null;
  state: OptionState;
  onChoose: () => void;
}) {
  return (
    <li className="relative">
      <button
        type="button"
        disabled={state !== 'open'}
        onClick={onChoose}
        className={[
          'flex min-h-14 w-full items-center gap-3 px-5 py-2 text-left',
          'rounded-block border-3 border-ink font-display text-xl leading-tight',
          'motion-safe:transition-[translate,box-shadow] motion-safe:duration-75',
          'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent',
          OPTION_TONES[state],
        ].join(' ')}
      >
        {flag && (
          <span className="w-12 flex-none">
            <FlagImage entity={flag} alt="" className="rounded-md" />
          </span>
        )}
        {text}
      </button>
      {(state === 'correct' || state === 'wrong') && (
        <AnswerMark correct={state === 'correct'} variant="badge" />
      )}
    </li>
  );
}

/**
 * A flag or a silhouette as a large card (GAME-03), named only by its position, "Opción 2": its name and alt
 * text never tell the country, or the question would answer itself (FLAG-B, SHAPE-B, SHAPE-01).
 */
function ImageOption({
  option,
  shape,
  label,
  state,
  onChoose,
}: {
  option: Entity;
  /** SHAPE-B shows the option's silhouette; FLAG-B its flag. */
  shape: boolean;
  label: string;
  state: OptionState;
  onChoose: () => void;
}) {
  return (
    <li className="relative">
      <button
        type="button"
        aria-label={label}
        disabled={state !== 'open'}
        onClick={onChoose}
        className={[
          'block w-full p-2.5',
          'rounded-block border-3 border-ink',
          'motion-safe:transition-[translate,box-shadow] motion-safe:duration-75',
          'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent',
          OPTION_TONES[state],
        ].join(' ')}
      >
        {shape ? <ShapeImage entity={option} alt="" /> : <FlagImage entity={option} alt="" />}
      </button>
      {(state === 'correct' || state === 'wrong') && (
        <AnswerMark correct={state === 'correct'} variant="badge" />
      )}
    </li>
  );
}

/**
 * ✓ or ✗ mark: feedback never relies on colour alone (RND-04, NFR-05). As a badge it sits outside the option's
 * button, so the button keeps its name (the country, or "Opción N"); as a tile it heads the feedback panel.
 */
function AnswerMark({ correct, variant }: { correct: boolean; variant: 'badge' | 'tile' }) {
  const { t } = useI18n();

  return (
    <span
      role="img"
      aria-label={t(correct ? 'round.markCorrect' : 'round.markWrong')}
      className={[
        'flex flex-none items-center justify-center border-3 border-ink',
        correct ? 'bg-sun' : 'bg-paper',
        variant === 'badge'
          ? 'absolute -top-3 -right-2 size-9 rounded-full'
          : 'size-12 -rotate-6 rounded-xl shadow-block-sm',
        // RND-04: a correct answer gets a positive animation, unless the device asks for reduced motion.
        correct ? 'motion-safe:animate-pop' : '',
      ].join(' ')}
    >
      {correct ? (
        <CheckIcon size={variant === 'badge' ? 18 : 26} />
      ) : (
        <CloseIcon size={variant === 'badge' ? 18 : 26} />
      )}
    </span>
  );
}

interface FeedbackProps {
  game: PlayableGame;
  question: Question;
  chosen: string | null;
  nextRef: Ref<HTMLButtonElement>;
  onNext: () => void;
}

/**
 * The answer's feedback and "Siguiente" (RND-04, RND-05). The status region is always there, empty while
 * the question is open, so screen readers announce the feedback when it appears.
 */
function Feedback({ game, question, chosen, nextRef, onNext }: FeedbackProps) {
  const { t, language } = useI18n();
  const answered = chosen !== null;
  const correct = chosen === question.entity.code;
  // FLAG-A, CAP-B and SHAPE-A name the right country and CAP-A the right capital; in FLAG-B and SHAPE-B the
  // country is the question, so it points at the ✓ card. Names keep their article (DATA-09): «Era el Reino Unido».
  const miss =
    game.id === 'FLAG-B'
      ? t('round.wrongFlag', { ofName: ofName(question.entity, language) })
      : game.id === 'SHAPE-B'
        ? t('round.wrongShape', { ofName: ofName(question.entity, language) })
        : game.id === 'CAP-A'
          ? t('round.wrongCapital', { name: optionText(game, question.entity, language) })
          : t('round.wrong', {
              was: wasWords(question.entity, language),
              name: nameInSentence(question.entity, language),
            });

  return (
    <section
      className={
        answered
          ? `fixed inset-x-0 bottom-0 border-t-3 border-ink ${correct ? 'bg-success' : 'bg-error'}`
          : ''
      }
    >
      <div className={answered ? 'mx-auto flex max-w-md flex-col gap-4 px-5 pt-5 pb-6' : ''}>
        <div role="status" className="flex items-center gap-3">
          {answered && (
            <>
              <AnswerMark correct={correct} variant="tile" />
              <p
                className={`font-display leading-tight ${correct || (game.id !== 'FLAG-B' && game.id !== 'SHAPE-B') ? 'text-3xl' : 'text-2xl'}`}
              >
                {correct ? t('round.correct') : miss}
              </p>
            </>
          )}
        </div>
        {answered && (
          <Button ref={nextRef} className="w-full" onClick={onNext}>
            {t('round.next')}
            <NextIcon />
          </Button>
        )}
      </div>
    </section>
  );
}
