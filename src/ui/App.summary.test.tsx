import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { countries } from '../data/countries.ts';
import { relations } from '../data/relations.ts';
import { generateRound, type Question, type RoundSettings } from '../domain/questions.ts';
import { createRng } from '../domain/random.ts';
import { ofName } from '../i18n/names.ts';
import { flagFile } from '../test/flags.ts';
import { renderAppAsLucia } from '../test/app.tsx';

const SETTINGS: RoundSettings = { topic: 'flags', region: 'europe', level: 1 };

/** The first two rounds of a visit with ?seed=42: both drawn from the same session generator. */
function firstTwoRounds(): [Question[], Question[]] {
  const rng = createRng(42);
  return [
    generateRound(countries, SETTINGS, rng, relations),
    generateRound(countries, SETTINGS, rng, relations),
  ];
}

function wrongName(question: Question): string {
  const wrong = question.options.find((option) => option.code !== question.entity.code);
  if (!wrong) throw new Error('A question always has wrong options');
  return wrong.name.es;
}

async function startFlagsRound(game = /^Bandera → País/): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: game }));
  await userEvent.click(screen.getByRole('button', { name: 'Europa' }));
  await userEvent.click(screen.getByRole('button', { name: 'Fácil' }));
}

/** Answers the 10 questions, the ones at `wrongAt` wrongly, tapping "Siguiente" after each. */
async function play(questions: readonly Question[], wrongAt: readonly number[]): Promise<void> {
  for (const [index, question] of questions.entries()) {
    const name = wrongAt.includes(index) ? wrongName(question) : question.entity.name.es;
    await userEvent.click(screen.getByRole('button', { name }));
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  }
}

describe('App · round summary', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?seed=42');
  });
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('RND-08 after the 10th answer the summary appears; "Jugar otra vez" starts a new round of Europa · Fácil', async () => {
    const [first, second] = firstTwoRounds();
    await renderAppAsLucia();
    await startFlagsRound();

    await play(first, [2, 5]);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('¡Muy bien!');
    expect(screen.getByText('8/10')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Jugar otra vez' }));

    expect(
      within(screen.getByRole('list', { name: 'Esta partida' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Banderas', 'Europa', 'Fácil']);
    expect(screen.getByText('1/10')).toBeVisible();
    expect(screen.getByText('Aciertos: 0')).toBeVisible();
    const firstOfSecondRound = second[0]?.entity.code ?? '';
    // A new round, not the same one again: with this seed the two rounds start differently.
    expect(firstOfSecondRound).not.toBe(first[0]?.entity.code);
    expect(screen.getByRole('img', { name: 'La bandera que hay que adivinar' })).toHaveAttribute(
      'src',
      expect.stringMatching(flagFile(firstOfSecondRound)),
    );
  }, 30_000);

  it('RND-08 "Menú" on the summary goes back to the home screen', async () => {
    const [first] = firstTwoRounds();
    await renderAppAsLucia();
    await startFlagsRound();
    await play(first, []);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('¡Perfecto!');
    await userEvent.click(screen.getByRole('button', { name: 'Menú' }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('¿A qué jugamos?');
  }, 30_000);

  it('RND-08 FLAG-B "Jugar otra vez" after a "País → Bandera" round starts FLAG-B again', async () => {
    const [first, second] = firstTwoRounds();
    await renderAppAsLucia();
    await startFlagsRound(/^País → Bandera/);

    for (const question of first) {
      const card = `Opción ${String(question.options.indexOf(question.entity) + 1)}`;
      await userEvent.click(screen.getByRole('button', { name: card }));
      await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    }
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('¡Perfecto!');

    await userEvent.click(screen.getByRole('button', { name: 'Jugar otra vez' }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `¿Cuál es la bandera ${second[0] ? ofName(second[0].entity, 'es') : ''}?`,
    );
    expect(screen.getByText('1/10')).toBeVisible();
  }, 30_000);
});
