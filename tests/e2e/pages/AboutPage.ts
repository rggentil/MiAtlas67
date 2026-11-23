import type { Locator, Page } from '@playwright/test';

/** Page object for "Acerca de": sources, licences and the neutrality statement (DATA-05, DATA-08, D33). */
export class AboutPage {
  /** "Acerca de" in the footer of the home screen and of «¿Quién juega?». */
  readonly openButton: Locator;
  /** "Acerca de" / "About" */
  readonly heading: Locator;
  readonly backButton: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.openButton = page.getByRole('contentinfo').getByRole('button', { name: 'Acerca de' });
    this.heading = page.getByRole('heading', { level: 1 });
    this.backButton = page.getByRole('button', { name: 'Volver' });
  }

  /** A section by its heading, e.g. "Banderas". */
  section(name: string): Locator {
    return this.page.getByRole('region', { name });
  }

  /** The credit of `title` ("Wikimedia Commons", "Saba") inside `within`. */
  credit(within: Locator, title: string): Locator {
    return within
      .getByRole('listitem')
      .filter({ has: this.page.getByText(title, { exact: true }) });
  }
}
