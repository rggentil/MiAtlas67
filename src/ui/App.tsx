import { lazy, Suspense } from 'react';
import { Chip } from './components/Chip.tsx';

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
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="font-display text-5xl leading-tight">
        Hola MiAtlas<span className="ml-1 rounded-xl border-3 border-ink bg-accent px-2">67</span>
      </h1>
      <p className="text-lg font-extrabold text-ink-muted">
        Banderas, capitales y siluetas del mundo
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Chip tone="flags">Banderas</Chip>
        <Chip tone="capitals">Capitales</Chip>
        <Chip tone="shapes">Siluetas</Chip>
      </div>
    </main>
  );
}
