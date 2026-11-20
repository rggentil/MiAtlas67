import type { Locator, Page } from '@playwright/test';

const LEVEL_COLUMNS = { Fácil: 0, Medio: 1, Difícil: 2 } as const;

/** Page object for "Récords de la familia": one table per game, regions × levels (HIS-05, D28). */
export class RecordsPage {
  /** "Récords de la familia" */
  readonly heading: Locator;
  readonly backButton: Locator;
  /** Every game table. */
  readonly tables: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.backButton = page.getByRole('button', { name: 'Volver' });
    this.tables = page.getByRole('table');
  }

  /** The table of a game, by its caption, e.g. "Bandera → País". */
  table(game: string): Locator {
    return this.page.getByRole('table', { name: game });
  }

  /** The cell of `region` and `level` in the table of `game`: its text is "9/10Pablo" or "Sin récord". */
  cell(game: string, region: string, level: keyof typeof LEVEL_COLUMNS): Locator {
    return this.table(game)
      .getByRole('row')
      .filter({ has: this.page.getByRole('rowheader', { name: region, exact: true }) })
      .getByRole('cell')
      .nth(LEVEL_COLUMNS[level]);
  }
}
