import { lazy, Suspense, useState } from 'react';
import type { Game } from '../domain/games.ts';
import { I18nProvider } from '../i18n/I18nProvider.tsx';
import { GameSetupScreen } from './screens/GameSetupScreen.tsx';
import { HomeScreen } from './screens/HomeScreen.tsx';

// Dev-only component showcase: left out of production builds (import.meta.env.DEV is false there).
const Showcase = import.meta.env.DEV ? lazy(() => import('./dev/Showcase.tsx')) : null;

type Screen = { readonly name: 'home' } | { readonly name: 'setup'; readonly game: Game };

const HOME: Screen = { name: 'home' };

/** Moves between the screens. The URL does not change, so `?seed=` stays for the whole visit. */
function Screens() {
  const [screen, setScreen] = useState<Screen>(HOME);

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
        />
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
