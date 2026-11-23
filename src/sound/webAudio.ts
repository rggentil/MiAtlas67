import type { Sound, SoundPlayer } from './sounds.ts';

interface Note {
  /** Hz */
  readonly frequency: number;
  /** Seconds after the sound starts. */
  readonly at: number;
  /** Seconds. */
  readonly length: number;
}

interface Tune {
  readonly wave: OscillatorType;
  readonly volume: number;
  readonly notes: readonly Note[];
}

/**
 * The three sounds, synthesized (D35): no file to download, cache or license. Each is a few notes one after the
 * other, under half a second. The wrong one is soft: lower, quieter and rounder than the right one (D16).
 */
const TUNES: Readonly<Record<Sound, Tune>> = {
  // E5 → B5, a bright rising step.
  correct: {
    wave: 'triangle',
    volume: 0.3,
    notes: [
      { frequency: 659.25, at: 0, length: 0.09 },
      { frequency: 987.77, at: 0.1, length: 0.18 },
    ],
  },
  // E♭4 → C4, a gentle "oops", never a buzzer.
  wrong: {
    wave: 'sine',
    volume: 0.18,
    notes: [
      { frequency: 311.13, at: 0, length: 0.12 },
      { frequency: 261.63, at: 0.13, length: 0.22 },
    ],
  },
  // C5 E5 G5 C6, a short fanfare.
  roundEnd: {
    wave: 'triangle',
    volume: 0.28,
    notes: [
      { frequency: 523.25, at: 0, length: 0.1 },
      { frequency: 659.25, at: 0.11, length: 0.1 },
      { frequency: 783.99, at: 0.22, length: 0.1 },
      { frequency: 1046.5, at: 0.33, length: 0.3 },
    ],
  },
};

type AudioContextClass = new () => AudioContext;

function browserAudioContext(): AudioContextClass | undefined {
  // Either may be missing at run time, whatever the DOM types say; older Safari has only the prefixed one.
  const scope = globalThis as unknown as {
    AudioContext?: AudioContextClass;
    webkitAudioContext?: AudioContextClass;
  };
  return scope.AudioContext ?? scope.webkitAudioContext;
}

/** Schedules a tune: one gain node shaped note by note, and one oscillator per note. */
function schedule(context: AudioContext, tune: Tune): void {
  const start = context.currentTime + 0.01;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.connect(context.destination);
  for (const note of tune.notes) {
    const from = start + note.at;
    const to = from + note.length;
    gain.gain.setValueAtTime(0, from);
    gain.gain.linearRampToValueAtTime(tune.volume, from + 0.01);
    gain.gain.linearRampToValueAtTime(0, to);
    const oscillator = context.createOscillator();
    oscillator.type = tune.wave;
    oscillator.frequency.setValueAtTime(note.frequency, from);
    oscillator.connect(gain);
    oscillator.start(from);
    oscillator.stop(to);
  }
}

/**
 * Plays the sounds with the Web Audio API. The audio context is created on the first sound, which comes from a
 * tap, as browsers require. Nothing here throws or waits: without Web Audio, or with a context that fails or is
 * slow to start, the game goes on in silence (D35, NFR-03).
 */
export function createWebAudioPlayer(
  getContextClass: () => AudioContextClass | undefined = browserAudioContext,
): SoundPlayer {
  let context: AudioContext | null = null;
  let unavailable = false;

  return {
    play(sound) {
      if (unavailable) return;
      try {
        if (!context) {
          const Context = getContextClass();
          if (!Context) {
            unavailable = true;
            return;
          }
          context = new Context();
        }
        if (context.state === 'suspended') {
          // Not awaited: the notes are scheduled now and play once the context runs.
          Promise.resolve(context.resume()).catch(() => undefined);
        }
        schedule(context, TUNES[sound]);
      } catch {
        // A browser that cannot play sound plays the round in silence.
      }
    },
  };
}
