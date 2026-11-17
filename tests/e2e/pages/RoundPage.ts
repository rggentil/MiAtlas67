import type { Locator, Page } from '@playwright/test';

/** Page object for the round screen: one question at a time (spec §8). */
export class RoundPage {
  /** The chips of the round: topic, region and level, e.g. Banderas · Europa · Fácil. */
  readonly settings: Locator;
  readonly progressBar: Locator;
  /** The visible progress, e.g. "1/10" (RND-06). */
  readonly progressText: Locator;

  constructor(page: Page) {
    this.settings = page.getByRole('list', { name: 'Esta partida' }).getByRole('listitem');
    this.progressBar = page.getByRole('progressbar', { name: 'Progreso de la partida' });
    this.progressText = page.getByText(/^\d+\/\d+$/);
  }
}
