import { Dexie } from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DATABASE_NAME, openStore } from './indexedDbStore.ts';
import { createMemoryStore } from './memoryStore.ts';
import type { GameStore, Player, PlayerData, RoundData } from './store.ts';

/** A round of "Bandera → País", "Europa · Fácil": 8 of 10, with two missed countries. */
function round(playerId: number, playedAt: number, overrides: Partial<RoundData> = {}): RoundData {
  return {
    playerId,
    playedAt,
    game: 'FLAG-A',
    region: 'europe',
    level: 1,
    score: 8,
    total: 10,
    stars: 2,
    missed: ['PT', 'BE'],
    ...overrides,
  };
}

const HIS_01_FIELDS = [
  'game',
  'id',
  'level',
  'missed',
  'playedAt',
  'playerId',
  'region',
  'score',
  'stars',
  'total',
];

/** A browser that refuses to open IndexedDB, as some private modes do. */
const throwingIndexedDB = {
  open() {
    throw new DOMException('IndexedDB is disabled', 'SecurityError');
  },
} as unknown as IDBFactory;

/** A browser whose open request fails, as when site data is disabled. */
const failingIndexedDB = {
  open() {
    const request: Partial<IDBOpenDBRequest> & { error: DOMException } = {
      error: new DOMException('IndexedDB is disabled', 'InvalidStateError'),
    };
    setTimeout(() => {
      request.onerror?.call(
        request as IDBOpenDBRequest,
        {
          target: request,
          type: 'error',
          preventDefault: () => undefined,
          stopPropagation: () => undefined,
        } as unknown as Event,
      );
    }, 0);
    return request;
  },
} as unknown as IDBFactory;

// Every behaviour of the repositories holds for both implementations.
describe.each([
  ['IndexedDB', () => openStore({ indexedDB: new IDBFactory(), IDBKeyRange })],
  ['in memory', () => Promise.resolve(createMemoryStore())],
])('game store (%s)', (_name, open) => {
  let store: GameStore;

  beforeEach(async () => {
    store = await open();
  });

  afterEach(() => {
    store.close();
  });

  it('PRF-02 creates a player with a nickname and an avatar', async () => {
    const lucia = await store.players.create({ nickname: 'Lucía', avatar: 'fox' });

    expect(lucia).toEqual({ id: expect.any(Number) as number, nickname: 'Lucía', avatar: 'fox' });
    expect(await store.players.list()).toEqual([lucia]);
  });

  it('PRF-01 lists the players in the order they were created', async () => {
    const lucia = await store.players.create({ nickname: 'Lucía', avatar: 'fox' });
    const pablo = await store.players.create({ nickname: 'Pablo', avatar: 'panda' });

    expect((await store.players.list()).map((player) => player.nickname)).toEqual([
      'Lucía',
      'Pablo',
    ]);
    expect(pablo.id).not.toBe(lucia.id);
  });

  it('PRF-04 changes the nickname and avatar of a player, who keeps their place in the list', async () => {
    const lucia = await store.players.create({ nickname: 'Lucía', avatar: 'fox' });
    const pablo = await store.players.create({ nickname: 'Pablo', avatar: 'panda' });

    await store.players.update({ ...lucia, nickname: 'Lu', avatar: 'owl' });

    expect(await store.players.list()).toEqual([
      { id: lucia.id, nickname: 'Lu', avatar: 'owl' },
      pablo,
    ]);
  });

  it('PRF-04 saving a player without changes does not fail', async () => {
    const lucia = await store.players.create({ nickname: 'Lucía', avatar: 'fox' });

    await store.players.update({ ...lucia });

    expect(await store.players.list()).toEqual([lucia]);
  });

  it('PRF-04 changing a player or round read from the store does not change the store', async () => {
    const lucia = await store.players.create({ nickname: 'Lucía', avatar: 'fox' });
    await store.rounds.add(round(lucia.id, 1_000));

    const [listed] = (await store.players.list()) as { nickname: string }[];
    if (listed) listed.nickname = 'Otra';
    const [saved] = (await store.rounds.listByPlayer(lucia.id)) as unknown as {
      missed: string[];
    }[];
    saved?.missed.push('FR');

    expect(await store.players.list()).toEqual([lucia]);
    expect((await store.rounds.listByPlayer(lucia.id))[0]?.missed).toEqual(['PT', 'BE']);
  });

  it('PRF-04 refuses to update a player that does not exist', async () => {
    await expect(
      store.players.update({ id: 99, nickname: 'Nadie', avatar: 'fox' }),
    ).rejects.toThrow(RangeError);
    expect(await store.players.list()).toEqual([]);
  });

  it('HIS-01 saves a completed round with every field of HIS-01', async () => {
    const lucia = await store.players.create({ nickname: 'Lucía', avatar: 'fox' });

    const saved = await store.rounds.add(round(lucia.id, 1_000));

    expect(saved).toEqual({ ...round(lucia.id, 1_000), id: expect.any(Number) as number });
    expect(await store.rounds.listByPlayer(lucia.id)).toEqual([saved]);
  });

  it('HIS-01 each player gets only their own rounds, newest first', async () => {
    const lucia = await store.players.create({ nickname: 'Lucía', avatar: 'fox' });
    const pablo = await store.players.create({ nickname: 'Pablo', avatar: 'panda' });
    // Saved out of date order, so neither the saving order nor its reverse is newest first.
    await store.rounds.add(round(lucia.id, 1_000, { score: 5, stars: 1 }));
    await store.rounds.add(round(pablo.id, 2_000, { score: 10, stars: 3 }));
    await store.rounds.add(round(lucia.id, 3_000, { game: 'FLAG-B' }));
    await store.rounds.add(round(lucia.id, 500, { score: 7 }));

    const rounds = await store.rounds.listByPlayer(lucia.id);

    expect(rounds.map((saved) => [saved.playedAt, saved.game, saved.score])).toEqual([
      [3_000, 'FLAG-B', 8],
      [1_000, 'FLAG-A', 5],
      [500, 'FLAG-A', 7],
    ]);
  });

  it('HIS-01 rounds saved in the same millisecond are listed newest first', async () => {
    const lucia = await store.players.create({ nickname: 'Lucía', avatar: 'fox' });
    await store.rounds.add(round(lucia.id, 1_000, { score: 4 }));
    await store.rounds.add(round(lucia.id, 1_000, { score: 9 }));

    const rounds = await store.rounds.listByPlayer(lucia.id);

    expect(rounds.map((saved) => saved.score)).toEqual([9, 4]);
  });

  it('PRF-01 remembers the last player', async () => {
    const lucia = await store.players.create({ nickname: 'Lucía', avatar: 'fox' });
    const pablo = await store.players.create({ nickname: 'Pablo', avatar: 'panda' });

    expect(await store.players.lastPlayerId()).toBeNull();
    await store.players.setLastPlayerId(lucia.id);
    await store.players.setLastPlayerId(pablo.id);

    expect(await store.players.lastPlayerId()).toBe(pablo.id);
  });

  it('PRF-04 deleting a player deletes their rounds and keeps the other players', async () => {
    const lucia = await store.players.create({ nickname: 'Lucía', avatar: 'fox' });
    const pablo = await store.players.create({ nickname: 'Pablo', avatar: 'panda' });
    for (const playedAt of [1_000, 2_000, 3_000]) await store.rounds.add(round(lucia.id, playedAt));
    const pabloRound = await store.rounds.add(round(pablo.id, 4_000));

    await store.players.delete(lucia.id);

    expect(await store.players.list()).toEqual([pablo]);
    expect(await store.rounds.listByPlayer(lucia.id)).toEqual([]);
    expect(await store.rounds.listByPlayer(pablo.id)).toEqual([pabloRound]);
  });

  it('PRF-04 deleting the last player forgets them as the last player', async () => {
    const lucia = await store.players.create({ nickname: 'Lucía', avatar: 'fox' });
    const pablo = await store.players.create({ nickname: 'Pablo', avatar: 'panda' });
    await store.players.setLastPlayerId(lucia.id);

    await store.players.delete(pablo.id);
    expect(await store.players.lastPlayerId()).toBe(lucia.id);

    await store.players.delete(lucia.id);
    expect(await store.players.lastPlayerId()).toBeNull();
  });

  it('PRF-04 a new player never gets the rounds of a deleted one', async () => {
    const lucia = await store.players.create({ nickname: 'Lucía', avatar: 'fox' });
    await store.rounds.add(round(lucia.id, 1_000));
    await store.players.delete(lucia.id);

    const newcomer = await store.players.create({ nickname: 'Lucía', avatar: 'fox' });

    expect(newcomer.id).not.toBe(lucia.id);
    expect(await store.rounds.listByPlayer(newcomer.id)).toEqual([]);
  });

  it('NFR-04 never keeps fields that are not a nickname, an avatar or a result', async () => {
    const extraPlayer = { nickname: 'Lucía', avatar: 'fox', realName: 'Lucía García', age: 8 };
    const lucia = await store.players.create(extraPlayer);
    await store.players.update({ ...lucia, email: 'lucia@example.com' } as typeof lucia);
    const extraRound = { ...round(lucia.id, 1_000), question: { flag: 'PT' } };
    await store.rounds.add(extraRound);

    expect(Object.keys((await store.players.list())[0] ?? {}).sort()).toEqual([
      'avatar',
      'id',
      'nickname',
    ]);
    expect(Object.keys((await store.rounds.listByPlayer(lucia.id))[0] ?? {}).sort()).toEqual(
      HIS_01_FIELDS,
    );
  });

  it('HIS-01 a saved round does not change when the caller changes its own copy', async () => {
    const lucia = await store.players.create({ nickname: 'Lucía', avatar: 'fox' });
    const missed = ['PT', 'BE'];
    await store.rounds.add(round(lucia.id, 1_000, { missed }));
    missed.push('FR');

    const [saved] = await store.rounds.listByPlayer(lucia.id);

    expect(saved?.missed).toEqual(['PT', 'BE']);
  });
});

describe('game store on the device (IndexedDB)', () => {
  let indexedDB: IDBFactory;
  const stores: GameStore[] = [];

  /** Opening the store again on the same IndexedDB is what happens when the game is opened again. */
  async function openGame(): Promise<GameStore> {
    const store = await openStore({ indexedDB, IDBKeyRange });
    stores.push(store);
    return store;
  }

  beforeEach(() => {
    indexedDB = new IDBFactory();
  });

  afterEach(() => {
    for (const store of stores.splice(0)) store.close();
  });

  it('NFR-04 players, their rounds and the last player survive closing the game', async () => {
    const first = await openGame();
    const lucia = await first.players.create({ nickname: 'Lucía', avatar: 'fox' });
    const pablo = await first.players.create({ nickname: 'Pablo', avatar: 'panda' });
    const saved = await first.rounds.add(round(lucia.id, 1_000));
    await first.players.setLastPlayerId(pablo.id);
    first.close();

    const again = await openGame();

    expect(await again.players.list()).toEqual([lucia, pablo]);
    expect(await again.rounds.listByPlayer(lucia.id)).toEqual([saved]);
    expect(await again.players.lastPlayerId()).toBe(pablo.id);
  });

  it('PRF-04 a deleted player and their rounds are gone from the device', async () => {
    const store = await openGame();
    const lucia = await store.players.create({ nickname: 'Lucía', avatar: 'fox' });
    const pablo = await store.players.create({ nickname: 'Pablo', avatar: 'panda' });
    for (const playedAt of [1_000, 2_000, 3_000]) await store.rounds.add(round(lucia.id, playedAt));
    await store.rounds.add(round(pablo.id, 4_000));
    await store.players.setLastPlayerId(lucia.id);

    await store.players.delete(lucia.id);
    store.close();

    // Read the database as it is stored, without the repository.
    const raw = new Dexie(DATABASE_NAME, { indexedDB, IDBKeyRange });
    await raw.open();
    const players = await raw.table('players').toArray();
    const rounds = await raw.table<{ playerId: number }>('rounds').toArray();
    const settings = await raw.table('settings').toArray();
    raw.close();

    expect(players).toEqual([pablo]);
    expect(rounds.map((stored) => stored.playerId)).toEqual([pablo.id]);
    expect(settings).toEqual([]);
  });

  it('NFR-04 stores only a nickname and an avatar per player and the fields of HIS-01 per round', async () => {
    const store = await openGame();
    const lucia = await store.players.create({
      nickname: 'Lucía',
      avatar: 'fox',
      realName: 'Lucía García',
      age: 8,
    } as PlayerData);
    await store.players.update({ ...lucia, email: 'lucia@example.com' } as Player);
    await store.rounds.add({ ...round(lucia.id, 1_000), entities: ['PT'] } as RoundData);
    store.close();

    const raw = new Dexie(DATABASE_NAME, { indexedDB, IDBKeyRange });
    await raw.open();
    const [player] = await raw.table<object>('players').toArray();
    const [stored] = await raw.table<object>('rounds').toArray();
    raw.close();

    expect(Object.keys(player ?? {}).sort()).toEqual(['avatar', 'id', 'nickname']);
    expect(Object.keys(stored ?? {}).sort()).toEqual(HIS_01_FIELDS);
  });

  it.each([
    ['refuses to open it', throwingIndexedDB],
    ['fails the open request', failingIndexedDB],
    ['has no IndexedDB at all', undefined],
  ])(
    'NFR-04 the game still works when the browser %s, until the page is closed',
    async (_case, blocked) => {
      const store = await openStore({ indexedDB: blocked, IDBKeyRange });
      const lucia = await store.players.create({ nickname: 'Lucía', avatar: 'fox' });
      const saved = await store.rounds.add(round(lucia.id, 1_000));

      expect(await store.players.list()).toEqual([lucia]);
      expect(await store.rounds.listByPlayer(lucia.id)).toEqual([saved]);
      store.close();

      const reopened = await openStore({ indexedDB: blocked, IDBKeyRange });
      expect(await reopened.players.list()).toEqual([]);
      reopened.close();
    },
  );
});
