import { lazy, Suspense, useEffect, useState } from 'react';
import { countries } from '../data/countries.ts';
import { relations } from '../data/relations.ts';
import { generateRound, type Question, type RoundSettings } from '../domain/questions.ts';
import { createRng } from '../domain/random.ts';
import type { RoundResult } from '../domain/round.ts';
import { I18nProvider } from '../i18n/I18nProvider.tsx';
import { openStore } from '../storage/indexedDbStore.ts';
import type { GameStore, Player, PlayerData } from '../storage/store.ts';
import { BackButtonProvider } from './navigation/BackButtonProvider.tsx';
import { getGameSeed } from './gameSeed.ts';
import type { PlayableGame } from './games.ts';
import { GameSetupScreen } from './screens/GameSetupScreen.tsx';
import { HomeScreen } from './screens/HomeScreen.tsx';
import { NewPlayerScreen } from './screens/NewPlayerScreen.tsx';
import { PlayersScreen } from './screens/PlayersScreen.tsx';
import { RoundScreen } from './screens/RoundScreen.tsx';
import { SummaryScreen } from './screens/SummaryScreen.tsx';

// Dev-only component showcase: left out of production builds (import.meta.env.DEV is false there).
const Showcase = import.meta.env.DEV ? lazy(() => import('./dev/Showcase.tsx')) : null;

type Screen =
  | { readonly name: 'players' }
  | { readonly name: 'newPlayer' }
  | { readonly name: 'home' }
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
    };

/** The screens that need a player: all but "¿Quién juega?" and "Nuevo jugador". */
type GameScreen = Exclude<Screen, { readonly name: 'players' | 'newPlayer' }>;

const PLAYERS: Screen = { name: 'players' };
const HOME: Screen = { name: 'home' };

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
 * round with `?seed=42` is `generateRound(…, createRng(42), …)`, and later rounds go on with the same
 * generator (NFR-07). The game opens on "¿Quién juega?" (PRF-01); away from it, the back button goes back
 * inside the game (NAV-01, D22).
 */
function Screens({ givenStore }: { givenStore: GameStore | undefined }) {
  const store = useGameStore(givenStore);
  const [roster, setRoster] = useRoster(store);
  const [player, setPlayer] = useState<Player | null>(null);
  const [screen, setScreen] = useState<Screen>(PLAYERS);
  const [rng] = useState(() => createRng(getGameSeed()));

  // Generated in event handlers, never during render, so StrictMode cannot draw twice.
  function startRound(game: PlayableGame, settings: RoundSettings, number: number) {
    const questions = generateRound(countries, settings, rng, relations);
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
        />
      ) : screen.name === 'newPlayer' ? (
        <NewPlayerScreen
          players={roster?.players ?? []}
          onBack={() => {
            setScreen(PLAYERS);
          }}
          onCreate={createPlayer}
        />
      ) : (
        player && (
          <CurrentScreen
            screen={screen}
            player={player}
            setScreen={setScreen}
            startRound={startRound}
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
}

function CurrentScreen({ screen, player, setScreen, startRound }: CurrentScreenProps) {
  switch (screen.name) {
    case 'home':
      return (
        <HomeScreen
          player={player}
          onOpenGame={(game) => {
            setScreen({ name: 'setup', game });
          }}
          onBack={() => {
            setScreen(PLAYERS);
          }}
        />
      );
    case 'setup':
      return (
        <GameSetupScreen
          game={screen.game}
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
            setScreen({ ...screen, name: 'summary', result });
          }}
        />
      );
    case 'summary':
      return (
        <SummaryScreen
          game={screen.game}
          settings={screen.settings}
          result={screen.result}
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
}

export function App({ store }: AppProps = {}) {
  if (Showcase && window.location.hash === '#showcase') {
    return (
      <Suspense fallback={null}>
        <Showcase />
      </Suspense>
    );
  }

  return (
    <I18nProvider>
      <Screens givenStore={store} />
    </I18nProvider>
  );
}
