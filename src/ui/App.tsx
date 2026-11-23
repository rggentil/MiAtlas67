import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { newRound } from '../data/rounds.ts';
import { type Level, type Question, type RoundSettings } from '../domain/questions.ts';
import { isNewRecord } from '../domain/playerProgress.ts';
import { createRng } from '../domain/random.ts';
import { unlockedLevel } from '../domain/unlocking.ts';
import type { RoundResult } from '../domain/round.ts';
import { I18nProvider } from '../i18n/I18nProvider.tsx';
import type { SoundPlayer } from '../sound/sounds.ts';
import { SoundProvider } from '../sound/SoundProvider.tsx';
import { createWebAudioPlayer } from '../sound/webAudio.ts';
import { openStore } from '../storage/indexedDbStore.ts';
import {
  roundToSave,
  type GameStore,
  type Player,
  type PlayerData,
  type SavedRound,
} from '../storage/store.ts';
import { BackButtonProvider } from './navigation/BackButtonProvider.tsx';
import { getGameSeed } from './gameSeed.ts';
import type { PlayableGame } from './games.ts';
import { AboutScreen } from './screens/AboutScreen.tsx';
import { AtlasScreen } from './screens/AtlasScreen.tsx';
import { GameSetupScreen } from './screens/GameSetupScreen.tsx';
import { HistoryScreen } from './screens/HistoryScreen.tsx';
import { HomeScreen } from './screens/HomeScreen.tsx';
import { PlayerFormScreen } from './screens/PlayerFormScreen.tsx';
import { PlayersScreen } from './screens/PlayersScreen.tsx';
import { ProgressScreen } from './screens/ProgressScreen.tsx';
import { RecordsScreen } from './screens/RecordsScreen.tsx';
import { RoundScreen } from './screens/RoundScreen.tsx';
import { SummaryScreen } from './screens/SummaryScreen.tsx';

// Dev-only component showcase: left out of production builds (import.meta.env.DEV is false there).
const Showcase = import.meta.env.DEV ? lazy(() => import('./dev/Showcase.tsx')) : null;

type Screen =
  | { readonly name: 'players' }
  | { readonly name: 'newPlayer' }
  | { readonly name: 'editPlayer'; readonly player: Player }
  | { readonly name: 'home' }
  /** "Acerca de" opens with or without a player, and goes back to where it was opened (D33). */
  | { readonly name: 'about'; readonly from: 'players' | 'home' }
  /** The Atlas, like "Acerca de", opens with or without a player (ATL-02, D34). */
  | { readonly name: 'atlas'; readonly from: 'players' | 'home' }
  | { readonly name: 'history' }
  | { readonly name: 'progress' }
  | { readonly name: 'records' }
  | { readonly name: 'setup'; readonly game: PlayableGame }
  | {
      readonly name: 'round';
      readonly game: PlayableGame;
      readonly settings: RoundSettings;
      readonly questions: readonly Question[];
      /** Counts the rounds of the visit, so every new round starts with a fresh screen. */
      readonly number: number;
    }
  | {
      readonly name: 'summary';
      readonly game: PlayableGame;
      readonly settings: RoundSettings;
      readonly result: RoundResult;
      readonly number: number;
      /** The round beat the player's best there (RND-08, D23); known a moment after the summary opens. */
      readonly newRecord: boolean;
      /** The level the round opened (RND-08, LVL-04), or `null`; known at the same moment as the record. */
      readonly unlocked: Level | null;
    };

/** The screens that need a player: all but "¿Quién juega?", the player form, "Acerca de" and the Atlas. */
type GameScreen = Exclude<
  Screen,
  { readonly name: 'players' | 'newPlayer' | 'editPlayer' | 'about' | 'atlas' }
>;

const PLAYERS: Screen = { name: 'players' };
const HOME: Screen = { name: 'home' };
const NO_PLAYERS: readonly Player[] = [];

/** The players of the device and who played last, as read from the store (PRF-01). */
interface Roster {
  readonly players: readonly Player[];
  readonly lastPlayerId: number | null;
}

/** The store given, or the device's own one, opened once (IndexedDB, or memory when it is blocked). */
function useGameStore(given: GameStore | undefined): GameStore | null {
  const [opened, setOpened] = useState<GameStore | null>(null);

  useEffect(() => {
    if (given) return;
    let live = true;
    let store: GameStore | null = null;
    void openStore().then((ready) => {
      if (live) {
        store = ready;
        setOpened(ready);
      } else {
        ready.close();
      }
    });
    return () => {
      live = false;
      store?.close();
    };
  }, [given]);

  return given ?? opened;
}

/** The players, read once the store is open; `null` until then. */
function useRoster(store: GameStore | null) {
  const [roster, setRoster] = useState<Roster | null>(null);

  useEffect(() => {
    if (!store) return;
    let live = true;
    void Promise.all([store.players.list(), store.players.lastPlayerId()]).then(
      ([players, lastPlayerId]) => {
        if (live) setRoster({ players, lastPlayerId });
      },
    );
    return () => {
      live = false;
    };
  }, [store]);

  return [roster, setRoster] as const;
}

/**
 * Moves between the screens. The URL does not change, so `?seed=` stays for the whole visit: the first
 * round with `?seed=42` is `newRound(…, createRng(42))`, and later rounds go on with the same
 * generator (NFR-07). The game opens on "¿Quién juega?" (PRF-01); away from it, the back button goes back
 * inside the game (NAV-01, D22).
 */
function Screens({ givenStore }: { givenStore: GameStore | undefined }) {
  const store = useGameStore(givenStore);
  const [roster, setRoster] = useRoster(store);
  const [player, setPlayer] = useState<Player | null>(null);
  const [screen, setScreen] = useState<Screen>(PLAYERS);
  const [rng] = useState(() => createRng(getGameSeed()));
  // The round being saved: the history waits for it, so a round just played is always listed.
  const saving = useRef<Promise<unknown>>(Promise.resolve());

  /**
   * Saves a completed round of the player who plays (HIS-01); a quit round never gets here (RND-07). First it
   * compares it with the player's earlier rounds: a new best shows "¡Nuevo récord!" on the summary of round
   * `number` (RND-08, D23), and a level it opens shows "¡Nivel desbloqueado!" (LVL-04).
   */
  function saveRound(
    game: PlayableGame,
    settings: RoundSettings,
    result: RoundResult,
    number: number,
  ) {
    if (!store || !player) return;
    const played = {
      playerId: player.id,
      playedAt: Date.now(),
      game: game.id,
      region: settings.region,
      level: settings.level,
    };
    saving.current = saving.current
      // Without the earlier rounds there is no record nor level unlocked to show (an empty history would make
      // every ★★ "unlock" a level that may be open already), but the round is still saved.
      .then(() => store.rounds.listByPlayer(played.playerId).catch(() => null))
      .then((previous) => {
        if (previous === null) return store.rounds.add(roundToSave(played, result));
        // Both are decided before the round is saved: a test that waits for the save knows them.
        const newRecord = isNewRecord(
          previous,
          game.id,
          settings.region,
          settings.level,
          result.score,
        );
        const unlocked = unlockedLevel(
          previous,
          game.id,
          settings.region,
          settings.level,
          result.stars,
        );
        if (newRecord || unlocked !== null) {
          setScreen((current) =>
            current.name === 'summary' && current.number === number
              ? { ...current, newRecord, unlocked }
              : current,
          );
        }
        return store.rounds.add(roundToSave(played, result));
      })
      .catch(() => undefined);
  }

  const loadRounds = useCallback(async (): Promise<readonly SavedRound[]> => {
    await saving.current;
    return store && player ? store.rounds.listByPlayer(player.id) : [];
  }, [store, player]);

  /** The rounds of every player, for the family records (HIS-05); a round just played is among them. */
  const loadAllRounds = useCallback(async (): Promise<readonly SavedRound[]> => {
    await saving.current;
    return store ? store.rounds.listAll() : [];
  }, [store]);

  // Generated in event handlers, never during render, so StrictMode cannot draw twice.
  function startRound(game: PlayableGame, settings: RoundSettings, number: number) {
    const questions = newRound(settings, rng);
    setScreen({ name: 'round', game, settings, questions, number });
  }

  function play(chosen: Player, players: readonly Player[]) {
    setRoster({ players, lastPlayerId: chosen.id });
    setPlayer(chosen);
    setScreen(HOME);
    void store?.players.setLastPlayerId(chosen.id);
  }

  async function createPlayer(data: PlayerData): Promise<void> {
    if (!store || !roster) throw new Error('The players are not read yet');
    const created = await store.players.create(data);
    play(created, [...roster.players, created]);
  }

  /** Saves the new nickname and avatar of `edited`; its rounds stay with it (PRF-04). */
  async function updatePlayer(edited: Player, data: PlayerData): Promise<void> {
    if (!store || !roster) throw new Error('The players are not read yet');
    const updated: Player = { ...edited, ...data };
    await store.players.update(updated);
    setRoster({
      ...roster,
      players: roster.players.map((other) => (other.id === updated.id ? updated : other)),
    });
    setScreen(PLAYERS);
  }

  /** Deletes `deleted` and its rounds from the device (PRF-04, NFR-04). */
  async function deletePlayer(deleted: Player): Promise<void> {
    if (!store || !roster) throw new Error('The players are not read yet');
    await store.players.delete(deleted.id);
    setRoster({
      players: roster.players.filter((other) => other.id !== deleted.id),
      lastPlayerId: roster.lastPlayerId === deleted.id ? null : roster.lastPlayerId,
    });
    setScreen(PLAYERS);
  }

  function backToPlayers() {
    setScreen(PLAYERS);
  }

  return (
    <BackButtonProvider away={screen.name !== 'players'}>
      {screen.name === 'players' ? (
        <PlayersScreen
          players={roster?.players ?? null}
          lastPlayerId={roster?.lastPlayerId ?? null}
          onChoose={(chosen) => {
            play(chosen, roster?.players ?? [chosen]);
          }}
          onNewPlayer={() => {
            setScreen({ name: 'newPlayer' });
          }}
          onEdit={(edited) => {
            setScreen({ name: 'editPlayer', player: edited });
          }}
          onOpenAtlas={() => {
            setScreen({ name: 'atlas', from: 'players' });
          }}
          onOpenAbout={() => {
            setScreen({ name: 'about', from: 'players' });
          }}
        />
      ) : screen.name === 'about' ? (
        <AboutScreen
          onBack={() => {
            setScreen(screen.from === 'home' && player ? HOME : PLAYERS);
          }}
        />
      ) : screen.name === 'atlas' ? (
        <AtlasScreen
          onBack={() => {
            setScreen(screen.from === 'home' && player ? HOME : PLAYERS);
          }}
        />
      ) : screen.name === 'newPlayer' ? (
        <PlayerFormScreen
          players={roster?.players ?? []}
          onBack={backToPlayers}
          onSave={createPlayer}
        />
      ) : screen.name === 'editPlayer' ? (
        <PlayerFormScreen
          players={roster?.players ?? []}
          editing={screen.player}
          onBack={backToPlayers}
          onSave={(data) => updatePlayer(screen.player, data)}
          onDelete={() => deletePlayer(screen.player)}
        />
      ) : (
        player && (
          <CurrentScreen
            screen={screen}
            player={player}
            setScreen={setScreen}
            startRound={startRound}
            saveRound={saveRound}
            loadRounds={loadRounds}
            loadAllRounds={loadAllRounds}
            players={roster?.players ?? NO_PLAYERS}
          />
        )
      )}
    </BackButtonProvider>
  );
}

interface CurrentScreenProps {
  screen: GameScreen;
  player: Player;
  setScreen: (screen: Screen) => void;
  startRound: (game: PlayableGame, settings: RoundSettings, number: number) => void;
  saveRound: (
    game: PlayableGame,
    settings: RoundSettings,
    result: RoundResult,
    number: number,
  ) => void;
  loadRounds: () => Promise<readonly SavedRound[]>;
  loadAllRounds: () => Promise<readonly SavedRound[]>;
  /** The players on the device. */
  players: readonly Player[];
}

function CurrentScreen({
  screen,
  player,
  setScreen,
  startRound,
  saveRound,
  loadRounds,
  loadAllRounds,
  players,
}: CurrentScreenProps) {
  switch (screen.name) {
    case 'home':
      return (
        <HomeScreen
          player={player}
          onOpenGame={(game) => {
            setScreen({ name: 'setup', game });
          }}
          onSwitchPlayer={() => {
            setScreen(PLAYERS);
          }}
          onOpenHistory={() => {
            setScreen({ name: 'history' });
          }}
          onOpenProgress={() => {
            setScreen({ name: 'progress' });
          }}
          onOpenRecords={() => {
            setScreen({ name: 'records' });
          }}
          onOpenAtlas={() => {
            setScreen({ name: 'atlas', from: 'home' });
          }}
          onOpenAbout={() => {
            setScreen({ name: 'about', from: 'home' });
          }}
          onBack={() => {
            setScreen(PLAYERS);
          }}
        />
      );
    case 'history':
      return (
        <HistoryScreen
          loadRounds={loadRounds}
          onBack={() => {
            setScreen(HOME);
          }}
        />
      );
    case 'records':
      return (
        <RecordsScreen
          loadRounds={loadAllRounds}
          players={players}
          onBack={() => {
            setScreen(HOME);
          }}
        />
      );
    case 'progress':
      return (
        <ProgressScreen
          loadRounds={loadRounds}
          onBack={() => {
            setScreen(HOME);
          }}
        />
      );
    case 'setup':
      return (
        <GameSetupScreen
          game={screen.game}
          loadRounds={loadRounds}
          onBack={() => {
            setScreen(HOME);
          }}
          onStart={(settings) => {
            startRound(screen.game, settings, 1);
          }}
        />
      );
    case 'round':
      return (
        <RoundScreen
          key={screen.number}
          game={screen.game}
          settings={screen.settings}
          questions={screen.questions}
          onQuit={() => {
            setScreen(HOME);
          }}
          onFinish={(result) => {
            setScreen({ ...screen, name: 'summary', result, newRecord: false, unlocked: null });
            saveRound(screen.game, screen.settings, result, screen.number);
          }}
        />
      );
    case 'summary':
      return (
        <SummaryScreen
          game={screen.game}
          settings={screen.settings}
          result={screen.result}
          newRecord={screen.newRecord}
          unlocked={screen.unlocked}
          onPlayAgain={() => {
            startRound(screen.game, screen.settings, screen.number + 1);
          }}
          onMenu={() => {
            setScreen(HOME);
          }}
        />
      );
  }
}

interface AppProps {
  /** Where players and rounds are kept; the device's IndexedDB when not given (tests give a memory one). */
  store?: GameStore;
  /** What plays the sounds (SET-02); the browser's Web Audio when not given (tests give a spy). */
  sound?: SoundPlayer;
}

/** The device's sounds: its audio context is created on the first sound, after a tap. */
const webAudio = createWebAudioPlayer();

export function App({ store, sound = webAudio }: AppProps = {}) {
  if (Showcase && window.location.hash === '#showcase') {
    return (
      <Suspense fallback={null}>
        <Showcase />
      </Suspense>
    );
  }

  return (
    <I18nProvider>
      <SoundProvider player={sound}>
        <Screens givenStore={store} />
      </SoundProvider>
    </I18nProvider>
  );
}
