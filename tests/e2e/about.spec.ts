import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { AboutPage } from './pages/AboutPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { PlayersPage } from './pages/PlayersPage.ts';

const NEUTRALITY =
  'Incluir un territorio, un estado con reconocimiento limitado o una región autónoma refleja su geografía y su bandera, no una posición política.';

/** Nothing on the page is wider than the window (NFR-01). */
async function expectNoSidewaysScroll(page: Page): Promise<void> {
  const widths = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    window: window.innerWidth,
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.window);
}

test.describe('"Acerca de"', () => {
  let about: AboutPage;

  test.beforeEach(({ page }) => {
    about = new AboutPage(page);
  });

  test(
    'NAV-01 "Acerca de" opens from the home screen; "Volver" and Back go back there',
    { tag: ['@NAV-01', '@DATA-05'] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await about.openButton.click();
      await expect(about.heading).toHaveText('Acerca de');
      await about.backButton.click();
      await expect(home.heading).toHaveText('¿A qué jugamos?');

      await about.openButton.click();
      await expect(about.heading).toHaveText('Acerca de');
      await page.goBack();
      await expect(home.heading).toHaveText('¿A qué jugamos?');
    },
  );

  test(
    'NAV-01 NAV-02 "Acerca de" opens before choosing a player; "Volver" and Back go back to «¿Quién juega?» without asking to leave',
    { tag: ['@NAV-01', '@NAV-02'] },
    async ({ page }) => {
      const players = new PlayersPage(page);
      await players.goto();

      await about.openButton.click();
      await expect(about.heading).toHaveText('Acerca de');
      await about.backButton.click();
      await expect(players.heading).toHaveText('¿Quién juega?');

      await about.openButton.click();
      await expect(about.heading).toHaveText('Acerca de');
      await page.goBack();
      await expect(players.heading).toHaveText('¿Quién juega?');
      await expect(players.exitDialog).toBeHidden();
      await expect(players.newPlayerButton).toBeVisible();
    },
  );

  test(
    'DATA-05 D13 D21 D25 the credits of flags, silhouettes and animals, with the 15 Commons flags one by one',
    { tag: ['@DATA-05'] },
    async ({ page }) => {
      await new PlayersPage(page).goto();
      await about.openButton.click();

      const flags = about.section('Banderas');
      const flagIcons = about.credit(flags, 'flag-icons');
      await expect(flagIcons).toContainText('MIT');
      await expect(flagIcons).toContainText('© 2013 Panayiotis Lipiridis');

      await about.commonsToggle.click();
      await expect(about.commonsList.getByRole('listitem')).toHaveCount(15);
      for (const name of ['Afganistán', 'Abjasia', 'Puntland', 'Zanzíbar']) {
        await expect(about.credit(about.commonsList, name)).toContainText(
          'https://commons.wikimedia.org/wiki/File:',
        );
      }
      const sintEustatius = about.credit(about.commonsList, 'San Eustaquio');
      await expect(sintEustatius).toContainText('CC BY-SA 4.0');
      await expect(sintEustatius).toContainText('Andrwsc');
      const saba = about.credit(about.commonsList, 'Saba');
      await expect(saba).toContainText('CC BY-SA 3.0');
      await expect(saba).toContainText('Mysid');
      await expect(
        about.commonsList.getByRole('listitem').filter({ hasText: 'Dominio público' }),
      ).toHaveCount(13);

      const shapes = about.section('Siluetas');
      await expect(about.credit(shapes, 'Natural Earth')).toContainText('Dominio público');
      const vatican = about.credit(shapes, 'Ciudad del Vaticano');
      await expect(vatican).toContainText('© OpenStreetMap contributors');
      await expect(vatican).toContainText('ODbL');

      const openMoji = about.credit(about.section('Animales'), 'OpenMoji');
      await expect(openMoji).toContainText('CC BY-SA 4.0');
      await expect(openMoji).toContainText(
        'All emojis designed by OpenMoji – the open-source emoji and icon project',
      );
    },
  );

  test(
    'DATA-08 the neutrality statement under "Territorios y nombres"',
    { tag: ['@DATA-08'] },
    async ({ page }) => {
      await new PlayersPage(page).goto();
      await about.openButton.click();

      const territories = about.section('Territorios y nombres');
      await expect(territories).toContainText(NEUTRALITY);
      await expect(territories).toContainText('Los nombres son las formas neutras más usadas.');
    },
  );

  test(
    'NFR-04 with every request to another site blocked, every source is written out with its address and nothing was asked',
    { tag: ['@NFR-04'] },
    async ({ page, baseURL }) => {
      const own = new URL(baseURL ?? page.url()).origin;
      const elsewhere: string[] = [];
      await page.route('**/*', (route) => {
        const url = route.request().url();
        if (new URL(url).origin === own) return route.continue();
        elsewhere.push(url);
        return route.abort();
      });
      await new PlayersPage(page).goto();
      await about.openButton.click();
      await about.commonsToggle.click();

      await expect(about.credit(about.section('Banderas'), 'flag-icons')).toContainText(
        'https://github.com/lipis/flag-icons',
      );
      await expect(about.credit(about.commonsList, 'Saba')).toContainText(
        'https://commons.wikimedia.org/wiki/File:Flag_of_Saba.svg',
      );
      await expect(about.credit(about.section('Siluetas'), 'Natural Earth')).toContainText(
        'https://www.naturalearthdata.com/',
      );
      await expect(about.credit(about.section('Animales'), 'OpenMoji')).toContainText(
        'https://openmoji.org/',
      );
      await expect(page.getByRole('link')).toHaveCount(0);
      expect(elsewhere).toEqual([]);
    },
  );

  test(
    "NFR-06 DATA-08 in English, with the licensors' credit lines in their original wording",
    { tag: ['@NFR-06', '@DATA-08'] },
    async ({ page }) => {
      const players = new PlayersPage(page);
      await players.goto();
      await page.getByText('English', { exact: true }).click();
      await page.getByRole('contentinfo').getByRole('button', { name: 'About' }).click();

      await expect(about.heading).toHaveText('About');
      await expect(page.getByRole('heading', { level: 2 })).toHaveText([
        'Flags',
        'Silhouettes',
        'Animals',
        'Territories and names',
      ]);
      await expect(about.credit(about.section('Silhouettes'), 'Natural Earth')).toContainText(
        'Public domain',
      );
      await expect(about.credit(about.section('Silhouettes'), 'Vatican City')).toContainText(
        '© OpenStreetMap contributors',
      );
      await expect(about.credit(about.section('Animals'), 'OpenMoji')).toContainText(
        'All emojis designed by OpenMoji – the open-source emoji and icon project',
      );
      await expect(about.section('Territories and names')).toContainText(
        'Including a territory, a state with limited recognition or an autonomous region reflects its geography and its flag, not a political position.',
      );
    },
  );

  test(
    'NFR-05 one h1 and a heading per section, a list that opens with the keyboard and says so, no axe violations, 48 px buttons and no sideways scroll at 360 px',
    { tag: ['@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      await page.setViewportSize({ width: 360, height: 640 });
      await new PlayersPage(page).goto();
      await about.openButton.click();

      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 2 })).toHaveText([
        'Banderas',
        'Siluetas',
        'Animales',
        'Territorios y nombres',
      ]);
      await expect(about.heading).toBeFocused();
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);

      await about.commonsToggle.focus();
      await expect(about.commonsToggle).toHaveAttribute('aria-expanded', 'false');
      await page.keyboard.press('Enter');
      await expect(about.commonsToggle).toHaveAttribute('aria-expanded', 'true');
      await expect(about.commonsList).toBeVisible();
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
      await expectNoSidewaysScroll(page);
      for (const button of await page.getByRole('button').all()) {
        const box = await button.boundingBox();
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(48);
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
      }

      await page.keyboard.press('Space');
      await expect(about.commonsToggle).toHaveAttribute('aria-expanded', 'false');
      await expect(about.commonsList).toBeHidden();
    },
  );
});
