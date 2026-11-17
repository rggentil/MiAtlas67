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

/** Matches the URL of the bundled flag of `code`: "/…/es.svg", with "?no-inline" in dev builds. */
export function flagFile(code: string): RegExp {
  return new RegExp(String.raw`/${code.toLowerCase()}\.svg(\?no-inline)?$`);
}
