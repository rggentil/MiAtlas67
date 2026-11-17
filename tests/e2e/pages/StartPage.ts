import type { Locator, Page } from '@playwright/test';

/** Page object for the start page. */
export class StartPage {
  readonly heading: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Hola MiAtlas68' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }
}
