import type { Locator, Page } from '@playwright/test';
import { flagFile } from '../../src/test/flags.ts';
import { expectedRound, questionAt, wrongOption } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { RoundPage } from './pages/RoundPage.ts';

// Background: I am playing "Bandera → País" in "Europa · Fácil" with seed 42.
const ROUND = expectedRound({ topic: 'flags', region: 'europe', level: 1 });
const FIRST = questionAt(ROUND, 0);
const SECOND = questionAt(ROUND, 1);

async function startRound(page: Page): Promise<RoundPage> {
  const home = new HomePage(page);
  const setup = new GameSetupPage(page);
  const round = new RoundPage(page);
  await home.goto('?seed=42');
  await home.openGame('Bandera → País');
  await setup.chooseRegion('Europa');
  await setup.chooseLevel('Fácil');
  await expect(round.heading).toHaveText('¿De qué país es esta bandera?');
  return round;
}

/** Every visible button is a touch target of at least 48 × 48 px (NFR-05). */
async function expectLargeButtons(buttons: Locator): Promise<void> {
  for (const button of await buttons.all()) {
    const box = await button.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(48);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
  }
}

/**
 * True when the element is on screen and nothing covers its centre, as it is now: without scrolling it
 * first, which is what Playwright's actions would do.
 */
async function isOnTop(element: Locator): Promise<boolean> {
  return element.evaluate((target) => {
    const box = target.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return hit !== null && target.contains(hit);
  });
}

test.describe('Play a FLAG-A round', () => {
  let round: RoundPage;

  test.beforeEach(async ({ page }) => {
    // A fake clock from the very start: no timer can hide in the round (RND-03).
    await page.clock.install();
    round = await startRound(page);
  });

  test(
    'FLAG-A GAME-03 RND-06 a flag, 3 country names as large buttons in a vertical list, and 1/10',
    { tag: ['@FLAG-A', '@GAME-03', '@RND-06'] },
    async () => {
      await expect(round.flag).toBeVisible();
      await expect(round.flag).toHaveAttribute('src', flagFile(FIRST.entity.code));
      await expect(round.options).toHaveText(FIRST.options.map((option) => option.name.es));

      const boxes = await Promise.all(
        (await round.options.all()).map((option) => option.boundingBox()),
      );
      for (const [index, box] of boxes.entries()) {
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
        expect(box?.x).toBe(boxes[0]?.x);
        if (index > 0) expect(box?.y ?? 0).toBeGreaterThan(boxes[index - 1]?.y ?? 0);
      }
      await expect(round.progressText).toHaveText('1/10');
      await expect(round.score).toHaveText('Aciertos: 0');
    },
  );

  test(
    'RND-04 tapping the correct country shows "¡Correcto!" with a ✓ and adds 1 to the score',
    { tag: '@RND-04' },
    async () => {
      await round.answer(FIRST.entity.name.es);

      await expect(round.feedback).toHaveText('¡Correcto!');
      await expect(round.feedback.getByRole('img', { name: 'Correcta' })).toBeVisible();
      await expect(round.mark(FIRST.entity.name.es, 'Correcta')).toBeVisible();
      await expect(round.score).toHaveText('Aciertos: 1');
    },
  );

  test(
    'RND-04 tapping a wrong country marks it ✗, highlights the correct one ✓ and names it',
    { tag: '@RND-04' },
    async ({ makeAxeBuilder }) => {
      const wrong = wrongOption(FIRST);
      await round.answer(wrong.name.es);

      await expect(round.mark(wrong.name.es, 'Incorrecta')).toBeVisible();
      await expect(round.mark(FIRST.entity.name.es, 'Correcta')).toBeVisible();
      await expect(round.feedback).toHaveText(`¡Casi! Era ${FIRST.entity.name.es}`);
      await expect(round.score).toHaveText('Aciertos: 0');
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'RND-05 RND-03 the game waits for "Siguiente" and has no timer',
    { tag: ['@RND-05', '@RND-03'] },
    async ({ page }) => {
      await page.clock.fastForward('10:00');
      await expect(round.progressText).toHaveText('1/10');
      await expect(round.nextButton).toHaveCount(0);

      await round.answer(FIRST.entity.name.es);
      await expect(round.nextButton).toBeFocused();
      await page.clock.fastForward('10:00');

      await expect(round.progressText).toHaveText('1/10');
      await expect(round.feedback).toHaveText('¡Correcto!');
      await expect(page.getByRole('timer')).toHaveCount(0);

      await round.nextButton.click();
      await expect(round.progressText).toHaveText('2/10');
      await expect(round.options).toHaveText(SECOND.options.map((option) => option.name.es));
      await expect(round.nextButton).toHaveCount(0);
    },
  );

  test(
    'RND-07 quitting asks for confirmation and goes back home',
    { tag: '@RND-07' },
    async ({ page, makeAxeBuilder }) => {
      await round.answer(FIRST.entity.name.es);
      await round.quitButton.click();
      await expect(round.quitDialog).toBeVisible();
      await expect(round.quitDialog).toContainText('esta partida no se guarda');
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);

      await round.quitDialog.getByRole('button', { name: 'Seguir jugando' }).click();
      await expect(round.quitDialog).toHaveCount(0);
      await expect(round.quitButton).toBeFocused();
      await expect(round.progressText).toHaveText('1/10');

      await round.quitButton.click();
      await page.keyboard.press('Escape');
      await expect(round.quitDialog).toHaveCount(0);
      await expect(round.quitButton).toBeFocused();

      await round.quit();
      await expect(new HomePage(page).heading).toHaveText('¿A qué jugamos?');
    },
  );

  test(
    'RND-07 while the quit dialog is open, the round behind it cannot be reached',
    { tag: '@RND-07' },
    async ({ page }) => {
      await round.quitButton.click();
      const stay = round.quitDialog.getByRole('button', { name: 'Seguir jugando' });
      await expect(stay).toBeFocused();

      for (let press = 0; press < 4; press++) {
        await page.keyboard.press('Tab');
        const outside = await page.evaluate(() => {
          const active = document.activeElement;
          return active !== null && active !== document.body && !active.closest('[role="dialog"]');
        });
        expect(outside).toBe(false);
      }
      await expect(round.options.first()).toBeEnabled();
      await expect(round.progressText).toHaveText('1/10');
    },
  );

  test(
    'RND-04 with reduced motion, a correct answer does not move',
    { tag: '@RND-04' },
    async () => {
      await round.answer(FIRST.entity.name.es);

      const tile = round.feedback.getByRole('img', { name: 'Correcta' });
      await expect(tile).toBeVisible();
      expect(await tile.evaluate((element) => element.getAnimations().length)).toBe(0);
    },
  );

  test(
    'NFR-05 the round has no accessibility violations and 48 × 48 px buttons, before and after answering',
    { tag: '@NFR-05' },
    async ({ page, makeAxeBuilder }) => {
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
      await expectLargeButtons(page.getByRole('button'));

      await round.answer(FIRST.entity.name.es);
      await expect(round.nextButton).toBeVisible();
      await expectLargeButtons(page.getByRole('button'));

      await round.quitButton.click();
      await expectLargeButtons(round.quitDialog.getByRole('button'));
    },
  );
});

test.describe('With animations on', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });

  test(
    'RND-04 a correct answer gets a positive animation',
    { tag: '@RND-04' },
    async ({ page }) => {
      const round = await startRound(page);

      await round.answer(FIRST.entity.name.es);

      const tile = round.feedback.getByRole('img', { name: 'Correcta' });
      await expect(tile).toBeVisible();
      expect(await tile.evaluate((element) => element.getAnimations().length)).toBeGreaterThan(0);
    },
  );
});

test.describe('A long list of answers on a short screen', () => {
  // Level Difícil has 6 answers: on a phone the list goes below the feedback panel.
  const HARD = questionAt(expectedRound({ topic: 'flags', region: 'europe', level: 3 }), 0);

  test(
    'RND-04 after answering, the ✓ and the ✗ are not hidden behind the feedback panel',
    { tag: '@RND-04' },
    async ({ page }) => {
      const home = new HomePage(page);
      const setup = new GameSetupPage(page);
      const round = new RoundPage(page);
      await home.goto('?seed=42');
      await home.openGame('Bandera → País');
      await setup.chooseRegion('Europa');
      await setup.chooseLevel('Difícil');
      await expect(round.options).toHaveCount(6);

      const last = HARD.options.at(-1);
      const tapped = last && last.code !== HARD.entity.code ? last : wrongOption(HARD);
      await round.answer(tapped.name.es);

      await expect(round.nextButton).toBeFocused();
      expect(await isOnTop(round.mark(tapped.name.es, 'Incorrecta'))).toBe(true);
      expect(await isOnTop(round.mark(HARD.entity.name.es, 'Correcta'))).toBe(true);
    },
  );
});
