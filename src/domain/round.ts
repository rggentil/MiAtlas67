import type { Entity } from './entity.ts';
import type { Question } from './questions.ts';

/**
 * Round engine (spec §8, §9): an immutable state plus pure transitions.
 * Every function returns a new state, or the same one when the action is ignored.
 */
export interface RoundState {
  readonly questions: readonly Question[];
  /** Code of the chosen option per question; `null` while unanswered. */
  readonly answers: readonly (string | null)[];
  /** Index of the current question. */
  readonly current: number;
}

export type Stars = 0 | 1 | 2 | 3;

export interface RoundResult {
  /** Correct answers (SCR-01). */
  readonly score: number;
  readonly total: number;
  readonly stars: Stars;
  /** Entities answered wrongly, in question order; each one is its own correct answer (RND-08). */
  readonly missed: readonly Entity[];
}

export function startRound(questions: readonly Question[]): RoundState {
  return { questions, answers: questions.map(() => null), current: 0 };
}

export function currentQuestion(state: RoundState): Question {
  const question = state.questions[state.current];
  if (!question) throw new RangeError(`The round has no question ${String(state.current + 1)}`);
  return question;
}

/** The option chosen for the current question, kept for the feedback (RND-04); `null` if not answered yet. */
export function currentAnswer(state: RoundState): string | null {
  return state.answers[state.current] ?? null;
}

/** Answers the current question. A second answer to the same question is ignored (RND-04). */
export function answer(state: RoundState, optionCode: string): RoundState {
  if (currentAnswer(state) !== null) return state;
  const question = currentQuestion(state);
  if (!question.options.some((option) => option.code === optionCode)) {
    throw new RangeError(`${optionCode} is not an option of the current question`);
  }
  return {
    ...state,
    answers: state.answers.map((chosen, index) => (index === state.current ? optionCode : chosen)),
  };
}

/** "Siguiente" (RND-05): moves to the next question once the current one is answered. */
export function next(state: RoundState): RoundState {
  const isLast = state.current >= state.questions.length - 1;
  if (currentAnswer(state) === null || isLast) return state;
  return { ...state, current: state.current + 1 };
}

/** Correct answers so far (SCR-01), visible during the round (RND-06). */
export function score(state: RoundState): number {
  return state.questions.filter((question, index) => state.answers[index] === question.entity.code)
    .length;
}

export function isComplete(state: RoundState): boolean {
  return state.answers.every((chosen) => chosen !== null);
}

/** SCR-02: 1★ from 50 %, 2★ from 80 %, 3★ only for a perfect round (5 / 8 / 10 of 10). */
export function starsFor(correct: number, total: number): Stars {
  if (total <= 0 || correct < 0 || correct > total) {
    throw new RangeError(`Invalid score ${String(correct)} of ${String(total)}`);
  }
  if (correct === total) return 3;
  if (correct * 10 >= total * 8) return 2;
  if (correct * 2 >= total) return 1;
  return 0;
}

/** The result of a complete round (SCR-01, SCR-02, RND-08). */
export function roundResult(state: RoundState): RoundResult {
  if (!isComplete(state)) throw new Error('The round is not complete yet');
  const total = state.questions.length;
  const correct = score(state);
  return {
    score: correct,
    total,
    stars: starsFor(correct, total),
    missed: state.questions
      .filter((question, index) => state.answers[index] !== question.entity.code)
      .map((question) => question.entity),
  };
}
