import { expect, type Locator, type Page } from '@playwright/test';
import { NewPlayerPage } from './NewPlayerPage.ts';
import { PlayersPage } from './PlayersPage.ts';

/** Page object for the home screen: who plays, and the six games grouped by topic (GAME-01). */
export class HomePage {
  /** "¿A qué jugamos?" / "What shall we play?" */
  readonly heading: Locator;
  /** Every topic section (Banderas, Capitales, Siluetas). */
  readonly topics: Locator;
  /** Who plays: the avatar, named after its animal, and the nickname (PRF-01). */
  readonly currentPlayer: Locator;
  /** The player button in it, named after the nickname: it opens «¿Quién juega?» (PRF-03). */
  readonly switchPlayerButton: Locator;
  /** "Historial": the rounds of the player who plays (HIS-02). */
  readonly historyButton: Locator;
  /** "Progreso": the best stars of the player who plays (HIS-03). */
  readonly progressButton: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.topics = page.getByRole('region');
    this.currentPlayer = page.getByRole('group', { name: 'Jugador' });
    this.switchPlayerButton = this.currentPlayer.getByRole('button');
    this.historyButton = page.getByRole('button', { name: 'Historial' });
    this.progressButton = page.getByRole('button', { name: 'Progreso' });
  }

  /**
   * Opens the game and creates the player "Lucía" with "Zorro", as a child does the first time, so the test
   * starts on the home screen. `query` such as "?seed=42" is kept while playing.
   */
  async goto(query = ''): Promise<void> {
    await new PlayersPage(this.page).goto(query);
    await new PlayersPage(this.page).newPlayerButton.click();
    await new NewPlayerPage(this.page).create('Lucía', 'Zorro');
    await expect(this.heading).toHaveText('¿A qué jugamos?');
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
