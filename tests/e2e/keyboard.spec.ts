import type { Page } from '@playwright/test';
import { nameInSentence, wasWords } from '../../src/i18n/names.ts';
import { expectedRound, questionAt, wrongOption } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { NewPlayerPage } from './pages/NewPlayerPage.ts';
import { PlayersPage } from './pages/PlayersPage.ts';
import { RoundPage } from './pages/RoundPage.ts';
import { SummaryPage } from './pages/SummaryPage.ts';

// Story #111 (NFR-05): the keyboard, the dialogs, colour vision and reduced motion.

const ROUND = expectedRound({ topic: 'flags', region: 'europe', level: 1 });

/** What has the focus: its role and accessible name, and whether its outline shows. */
async function focused(page: Page): Promise<{ name: string; outline: boolean; top: number }> {
  return page.evaluate(() => {
    const element = document.activeElement;
    if (!element || element === document.body) return { name: '', outline: false, top: 0 };
    const style = getComputedStyle(element);
    const name = (element.getAttribute('aria-label') ?? element.textContent).trim();
    return {
      name,
      outline: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
      top: element.getBoundingClientRect().top + window.scrollY,
    };
  });
}

/**
 * Presses Tab until the control named `name` has the focus, checking that every control on the way shows its
 * outline. Fails if it cannot be reached within `limit` presses.
 */
async function tabTo(page: Page, name: string | RegExp, limit = 40): Promise<void> {
  for (let press = 0; press < limit; press += 1) {
    await page.keyboard.press('Tab');
    const now = await focused(page);
    if (now.name === '') continue;
    expect(now.outline, `the focused "${now.name}" shows its outline`).toBe(true);
    if (typeof name === 'string' ? now.name === name : name.test(now.name)) return;
  }
  throw new Error(`"${String(name)}" cannot be reached with Tab`);
}

async function luciaOnTheDevice(page: Page): Promise<void> {
  const players = new PlayersPage(page);
  await players.goto('?seed=42');
  await players.newPlayerButton.click();
  await new NewPlayerPage(page).create('Lucía', 'Zorro');
  await expect(new HomePage(page).heading).toHaveText('¿A qué jugamos?');
  await page.goto('/?seed=42');
  await expect(players.heading).toHaveText('¿Quién juega?');
}

test.describe('Keyboard, dialogs, colour and motion (NFR-05)', () => {
  test.beforeEach(({ browserName }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-chrome',
      'The keyboard is a desktop matter, and the colour emulation is Chromium only',
    );
    expect(browserName).toBe('chromium');
  });

  test(
    'NFR-05 a whole round with the keyboard alone, from «¿Quién juega?» to the summary and back home, with a visible outline, the focus on each new title and on "Siguiente" after answering',
    { tag: ['@NFR-05'] },
    async ({ page }) => {
      await luciaOnTheDevice(page);
      const home = new HomePage(page);
      const setup = new GameSetupPage(page);
      const round = new RoundPage(page);
      const summary = new SummaryPage(page);

      await tabTo(page, 'Lucía');
      await page.keyboard.press('Enter');
      await expect(home.heading).toBeFocused();

      await tabTo(page, /^Bandera → País/);
      await page.keyboard.press('Enter');
      await expect(setup.heading).toBeFocused();
      await tabTo(page, 'Europa');
      await page.keyboard.press('Enter');
      await expect(setup.levelStep.getByRole('heading')).toBeFocused();
      await tabTo(page, /^Fácil/);
      await page.keyboard.press('Enter');
      await expect(round.heading).toBeFocused();

      for (const [index, question] of ROUND.entries()) {
        const answer = index === 1 ? wrongOption(question) : question.entity;
        await tabTo(page, answer.name.es);
        await page.keyboard.press(index % 2 === 0 ? 'Enter' : 'Space');
        await expect(round.feedback).not.toBeEmpty();
        await expect(round.nextButton).toBeFocused();
        await page.keyboard.press('Enter');
      }

      await expect(summary.heading).toBeFocused();
      await tabTo(page, 'Menú');
      await page.keyboard.press('Enter');
      await expect(home.heading).toBeFocused();
    },
  );

  test(
    'NFR-05 every screen opened with the keyboard puts the focus on its title',
    { tag: ['@NFR-05'] },
    async ({ page }) => {
      await luciaOnTheDevice(page);
      const title = page.getByRole('heading', { level: 1 });
      const open = async (name: string, within?: 'footer') => {
        const scope = within === 'footer' ? page.getByRole('contentinfo') : page;
        await scope.getByRole('button', { name, exact: true }).focus();
        await page.keyboard.press('Enter');
        await expect(title).toBeFocused();
      };
      const back = async () => {
        await page.getByRole('button', { name: 'Volver', exact: true }).focus();
        await page.keyboard.press('Enter');
        await expect(title).toBeFocused();
      };

      await open('Nuevo jugador');
      await back();
      await open('Atlas', 'footer');
      await back();
      await open('Acerca de', 'footer');
      await back();
      await page.getByRole('button', { name: 'Editar a Lucía' }).focus();
      await page.keyboard.press('Enter');
      await expect(title).toBeFocused();
      await back();
      await page.getByRole('button', { name: 'Lucía', exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(title).toBeFocused();
      for (const screen of ['Historial', 'Progreso', 'Récords']) {
        await open(screen);
        await back();
      }
    },
  );

  test(
    'NFR-05 on the home screen Tab follows the reading order, top to bottom',
    { tag: ['@NFR-05'] },
    async ({ page }) => {
      await luciaOnTheDevice(page);
      await new PlayersPage(page).player('Lucía').click();

      const tops: number[] = [];
      const names: string[] = [];
      for (let press = 0; press < 14; press += 1) {
        await page.keyboard.press('Tab');
        const now = await focused(page);
        // Past the last control the focus leaves the page, to the browser.
        if (now.name === '') break;
        tops.push(now.top);
        names.push(now.name);
      }
      expect(names).toContain('Historial');
      for (let index = 1; index < tops.length; index += 1) {
        // The next control is on the same row or below; two buttons of one row share their top.
        expect(
          tops[index] ?? 0,
          `${names[index] ?? ''} after ${names[index - 1] ?? ''}`,
        ).toBeGreaterThanOrEqual((tops[index - 1] ?? 0) - 1);
      }
    },
  );

  test(
    'NFR-05 "Salir de la partida", "¿Borrar a Pablo?" and "¿Salir del juego?" keep the focus inside, and Escape gives it back',
    { tag: ['@NFR-05'] },
    async ({ page }) => {
      await luciaOnTheDevice(page);
      const players = new PlayersPage(page);
      const home = new HomePage(page);

      /** Tab and Shift+Tab, round and round: the focus stays in the dialog. */
      const expectFocusKeptIn = async (dialogName: string) => {
        const dialog = page.getByRole('dialog', { name: dialogName });
        await expect(dialog).toBeVisible();
        for (const key of ['Tab', 'Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
          await page.keyboard.press(key);
          expect(
            await dialog.evaluate((element) => element.contains(document.activeElement)),
            `${dialogName}: ${key}`,
          ).toBe(true);
        }
      };

      // "Salir de la partida", opened from its button.
      await players.player('Lucía').click();
      await home.openGame('Bandera → País');
      await new GameSetupPage(page).chooseRegion('Europa');
      await new GameSetupPage(page).chooseLevel('Fácil');
      const round = new RoundPage(page);
      await round.quitButton.focus();
      await page.keyboard.press('Enter');
      await expectFocusKeptIn('¿Salir de la partida?');
      await page.keyboard.press('Escape');
      await expect(round.quitDialog).toBeHidden();
      await expect(round.quitButton).toBeFocused();
      await round.quit();

      // "¿Borrar a Pablo?", opened from "Borrar jugador".
      await home.switchPlayerButton.click();
      await players.newPlayerButton.click();
      const form = new NewPlayerPage(page);
      await form.create('Pablo', 'Búho');
      await home.switchPlayerButton.click();
      await page.getByRole('button', { name: 'Editar a Pablo' }).click();
      await form.deleteButton.focus();
      await page.keyboard.press('Enter');
      await expectFocusKeptIn('¿Borrar a Pablo?');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog', { name: '¿Borrar a Pablo?' })).toBeHidden();
      await expect(form.deleteButton).toBeFocused();
      await form.backButton.click();

      // "¿Salir del juego?", opened by the back button: no control opened it, so the focus goes to the title.
      await page.goBack();
      await expectFocusKeptIn('¿Salir del juego?');
      await page.keyboard.press('Escape');
      await expect(players.exitDialog).toBeHidden();
      await expect(players.heading).toBeFocused();
    },
  );

  test(
    'NFR-05 RND-04 the feedback is a live region, announced when it appears',
    { tag: ['@NFR-05', '@RND-04'] },
    async ({ page }) => {
      await luciaOnTheDevice(page);
      await new PlayersPage(page).player('Lucía').click();
      await new HomePage(page).openGame('Bandera → País');
      await new GameSetupPage(page).chooseRegion('Europa');
      await new GameSetupPage(page).chooseLevel('Fácil');
      const round = new RoundPage(page);

      // The region is there, empty, before the answer: a screen reader announces what appears in it.
      await expect(round.feedback).toBeAttached();
      await expect(round.feedback).toBeEmpty();
      await round.answer(questionAt(ROUND, 0).entity.name.es);
      await expect(round.feedback).toContainText('¡Correcto!');
      await round.nextButton.click();
      await expect(round.feedback).toBeEmpty();
      const second = questionAt(ROUND, 1);
      await round.answer(wrongOption(second).name.es);
      await expect(round.feedback).toContainText(`¡Uy! ${wasWords(second.entity, 'es')}`);
      await expect(round.feedback).toContainText(nameInSentence(second.entity, 'es'));
    },
  );

  test(
    'NFR-05 RND-04 LVL-05 with no colour vision, a right and a wrong answer, a locked level, the chosen language and the sound are told apart by their marks',
    { tag: ['@NFR-05', '@RND-04', '@LVL-05'] },
    async ({ page }) => {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setEmulatedVisionDeficiency', { type: 'achromatopsia' });
      await luciaOnTheDevice(page);
      const players = new PlayersPage(page);

      // The chosen language has a ✓, the other one none; the sound switch shows waves or a cross.
      const chips = page.getByRole('group', { name: 'Idioma' }).locator('label');
      await expect(chips.filter({ hasText: 'Español' }).locator('svg')).toHaveCount(1);
      await expect(chips.filter({ hasText: 'English' }).locator('svg')).toHaveCount(0);
      const sound = page.getByRole('switch', { name: 'Sonido' });
      await expect(sound).toHaveAttribute('aria-checked', 'true');
      const iconOn = await sound.locator('svg').innerHTML();
      await sound.click();
      await expect(sound).toHaveAttribute('aria-checked', 'false');
      const iconOff = await sound.locator('svg').innerHTML();
      expect(iconOff).not.toBe(iconOn);
      // Waves when on, a cross when off: more strokes on the speaker, not another colour.
      expect(iconOn).not.toContain('M16 9.5l5 5');
      expect(iconOff).toContain('M16 9.5l5 5');
      await sound.click();

      // A locked level: a padlock and its text.
      await players.player('Lucía').click();
      await new HomePage(page).openGame('Bandera → País');
      const setup = new GameSetupPage(page);
      await setup.chooseRegion('Europa');
      await expect(setup.level('Medio')).toHaveAccessibleName('Medio, bloqueado');
      await expect(page.getByText('Consigue ★★ en Fácil para desbloquear')).toBeVisible();
      await expect(setup.level('Medio').locator('svg')).toHaveCount(1);
      await expect(setup.level('Fácil').locator('svg')).toHaveCount(0);

      // A right and a wrong answer: ✓ and ✗, named.
      await setup.chooseLevel('Fácil');
      const round = new RoundPage(page);
      const first = questionAt(ROUND, 0);
      await round.answer(wrongOption(first).name.es);
      await expect(round.mark(wrongOption(first).name.es, 'Incorrecta')).toBeVisible();
      await expect(round.mark(first.entity.name.es, 'Correcta')).toBeVisible();
      await expect(round.feedbackMark('Incorrecta')).toBeVisible();
      // ✓ and ✗ are different drawings, not one shape in two colours.
      const check = await round.mark(first.entity.name.es, 'Correcta').innerHTML();
      const cross = await round.mark(wrongOption(first).name.es, 'Incorrecta').innerHTML();
      expect(check).not.toBe(cross);
    },
  );

  for (const motion of ['reduce', 'no-preference'] as const) {
    test(
      `NFR-05 RND-04 RND-08 with motion "${motion}", the pop of a right answer and the confetti of a perfect round ${motion === 'reduce' ? 'do not move, and their ✓ and label stay' : 'move'}`,
      { tag: ['@NFR-05', '@RND-04', '@RND-08'] },
      async ({ page }) => {
        await page.emulateMedia({ reducedMotion: motion });
        await luciaOnTheDevice(page);
        await new PlayersPage(page).player('Lucía').click();
        await new HomePage(page).openGame('Bandera → País');
        await new GameSetupPage(page).chooseRegion('Europa');
        await new GameSetupPage(page).chooseLevel('Fácil');
        const round = new RoundPage(page);

        await round.answer(questionAt(ROUND, 0).entity.name.es);
        const pop = round.feedbackMark('Correcta');
        await expect(pop).toBeVisible();
        const popAnimation = await pop.evaluate(
          (element) => getComputedStyle(element).animationName,
        );
        await round.nextButton.click();
        await round.playRound(ROUND.slice(1), []);

        const summary = new SummaryPage(page);
        await expect(summary.celebration).toBeVisible();
        await expect(summary.celebration).toHaveAccessibleName('¡Ronda perfecta!');
        const confetti = await summary.celebration.evaluate((box) => [
          ...new Set([...box.children].map((piece) => getComputedStyle(piece).animationName)),
        ]);
        if (motion === 'reduce') {
          expect(popAnimation).toBe('none');
          expect(confetti).toEqual(['none']);
        } else {
          expect(popAnimation).toBe('pop');
          expect(confetti).toEqual(['confetti']);
        }
      },
    );
  }
});
