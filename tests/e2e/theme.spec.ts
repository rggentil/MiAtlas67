import { expect, test } from './fixtures.ts';
import { ShowcasePage } from './pages/ShowcasePage.ts';
import { StartPage } from './pages/StartPage.ts';

test.describe('Theme «Bloques»', () => {
  test(
    'D11 applies the «Bloques» background, text colour and fonts',
    { tag: '@D11' },
    async ({ page }) => {
      const start = new StartPage(page);
      await start.goto();

      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(207, 230, 255)');
      await expect(page.locator('body')).toHaveCSS('color', 'rgb(26, 26, 46)');
      await expect(start.heading).toHaveCSS('font-family', /Lilita One/);

      const loadedFaces = await page.evaluate(async () => {
        const display = await document.fonts.load('16px "Lilita One"');
        const body = await document.fonts.load('16px "Nunito Variable"');
        return { display: display.length, body: body.length };
      });
      expect(loadedFaces.display).toBeGreaterThan(0);
      expect(loadedFaces.body).toBeGreaterThan(0);
    },
  );

  test(
    'NFR-04 loads everything from the app itself, with no external requests',
    { tag: '@NFR-04' },
    async ({ page }) => {
      const requested: string[] = [];
      page.on('request', (request) => requested.push(request.url()));

      const start = new StartPage(page);
      await start.goto();
      await expect(start.heading).toBeVisible();
      await page.evaluate(() => document.fonts.ready);

      const appOrigin = new URL(page.url()).origin;
      const external = requested.filter(
        (url) => url.startsWith('http') && new URL(url).origin !== appOrigin,
      );
      expect(external).toEqual([]);
    },
  );

  test(
    'NFR-05 every button has a touch target of at least 48 × 48 px',
    { tag: '@NFR-05' },
    async ({ page }) => {
      const showcase = new ShowcasePage(page);
      await showcase.goto();

      const buttons = await showcase.buttons.all();
      expect(buttons.length).toBeGreaterThan(0);
      for (const button of buttons) {
        const box = await button.boundingBox();
        expect(box).not.toBeNull();
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(48);
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
      }
    },
  );

  test(
    'D11 a pressed button loses its shadow and moves down-right',
    { tag: '@D11' },
    async ({ page }) => {
      const showcase = new ShowcasePage(page);
      await showcase.goto();
      const button = showcase.primaryButton;
      // The «Bloques» offset shadow: ink colour, 4 px right and 4 px down.
      const inkOffsetShadow = /rgb\(26, 26, 46\) 4px 4px 0px/;
      await expect(button).toHaveCSS('box-shadow', inkOffsetShadow);

      await button.hover();
      await page.mouse.down();
      await expect(button).not.toHaveCSS('box-shadow', inkOffsetShadow);
      await expect(button).toHaveCSS('translate', '4px 4px');
      await page.mouse.up();

      await expect(button).toHaveCSS('box-shadow', inkOffsetShadow);
    },
  );

  test(
    'NFR-05 the component showcase has no accessibility violations',
    { tag: '@NFR-05' },
    async ({ page, makeAxeBuilder }) => {
      const showcase = new ShowcasePage(page);
      await showcase.goto();
      const results = await makeAxeBuilder().analyze();
      expect(results.violations).toEqual([]);
    },
  );
});
