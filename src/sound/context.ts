import { createContext, useContext } from 'react';
import type { Sound } from './sounds.ts';

export interface SoundValue {
  /** The switch «Sonido» (SET-02). */
  soundOn: boolean;
  setSoundOn: (on: boolean) => void;
  /** Plays `sound` if the sound is on; never throws nor waits (NFR-03). */
  play: (sound: Sound) => void;
  /** Gets the sound ready before it is needed, if it is on (NFR-03). */
  prepare: () => void;
}

/** Without a provider (a screen tested alone) the game is silent and the switch does nothing. */
const SILENT_VALUE: SoundValue = {
  soundOn: false,
  setSoundOn: () => undefined,
  play: () => undefined,
  prepare: () => undefined,
};

export const SoundContext = createContext<SoundValue>(SILENT_VALUE);

export function useSound(): SoundValue {
  return useContext(SoundContext);
}
