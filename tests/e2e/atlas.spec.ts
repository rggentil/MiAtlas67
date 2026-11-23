import type { Locator, Page } from '@playwright/test';
import { savedPlayerId, savedRoundsOf } from './device.ts';
import { expect, test } from './fixtures.ts';
import { AtlasPage } from './pages/AtlasPage.ts';
import { HistoryPage } from './pages/HistoryPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { PlayersPage } from './pages/PlayersPage.ts';

const REGIONS = ['Mundo', 'Europa', 'África', 'América', 'Asia', 'Oceanía'];

/** Nothing on the page is wider than the window (NFR-01). */
async function expectNoSidewaysScroll(page: Page): Promise<void> {
  const widths = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    window: window.innerWidth,
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.window);
}

/** Every element of `targets` (exactly `count`) is at least 48 × 48 px (NFR-05). */
async function expectTargetsOf48px(targets: Locator, count: number): Promise<void> {
  await expect(targets).toHaveCount(count);
  for (const target of await targets.all()) {
    const box = await target.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(48);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
  }
}

test.describe('Atlas', () => {
  let atlas: AtlasPage;

  test.beforeEach(({ page }) => {
    atlas = new AtlasPage(page);
  });

  /** Opens the Atlas from «¿Quién juega?», with no player chosen. */
  async function openWithoutPlayer(page: Page): Promise<void> {
    await new PlayersPage(page).goto();
    await atlas.openButton.click();
    await expect(atlas.heading).toHaveText('Atlas');
  }

  test(
    'ATL-02 NAV-01 NAV-02 the Atlas opens without a player; "Volver" and Back go back to «¿Quién juega?» without asking to leave',
    { tag: ['@ATL-02', '@NAV-01', '@NAV-02'] },
    async ({ page }) => {
      const players = new PlayersPage(page);
      await openWithoutPlayer(page);

      await expect(atlas.regions.getByRole('button')).toHaveText(REGIONS);
      await atlas.backButton.click();
      await expectTargetsOf48px(atlas.openButton, 1);
      await expect(players.heading).toHaveText('¿Quién juega?');

      await atlas.openButton.click();
      await expect(atlas.regions).toBeVisible();
      await page.goBack();
      await expect(players.heading).toHaveText('¿Quién juega?');
      await expect(players.newPlayerButton).toBeVisible();
      await expect(players.exitDialog).toBeHidden();
    },
  );

  test(
    'ATL-02 NAV-01 from the home screen: the same regions; inside a region "Volver" goes to the regions, then home',
    { tag: ['@ATL-02', '@NAV-01'] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      await expectTargetsOf48px(atlas.openButton, 1);
      await atlas.openButton.click();
      await expect(atlas.regions.getByRole('button')).toHaveText(REGIONS);

      await atlas.chooseRegion('Oceanía');
      await expect(atlas.entries('Oceanía')).toHaveCount(14);
      await atlas.backButton.click();
      await expect(atlas.regions).toBeVisible();
      await expect(atlas.entries('Oceanía')).toHaveCount(0);

      await atlas.chooseRegion('Oceanía');
      await page.goBack();
      await expect(atlas.regions).toBeVisible();
      await atlas.backButton.click();
      await expect(home.heading).toHaveText('¿A qué jugamos?');
    },
  );

  test(
    'ATL-01 DATA-08 "Oceanía": 14 countries from "Australia" to "Vanuatu", then 10 "Territorios y otros" with their status',
    { tag: ['@ATL-01', '@DATA-08'] },
    async ({ page }) => {
      await openWithoutPlayer(page);
      await atlas.chooseRegion('Oceanía');

      await expect(atlas.entries('Oceanía')).toHaveCount(14);
      const countries = await atlas.names('Oceanía');
      expect(countries[0]).toBe('Australia');
      expect(countries.at(-1)).toBe('Vanuatu');
      expect(countries).toEqual([...countries].sort(new Intl.Collator('es').compare));

      const newZealand = atlas.entry('Oceanía', 'Nueva Zelanda');
      await expect(newZealand).toHaveText('Nueva ZelandaWellington');
      const pictures = newZealand.locator('img');
      await expect(pictures).toHaveCount(2);
      await newZealand.scrollIntoViewIfNeeded();
      for (const picture of await pictures.all()) {
        await expect
          .poll(() => picture.evaluate((image: HTMLImageElement) => image.naturalWidth))
          .toBeGreaterThan(0);
      }

      await expect(atlas.entries('Territorios y otros')).toHaveCount(10);
      const others = await atlas.names('Territorios y otros');
      expect(others[0]).toBe('Bougainville');
      expect(others.at(-1)).toBe('Tokelau');
      await expect(atlas.entry('Territorios y otros', 'Guam')).toContainText(
        'Territorio no incorporado de los Estados Unidos',
      );
      await expect(atlas.entry('Territorios y otros', 'Niue')).toContainText(
        'Estado en libre asociación con Nueva Zelanda',
      );
    },
  );

  test(
    'ATL-01 "Mundo" lists 195 countries and, under "Territorios y otros", 52 more',
    { tag: ['@ATL-01'] },
    async ({ page }) => {
      await openWithoutPlayer(page);
      await atlas.chooseRegion('Mundo');

      await expect(atlas.entries('Mundo')).toHaveCount(195);
      await expect(atlas.entries('Territorios y otros')).toHaveCount(52);
    },
  );

  test(
    'DATA-03 CAP-02 SHAPE-04 other capitals, an entity without a capital and one without a silhouette',
    { tag: ['@DATA-03', '@CAP-02', '@SHAPE-04'] },
    async ({ page }) => {
      await openWithoutPlayer(page);

      await atlas.chooseRegion('América');
      await expect(atlas.entry('América', 'Bolivia')).toHaveText(
        'BoliviaSucreOtras capitales: La Paz',
      );
      await expect(atlas.entry('América', 'México')).toHaveText('MéxicoCiudad de México');
      await atlas.backButton.click();

      await atlas.chooseRegion('Europa');
      const gibraltar = atlas.entry('Territorios y otros', 'Gibraltar');
      await expect(gibraltar).toHaveText('GibraltarTerritorio británico de ultramar');
      await expect(gibraltar.locator('img')).toHaveCount(2);
      await gibraltar.scrollIntoViewIfNeeded();
      for (const picture of await gibraltar.locator('img').all()) {
        await expect
          .poll(() => picture.evaluate((image: HTMLImageElement) => image.naturalWidth))
          .toBeGreaterThan(0);
      }
      await atlas.backButton.click();

      await atlas.chooseRegion('África');
      const puntland = atlas.entry('Territorios y otros', 'Puntland');
      await expect(puntland).toHaveText('PuntlandGaroweEstado federado de Somalia');
      await expect(puntland.locator('img')).toHaveCount(1);
    },
  );

  test(
    'ATL-02 browsing several regions scores nothing and saves nothing',
    { tag: ['@ATL-02'] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      const lucia = await savedPlayerId(page, 'Lucía');
      expect(lucia).not.toBeNull();
      const storageBefore = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
      await atlas.openButton.click();
      for (const region of ['Oceanía', 'Europa', 'Mundo']) {
        await atlas.chooseRegion(region);
        await expect(atlas.entries(region)).not.toHaveCount(0);
        await atlas.backButton.click();
      }
      await atlas.backButton.click();
      await expect(home.heading).toHaveText('¿A qué jugamos?');

      expect(await savedRoundsOf(page, lucia ?? Number.NaN)).toBe(0);
      expect(await savedPlayerId(page, 'Lucía')).toBe(lucia);
      expect(await page.evaluate(() => JSON.stringify(Object.entries(localStorage)))).toBe(
        storageBefore,
      );
      await home.historyButton.click();
      await expect(new HistoryPage(page).empty).toBeVisible();
      await page.goBack();
      await home.progressButton.click();
      await expect(page.getByText('0 estrellas en total')).toBeVisible();
    },
  );

  test(
    'NFR-06 in English: names, capitals and statuses in English, in English order',
    { tag: ['@NFR-06', '@ATL-01', '@DATA-08'] },
    async ({ page }) => {
      await new PlayersPage(page).goto();
      await new HomePage(page).chooseLanguage('English');
      await page.getByRole('contentinfo').getByRole('button', { name: 'Atlas' }).click();
      await expect(
        page.getByRole('region', { name: 'Which region do you want to see?' }),
      ).toBeVisible();

      await atlas.chooseRegion('Oceania');
      await expect(atlas.entry('Territories and others', 'Tokelau')).toContainText(
        'Dependent territory of New Zealand',
      );
      for (const section of ['Oceania', 'Territories and others']) {
        const names = await atlas.names(section);
        expect(names.length).toBeGreaterThan(0);
        expect(names).toEqual([...names].sort(new Intl.Collator('en').compare));
      }
    },
  );

  test(
    'NFR-05 NFR-03 NFR-01 "Mundo": list items with empty alt pictures, far images not requested until scrolled to, no axe violations, 48 px buttons, no sideways scroll at 360 px',
    { tag: ['@NFR-05', '@NFR-03', '@NFR-01'] },
    async ({ page, makeAxeBuilder }) => {
      await page.setViewportSize({ width: 360, height: 640 });
      const requested: string[] = [];
      // Only the pictures: in dev, Vite also loads a small script per flag, its address.
      page.on('request', (request) => {
        if (request.resourceType() === 'image') requested.push(request.url());
      });
      await openWithoutPlayer(page);
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
      await expectTargetsOf48px(atlas.regions.getByRole('button'), 6);
      await expectTargetsOf48px(atlas.backButton, 1);

      await atlas.chooseRegion('Mundo');
      await expect(atlas.entries('Mundo')).toHaveCount(195);
      const zimbabwe = atlas.entry('Mundo', 'Zimbabue');
      await expect(zimbabwe).toHaveText('ZimbabueHarare');
      const alts = await page
        .getByRole('main')
        .locator('img')
        .evaluateAll((images) => images.map((image) => image.getAttribute('alt')));
      // A flag and a silhouette for each of the 247 entities, but Puntland and Jubalandia (SHAPE-04).
      expect(alts).toHaveLength(2 * 247 - 2);
      expect(alts.every((alt) => alt === '')).toBe(true);
      // The first flag, on screen, is asked for: only then does the absence of the last one mean something.
      await expect.poll(() => requested.some((url) => url.includes('/flags/af.svg'))).toBe(true);
      expect(requested.some((url) => url.includes('/flags/zw.svg'))).toBe(false);

      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
      await expectNoSidewaysScroll(page);

      await zimbabwe.scrollIntoViewIfNeeded();
      await expect.poll(() => requested.some((url) => url.includes('/flags/zw.svg'))).toBe(true);
    },
  );
});
