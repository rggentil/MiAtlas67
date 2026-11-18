import type { Locator, Page } from '@playwright/test';
import type { Question } from '../../../src/domain/questions.ts';
import { wrongOption } from '../expected.ts';

/** Page object for the round screen: one question at a time (spec §8). */
export class RoundPage {
  /** The question, e.g. "¿De qué país es esta bandera?". */
  readonly heading: Locator;
  /** The chips of the round: topic, region and level, e.g. Banderas · Europa · Fácil. */
  readonly settings: Locator;
  readonly progressBar: Locator;
  /** The visible progress, e.g. "1/10" (RND-06). */
  readonly progressText: Locator;
  /** The visible score, e.g. "Aciertos: 1" (RND-06). */
  readonly score: Locator;
  /** The flag to guess (FLAG-A). */
  readonly flag: Locator;
  /** The list of answers ("Respuestas"). */
  readonly answers: Locator;
  /** The answer buttons, in the order they are shown. */
  readonly options: Locator;
  /** The feedback after answering: "¡Correcto!" or "¡Uy! Era …" (RND-04). */
  readonly feedback: Locator;
  readonly nextButton: Locator;
  readonly quitButton: Locator;
  readonly quitDialog: Locator;
  /** "Seguir jugando" in the quit question. */
  readonly stayButton: Locator;
  /** "Sí, salir" in the quit question. */
  readonly confirmQuitButton: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.settings = page.getByRole('list', { name: 'Esta partida' }).getByRole('listitem');
    this.progressBar = page.getByRole('progressbar', { name: 'Progreso de la partida' });
    this.progressText = page.getByText(/^\d+\/\d+$/);
    this.score = page.getByText(/^Aciertos: \d+$/);
    this.flag = page.getByRole('img', { name: 'La bandera que hay que adivinar' });
    this.answers = page.getByRole('list', { name: 'Respuestas' });
    this.options = this.answers.getByRole('button');
    this.feedback = page.getByRole('status');
    this.nextButton = page.getByRole('button', { name: 'Siguiente' });
    this.quitButton = page.getByRole('button', { name: 'Salir de la partida' });
    this.quitDialog = page.getByRole('dialog', { name: '¿Salir de la partida?' });
    this.stayButton = this.quitDialog.getByRole('button', { name: 'Seguir jugando' });
    this.confirmQuitButton = this.quitDialog.getByRole('button', { name: 'Sí, salir' });
  }

  /** The answer button with exactly this name. */
  option(name: string): Locator {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** The ✓ ("Correcta") or ✗ ("Incorrecta") mark next to an answer, once the question is answered. */
  mark(optionName: string, mark: 'Correcta' | 'Incorrecta'): Locator {
    return this.page
      .getByRole('listitem')
      .filter({ has: this.option(optionName) })
      .getByRole('img', { name: mark, exact: true });
  }

  /** The ✓ or ✗ tile of the feedback panel. */
  feedbackMark(mark: 'Correcta' | 'Incorrecta'): Locator {
    return this.feedback.getByRole('img', { name: mark, exact: true });
  }

  async answer(name: string): Promise<void> {
    await this.option(name).click();
  }

  /**
   * Plays a whole FLAG-A round: the questions at `wrongAt` with a wrong country, the others right, tapping
   * "Siguiente" after each answer.
   */
  async playRound(questions: readonly Question[], wrongAt: readonly number[]): Promise<void> {
    for (const [index, question] of questions.entries()) {
      const option = wrongAt.includes(index) ? wrongOption(question) : question.entity;
      await this.answer(option.name.es);
      await this.nextButton.click();
    }
  }

  /** "Salir de la partida", then "Sí, salir" in the confirmation (RND-07). */
  async quit(): Promise<void> {
    await this.quitButton.click();
    await this.confirmQuitButton.click();
  }
}
