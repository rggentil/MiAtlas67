import { countries } from '../../src/data/countries.ts';
import { relations } from '../../src/data/relations.ts';
import type { Entity } from '../../src/domain/entity.ts';
import { generateRound, type Question, type RoundSettings } from '../../src/domain/questions.ts';
import { createRng } from '../../src/domain/random.ts';

/**
 * The questions the app plays as its first round after opening it with `?seed=<seed>` (NFR-07): the same
 * domain call, so the tests follow the data instead of hard-coding country names.
 */
export function expectedRound(settings: RoundSettings, seed = 42): Question[] {
  return generateRound(countries, settings, createRng(seed), relations);
}

/**
 * The first `count` rounds of a visit with `?seed=<seed>`: every round of the visit draws from the same
 * session generator, so "Jugar otra vez" plays the next one.
 */
export function expectedRounds(settings: RoundSettings, count: number, seed = 42): Question[][] {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => generateRound(countries, settings, rng, relations));
}

export function questionAt(questions: readonly Question[], index: number): Question {
  const question = questions[index];
  if (!question) throw new Error(`The round has no question ${String(index + 1)}`);
  return question;
}

export function wrongOption(question: Question): Entity {
  const wrong = question.options.find((option) => option.code !== question.entity.code);
  if (!wrong) throw new Error('A question always has wrong options');
  return wrong;
}
