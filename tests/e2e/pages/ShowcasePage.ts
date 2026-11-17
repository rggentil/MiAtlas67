import type { Locator, Page } from '@playwright/test';

/** Page object for the dev-only component showcase (/#showcase). */
export class ShowcasePage {
  readonly buttons: Locator;
  readonly primaryButton: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.buttons = page.getByRole('button');
    this.primaryButton = page.getByRole('button', { name: 'Siguiente' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/#showcase');
    await this.page.getByRole('heading', { name: 'Componentes' }).waitFor();
  }
}
