import { lazy, Suspense } from 'react';
import { I18nProvider } from '../i18n/I18nProvider.tsx';
import { StartScreen } from './screens/StartScreen.tsx';

// Dev-only component showcase: left out of production builds (import.meta.env.DEV is false there).
const Showcase = import.meta.env.DEV ? lazy(() => import('./dev/Showcase.tsx')) : null;

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
      <StartScreen />
    </I18nProvider>
  );
}
