import type { Locator, Page } from '@playwright/test';

/** Page object for the game setup screen, opened from the home screen (LVL-01). */
export class GameSetupPage {
  /** The game's name, e.g. "Bandera → País". */
  readonly heading: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.backButton = page.getByRole('button', { name: 'Volver' });
  }
}
