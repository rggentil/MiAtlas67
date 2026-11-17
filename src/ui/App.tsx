import { lazy, Suspense, useState } from 'react';
import { countries } from '../data/countries.ts';
import { relations } from '../data/relations.ts';
import { generateRound, type Question, type RoundSettings } from '../domain/questions.ts';
import { createRng } from '../domain/random.ts';
import { I18nProvider } from '../i18n/I18nProvider.tsx';
import { getGameSeed } from './gameSeed.ts';
import type { PlayableGame } from './games.ts';
import { GameSetupScreen } from './screens/GameSetupScreen.tsx';
import { HomeScreen } from './screens/HomeScreen.tsx';
import { RoundScreen } from './screens/RoundScreen.tsx';

// Dev-only component showcase: left out of production builds (import.meta.env.DEV is false there).
const Showcase = import.meta.env.DEV ? lazy(() => import('./dev/Showcase.tsx')) : null;

type Screen =
  | { readonly name: 'home' }
  | { readonly name: 'setup'; readonly game: PlayableGame }
  | {
      readonly name: 'round';
      readonly game: PlayableGame;
      readonly settings: RoundSettings;
      readonly questions: readonly Question[];
    };

const HOME: Screen = { name: 'home' };

/**
 * Moves between the screens. The URL does not change, so `?seed=` stays for the whole visit: the first
 * round with `?seed=42` is `generateRound(…, createRng(42), …)`, and later rounds go on with the same
 * generator (NFR-07).
 */
function Screens() {
  const [screen, setScreen] = useState<Screen>(HOME);
  const [rng] = useState(() => createRng(getGameSeed()));

  switch (screen.name) {
    case 'home':
      return (
        <HomeScreen
          onOpenGame={(game) => {
            setScreen({ name: 'setup', game });
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
            // Generated in the event handler, never during render, so StrictMode cannot draw twice.
            const questions = generateRound(countries, settings, rng, relations);
            setScreen({ name: 'round', game: screen.game, settings, questions });
          }}
        />
      );
    case 'round':
      return (
        <RoundScreen game={screen.game} settings={screen.settings} questions={screen.questions} />
      );
  }
}

export function App() {
  if (Showcase && window.location.hash === '#showcase') {
    return (
      <Suspense fallback={null}>
        <Showcase />
      </Suspense>
    );
  }

  return (
    <I18nProvider>
      <Screens />
    </I18nProvider>
  );
}
