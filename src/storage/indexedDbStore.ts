import { Dexie, type DexieOptions, type EntityTable } from 'dexie';
import { createMemoryStore } from './memoryStore.ts';
import {
  newestFirst,
  playerFields,
  roundFields,
  type GameStore,
  type Player,
  type SavedRound,
} from './store.ts';

/** The IndexedDB database of the game. Only nickname, avatar and results are stored (NFR-04). */
export const DATABASE_NAME = 'miatlas67';

const LAST_PLAYER = 'lastPlayer';

interface Setting {
  readonly key: string;
  readonly value: number;
}

type Database = Dexie & {
  players: EntityTable<Player, 'id'>;
  rounds: EntityTable<SavedRound, 'id'>;
  settings: EntityTable<Setting, 'key'>;
};

/** Where IndexedDB comes from: the browser's by default; tests pass fake-indexeddb. */
export type StorageOptions = Pick<DexieOptions, 'indexedDB' | 'IDBKeyRange'>;

/**
 * Opens the game's storage on the device (IndexedDB through Dexie). If the browser blocks IndexedDB (some
 * private modes, disabled site data), the game still works with an in-memory store, which lasts until the page
 * is closed.
 */
export async function openStore(options: StorageOptions = {}): Promise<GameStore> {
  const db = new Dexie(DATABASE_NAME, options) as Database;
  db.version(1).stores({
    players: '++id',
    rounds: '++id, playerId',
    settings: 'key',
  });
  try {
    await db.open();
  } catch {
    return createMemoryStore();
  }
  return indexedDbStore(db);
}

function indexedDbStore(db: Database): GameStore {
  return {
    players: {
      list: () => db.players.toArray(),
      create: async ({ nickname, avatar }) => {
        const id = await db.players.add({ nickname, avatar });
        return { id, nickname, avatar };
      },
      update: async (player) => {
        const { nickname, avatar } = playerFields(player);
        const changed = await db.players.update(player.id, { nickname, avatar });
        if (changed === 0 && !(await db.players.get(player.id))) {
          throw new RangeError(`There is no player ${String(player.id)}`);
        }
      },
      delete: (id) =>
        db.transaction('rw', db.players, db.rounds, db.settings, async () => {
          await db.rounds.where('playerId').equals(id).delete();
          await db.players.delete(id);
          const last = await db.settings.get(LAST_PLAYER);
          if (last?.value === id) await db.settings.delete(LAST_PLAYER);
        }),
      lastPlayerId: async () => (await db.settings.get(LAST_PLAYER))?.value ?? null,
      setLastPlayerId: async (id) => {
        await db.settings.put({ key: LAST_PLAYER, value: id });
      },
    },
    rounds: {
      add: async (data) => {
        const fields = roundFields(data);
        const id = await db.rounds.add(fields);
        return { ...fields, id };
      },
      listByPlayer: async (playerId) =>
        (await db.rounds.where('playerId').equals(playerId).toArray()).sort(newestFirst),
    },
    close: () => {
      db.close();
    },
  };
}
