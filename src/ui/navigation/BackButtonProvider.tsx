import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { BackContext, type BackHandler } from './backContext.ts';

/** Marks the history entry the game adds above itself. The address stays the same (`?seed=` included). */
const GUARD = { miatlas: 'back' } as const;

function isGuard(state: unknown): boolean {
  return typeof state === 'object' && state !== null && 'miatlas' in state;
}

/**
 * The phone's back button (or back gesture, or the browser's Back) inside the game (NAV-01).
 *
 * While a screen other than home is open, the game keeps one history entry of its own above the page.
 * Back removes that entry: instead of leaving, the screen does what its own way back does (registered
 * with `useOnBack`), and the entry is added again if the game is still away from home. Going home in the
 * game removes the entry, so on the home screen Back leaves the game, as from any page.
 */
export function BackButtonProvider({ away, children }: { away: boolean; children: ReactNode }) {
  const handler = useRef<BackHandler | null>(null);
  const awayNow = useRef(away);
  // Whether our entry is on top. A reload keeps the entry, so the state of the current one says it.
  const guarded = useRef(isGuard(window.history.state));
  // The game called history.back() itself to remove its entry: that popstate is not the player's Back.
  const removing = useRef(false);
  // Changes on every Back, so the entry is added again after the screen has handled it.
  const [backs, setBacks] = useState(0);

  const register = useCallback((next: BackHandler | null) => {
    handler.current = next;
  }, []);

  useEffect(() => {
    awayNow.current = away;
  });

  useEffect(() => {
    function onPopState(event: PopStateEvent) {
      if (removing.current) {
        removing.current = false;
      } else if (awayNow.current) {
        guarded.current = false;
        handler.current?.();
      } else if (isGuard(event.state)) {
        // Forward again into an entry of ours while at home (desktop): it would make the next Back do
        // nothing, so it is removed too.
        guarded.current = true;
      }
      setBacks((n) => n + 1);
    }
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  useEffect(() => {
    if (removing.current) return;
    if (away && !guarded.current) {
      window.history.pushState(GUARD, '');
      guarded.current = true;
    } else if (!away && guarded.current) {
      guarded.current = false;
      removing.current = true;
      window.history.back();
    }
  }, [away, backs]);

  return <BackContext value={register}>{children}</BackContext>;
}
