import { describe, expect, it } from 'vitest';
import { countries } from '../data/countries.ts';
import { generateRound, type Question } from './questions.ts';
import { createRng } from './random.ts';
import {
  answer,
  currentAnswer,
  currentQuestion,
  isComplete,
  next,
  roundResult,
  score,
  starsFor,
  startRound,
  type RoundState,
} from './round.ts';

const questions = generateRound(
  countries,
  { topic: 'flags', region: 'world', level: 1 },
  createRng(42),
);

function questionAt(index: number): Question {
  const question = questions[index];
  if (!question) throw new Error(`No question ${String(index)}`);
  return question;
}

function wrongCode(question: Question): string {
  const wrong = question.options.find((option) => option.code !== question.entity.code);
  if (!wrong) throw new Error('A question always has wrong options');
  return wrong.code;
}

/** Plays the whole round: the questions at `correctIndexes` right, the others wrong. */
function play(correctIndexes: readonly number[]): RoundState {
  let state = startRound(questions);
  questions.forEach((question, index) => {
    state = answer(
      state,
      correctIndexes.includes(index) ? question.entity.code : wrongCode(question),
    );
    state = next(state);
  });
  return state;
}

function firstN(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}

describe('round engine', () => {
  it('RND-01 a round starts at the first of its 10 questions, with no answers and score 0', () => {
    const state = startRound(questions);
    expect(currentQuestion(state)).toBe(questions[0]);
    expect(currentAnswer(state)).toBeNull();
    expect(score(state)).toBe(0);
    expect(isComplete(state)).toBe(false);
  });

  it('SCR-01 the score counts the correct answers: 7 of 10 gives 7', () => {
    expect(roundResult(play([0, 1, 2, 4, 6, 8, 9])).score).toBe(7);
  });

  it('RND-06 the current score is updated after every answer', () => {
    let state = startRound(questions);
    state = answer(state, questionAt(0).entity.code);
    expect(score(state)).toBe(1);
    state = answer(next(state), wrongCode(questionAt(1)));
    expect(score(state)).toBe(1);
  });

  it('RND-04 the chosen option is kept for feedback until moving on', () => {
    const first = questionAt(0);
    const state = answer(startRound(questions), wrongCode(first));
    expect(currentAnswer(state)).toBe(wrongCode(first));
    expect(currentQuestion(state)).toBe(first);
  });

  it('RND-04 one answer per question: a second answer is ignored', () => {
    const first = questionAt(0);
    const answered = answer(startRound(questions), first.entity.code);
    const again = answer(answered, wrongCode(first));
    expect(again).toBe(answered);
    expect(score(again)).toBe(1);
  });

  it('RND-05 "Siguiente" only moves on after the question is answered', () => {
    const state = startRound(questions);
    expect(next(state)).toBe(state);
    const moved = next(answer(state, wrongCode(questionAt(0))));
    expect(currentQuestion(moved)).toBe(questions[1]);
    expect(currentAnswer(moved)).toBeNull();
  });

  it('RND-02 an answer that is not one of the options is rejected', () => {
    expect(() => answer(startRound(questions), 'ZZ')).toThrow(/not an option/);
  });

  it('RND-08 the round is complete once the last question is answered', () => {
    let state = startRound(questions);
    for (const question of questions.slice(0, -1)) {
      state = next(answer(state, question.entity.code));
    }
    expect(isComplete(state)).toBe(false);
    state = answer(state, wrongCode(currentQuestion(state)));
    expect(isComplete(state)).toBe(true);
    expect(next(state)).toBe(state);
  });

  it('RND-08 the result lists every missed entity, in question order', () => {
    const result = roundResult(play([0, 2, 3, 5, 6, 7, 9]));
    expect(result.missed).toEqual([
      questionAt(1).entity,
      questionAt(4).entity,
      questionAt(8).entity,
    ]);
  });

  it('RND-08 a perfect round has no missed entities', () => {
    expect(roundResult(play(firstN(10))).missed).toEqual([]);
  });

  it('RND-08 there is no result before the round is complete', () => {
    expect(() => roundResult(startRound(questions))).toThrow(/not complete/);
  });

  it.each([
    [0, 0],
    [4, 0],
    [5, 1],
    [7, 1],
    [8, 2],
    [9, 2],
    [10, 3],
  ] as const)('SCR-02 a round of 10 with %i correct answers gives %i stars', (correct, stars) => {
    expect(starsFor(correct, 10)).toBe(stars);
    expect(roundResult(play(firstN(correct))).stars).toBe(stars);
  });

  it.each([
    [1, 4, 0],
    [2, 4, 1],
    [3, 4, 1],
    [4, 4, 3],
    [4, 5, 2],
  ] as const)(
    'SCR-02 stars are proportional in shorter rounds: %i of %i gives %i stars',
    (correct, total, stars) => {
      expect(starsFor(correct, total)).toBe(stars);
    },
  );

  it('SCR-02 stars need a valid score and total', () => {
    expect(() => starsFor(1, 0)).toThrow(RangeError);
    expect(() => starsFor(11, 10)).toThrow(RangeError);
    expect(() => starsFor(-1, 10)).toThrow(RangeError);
  });

  it('RND-01 a round without questions has no current question', () => {
    expect(() => currentQuestion(startRound([]))).toThrow(RangeError);
  });
});
