import type { Locator, Page } from '@playwright/test';

/** Page object for the home screen: the six games grouped by topic (GAME-01). */
export class HomePage {
  /** "¿A qué jugamos?" / "What shall we play?" */
  readonly heading: Locator;
  /** Every topic section (Banderas, Capitales, Siluetas). */
  readonly topics: Locator;
  /** "¿Salir del juego?": Back on the home screen asks first (NAV-02). */
  readonly exitDialog: Locator;
  /** "Seguir jugando" in that question. */
  readonly exitStayButton: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.topics = page.getByRole('region');
    this.exitDialog = page.getByRole('dialog', { name: '¿Salir del juego?' });
    this.exitStayButton = this.exitDialog.getByRole('button', { name: 'Seguir jugando' });
  }

  /** Opens the app; `query` such as "?seed=42" is kept while playing. */
  async goto(query = ''): Promise<void> {
    await this.page.goto(`/${query}`);
  }

  topic(name: string): Locator {
    return this.page.getByRole('region', { name });
  }

  /**
   * A game button by its direction, e.g. "Bandera → País". Its full accessible name also holds the
   * question ("Bandera → País ¿De qué país es?") and, for the games still to come, "Pronto".
   */
  game(direction: string): Locator {
    return this.page.getByRole('button', { name: direction });
  }

  async openGame(name: string): Promise<void> {
    await this.game(name).click();
  }

  languageOption(name: 'Español' | 'English'): Locator {
    return this.page.getByRole('radio', { name });
  }

  /** Taps a language chip (the radio input itself is visually hidden behind its label). */
  async chooseLanguage(name: 'Español' | 'English'): Promise<void> {
    await this.page.getByText(name, { exact: true }).click();
  }
}
