import type { Page } from '@playwright/test';
import { expectedRound, questionAt, wrongOption } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { NewPlayerPage } from './pages/NewPlayerPage.ts';
import { PlayersPage } from './pages/PlayersPage.ts';
import { RoundPage } from './pages/RoundPage.ts';
import { SummaryPage } from './pages/SummaryPage.ts';

// Background: Lucía plays "Bandera → País" in "Europa · Fácil" with seed 42.
const ROUND = expectedRound({ topic: 'flags', region: 'europe', level: 1 });
const FIRST = questionAt(ROUND, 0);
const SECOND = questionAt(ROUND, 1);

type AudioMode = 'normal' | 'slow' | 'none';

/**
 * Counts the sounds the game plays: each sound is one gain node of the page's audio context. 'slow': the
 * context takes forever to start; 'none': the browser has no Web Audio at all.
 */
async function listenToSounds(page: Page, mode: AudioMode = 'normal'): Promise<void> {
  await page.addInitScript((audio: AudioMode) => {
    const scope = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
      soundsPlayed: number;
      hasWebAudio: boolean;
    };
    scope.soundsPlayed = 0;
    scope.hasWebAudio = false;
    if (audio === 'none') {
      scope.AudioContext = undefined;
      scope.webkitAudioContext = undefined;
      return;
    }
    const Original = scope.AudioContext ?? scope.webkitAudioContext;
    if (!Original) return;
    scope.hasWebAudio = true;
    scope.AudioContext = class extends Original {
      override createGain(): GainNode {
        scope.soundsPlayed += 1;
        return super.createGain();
      }

      override resume(): Promise<void> {
        return audio === 'slow' ? new Promise<void>(() => undefined) : super.resume();
      }
    };
  }, mode);
}

/**
 * Skips a test that counts sounds where the browser has no Web Audio to count, as Playwright's WebKit on
 * Windows; the component tests count them with a spy player everywhere.
 */
async function skipWithoutWebAudio(page: Page): Promise<void> {
  const has = await page.evaluate(
    () => (window as unknown as { hasWebAudio: boolean }).hasWebAudio,
  );
  test.skip(!has, 'This browser build has no Web Audio to count the sounds of');
}

async function soundsPlayed(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { soundsPlayed: number }).soundsPlayed);
}

const soundSwitch = (page: Page, name = 'Sonido') =>
  page.getByRole('contentinfo').getByRole('switch', { name });

async function startRound(page: Page, home: HomePage): Promise<RoundPage> {
  await home.openGame('Bandera → País');
  const setup = new GameSetupPage(page);
  await setup.chooseRegion('Europa');
  await setup.chooseLevel('Fácil');
  const round = new RoundPage(page);
  await expect(round.heading).toHaveText('¿De qué país es esta bandera?');
  return round;
}

test.describe('Sound effects', () => {
  test(
    'RND-04 SET-02 a right answer plays one sound, a wrong one another, and the disabled options play nothing',
    { tag: ['@RND-04', '@SET-02'] },
    async ({ page }) => {
      await listenToSounds(page);
      const home = new HomePage(page);
      await home.goto('?seed=42');
      await skipWithoutWebAudio(page);
      const round = await startRound(page, home);

      await round.answer(FIRST.entity.name.es);
      await expect(round.feedback).toContainText('¡Correcto!');
      await expect(round.feedbackMark('Correcta')).toBeVisible();
      await expect.poll(() => soundsPlayed(page)).toBe(1);
      for (const option of FIRST.options) {
        await round.option(option.name.es).dispatchEvent('click');
      }

      await round.nextButton.click();
      await round.answer(wrongOption(SECOND).name.es);
      await expect(round.feedback).toContainText('¡Uy!');
      await expect(round.mark(wrongOption(SECOND).name.es, 'Incorrecta')).toBeVisible();
      await expect.poll(() => soundsPlayed(page)).toBe(2);
    },
  );

  test(
    'RND-08 SET-02 finishing a round plays the "round end" sound once, when the summary opens',
    { tag: ['@RND-08', '@SET-02'] },
    async ({ page }) => {
      await listenToSounds(page);
      const home = new HomePage(page);
      await home.goto('?seed=42');
      await skipWithoutWebAudio(page);
      const round = await startRound(page, home);

      await round.playRound(ROUND, [2, 5]);

      await expect(new SummaryPage(page).playAgainButton).toBeVisible();
      await expect.poll(() => soundsPlayed(page)).toBe(11);
    },
  );

  test(
    'SET-02 NFR-05 "Sonido" is on the first time, next to "Idioma" on both screens; turned off, a whole round is silent, and it stays off after a reload, for Pablo too',
    { tag: ['@SET-02', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      await listenToSounds(page);
      const home = new HomePage(page);
      const players = new PlayersPage(page);
      await home.goto('?seed=42');

      const footer = page.getByRole('contentinfo');
      await expect(footer.getByRole('group', { name: 'Idioma' })).toBeVisible();
      await expect(soundSwitch(page)).toBeChecked();
      const box = await soundSwitch(page).boundingBox();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(48);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
      await soundSwitch(page).click();
      await expect(soundSwitch(page)).not.toBeChecked();
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);

      const round = await startRound(page, home);
      await round.answer(FIRST.entity.name.es);
      await expect(round.feedbackMark('Correcta')).toBeVisible();
      await round.nextButton.click();
      await round.answer(wrongOption(SECOND).name.es);
      await expect(round.feedback).toContainText('¡Uy!');
      await round.nextButton.click();
      await round.playRound(ROUND.slice(2), []);
      await expect(new SummaryPage(page).playAgainButton).toBeVisible();
      expect(await soundsPlayed(page)).toBe(0);

      await page.reload();
      await expect(players.heading).toHaveText('¿Quién juega?');
      await expect(soundSwitch(page)).not.toBeChecked();
      await players.newPlayerButton.click();
      await new NewPlayerPage(page).create('Pablo', 'Búho');
      await expect(home.heading).toHaveText('¿A qué jugamos?');
      await expect(soundSwitch(page)).not.toBeChecked();
    },
  );

  test(
    'SET-02 a browser that cannot play sound: the round goes on with no error',
    { tag: ['@SET-02'] },
    async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await listenToSounds(page, 'none');
      const home = new HomePage(page);
      await home.goto('?seed=42');
      const round = await startRound(page, home);

      await round.answer(wrongOption(FIRST).name.es);
      await expect(round.feedback).toContainText('¡Uy!');
      await round.nextButton.click();
      await expect(round.progressText).toHaveText('2/10');
      expect(errors).toEqual([]);
    },
  );

  test(
    'NFR-03 a sound slow to start never delays the ✓ of an answer',
    { tag: ['@NFR-03'] },
    async ({ page }) => {
      await listenToSounds(page, 'slow');
      const home = new HomePage(page);
      await home.goto('?seed=42');
      const round = await startRound(page, home);

      await round.answer(FIRST.entity.name.es);

      await expect(round.feedbackMark('Correcta')).toBeVisible({ timeout: 1_000 });
      await expect(round.feedback).toContainText('¡Correcto!');
    },
  );

  test(
    'NFR-06 SET-02 in English the switch is called "Sound" and works the same',
    { tag: ['@NFR-06', '@SET-02'] },
    async ({ page }) => {
      await listenToSounds(page);
      await new PlayersPage(page).goto();
      await new HomePage(page).chooseLanguage('English');

      await expect(soundSwitch(page, 'Sound')).toBeChecked();
      await soundSwitch(page, 'Sound').click();
      await expect(soundSwitch(page, 'Sound')).not.toBeChecked();
    },
  );
});
