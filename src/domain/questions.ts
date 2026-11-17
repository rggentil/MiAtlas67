import { isCapitalEligible, REGIONS, type Entity, type Tier } from './entity.ts';
import { shuffle, type Rng } from './random.ts';

/** Topics with data so far. Shapes, and its eligibility (SHAPE-03), arrive with the shapes data. */
export const TOPICS = ['flags', 'capitals'] as const;
export type Topic = (typeof TOPICS)[number];

/** 1 Fácil, 2 Medio, 3 Difícil (spec §7). Level 4 Experto arrives with the extended set. */
export const LEVELS = [1, 2, 3] as const;
export type Level = (typeof LEVELS)[number];

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
export const OPTIONS_PER_LEVEL: Readonly<Record<Level, number>> = { 1: 3, 2: 4, 3: 6 };

const TIERS: readonly Tier[] = [1, 2, 3];

function isEligible(entity: Entity, topic: Topic): boolean {
  return topic === 'capitals' ? isCapitalEligible(entity) : true;
}

/**
 * Entities that can appear in a round: eligible for the topic, in the region and in the level's tiers.
 * A pool smaller than a round is topped up with random entities of the next tier, then the one after (LVL-03).
 */
function buildPool(entities: readonly Entity[], settings: RoundSettings, rng: Rng): Entity[] {
  const candidates = entities.filter(
    (entity) =>
      isEligible(entity, settings.topic) &&
      (settings.region === 'world' || entity.region === settings.region),
  );
  const pool = candidates.filter((entity) => entity.tier <= settings.level);

  for (const tier of TIERS) {
    if (tier <= settings.level || pool.length >= QUESTIONS_PER_ROUND) continue;
    const nextTier = shuffle(
      candidates.filter((entity) => entity.tier === tier),
      rng,
    );
    pool.push(...nextTier.slice(0, QUESTIONS_PER_ROUND - pool.length));
  }

  if (pool.length < QUESTIONS_PER_ROUND) {
    throw new Error(
      `A round needs at least ${String(QUESTIONS_PER_ROUND)} entities; ` +
        `${settings.topic} / ${settings.region} / level ${String(settings.level)} has ${String(pool.length)}`,
    );
  }
  return pool;
}

/** True when the candidate's quiz capital is one of the other capitals of the answer (DATA-03). */
function offersOtherCapital(answer: Entity, candidate: Entity): boolean {
  return answer.otherCapitals.some(
    (other) => other.es === candidate.capital?.es || other.en === candidate.capital?.en,
  );
}

/**
 * Wrong options for one question (spec §7): at level 1 random from the pool; at levels 2 and 3 random from the
 * answer's region (level 3 "tricky" options come with story #37, D14).
 */
function wrongOptionsFor(
  answer: Entity,
  pool: readonly Entity[],
  settings: RoundSettings,
  rng: Rng,
): Entity[] {
  const needed = OPTIONS_PER_LEVEL[settings.level] - 1;
  const candidates = pool.filter(
    (candidate) =>
      candidate.code !== answer.code &&
      (settings.level === 1 || candidate.region === answer.region) &&
      !(settings.topic === 'capitals' && offersOtherCapital(answer, candidate)),
  );
  if (candidates.length < needed) {
    throw new Error(
      `Not enough wrong options for ${answer.code}: ${String(candidates.length)} of ${String(needed)}`,
    );
  }
  return shuffle(candidates, rng).slice(0, needed);
}

/**
 * The 10 questions of a round (RND-01, RND-02). Every random choice comes from `rng`,
 * so the same seed gives the same round (NFR-07).
 */
export function generateRound(
  entities: readonly Entity[],
  settings: RoundSettings,
  rng: Rng,
): Question[] {
  const pool = buildPool(entities, settings, rng);
  return shuffle(pool, rng)
    .slice(0, QUESTIONS_PER_ROUND)
    .map((entity) => ({
      entity,
      options: shuffle([entity, ...wrongOptionsFor(entity, pool, settings, rng)], rng),
    }));
}
