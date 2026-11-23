import { describe, expect, it, vi } from 'vitest';
import { createWebAudioPlayer } from './webAudio.ts';

/** Records what the player asks of the audio context. */
function fakeContextClass(
  options: { state?: AudioContextState; resume?: () => Promise<void> } = {},
) {
  const log = {
    contexts: 0,
    gains: 0,
    oscillators: [] as { type: string; frequency: number }[],
    resumes: 0,
  };
  const param = () => ({
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  });

  class FakeContext {
    currentTime = 0;
    destination = {};
    state: AudioContextState = options.state ?? 'running';

    constructor() {
      log.contexts += 1;
    }

    resume() {
      log.resumes += 1;
      return (options.resume ?? (() => Promise.resolve()))();
    }

    createGain() {
      log.gains += 1;
      return { gain: param(), connect: vi.fn() };
    }

    createOscillator() {
      const frequency = { value: 0, setValueAtTime: (hz: number) => (frequency.value = hz) };
      const oscillator = {
        type: 'sine',
        frequency,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      log.oscillators.push({
        get type() {
          return oscillator.type;
        },
        get frequency() {
          return frequency.value;
        },
      });
      return oscillator;
    }
  }

  return { log, Context: FakeContext as unknown as new () => AudioContext };
}

describe('Web Audio player', () => {
  it('SET-02 RND-04 each sound is one tune: a rising step when right, a soft lower one when wrong', () => {
    const { log, Context } = fakeContextClass();
    const player = createWebAudioPlayer(() => Context);

    player.play('correct');
    expect(log.gains).toBe(1);
    const right = log.oscillators.map((note) => note.frequency);
    expect(right).toHaveLength(2);
    expect(right[1]).toBeGreaterThan(right[0] ?? 0);

    player.play('wrong');
    expect(log.gains).toBe(2);
    const wrong = log.oscillators.slice(2).map((note) => note.frequency);
    expect(Math.max(...wrong)).toBeLessThan(Math.min(...right));
    expect(log.oscillators[2]?.type).toBe('sine');

    player.play('roundEnd');
    expect(log.gains).toBe(3);
    expect(log.oscillators).toHaveLength(8);
    // One audio context for the whole visit.
    expect(log.contexts).toBe(1);
  });

  it('SET-02 a browser without Web Audio plays nothing and throws nothing', () => {
    const player = createWebAudioPlayer(() => undefined);

    expect(() => {
      player.play('correct');
      player.play('roundEnd');
    }).not.toThrow();
  });

  it('SET-02 an audio context that fails to start throws nothing', () => {
    function FailingContext(): never {
      throw new Error('NotAllowedError');
    }
    const player = createWebAudioPlayer(() => FailingContext as unknown as new () => AudioContext);

    expect(() => {
      player.play('wrong');
    }).not.toThrow();
  });

  it('NFR-03 a context slow to start is resumed without waiting for it: the notes are scheduled at once', () => {
    const { log, Context } = fakeContextClass({
      state: 'suspended',
      resume: () => new Promise<void>(() => undefined),
    });
    const player = createWebAudioPlayer(() => Context);

    player.play('correct');

    expect(log.resumes).toBe(1);
    expect(log.oscillators).toHaveLength(2);
  });

  it('SET-02 a rejected resume is not an unhandled error', async () => {
    const { log, Context } = fakeContextClass({
      state: 'suspended',
      resume: () => Promise.reject(new Error('NotAllowedError')),
    });
    const player = createWebAudioPlayer(() => Context);

    player.play('correct');
    await Promise.resolve();

    expect(log.resumes).toBe(1);
  });
});
