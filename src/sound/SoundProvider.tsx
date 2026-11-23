import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { SoundContext, type SoundValue } from './context.ts';
import type { Sound, SoundPlayer } from './sounds.ts';
import { loadSoundOn, saveSoundOn } from './storage.ts';

interface SoundProviderProps {
  /** What plays the sounds: Web Audio in the game, a spy in tests. */
  player: SoundPlayer;
  children: ReactNode;
}

/** Holds the switch «Sonido», stored on the device for every player (SET-02, D35), and plays the sounds. */
export function SoundProvider({ player, children }: SoundProviderProps) {
  const [soundOn, setSoundOnState] = useState(() => loadSoundOn());

  const setSoundOn = useCallback((on: boolean) => {
    setSoundOnState(on);
    saveSoundOn(on);
  }, []);

  const play = useCallback(
    (sound: Sound) => {
      if (!soundOn) return;
      try {
        player.play(sound);
      } catch {
        // A sound must never break the round (D35).
      }
    },
    [soundOn, player],
  );

  const prepare = useCallback(() => {
    if (!soundOn) return;
    try {
      player.prepare?.();
    } catch {
      // A sound must never break the round (D35).
    }
  }, [soundOn, player]);

  const value = useMemo<SoundValue>(
    () => ({ soundOn, setSoundOn, play, prepare }),
    [soundOn, setSoundOn, play, prepare],
  );

  return <SoundContext value={value}>{children}</SoundContext>;
}
