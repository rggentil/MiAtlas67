import type AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import type { GameId } from '../../src/domain/games.ts';
import type { Question, Topic } from '../../src/domain/questions.ts';
import type { Language } from '../../src/i18n/languages.ts';
import { findOverflow, inspectScreen, text, useBigText } from './a11y.ts';
import { openLevel, savedPlayerId, saveResults } from './device.ts';
import { expectedRound, questionAt, wrongOption } from './expected.ts';
import { expect, test } from './fixtures.ts';

// The accessibility sweep of story #111: every screen and state of the game, in both languages, scanned with
// axe for WCAG 2.2 A and AA, with its touch targets measured, its structure checked for a screen reader, and
// shown on a 360 px phone with the text at 200 % (NFR-05, NFR-06, NFR-01). Each failure names the screen.

const GAMES: readonly { id: GameId; topic: Topic }[] = [
  { id: 'FLAG-A', topic: 'flags' },
  { id: 'FLAG-B', topic: 'flags' },
  { id: 'CAP-A', topic: 'capitals' },
  { id: 'CAP-B', topic: 'capitals' },
  { id: 'SHAPE-A', topic: 'shapes' },
  { id: 'SHAPE-B', topic: 'shapes' },
];

/**
 * "standard": axe, touch targets and structure on every project. "small phone, big text": a 360 px phone with the
 * text at 200 %, on mobile-chrome only; nothing may scroll sideways or be cut off (NFR-01, NFR-05).
 */
type Mode = 'standard' | 'small phone, big text';

/** Scans the screen on show and records every finding under `screen`, without stopping the journey. */
async function sweep(
  page: Page,
  makeAxeBuilder: () => AxeBuilder,
  language: Language,
  mode: Mode,
  screen: string,
): Promise<void> {
  if (mode === 'small phone, big text') {
    expect.soft(await findOverflow(page), `${screen}: 360 px and 200 % text`).toEqual([]);
    return;
  }
  const axe = await makeAxeBuilder().analyze();
  expect
    .soft(
      axe.violations.map(
        (violation) =>
          `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`,
      ),
      `${screen}: axe`,
    )
    .toEqual([]);
  const report = await inspectScreen(page, language);
  expect.soft(report.smallTargets, `${screen}: targets under 48 px`).toEqual([]);
  expect.soft(report.structure, `${screen}: structure`).toEqual([]);
}

/** The label of an option of `question` in `game`: a name, a capital, or the number of an image card. */
function optionLabel(language: Language, game: GameId, question: Question, right: boolean): string {
  const option = right ? question.entity : wrongOption(question);
  if (game === 'FLAG-B' || game === 'SHAPE-B') {
    return text(language, 'round.option', { n: question.options.indexOf(option) + 1 });
  }
  if (game === 'CAP-A') return option.capital?.[language] ?? '';
  return option.name[language];
}

async function openGame(page: Page, language: Language, game: GameId): Promise<void> {
  await page.getByRole('button', { name: text(language, `game.${game}.name`) }).click();
}

for (const [language, mode] of [
  ['es', 'standard'],
  ['en', 'standard'],
  ['es', 'small phone, big text'],
  ['en', 'small phone, big text'],
] as const) {
  const t = (key: Parameters<typeof text>[1], params?: Parameters<typeof text>[2]) =>
    text(language, key, params);
  const button = (
    page: Page,
    key: Parameters<typeof text>[1],
    params?: Parameters<typeof text>[2],
  ) => page.getByRole('button', { name: t(key, params), exact: true });

  test.describe(`Accessibility sweep · ${language} · ${mode}`, () => {
    test.beforeEach(async ({ page }, testInfo) => {
      if (mode === 'small phone, big text') {
        test.skip(testInfo.project.name !== 'mobile-chrome', 'One phone is enough for the layout');
        await page.setViewportSize({ width: 360, height: 740 });
        await useBigText(page);
      }
      await page.addInitScript((lang) => {
        if (!sessionStorage.getItem('sweep-started')) {
          localStorage.setItem('miatlas67.language', lang);
          sessionStorage.setItem('sweep-started', 'yes');
        }
      }, language);
    });

    test(
      `NFR-05 NFR-06 players: «¿Quién juega?» empty, with players and with 8, the player form with an error, "Editar jugador", "¿Borrar a Pablo?" and "¿Salir del juego?" · ${language} · ${mode}`,
      { tag: mode === 'standard' ? ['@NFR-05', '@NFR-06'] : ['@NFR-05', '@NFR-06', '@NFR-01'] },
      async ({ page, makeAxeBuilder }) => {
        test.slow();
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(t('players.title'));
        await sweep(page, makeAxeBuilder, language, mode, 'players, empty');

        await button(page, 'players.new').click();
        await button(page, 'newPlayer.create').click();
        await expect(page.getByText(t('newPlayer.empty'))).toBeVisible();
        await sweep(page, makeAxeBuilder, language, mode, 'new player with an error');

        for (const nickname of ['Lucía', 'Pablo']) {
          if (nickname === 'Pablo') {
            await page
              .getByRole('group', { name: t('player.current') })
              .getByRole('button')
              .click();
            await button(page, 'players.new').click();
          }
          await page.getByRole('textbox', { name: t('newPlayer.nickname') }).fill(nickname);
          await page.getByRole('radio').first().check({ force: true });
          await button(page, 'newPlayer.create').click();
          await expect(page.getByRole('heading', { level: 1 })).toHaveText(t('home.title'));
        }
        await page.getByRole('button', { name: 'Pablo', exact: true }).click();
        await sweep(page, makeAxeBuilder, language, mode, 'players, with 2');

        await button(page, 'players.edit', { name: 'Pablo' }).click();
        await sweep(page, makeAxeBuilder, language, mode, 'edit player');
        await button(page, 'editPlayer.delete').click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await sweep(page, makeAxeBuilder, language, mode, 'delete player dialog');
        await button(page, 'deletePlayer.keep').click();
        await button(page, 'nav.back').click();

        await page.goBack();
        await expect(page.getByRole('dialog')).toBeVisible();
        await sweep(page, makeAxeBuilder, language, mode, 'exit dialog');
        await button(page, 'exit.stay').click();

        for (const nickname of ['Ana', 'Bruno', 'Carla', 'Dani', 'Eva', 'Félix']) {
          await button(page, 'players.new').click();
          await page.getByRole('textbox', { name: t('newPlayer.nickname') }).fill(nickname);
          await button(page, 'newPlayer.create').click();
          await page
            .getByRole('group', { name: t('player.current') })
            .getByRole('button')
            .click();
        }
        await expect(page.getByText(t('players.full', { n: 8 }))).toBeVisible();
        await sweep(page, makeAxeBuilder, language, mode, 'players, with 8');
      },
    );

    for (const [index, game] of GAMES.entries()) {
      test(
        `NFR-05 NFR-06 a round of ${game.id} before and after a right and a wrong answer${index === 0 ? ', with the home screen, the setup steps (locked levels) and "Salir de la partida"' : ''} · ${language} · ${mode}`,
        { tag: mode === 'standard' ? ['@NFR-05', '@NFR-06'] : ['@NFR-05', '@NFR-06', '@NFR-01'] },
        async ({ page, makeAxeBuilder }) => {
          test.slow();
          await page.goto('/?seed=42');
          await button(page, 'players.new').click();
          await page.getByRole('textbox', { name: t('newPlayer.nickname') }).fill('Lucía');
          await button(page, 'newPlayer.create').click();
          await expect(page.getByRole('heading', { level: 1 })).toHaveText(t('home.title'));
          if (index === 0) await sweep(page, makeAxeBuilder, language, mode, 'home');

          await openGame(page, language, game.id);
          if (index === 0) await sweep(page, makeAxeBuilder, language, mode, 'setup, region step');
          await button(page, 'region.europe').click();
          if (index === 0) {
            await sweep(
              page,
              makeAxeBuilder,
              language,
              mode,
              'setup, level step with locked levels',
            );
          }
          await page.getByRole('button', { name: t('level.1') }).click();

          const round = expectedRound({ topic: game.topic, region: 'europe', level: 1 });
          const options = page.getByRole('list', { name: t('round.options') });
          await sweep(page, makeAxeBuilder, language, mode, `${game.id} before answering`);
          await options
            .getByRole('button', {
              name: optionLabel(language, game.id, questionAt(round, 0), true),
              exact: true,
            })
            .click();
          await sweep(page, makeAxeBuilder, language, mode, `${game.id} after a right answer`);
          await button(page, 'round.next').click();
          await options
            .getByRole('button', {
              name: optionLabel(language, game.id, questionAt(round, 1), false),
              exact: true,
            })
            .click();
          await sweep(page, makeAxeBuilder, language, mode, `${game.id} after a wrong answer`);

          if (index === 0) {
            await page.getByRole('button', { name: t('round.quit') }).click();
            await expect(page.getByRole('dialog')).toBeVisible();
            await sweep(page, makeAxeBuilder, language, mode, 'quit round dialog');
          }
        },
      );
    }

    test(
      `NFR-05 NFR-06 a perfect round's summary with "¡Nuevo récord!" and "¡Nivel desbloqueado!", then Historial, Progreso, Récords, Atlas and "Acerca de" · ${language} · ${mode}`,
      { tag: mode === 'standard' ? ['@NFR-05', '@NFR-06'] : ['@NFR-05', '@NFR-06', '@NFR-01'] },
      async ({ page, makeAxeBuilder }) => {
        test.slow();
        await page.goto('/?seed=42');
        await button(page, 'players.new').click();
        await page.getByRole('textbox', { name: t('newPlayer.nickname') }).fill('Lucía');
        await button(page, 'newPlayer.create').click();
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(t('home.title'));
        const lucia = (await savedPlayerId(page, 'Lucía')) ?? -1;
        await saveResults(page, lucia, [
          { game: 'FLAG-A', region: 'europe', level: 1, score: 6, stars: 1 },
          { game: 'FLAG-B', region: 'asia', level: 2, score: 9, stars: 2 },
        ]);
        // Pablo, with a 12-letter nickname, holds records in every game, so every table has rows and holders.
        await page
          .getByRole('group', { name: t('player.current') })
          .getByRole('button')
          .click();
        await button(page, 'players.new').click();
        await page.getByRole('textbox', { name: t('newPlayer.nickname') }).fill('Pablo Martín');
        await button(page, 'newPlayer.create').click();
        const pablo = (await savedPlayerId(page, 'Pablo Martín')) ?? -1;
        await saveResults(
          page,
          pablo,
          GAMES.map((game) => ({ game: game.id, region: 'world', level: 3, score: 8, stars: 2 })),
        );
        await page
          .getByRole('group', { name: t('player.current') })
          .getByRole('button')
          .click();
        await page.getByRole('button', { name: 'Lucía', exact: true }).click();
        await openLevel(page, 'SHAPE-A', 'europe', 3);

        await openGame(page, language, 'FLAG-A');
        await button(page, 'region.europe').click();
        await page.getByRole('button', { name: t('level.1') }).click();
        const round = expectedRound({ topic: 'flags', region: 'europe', level: 1 });
        const options = page.getByRole('list', { name: t('round.options') });
        for (const question of round) {
          await options
            .getByRole('button', {
              name: optionLabel(language, 'FLAG-A', question, true),
              exact: true,
            })
            .click();
          await button(page, 'round.next').click();
        }
        await expect(page.getByText(t('summary.record'))).toBeVisible();
        await expect(page.getByText(t('summary.unlocked', { level: t('level.2') }))).toBeVisible();
        await sweep(page, makeAxeBuilder, language, mode, 'summary of a perfect round');
        await button(page, 'summary.menu').click();

        for (const [key, screen] of [
          ['home.history', 'history'],
          ['home.progress', 'progress'],
          ['home.records', 'records'],
        ] as const) {
          await button(page, key).click();
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
          await sweep(page, makeAxeBuilder, language, mode, screen);
          await button(page, 'nav.back').click();
        }

        await page
          .getByRole('contentinfo')
          .getByRole('button', { name: t('atlas.title') })
          .click();
        await sweep(page, makeAxeBuilder, language, mode, 'atlas, regions');
        await button(page, 'region.oceania').click();
        await sweep(page, makeAxeBuilder, language, mode, 'atlas, Oceanía');
        await button(page, 'nav.back').click();
        await button(page, 'nav.back').click();

        await page
          .getByRole('contentinfo')
          .getByRole('button', { name: t('about.title') })
          .click();
        await sweep(page, makeAxeBuilder, language, mode, 'about');
      },
    );
  });
}
