import type { Locator, Page } from '@playwright/test';

/** Page object for "Historial": the rounds of the player who plays, newest first (HIS-02). */
export class HistoryPage {
  /** "Historial" */
  readonly heading: Locator;
  /** The list of the rounds, "Partidas", newest first. */
  readonly rounds: Locator;
  /** Every round of the list. */
  readonly entries: Locator;
  /** The filter, "Juego": "Todos" and the games that can be played. */
  readonly filter: Locator;
  /** "Todavía no hay partidas." */
  readonly empty: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.rounds = page.getByRole('list', { name: 'Partidas' });
    this.entries = this.rounds.getByRole('listitem');
    this.filter = page.getByRole('group', { name: 'Juego' });
    this.empty = page.getByText('Todavía no hay partidas.', { exact: true });
    this.backButton = page.getByRole('button', { name: 'Volver' });
  }

  /** A filter option by its text, e.g. "Todos" or "País → Bandera". */
  filterOption(name: string): Locator {
    return this.filter.getByRole('radio', { name });
  }

  /** Taps a filter chip (the radio input itself is visually hidden behind its label). */
  async chooseFilter(name: string): Promise<void> {
    await this.filter.getByText(name, { exact: true }).click();
  }
}
