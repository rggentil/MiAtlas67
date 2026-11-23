import type { Locator, Page } from '@playwright/test';

/** Page object for the Atlas: choose a region, then browse its entities (ATL-01, ATL-02, D34). */
export class AtlasPage {
  /** "Atlas" in the footer of the home screen and of «¿Quién juega?». */
  readonly openButton: Locator;
  /** "Atlas" */
  readonly heading: Locator;
  readonly backButton: Locator;
  /** The first step, "¿Qué región quieres ver?", with its region buttons. */
  readonly regions: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.openButton = page.getByRole('contentinfo').getByRole('button', { name: 'Atlas' });
    this.heading = page.getByRole('heading', { level: 1 });
    this.backButton = page.getByRole('button', { name: 'Volver' });
    this.regions = page.getByRole('region', { name: '¿Qué región quieres ver?' });
  }

  async chooseRegion(name: string): Promise<void> {
    await this.page.getByRole('button', { name, exact: true }).click();
  }

  /** The entries of a section: the region's countries ("Oceanía") or "Territorios y otros". */
  entries(section: string): Locator {
    return this.page.getByRole('region', { name: section, exact: true }).getByRole('listitem');
  }

  /** The entry of `name` in `section`; its first line is the name. */
  entry(section: string, name: string): Locator {
    return this.entries(section).filter({ has: this.page.getByText(name, { exact: true }) });
  }

  /** The names of the entries of a section, in the order shown. */
  async names(section: string): Promise<string[]> {
    return this.entries(section).evaluateAll((items) =>
      items.map((item) => item.querySelector('p')?.textContent ?? ''),
    );
  }
}
