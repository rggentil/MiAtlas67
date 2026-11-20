import type { Level } from '../domain/questions.ts';
import type { MessageKey } from '../i18n/dictionaries.ts';

/** UI text of each level: Fácil, Medio, Difícil, Experto (spec §7). */
export const LEVEL_NAMES: Readonly<Record<Level, MessageKey>> = {
  1: 'level.1',
  2: 'level.2',
  3: 'level.3',
  4: 'level.4',
};
