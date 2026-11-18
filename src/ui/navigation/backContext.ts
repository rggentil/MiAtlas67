import { createContext } from 'react';

/** What the back button does on the current screen. */
export type BackHandler = () => void;

export interface BackControls {
  /** Registers what the back button does on the current screen (NAV-01). */
  register: (handler: BackHandler | null) => void;
  /** While held, the game adds no history entries: from "¿Salir del juego?", Back leaves (NAV-02). */
  hold: (held: boolean) => void;
}

/** Lets the current screen talk to `BackButtonProvider`. */
export const BackContext = createContext<BackControls>({
  register: () => undefined,
  hold: () => undefined,
});

/**
 * How many history entries of its own the game keeps above the page while away from home: Back can be
 * pressed this many times in a row (e.g. in a round: ask, close the question, ask again) before it leaves.
 */
export const GAME_ENTRIES = 3;

/** On the home screen the game keeps one: Back asks "¿Salir del juego?", and Back again leaves (NAV-02). */
export const HOME_ENTRIES = 1;
