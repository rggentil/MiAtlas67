import { expect, test } from './fixtures.ts';
import { HomePage } from './pages/HomePage.ts';

test.describe('Installable on the home screen', () => {
  test(
    'NFR-02 the page links a manifest named "MiAtlas67" that opens full screen on the start page, with its icons',
    { tag: '@NFR-02' },
    async ({ page, request }) => {
      await new HomePage(page).goto();

      const href = await page.locator('link[rel="manifest"]').getAttribute('href');
      expect(href).toBeTruthy();
      const manifestUrl = new URL(href ?? '', page.url()).href;
      const response = await request.get(manifestUrl);
      expect(response.ok()).toBe(true);
      const manifest = (await response.json()) as {
        name: string;
        short_name: string;
        display: string;
        start_url: string;
        icons: { src: string; sizes: string }[];
      };
      expect(manifest).toMatchObject({
        name: 'MiAtlas67',
        short_name: 'MiAtlas67',
        display: 'standalone',
      });
      expect(new URL(manifest.start_url, manifestUrl).pathname).toBe(new URL(page.url()).pathname);
      expect(manifest.icons.map((icon) => icon.sizes)).toEqual(
        expect.arrayContaining(['192x192', '512x512']),
      );
      for (const icon of manifest.icons) {
        const iconResponse = await request.get(new URL(icon.src, manifestUrl).href);
        expect(iconResponse.headers()['content-type']).toContain('image/png');
      }
    },
  );

  test(
    'NFR-02 iPhone gets its own home screen icon, name and full screen mode',
    { tag: '@NFR-02' },
    async ({ page, request }) => {
      await new HomePage(page).goto();

      const touchIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
      const iconResponse = await request.get(new URL(touchIcon ?? '', page.url()).href);
      expect(iconResponse.headers()['content-type']).toContain('image/png');
      await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute(
        'content',
        'MiAtlas67',
      );
      await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute(
        'content',
        'yes',
      );
    },
  );
});
