import type { Page } from '@playwright/test';

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
 * Saves `count` finished rounds of the player `playerId` straight into the database, as the game does at the
 * end of a round (HIS-01): the history screen that saves them from a real round comes with story #64.
 */
export async function saveRounds(page: Page, playerId: number, count: number): Promise<void> {
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
          for (let index = 0; index < rounds; index++) {
            transaction.objectStore('rounds').add({
              playerId: id,
              playedAt: Date.UTC(2026, 10, 1 + index),
              game: 'FLAG-A',
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
    [playerId, count] as const,
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
