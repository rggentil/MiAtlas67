import type { Locator, Page } from '@playwright/test';
import { FLAG_RATIOS } from '../../src/data/flagRatios.ts';
import { flagAspect } from '../../src/domain/flagRatio.ts';
import type { RoundSettings } from '../../src/domain/questions.ts';
import { openLevel } from './device.ts';
import { expectedRound, questionAt } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { AtlasPage } from './pages/AtlasPage.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { PlayersPage } from './pages/PlayersPage.ts';
import { RoundPage } from './pages/RoundPage.ts';

// Flags in their real proportions (D39, story #113).

/** The ink colour of theme «Bloques» (#1A1A2E), as the browser computes it. */
const INK = 'rgb(26, 26, 46)';

/** The flag image of `code` inside `within`: the bundled flags/<code>.svg, never the silhouette. */
function flagOf(within: Locator | Page, code: string): Locator {
  return within.locator(`img[src*="/flags/${code.toLowerCase()}.svg"]`);
}

/** Width over height of an element as drawn on the screen. */
async function drawnAspect(element: Locator): Promise<number> {
  await element.scrollIntoViewIfNeeded();
  const box = await element.boundingBox();
  if (!box) throw new Error('The flag is not drawn');
  return box.width / box.height;
}

/**
 * Drawn in the ratio recorded for it, give or take a pixel of rounding (DATA-06): its box on the screen, and the
 * picture the browser loaded from the file, so a missing or broken file fails too.
 */
async function expectRealRatio(flag: Locator, code: string): Promise<void> {
  const recorded = flagAspect(FLAG_RATIOS[code] ?? '');
  expect(Math.abs((await drawnAspect(flag)) / recorded - 1), code).toBeLessThan(0.03);
  await expect
    .poll(() => flag.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth))
    .toBeGreaterThan(0);
  const natural = await flag.evaluate(
    (image: HTMLImageElement) => image.naturalWidth / image.naturalHeight,
  );
  expect(Math.abs(natural / recorded - 1), `${code} file`).toBeLessThan(0.03);
}

/** The pixels of a 2 × 2 px square of the screen at (x, y), as a PNG. */
function pixelsAt(page: Page, x: number, y: number): Promise<Buffer> {
  return page.screenshot({ clip: { x, y, width: 2, height: 2 }, animations: 'disabled' });
}

/** «País → Bandera · Mundo · Difícil»: its first question offers both Indonesia and Mónaco. */
const DIFFICULT_WORLD: RoundSettings = { topic: 'flags', region: 'world', level: 3 };
const SEED = (() => {
  for (let seed = 1; seed <= 20_000; seed += 1) {
    const codes = questionAt(expectedRound(DIFFICULT_WORLD, seed), 0).options.map((o) => o.code);
    if (codes.includes('ID') && codes.includes('MC')) return seed;
  }
  throw new Error('No seed offers Indonesia and Mónaco together');
})();
const FIRST = questionAt(expectedRound(DIFFICULT_WORLD, SEED), 0);

test.describe('Flags in their real proportions', () => {
  test(
    'DATA-06 D39 in the Atlas, Suiza is square and Mongolia and Sri Lanka are longer than 4:3, in their real ratio',
    { tag: ['@DATA-06', '@FLAG-A'] },
    async ({ page }) => {
      const atlas = new AtlasPage(page);
      await new PlayersPage(page).goto();
      await atlas.openButton.click();

      await atlas.chooseRegion('Europa');
      const switzerland = flagOf(atlas.entry('Europa', 'Suiza'), 'CH');
      expect(Math.abs((await drawnAspect(switzerland)) - 1)).toBeLessThan(0.03);
      await expectRealRatio(switzerland, 'CH');

      await atlas.backButton.click();
      await atlas.chooseRegion('Asia');
      for (const [name, code] of [
        ['Mongolia', 'MN'],
        ['Sri Lanka', 'LK'],
      ] as const) {
        const flag = flagOf(atlas.entry('Asia', name), code);
        expect(await drawnAspect(flag)).toBeGreaterThan(4 / 3 + 0.3);
        await expectRealRatio(flag, code);
      }
    },
  );

  test(
    'NFR-05 D39 Nepal keeps its pennants with nothing around them, and every flag its ink outline drawn around its own shape',
    { tag: ['@NFR-05', '@DATA-06'] },
    async ({ page }) => {
      const atlas = new AtlasPage(page);
      await new PlayersPage(page).goto();
      await atlas.openButton.click();
      await atlas.chooseRegion('Asia');

      const nepal = flagOf(atlas.entry('Asia', 'Nepal'), 'NP');
      expect(await drawnAspect(nepal)).toBeLessThan(1);
      await expectRealRatio(nepal, 'NP');
      // The top right corner of Nepal's box, beside the upper pennant, shows the white card, as the card's own
      // padding does: no rectangle is drawn around the pennants.
      const flagBox = await nepal.boundingBox();
      const entryBox = await atlas.entry('Asia', 'Nepal').boundingBox();
      if (!flagBox || !entryBox) throw new Error('Nepal is not drawn');
      expect(await pixelsAt(page, flagBox.x + flagBox.width - 6, flagBox.y + 4)).toEqual(
        await pixelsAt(page, entryBox.x + 8, entryBox.y + 8),
      );

      for (const [name, code] of [
        ['Nepal', 'NP'],
        ['Japón', 'JP'],
      ] as const) {
        const style = await flagOf(atlas.entry('Asia', name), code).evaluate((image) => {
          const own = getComputedStyle(image);
          const frame = image.parentElement ? getComputedStyle(image.parentElement) : own;
          return {
            filter: own.filter,
            outline: own.outlineStyle,
            border: own.borderWidth,
            background: own.backgroundColor,
            frameBorder: frame.borderWidth,
            frameBackground: frame.backgroundColor,
          };
        });
        // Four ink shadows around the drawing itself, so a white flag stands out on a white card.
        expect(style.filter.match(/drop-shadow/g), name).toHaveLength(4);
        expect(style.filter.split(INK).length - 1, name).toBe(4);
        expect(style).toMatchObject({
          outline: 'none',
          border: '0px',
          background: 'rgba(0, 0, 0, 0)',
          frameBorder: '0px',
          frameBackground: 'rgba(0, 0, 0, 0)',
        });
      }
    },
  );

  test(
    'GAME-03 RND-02 D39 in a "País → Bandera" grid of 6, the cards are the same size and each flag sits whole in the middle of its card in its real ratio: Indonesia 2:3 and Mónaco 4:5',
    { tag: ['@GAME-03', '@FLAG-B', '@RND-02', '@DATA-06'] },
    async ({ page }) => {
      const home = new HomePage(page);
      const setup = new GameSetupPage(page);
      const round = new RoundPage(page);
      await home.goto(`?seed=${String(SEED)}`);
      await openLevel(page, 'FLAG-B', 'world', 3);
      await home.openGame('País → Bandera');
      await setup.chooseRegion('Mundo');
      await setup.chooseLevel('Difícil');
      await expect(round.options).toHaveCount(6);

      const cards = await round.options.all();
      const cardBoxes = await Promise.all(cards.map((card) => card.boundingBox()));
      const [first] = cardBoxes;
      for (const box of cardBoxes) {
        expect(box?.width).toBeCloseTo(first?.width ?? 0, 0);
        expect(box?.height).toBeCloseTo(first?.height ?? 0, 0);
      }
      for (const [index, option] of FIRST.options.entries()) {
        const flag = flagOf(round.options.nth(index), option.code);
        await expectRealRatio(flag, option.code);
        const card = cardBoxes[index];
        const box = await flag.boundingBox();
        if (!card || !box) throw new Error(`Option ${String(index + 1)} is not drawn`);
        // Whole inside its card: never cropped.
        expect(box.x).toBeGreaterThanOrEqual(card.x);
        expect(box.y).toBeGreaterThanOrEqual(card.y);
        expect(box.x + box.width).toBeLessThanOrEqual(card.x + card.width);
        expect(box.y + box.height).toBeLessThanOrEqual(card.y + card.height);
        // In the middle of its card.
        expect(Math.abs(box.x + box.width / 2 - (card.x + card.width / 2))).toBeLessThan(1.5);
        expect(Math.abs(box.y + box.height / 2 - (card.y + card.height / 2))).toBeLessThan(1.5);
      }

      expect(await drawnAspect(flagOf(page, 'ID'))).toBeCloseTo(1.5, 1);
      expect(await drawnAspect(flagOf(page, 'MC'))).toBeCloseTo(1.25, 1);
      // Still one right answer (RND-02): six different flags on the screen, one of them the asked country's.
      const sources = await round.options
        .locator('img')
        .evaluateAll((images) => images.map((image) => image.getAttribute('src') ?? ''));
      expect(new Set(sources).size).toBe(6);
      expect(
        sources.filter((source) =>
          source.includes(`/flags/${FIRST.entity.code.toLowerCase()}.svg`),
        ),
      ).toHaveLength(1);
    },
  );
});
