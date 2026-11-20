import {
  newestFirst,
  playerFields,
  roundFields,
  type GameStore,
  type Player,
  type SavedRound,
} from './store.ts';

/** A copy the caller can change without changing the store. */
function copyOf(round: SavedRound): SavedRound {
  return {
    ...round,
    missed: [...round.missed],
    ...(round.asked ? { asked: [...round.asked] } : {}),
  };
}

/**
 * Keeps everything in memory. It is the fallback when the browser blocks IndexedDB: the game still works,
 * and its players and rounds last until the page is closed.
 */
export function createMemoryStore(): GameStore {
  const players = new Map<number, Player>();
  let rounds: SavedRound[] = [];
  let lastPlayer: number | null = null;
  let nextPlayerId = 1;
  let nextRoundId = 1;

  return {
    players: {
      list: () => Promise.resolve([...players.values()].map(playerFields)),
      create: (data) => {
        const player = playerFields({ ...data, id: nextPlayerId++ });
        players.set(player.id, player);
        return Promise.resolve(playerFields(player));
      },
      update: (player) => {
        if (!players.has(player.id)) {
          return Promise.reject(new RangeError(`There is no player ${String(player.id)}`));
        }
        players.set(player.id, playerFields(player));
        return Promise.resolve();
      },
      delete: (id) => {
        players.delete(id);
        rounds = rounds.filter((round) => round.playerId !== id);
        if (lastPlayer === id) lastPlayer = null;
        return Promise.resolve();
      },
      lastPlayerId: () => Promise.resolve(lastPlayer),
      setLastPlayerId: (id) => {
        lastPlayer = id;
        return Promise.resolve();
      },
    },
    rounds: {
      add: (data) => {
        const round: SavedRound = { ...roundFields(data), id: nextRoundId++ };
        rounds.push(round);
        return Promise.resolve(copyOf(round));
      },
      listByPlayer: (playerId) =>
        Promise.resolve(
          rounds
            .filter((round) => round.playerId === playerId)
            .sort(newestFirst)
            .map((round) => copyOf(round)),
        ),
      listAll: () => Promise.resolve([...rounds].sort(newestFirst).map((round) => copyOf(round))),
    },
    close: () => {
      // Nothing to release.
    },
  };
}
