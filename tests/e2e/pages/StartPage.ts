import type { Locator, Page } from '@playwright/test';

/** Page object for the start page. */
export class StartPage {
  /** The main title, in whatever language is active ("Hola MiAtlas67" / "Hello MiAtlas67"). */
  readonly heading: Locator;
  readonly tagline: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.tagline = page.getByRole('main').locator('p').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  languageOption(name: 'Español' | 'English'): Locator {
    return this.page.getByRole('radio', { name });
  }

  /** Taps a language chip (the radio input itself is visually hidden behind its label). */
  async chooseLanguage(name: 'Español' | 'English'): Promise<void> {
    await this.page.getByText(name, { exact: true }).click();
  }
}
