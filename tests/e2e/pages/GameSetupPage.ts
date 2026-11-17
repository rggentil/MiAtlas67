import type { Locator, Page } from '@playwright/test';

/** Page object for the game setup screen: Game → Region → Level (LVL-01). */
export class GameSetupPage {
  /** The game's name, e.g. "Bandera → País". */
  readonly heading: Locator;
  readonly backButton: Locator;
  /** The region step, "¿Dónde jugamos?", and its buttons. */
  readonly regionStep: Locator;
  /** The level step, "¿Qué nivel?", and its buttons. */
  readonly levelStep: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.backButton = page.getByRole('button', { name: 'Volver' });
    this.regionStep = page.getByRole('region', { name: '¿Dónde jugamos?' });
    this.levelStep = page.getByRole('region', { name: '¿Qué nivel?' });
  }

  async chooseRegion(name: string): Promise<void> {
    await this.regionStep.getByRole('button', { name, exact: true }).click();
  }

  async chooseLevel(name: string): Promise<void> {
    await this.levelStep.getByRole('button', { name, exact: true }).click();
  }
}
