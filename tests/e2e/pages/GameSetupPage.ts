import type { Locator, Page } from '@playwright/test';

const STEP_NAMES = {
  es: { back: 'Volver', region: '¿Dónde jugamos?', level: '¿Qué nivel?' },
  en: { back: 'Back', region: 'Where shall we play?', level: 'Which level?' },
} as const;

/** Page object for the game setup screen: Game → Region → Level (LVL-01), in Spanish or English. */
export class GameSetupPage {
  /** The game's name, e.g. "Bandera → País". */
  readonly heading: Locator;
  readonly backButton: Locator;
  /** The region step, "¿Dónde jugamos?", and its buttons. */
  readonly regionStep: Locator;
  /** The level step, "¿Qué nivel?", and its buttons. */
  readonly levelStep: Locator;

  constructor(page: Page, language: 'es' | 'en' = 'es') {
    const names = STEP_NAMES[language];
    this.heading = page.getByRole('heading', { level: 1 });
    this.backButton = page.getByRole('button', { name: names.back });
    this.regionStep = page.getByRole('region', { name: names.region });
    this.levelStep = page.getByRole('region', { name: names.level });
  }

  async chooseRegion(name: string): Promise<void> {
    await this.regionStep.getByRole('button', { name, exact: true }).click();
  }

  async chooseLevel(name: string): Promise<void> {
    await this.levelStep.getByRole('button', { name, exact: true }).click();
  }
}
