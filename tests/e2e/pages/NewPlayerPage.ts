import type { Locator, Page } from '@playwright/test';

/** Page object for "Nuevo jugador": a nickname and an avatar, nothing else (PRF-02). */
export class NewPlayerPage {
  /** "Nuevo jugador" */
  readonly heading: Locator;
  /** "Nombre" */
  readonly nicknameInput: Locator;
  /** "Elige un animal": the 11 avatars, as radio buttons named after their animal. */
  readonly avatars: Locator;
  readonly createButton: Locator;
  readonly backButton: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.nicknameInput = page.getByRole('textbox', { name: 'Nombre' });
    this.avatars = page.getByRole('group', { name: 'Elige un animal' });
    this.createButton = page.getByRole('button', { name: 'Crear' });
    this.backButton = page.getByRole('button', { name: 'Volver' });
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
