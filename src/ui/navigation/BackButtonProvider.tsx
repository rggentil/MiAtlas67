import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { BackContext, GAME_ENTRIES, HOME_ENTRIES, type BackHandler } from './backContext.ts';

/** How deep in the game's own entries a history entry is: 0 is the page's own entry. */
function depthOf(state: unknown): number {
  if (typeof state === 'object' && state !== null && 'miatlas' in state) {
    return typeof state.miatlas === 'number' ? state.miatlas : 0;
  }
  return 0;
}

/**
 * The phone's back button (or back gesture, or the browser's Back) inside the game (NAV-01, NAV-02).
 *
 * The game keeps a few history entries of its own above the page (the address stays the same): three away
 * from home, one on the home screen. Back moves down one of them, and the current screen does what its own
 * way back does (registered with `useOnBack`); on the home screen that is asking "¿Salir del juego?". Going
 * home removes the entries above the home one, so from the question Back leaves the game.
 *
 * Entries are only added after a tap or a key press, never on their own after a Back: Chrome's back
 * button skips every entry of a page that adds entries without a user action (history manipulation
 * intervention), so Back would leave the game instead of going back inside it.
 */
export function BackButtonProvider({ away, children }: { away: boolean; children: ReactNode }) {
  const handler = useRef<BackHandler | null>(null);
  const awayNow = useRef(away);
  // Where we are among the game's entries. A reload keeps them, so the current entry says it.
  const depth = useRef(depthOf(window.history.state));
  // A tap or key press since the last Back or Forward: only then may the game add entries.
  const acted = useRef(false);
  // The game moved through history itself, to go home: that popstate is not the player's Back.
  const leaving = useRef(false);
  // Changes on every history move, so the effect below runs again after the screen has handled it.
  const [moves, setMoves] = useState(0);

  const register = useCallback((next: BackHandler | null) => {
    handler.current = next;
  }, []);

  const topUp = useCallback(() => {
    if (!acted.current || leaving.current) return;
    const entries = awayNow.current ? GAME_ENTRIES : HOME_ENTRIES;
    while (depth.current < entries) {
      depth.current += 1;
      window.history.pushState({ miatlas: depth.current }, '');
    }
  }, []);

  useEffect(() => {
    awayNow.current = away;
  });

  useEffect(() => {
    function onAction(event: Event) {
      // Escape is not a user action for the browser (it closes the quit question).
      if (event instanceof KeyboardEvent && event.key === 'Escape') return;
      acted.current = true;
      topUp();
    }
    function onPopState(event: PopStateEvent) {
      const before = depth.current;
      depth.current = depthOf(event.state);
      acted.current = false;
      if (leaving.current) leaving.current = false;
      else if (depth.current < before) handler.current?.();
      setMoves((n) => n + 1);
    }
    window.addEventListener('click', onAction, true);
    window.addEventListener('keydown', onAction, true);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('click', onAction, true);
      window.removeEventListener('keydown', onAction, true);
      window.removeEventListener('popstate', onPopState);
    };
  }, [topUp]);

  useEffect(() => {
    if (leaving.current) return;
    if (!away && depth.current > HOME_ENTRIES) {
      // Home: the entries above the home one go, also after a reload or a Forward into them.
      leaving.current = true;
      window.history.go(HOME_ENTRIES - depth.current);
    } else {
      topUp();
    }
  }, [away, moves, topUp]);

  return <BackContext value={register}>{children}</BackContext>;
}
