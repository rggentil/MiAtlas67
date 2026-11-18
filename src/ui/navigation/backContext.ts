import { createContext } from 'react';

/** What the back button does on the current screen. */
export type BackHandler = () => void;

/** Lets the current screen register its back handler with `BackButtonProvider` (NAV-01). */
export const BackContext = createContext<(handler: BackHandler | null) => void>(() => undefined);

/**
 * How many history entries of its own the game keeps above the page while away from home: Back can be
 * pressed this many times in a row (e.g. in a round: ask, close the question, ask again) before it leaves.
 */
export const GAME_ENTRIES = 3;
