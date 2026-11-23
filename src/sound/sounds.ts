/** The sounds of the game (SET-02, D35): a correct answer, a soft wrong one (D16) and the end of a round. */
export type Sound = 'correct' | 'wrong' | 'roundEnd';

/** Plays a sound now. It must never throw nor wait: the answer's feedback does not depend on it (NFR-03). */
export interface SoundPlayer {
  play: (sound: Sound) => void;
  /**
   * Gets ready to play before the first sound, e.g. when a round opens: starting the audio takes long, and it
   * must not delay the first answer's ✓ or ✗ (NFR-03, D38).
   */
  prepare?: () => void;
}

/** A player that plays nothing: the default where no provider is set up (tests of a single screen). */
export const SILENT: SoundPlayer = {
  play: () => undefined,
};
