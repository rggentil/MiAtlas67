import { expect, type Locator, type Page } from '@playwright/test';

/** Page object for "¿Quién juega?", the first screen: the players of the device (PRF-01). */
export class PlayersPage {
  /** "¿Quién juega?" / "Who's playing?" */
  readonly heading: Locator;
  /** The list of the players, "Jugadores". */
  readonly list: Locator;
  /** "Nuevo jugador": only while fewer than 8 players fit (PRF-05). */
  readonly newPlayerButton: Locator;
  /** The note shown instead of "Nuevo jugador" with 8 players (PRF-05). */
  readonly fullNote: Locator;
  /** "¿Salir del juego?": Back on this screen asks first (NAV-02, D22). */
  readonly exitDialog: Locator;
  /** "Seguir jugando" in that question. */
  readonly exitStayButton: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.list = page.getByRole('list', { name: 'Jugadores' });
    this.newPlayerButton = page.getByRole('button', { name: 'Nuevo jugador' });
    this.fullNote = page.getByText('En este dispositivo caben 8 jugadores como mucho.');
    this.exitDialog = this.exitDialogNamed('¿Salir del juego?');
    this.exitStayButton = this.exitDialog.getByRole('button', { name: 'Seguir jugando' });
  }

  /** Opens the game on this screen; `query` such as "?seed=42" is kept while playing. */
  async goto(query = ''): Promise<void> {
    await this.page.goto(`/${query}`);
    await expect(this.heading).toHaveText('¿Quién juega?');
  }

  /**
   * A player by nickname. "Jugó la última vez" sits next to the button as its description, so the name is
   * exactly the nickname written on it.
   */
  player(nickname: string): Locator {
    return this.page.getByRole('button', { name: nickname, exact: true });
  }

  async choose(nickname: string): Promise<void> {
    await this.player(nickname).click();
  }

  /** The question "¿Salir del juego?" by its name, e.g. "Leave the game?" in English. */
  exitDialogNamed(name: string): Locator {
    return this.page.getByRole('dialog', { name });
  }

  /**
   * Waits until the game keeps only this screen's own history entry: it trims the others a moment after
   * coming back here (NAV-02).
   */
  async onlyOwnEntryLeft(): Promise<void> {
    await expect
      .poll(() => this.page.evaluate(() => window.history.state as unknown))
      .toEqual({ miatlas: 1 });
  }
}
