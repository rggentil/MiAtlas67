import type { GameId } from '../domain/games.ts';
import type { Level, RegionChoice } from '../domain/questions.ts';
import type { Stars } from '../domain/round.ts';

/** A player on this device (PRF-02). Only a nickname and an avatar are kept: no real name, age or email (NFR-04). */
export interface Player {
  readonly id: number;
  readonly nickname: string;
  /** Id of an avatar of the predefined set. */
  readonly avatar: string;
}

export type PlayerData = Omit<Player, 'id'>;

/** A completed round (HIS-01). Quit rounds are never saved (RND-07). */
export interface SavedRound {
  readonly id: number;
  readonly playerId: number;
  /** When the round was completed, in milliseconds since the epoch. */
  readonly playedAt: number;
  readonly game: GameId;
  readonly region: RegionChoice;
  readonly level: Level;
  readonly score: number;
  readonly total: number;
  readonly stars: Stars;
  /**
   * Codes of the missed entities, in question order. Codes, not names: a language switch or a data fix never
   * changes the history.
   */
  readonly missed: readonly string[];
}

export type RoundData = Omit<SavedRound, 'id'>;

export interface PlayerRepository {
  /** Every player of the device, in the order they were created. */
  list(): Promise<Player[]>;
  create(data: PlayerData): Promise<Player>;
  /** Changes the nickname and avatar of an existing player (PRF-04). */
  update(player: Player): Promise<void>;
  /** Deletes the player and every round of theirs (PRF-04, NFR-04). */
  delete(id: number): Promise<void>;
  /** The player chosen last on this device (PRF-01), or `null`. */
  lastPlayerId(): Promise<number | null>;
  setLastPlayerId(id: number): Promise<void>;
}

export interface RoundRepository {
  add(data: RoundData): Promise<SavedRound>;
  /** The rounds of one player, newest first (HIS-02). */
  listByPlayer(playerId: number): Promise<SavedRound[]>;
}

/** Everything the game keeps on the device, behind interfaces so the storage can change later. */
export interface GameStore {
  readonly players: PlayerRepository;
  readonly rounds: RoundRepository;
  close(): void;
}

/** A copy that holds only the fields of a player: nothing else is ever stored (NFR-04). */
export function playerFields({ id, nickname, avatar }: Player): Player {
  return { id, nickname, avatar };
}

/** A copy that holds only the fields of HIS-01: nothing else is ever stored (NFR-04). */
export function roundFields(data: RoundData): RoundData {
  const { playerId, playedAt, game, region, level, score, total, stars, missed } = data;
  return { playerId, playedAt, game, region, level, score, total, stars, missed: [...missed] };
}

/** Newest first; rounds of the same millisecond keep the order they were saved in, newest first too. */
export function newestFirst(a: SavedRound, b: SavedRound): number {
  return b.playedAt - a.playedAt || b.id - a.id;
}
