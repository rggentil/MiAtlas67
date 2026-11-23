import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { countries } from '../data/countries.ts';
import { relations } from '../data/relations.ts';
import { generateRound, type Question } from '../domain/questions.ts';
import { createRng } from '../domain/random.ts';
import type { Sound, SoundPlayer } from '../sound/sounds.ts';
import { SOUND_STORAGE_KEY } from '../sound/storage.ts';
import type { PlayerData } from '../storage/store.ts';
import { deviceWith, LUCIA, renderApp } from '../test/app.tsx';

const PABLO: PlayerData = { nickname: 'Pablo', avatar: 'owl' };

/** The first round of a visit with ?seed=42 in "Bandera → País · Europa · Fácil". */
const ROUND = generateRound(
  countries,
  { topic: 'flags', region: 'europe', level: 1 },
  createRng(42),
  relations,
);

/** A player that records each sound, and what was on screen when it played. */
function spyPlayer() {
  const played: Sound[] = [];
  const shown: string[] = [];
  const player: SoundPlayer = {
    play: (sound) => {
      played.push(sound);
      shown.push(document.body.textContent);
    },
  };
  return { player, played, shown };
}

function wrongName(question: Question): string {
  const wrong = question.options.find((option) => option.code !== question.entity.code);
  if (!wrong) throw new Error('A question always has wrong options');
  return wrong.name.es;
}

const soundSwitch = () => screen.getByRole('switch', { name: 'Sonido' });
const feedback = () => screen.getByRole('status');

async function chooseLuciaAndStart(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: 'Lucía' }));
  await userEvent.click(screen.getByRole('button', { name: /^Bandera → País/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Europa' }));
  await userEvent.click(screen.getByRole('button', { name: 'Fácil' }));
}

/** Answers question `index` rightly or wrongly. */
async function answer(index: number, right: boolean): Promise<void> {
  const question = ROUND[index];
  if (!question) throw new Error(`No question ${String(index)}`);
  await userEvent.click(
    screen.getByRole('button', { name: right ? question.entity.name.es : wrongName(question) }),
  );
}

async function nextQuestion(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
}

describe('App · sound (SET-02, D35)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?seed=42');
  });
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, '', '/');
  });

  it('RND-04 a correct answer plays the "correct" sound once, after "¡Correcto!" and its ✓ are on screen', async () => {
    const { player, played, shown } = spyPlayer();
    await renderApp(undefined, player);
    await chooseLuciaAndStart();

    await answer(0, true);

    expect(played).toEqual(['correct']);
    expect(shown[0]).toContain('¡Correcto!');
    expect(feedback()).toHaveTextContent('¡Correcto!');
    expect(within(feedback()).getByRole('img', { name: 'Correcta' })).toBeVisible();
  });

  it('RND-04 D16 a wrong answer plays the "wrong" sound once, after the ✗ and "¡Uy! Era …" are on screen', async () => {
    const { player, played, shown } = spyPlayer();
    await renderApp(undefined, player);
    await chooseLuciaAndStart();

    await answer(0, false);

    expect(played).toEqual(['wrong']);
    expect(shown[0]).toContain('¡Uy!');
    expect(feedback()).toHaveTextContent('¡Uy!');
    expect(screen.getAllByRole('img', { name: 'Incorrecta' })[0]).toBeVisible();
  });

  it('SET-02 one sound per answer: tapping the options again, disabled now, plays nothing', async () => {
    const { player, played } = spyPlayer();
    await renderApp(undefined, player);
    await chooseLuciaAndStart();
    await answer(0, true);

    const question = ROUND[0];
    if (!question) throw new Error('No question');
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    for (const option of question.options) {
      await user.click(screen.getByRole('button', { name: option.name.es }));
    }

    expect(played).toEqual(['correct']);
  });

  it('RND-08 finishing a round plays the "round end" sound once, when the summary opens', async () => {
    const { player, played, shown } = spyPlayer();
    await renderApp(undefined, player);
    await chooseLuciaAndStart();

    for (let index = 0; index < 10; index += 1) {
      await answer(index, index % 3 !== 0);
      if (index < 9) await nextQuestion();
    }
    expect(played.filter((sound) => sound === 'roundEnd')).toHaveLength(0);
    await nextQuestion();

    expect(played.filter((sound) => sound === 'roundEnd')).toHaveLength(1);
    expect(played.at(-1)).toBe('roundEnd');
    expect(played).toHaveLength(11);
    expect(shown.at(-1)).toContain('Jugar otra vez');
    expect(screen.getByRole('button', { name: 'Jugar otra vez' })).toBeVisible();
  });

  it('SET-02 the switch "Sonido" is on the first time, on «¿Quién juega?» and on the home screen', async () => {
    await renderApp(undefined, spyPlayer().player);

    expect(
      within(screen.getByRole('contentinfo')).getByRole('switch', { name: 'Sonido' }),
    ).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Lucía' }));
    expect(
      within(screen.getByRole('contentinfo')).getByRole('switch', { name: 'Sonido' }),
    ).toBeChecked();
  });

  it('SET-02 with "Sonido" off, a round right and wrong to its summary plays nothing, with the same feedback', async () => {
    const { player, played } = spyPlayer();
    await renderApp(undefined, player);
    await userEvent.click(screen.getByRole('button', { name: 'Lucía' }));
    await userEvent.click(soundSwitch());
    expect(soundSwitch()).not.toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: /^Bandera → País/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Europa' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fácil' }));

    await answer(0, true);
    expect(feedback()).toHaveTextContent('¡Correcto!');
    expect(within(feedback()).getByRole('img', { name: 'Correcta' })).toBeVisible();
    await nextQuestion();
    await answer(1, false);
    expect(feedback()).toHaveTextContent('¡Uy!');
    expect(screen.getAllByRole('img', { name: 'Incorrecta' })[0]).toBeVisible();
    for (let index = 1; index < 10; index += 1) {
      if (index > 1) await answer(index, true);
      await nextQuestion();
    }

    expect(screen.getByRole('button', { name: 'Jugar otra vez' })).toBeVisible();
    expect(played).toEqual([]);
  });

  it('SET-02 the choice is kept on the device for every player: after a reload, Pablo has it off too', async () => {
    const store = await deviceWith({ players: [LUCIA, PABLO] });
    await renderApp(store, spyPlayer().player);
    await userEvent.click(soundSwitch());
    expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe('off');

    cleanup();
    await renderApp(store, spyPlayer().player);
    expect(soundSwitch()).not.toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Pablo' }));

    expect(soundSwitch()).not.toBeChecked();
  });

  it('SET-02 with blocked storage the sound is on, and the switch works until the page is reloaded', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage is disabled', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is disabled', 'SecurityError');
    });
    const store = await deviceWith();
    await renderApp(store, spyPlayer().player);

    expect(soundSwitch()).toBeChecked();
    await userEvent.click(soundSwitch());
    expect(soundSwitch()).not.toBeChecked();

    cleanup();
    await renderApp(store, spyPlayer().player);
    expect(soundSwitch()).toBeChecked();
  });

  it('SET-02 a browser that cannot play sound: the round works as without sound, with no error shown', async () => {
    const failing: SoundPlayer = {
      play: () => {
        throw new Error('NotAllowedError');
      },
    };
    await renderApp(undefined, failing);
    await chooseLuciaAndStart();

    await answer(0, false);

    expect(feedback()).toHaveTextContent('¡Uy!');
    await nextQuestion();
    expect(screen.getByText('2/10')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('NFR-06 SET-02 in English the switch is called "Sound"', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    const { player, played } = spyPlayer();
    await renderApp(undefined, player);

    expect(screen.getByRole('switch', { name: 'Sound' })).toBeChecked();
    await userEvent.click(screen.getByRole('switch', { name: 'Sound' }));
    expect(screen.getByRole('switch', { name: 'Sound' })).not.toBeChecked();
    expect(played).toEqual([]);
  });
});
