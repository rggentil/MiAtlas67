import type { Locator, Page } from '@playwright/test';

const LEVEL_COLUMNS = { Fácil: 0, Medio: 1, Difícil: 2, Experto: 3 } as const;

/** Page object for "Progreso": the total stars and one table per game, regions × levels (HIS-03). */
export class ProgressPage {
  /** "Progreso" */
  readonly heading: Locator;
  /** Every game table. */
  readonly tables: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.tables = page.getByRole('table');
  }

  /** The table of a game, by its caption, e.g. "Bandera → País". */
  table(game: string): Locator {
    return this.page.getByRole('table', { name: game });
  }

  /** The cell of `region` and `level` in the table of `game`: its text is "3 de 3 estrellas" or "Sin jugar". */
  cell(game: string, region: string, level: keyof typeof LEVEL_COLUMNS): Locator {
    return this.table(game)
      .getByRole('row')
      .filter({ has: this.page.getByRole('rowheader', { name: region, exact: true }) })
      .getByRole('cell')
      .nth(LEVEL_COLUMNS[level]);
  }

  /** "Países dominados: 1/195" of a game (HIS-04). */
  mastered(game: string): Locator {
    return this.page.getByRole('region', { name: game }).getByText(/^Países dominados:/);
  }

  /** "Territorios y otros dominados: 3/52" of a game: the extended entities mastered, counted apart (HIS-04). */
  masteredExtended(game: string): Locator {
    return this.page
      .getByRole('region', { name: game })
      .getByText(/^Territorios y otros dominados:/);
  }

  /** "6 estrellas en total" */
  total(text: string): Locator {
    return this.page.getByText(text, { exact: true });
  }
}
