import type { Page } from '@playwright/test';
import type { GameId } from '../../src/domain/games.ts';

/**
 * What the game has saved on the device: read straight from its IndexedDB database ("miatlas67"), with the
 * browser's own API. The game saves in the background, so a test that reloads the page first waits with
 * `expect.poll` until the value it needs is there.
 */

/** The id of the saved player called `nickname`, or `null` when there is none. */
export async function savedPlayerId(page: Page, nickname: string): Promise<number | null> {
  return page.evaluate(
    (wanted) =>
      new Promise<number | null>((resolve, reject) => {
        const request = indexedDB.open('miatlas67');
        request.onerror = () => {
          reject(new Error('The game database cannot be opened'));
        };
        request.onsuccess = () => {
          const db = request.result;
          const all = db.transaction('players', 'readonly').objectStore('players').getAll();
          all.onsuccess = () => {
            db.close();
            const players = all.result as { id: number; nickname: string }[];
            resolve(players.find((player) => player.nickname === wanted)?.id ?? null);
          };
        };
      }),
    nickname,
  );
}

/**
 * Saves `count` finished rounds of `game` for the player `playerId` straight into the database, as the game
 * does at the end of a round (HIS-01): quicker than playing them when a test only needs them to be there.
 */
export async function saveRounds(
  page: Page,
  playerId: number,
  count: number,
  game: 'FLAG-A' | 'FLAG-B' = 'FLAG-A',
): Promise<void> {
  await page.evaluate(
    ([id, rounds, playedGame]) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('miatlas67');
        request.onerror = () => {
          reject(new Error('The game database cannot be opened'));
        };
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction('rounds', 'readwrite');
          for (let index = 0; index < rounds; index++) {
            transaction.objectStore('rounds').add({
              playerId: id,
              playedAt: Date.UTC(2026, 10, 1 + index),
              game: playedGame,
              region: 'europe',
              level: 1,
              score: 8,
              total: 10,
              stars: 2,
              missed: ['PT', 'BE'],
            });
          }
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onerror = () => {
            reject(new Error('The rounds could not be saved'));
          };
        };
      }),
    [playerId, count, game] as const,
  );
}

/** A finished round with its result, to save straight into the database. */
export interface Result {
  readonly game: GameId;
  readonly region: string;
  readonly level: 1 | 2 | 3 | 4;
  readonly score: number;
  readonly stars: 0 | 1 | 2 | 3;
  /** When it was played; by default 1 November 2026 for the first result of a call, then one day more each. */
  readonly playedAt?: number;
  /** Codes of the entities asked (HIS-04); left out, the round is like one saved before the counter arrived. */
  readonly asked?: readonly string[];
  /** Codes of the entities missed; none when left out. */
  readonly missed?: readonly string[];
}

/** Saves the finished rounds `results` of the player `playerId` straight into the database (HIS-01). */
export async function saveResults(
  page: Page,
  playerId: number,
  results: readonly Result[],
): Promise<void> {
  await page.evaluate(
    ([id, rounds]) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('miatlas67');
        request.onerror = () => {
          reject(new Error('The game database cannot be opened'));
        };
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction('rounds', 'readwrite');
          for (const [index, round] of rounds.entries()) {
            transaction.objectStore('rounds').add({
              ...round,
              playerId: id,
              playedAt: round.playedAt ?? Date.UTC(2026, 10, 1 + index),
              total: 10,
              missed: round.missed ?? [],
            });
          }
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onerror = () => {
            reject(new Error('The rounds could not be saved'));
          };
        };
      }),
    [playerId, results] as const,
  );
}

/** How many rounds of the player `playerId` are saved on the device. */
export async function savedRoundsOf(page: Page, playerId: number): Promise<number> {
  return page.evaluate(
    (id) =>
      new Promise<number>((resolve, reject) => {
        const request = indexedDB.open('miatlas67');
        request.onerror = () => {
          reject(new Error('The game database cannot be opened'));
        };
        request.onsuccess = () => {
          const db = request.result;
          const all = db.transaction('rounds', 'readonly').objectStore('rounds').getAll();
          all.onsuccess = () => {
            db.close();
            const rounds = all.result as { playerId: number }[];
            resolve(rounds.filter((round) => round.playerId === id).length);
          };
        };
      }),
    playerId,
  );
}

/** The missed entities of each saved round of the player `playerId`, in the order they were saved. */
export async function savedMissedOf(page: Page, playerId: number): Promise<string[][]> {
  return page.evaluate(
    (id) =>
      new Promise<string[][]>((resolve, reject) => {
        const request = indexedDB.open('miatlas67');
        request.onerror = () => {
          reject(new Error('The game database cannot be opened'));
        };
        request.onsuccess = () => {
          const db = request.result;
          const all = db.transaction('rounds', 'readonly').objectStore('rounds').getAll();
          all.onsuccess = () => {
            db.close();
            const rounds = all.result as { playerId: number; missed: string[] }[];
            resolve(rounds.filter((round) => round.playerId === id).map((round) => round.missed));
          };
        };
      }),
    playerId,
  );
}

/** The codes asked in each saved round of the player `playerId` (HIS-04), or `null` for a round without them. */
export async function savedAskedOf(page: Page, playerId: number): Promise<(string[] | null)[]> {
  return page.evaluate(
    (id) =>
      new Promise<(string[] | null)[]>((resolve, reject) => {
        const request = indexedDB.open('miatlas67');
        request.onerror = () => {
          reject(new Error('The game database cannot be opened'));
        };
        request.onsuccess = () => {
          const db = request.result;
          const all = db.transaction('rounds', 'readonly').objectStore('rounds').getAll();
          all.onsuccess = () => {
            db.close();
            const rounds = all.result as { playerId: number; asked?: string[] }[];
            resolve(
              rounds.filter((round) => round.playerId === id).map((round) => round.asked ?? null),
            );
          };
        };
      }),
    playerId,
  );
}

/** The nickname of the player saved as the last one who played, or `null`. */
export async function savedLastPlayer(page: Page): Promise<string | null> {
  return page.evaluate(
    () =>
      new Promise<string | null>((resolve, reject) => {
        const request = indexedDB.open('miatlas67');
        request.onerror = () => {
          reject(new Error('The game database cannot be opened'));
        };
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['settings', 'players'], 'readonly');
          const setting = transaction.objectStore('settings').get('lastPlayer');
          setting.onsuccess = () => {
            const id = (setting.result as { value?: number } | undefined)?.value;
            if (id === undefined) {
              db.close();
              resolve(null);
              return;
            }
            const player = transaction.objectStore('players').get(id);
            player.onsuccess = () => {
              db.close();
              resolve((player.result as { nickname?: string } | undefined)?.nickname ?? null);
            };
          };
        };
      }),
  );
}

/**
 * Opens `level` of `game` in `region` for the player `nickname` (LVL-04): saves a ★★ round (8/10) in every
 * level before it, as if they had been played. Call it on the home screen, before the game is opened: the level
 * step reads the rounds when the game opens.
 */
export async function openLevel(
  page: Page,
  game: GameId,
  region: string,
  level: 2 | 3 | 4,
  nickname = 'Lucía',
): Promise<void> {
  const playerId = await savedPlayerId(page, nickname);
  if (playerId === null) throw new Error(`There is no player called ${nickname}`);
  const before = ([1, 2, 3] as const).filter((earlier) => earlier < level);
  await saveResults(
    page,
    playerId,
    before.map((earlier) => ({ game, region, level: earlier, score: 8, stars: 2 })),
  );
}
