import type { Language } from './languages.ts';

/** Spanish is the source dictionary: every key must exist here first. */
const es = {
  'app.greeting': 'Hola',
  'app.tagline': 'Banderas, capitales y siluetas del mundo',
  'topic.flags': 'Banderas',
  'topic.capitals': 'Capitales',
  'topic.shapes': 'Siluetas',
  'settings.language': 'Idioma',
} as const;

export type MessageKey = keyof typeof es;

/** A complete translation: a missing or unknown key fails the typecheck (NFR-06). */
export type Dictionary = Record<MessageKey, string>;

const en: Dictionary = {
  'app.greeting': 'Hello',
  'app.tagline': 'Flags, capitals and shapes of the world',
  'topic.flags': 'Flags',
  'topic.capitals': 'Capitals',
  'topic.shapes': 'Shapes',
  'settings.language': 'Language',
};

export const dictionaries: Record<Language, Dictionary> = { es, en };
