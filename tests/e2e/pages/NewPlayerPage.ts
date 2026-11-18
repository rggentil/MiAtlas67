import type { Locator, Page } from '@playwright/test';

/**
 * Page object for the player form: "Nuevo jugador" (PRF-02) and "Editar jugador" (PRF-04), a nickname and an
 * avatar, nothing else. When editing, "Borrar jugador" asks "¿Borrar a Lucía?" first.
 */
export class NewPlayerPage {
  /** "Nuevo jugador" */
  readonly heading: Locator;
  /** "Nombre" */
  readonly nicknameInput: Locator;
  /** "Elige un animal": the 11 avatars, as radio buttons named after their animal. */
  readonly avatars: Locator;
  readonly createButton: Locator;
  /** "Guardar", when editing. */
  readonly saveButton: Locator;
  /** "Borrar jugador", when editing. */
  readonly deleteButton: Locator;
  readonly backButton: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.nicknameInput = page.getByRole('textbox', { name: 'Nombre' });
    this.avatars = page.getByRole('group', { name: 'Elige un animal' });
    this.createButton = page.getByRole('button', { name: 'Crear' });
    this.saveButton = page.getByRole('button', { name: 'Guardar' });
    this.deleteButton = page.getByRole('button', { name: 'Borrar jugador' });
    this.backButton = page.getByRole('button', { name: 'Volver' });
  }

  /** "¿Borrar a Lucía?" for the player `nickname`. */
  deleteDialog(nickname: string): Locator {
    return this.page.getByRole('dialog', { name: `¿Borrar a ${nickname}?` });
  }

  /** Changes the nickname and the avatar of the player being edited, and taps "Guardar". */
  async edit(nickname: string, avatar: string): Promise<void> {
    await this.nicknameInput.fill(nickname);
    await this.chooseAvatar(avatar);
    await this.saveButton.click();
  }

  /** An avatar by its animal, e.g. "Zorro". */
  avatar(name: string): Locator {
    return this.avatars.getByRole('radio', { name });
  }

  /** Taps an avatar: its radio button covers the whole tile, transparent over the picture. */
  async chooseAvatar(name: string): Promise<void> {
    await this.avatar(name).check();
  }

  /** A message about the nickname, such as "Escribe un nombre". */
  message(text: string): Locator {
    return this.page.getByText(text, { exact: true });
  }

  /** Types the nickname, chooses the avatar and taps "Crear". */
  async create(nickname: string, avatar: string): Promise<void> {
    await this.nicknameInput.fill(nickname);
    await this.chooseAvatar(avatar);
    await this.createButton.click();
  }
}
