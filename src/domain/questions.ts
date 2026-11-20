import {
  isCapitalEligible,
  isCountry,
  isShapeEligible,
  REGIONS,
  type Entity,
  type Tier,
} from './entity.ts';
import { shuffle, type Rng } from './random.ts';
import type { Relations } from './relations.ts';

/** The three topics of the games (spec §6). */
export const TOPICS = ['flags', 'capitals', 'shapes'] as const;
export type Topic = (typeof TOPICS)[number];

/** 1 Fácil, 2 Medio, 3 Difícil, 4 Experto (spec §7). */
export const LEVELS = [1, 2, 3, 4] as const;
export type Level = (typeof LEVELS)[number];

/** Level 4 Experto: the only one that asks the extended set (§13.2, LVL-07). */
export const EXPERT_LEVEL = 4;

/** Questions of an Experto round that ask an extended entity (LVL-07, D27). */
export const EXTENDED_PER_ROUND = 5;

/** A region, or "world" (Mundo), which includes all regions (LVL-02). */
export const REGION_CHOICES = ['world', ...REGIONS] as const;
export type RegionChoice = (typeof REGION_CHOICES)[number];

export interface RoundSettings {
  readonly topic: Topic;
  readonly region: RegionChoice;
  readonly level: Level;
}

export interface Question {
  /** The entity asked about; it is also the correct option. */
  readonly entity: Entity;
  /** Shuffled options: the correct entity exactly once plus distinct wrong ones (RND-02). */
  readonly options: readonly Entity[];
}

export const QUESTIONS_PER_ROUND = 10;

/** Options per question, correct one included (spec §7). */
export const OPTIONS_PER_LEVEL: Readonly<Record<Level, number>> = { 1: 3, 2: 4, 3: 6, 4: 6 };

const TIERS: readonly Tier[] = [1, 2, 3];

/** Whether `entity` can be asked or offered in a game of `topic` (CAP-02, SHAPE-03, SHAPE-04). */
export function isEligible(entity: Entity, topic: Topic): boolean {
  if (topic === 'capitals') return isCapitalEligible(entity);
  if (topic === 'shapes') return isShapeEligible(entity);
  return true;
}

/**
 * Entities of the round's topic and region. Levels 1–3 use only the 195 countries; Experto adds the extended set
 * (§13.2).
 */
function candidatesFor(entities: readonly Entity[], settings: RoundSettings): Entity[] {
  return entities.filter(
    (entity) =>
      isEligible(entity, settings.topic) &&
      (settings.region === 'world' || entity.region === settings.region) &&
      (settings.level === EXPERT_LEVEL || isCountry(entity)),
  );
}

function tooFew(settings: RoundSettings, count: number): Error {
  return new Error(
    `A round needs at least ${String(QUESTIONS_PER_ROUND)} entities; ` +
      `${settings.topic} / ${settings.region} / level ${String(settings.level)} has ${String(count)}`,
  );
}

/**
 * Levels 1–3: the entities that can appear in a round, those of the level's tiers. A pool smaller than a round
 * is topped up with random entities of the next tier, then the one after (LVL-03).
 */
function buildPool(candidates: readonly Entity[], settings: RoundSettings, rng: Rng): Entity[] {
  const pool = candidates.filter((entity) => entity.tier <= settings.level);

  for (const tier of TIERS) {
    if (tier <= settings.level || pool.length >= QUESTIONS_PER_ROUND) continue;
    const nextTier = shuffle(
      candidates.filter((entity) => entity.tier === tier),
      rng,
    );
    pool.push(...nextTier.slice(0, QUESTIONS_PER_ROUND - pool.length));
  }

  if (pool.length < QUESTIONS_PER_ROUND) throw tooFew(settings, pool.length);
  return pool;
}

/**
 * The 10 entities an Experto round asks (LVL-07, D27): 5 extended entities and 5 countries of any tier, in random
 * order. With fewer than 5 extended entities in the topic and region, all of them are asked and countries
 * complete the round.
 */
function expertQuestions(
  candidates: readonly Entity[],
  settings: RoundSettings,
  rng: Rng,
): Entity[] {
  const extended = shuffle(
    candidates.filter((entity) => !isCountry(entity)),
    rng,
  ).slice(0, EXTENDED_PER_ROUND);
  const countries = shuffle(candidates.filter(isCountry), rng).slice(
    0,
    QUESTIONS_PER_ROUND - extended.length,
  );
  const asked = [...extended, ...countries];
  if (asked.length < QUESTIONS_PER_ROUND) throw tooFew(settings, asked.length);
  return shuffle(asked, rng);
}

/** A capital's name without case, accents, spaces or hyphens: «George Town» reads as «Georgetown». */
export function capitalKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]/gu, '');
}

/**
 * True when the candidate's quiz capital is a capital of the answer: its quiz capital, shared by a few entities
 * such as Reino Unido and Inglaterra (CAP-03), or one of its other capitals (DATA-03). Offering it would give
 * a Capitals question two right answers, or show the same capital twice.
 */
function sharesCapital(answer: Entity, candidate: Entity): boolean {
  const offered = candidate.capital;
  if (offered === null) return false;
  return [answer.capital, ...answer.otherCapitals].some(
    (capital) =>
      capital !== null &&
      (capitalKey(capital.es) === capitalKey(offered.es) ||
        capitalKey(capital.en) === capitalKey(offered.en)),
  );
}

/**
 * Candidate wrong options in priority order (spec §7):
 * - level 1: the whole pool;
 * - level 2: the answer's region;
 * - levels 3 and 4, "tricky" (LVL-06): similar flags (Flags games only), then land neighbours, then the answer's
 *   region.
 */
function candidateGroups(
  answer: Entity,
  candidates: readonly Entity[],
  settings: RoundSettings,
  relations: Relations,
): Entity[][] {
  const sameRegion = (entity: Entity): boolean => entity.region === answer.region;
  if (settings.level === 1) return [[...candidates]];
  if (settings.level === 2) return [candidates.filter(sameRegion)];

  const similar = new Set(
    settings.topic === 'flags' ? (relations.similarFlags.get(answer.code) ?? []) : [],
  );
  const neighbours = new Set(relations.neighbours.get(answer.code) ?? []);
  const isSimilar = (entity: Entity): boolean => similar.has(entity.code);
  const isNeighbour = (entity: Entity): boolean =>
    !isSimilar(entity) && neighbours.has(entity.code);
  return [
    candidates.filter(isSimilar),
    candidates.filter(isNeighbour),
    candidates.filter((entity) => !isSimilar(entity) && !isNeighbour(entity) && sameRegion(entity)),
  ];
}

/** Wrong options for one question: taken group by group, at random within each group. */
function wrongOptionsFor(
  answer: Entity,
  pool: readonly Entity[],
  settings: RoundSettings,
  relations: Relations,
  rng: Rng,
): Entity[] {
  const needed = OPTIONS_PER_LEVEL[settings.level] - 1;
  const candidates = pool.filter(
    (candidate) =>
      candidate.code !== answer.code &&
      !(settings.topic === 'capitals' && sharesCapital(answer, candidate)),
  );
  // Two wrong options with the same quiz capital (Jamaica and Isla Norfolk, Kingston) would show the same
  // capital twice (CAP-03).
  const repeatsCapital = (candidate: Entity): boolean =>
    settings.topic === 'capitals' && chosen.some((option) => sharesCapital(option, candidate));
  const chosen: Entity[] = [];
  for (const group of candidateGroups(answer, candidates, settings, relations)) {
    for (const candidate of shuffle(group, rng)) {
      if (chosen.length === needed) break;
      if (!repeatsCapital(candidate)) chosen.push(candidate);
    }
  }
  if (chosen.length < needed) {
    throw new Error(
      `Not enough wrong options for ${answer.code}: ${String(chosen.length)} of ${String(needed)}`,
    );
  }
  return chosen;
}

/**
 * The 10 questions of a round (RND-01, RND-02). Every random choice comes from `rng`,
 * so the same seed gives the same round (NFR-07). `relations` feed the "tricky" wrong options of levels 3 and 4
 * (LVL-06): at Experto, those of the extended set too.
 */
export function generateRound(
  entities: readonly Entity[],
  settings: RoundSettings,
  rng: Rng,
  relations: Relations,
): Question[] {
  const candidates = candidatesFor(entities, settings);
  // Experto offers wrong options from every entity of the topic and region (LVL-07).
  const pool = settings.level === EXPERT_LEVEL ? candidates : buildPool(candidates, settings, rng);
  const asked =
    settings.level === EXPERT_LEVEL
      ? expertQuestions(candidates, settings, rng)
      : shuffle(pool, rng).slice(0, QUESTIONS_PER_ROUND);
  return asked.map((entity) => ({
    entity,
    options: shuffle([entity, ...wrongOptionsFor(entity, pool, settings, relations, rng)], rng),
  }));
}
