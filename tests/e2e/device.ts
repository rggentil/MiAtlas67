import type { Page } from '@playwright/test';

/**
 * What the game has saved on the device: read straight from its IndexedDB database ("miatlas67"), with the
 * browser's own API. The game saves in the background, so a test that reloads the page first waits with
 * `expect.poll` until the value it needs is there.
 */

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
