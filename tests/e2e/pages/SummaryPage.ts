import type { Locator, Page } from '@playwright/test';

/** Page object for the round summary (RND-08). */
export class SummaryPage {
  /** An encouraging title that depends on the stars, e.g. "¡Muy bien!" or "¡Perfecto!". */
  readonly heading: Locator;
  /** The stars as one image, named e.g. "2 de 3 estrellas" (SCR-02). */
  readonly stars: Locator;
  /** The celebration of a perfect round. */
  readonly celebration: Locator;
  /** "Para repasar": the missed entities, each with its flag and its name. */
  readonly missed: Locator;
  readonly playAgainButton: Locator;
  readonly menuButton: Locator;
  /** "¡Nuevo récord!": the player beat their best in this game, region and level (RND-08, D23). */
  readonly newRecord: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.stars = page.getByRole('img', { name: /de 3 estrellas$/ });
    this.celebration = page.getByRole('img', { name: '¡Ronda perfecta!' });
    this.missed = page.getByRole('list', { name: 'Para repasar' }).getByRole('listitem');
    this.playAgainButton = page.getByRole('button', { name: 'Jugar otra vez' });
    this.menuButton = page.getByRole('button', { name: 'Menú' });
    this.newRecord = page.getByRole('status').getByText('¡Nuevo récord!', { exact: true });
  }

  /** The flag of the n-th missed entity (from 0). Its alt text is empty, next to the name, so it has no role. */
  missedFlag(index: number): Locator {
    return this.missed.nth(index).locator('img');
  }

  /** The score, e.g. "8/10" (SCR-01). */
  score(text: string): Locator {
    return this.page.getByText(text, { exact: true });
  }
}
