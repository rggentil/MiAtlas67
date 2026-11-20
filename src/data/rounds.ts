import type { Entity } from '../domain/entity.ts';
import {
  EXPERT_LEVEL,
  generateRound,
  type Question,
  type RoundSettings,
} from '../domain/questions.ts';
import type { Rng } from '../domain/random.ts';
import { countries } from './countries.ts';
import { extendedEntities } from './extended.ts';
import { expertRelations, relations } from './relations.ts';

/** Every entity of the game: the 195 countries and the extended set of level 4 (§13.2). */
export const allEntities: readonly Entity[] = [...countries, ...extendedEntities];

/**
 * A round of the bundled data: levels 1–3 with the 195 countries and their borders and similar flags, Experto
 * with the extended set too (LVL-06, LVL-07).
 */
export function newRound(settings: RoundSettings, rng: Rng): Question[] {
  return settings.level === EXPERT_LEVEL
    ? generateRound(allEntities, settings, rng, expertRelations)
    : generateRound(countries, settings, rng, relations);
}
