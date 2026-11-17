import type { Language } from './languages.ts';

/** Spanish is the source dictionary: every key must exist here first. */
const es = {
  'home.title': '¿A qué jugamos?',
  'home.soon': 'Pronto',
  'topic.flags': 'Banderas',
  'topic.capitals': 'Capitales',
  'topic.shapes': 'Siluetas',
  'game.FLAG-A.name': 'Bandera → País',
  'game.FLAG-A.question': '¿De qué país es?',
  'game.FLAG-B.name': 'País → Bandera',
  'game.FLAG-B.question': '¿Cuál es su bandera?',
  'game.CAP-A.name': 'País → Capital',
  'game.CAP-A.question': '¿Cuál es su capital?',
  'game.CAP-B.name': 'Capital → País',
  'game.CAP-B.question': '¿De qué país es?',
  'game.SHAPE-A.name': 'Silueta → País',
  'game.SHAPE-A.question': '¿Qué país es?',
  'game.SHAPE-B.name': 'País → Silueta',
  'game.SHAPE-B.question': '¿Cuál es su forma?',
  'nav.back': 'Volver',
  'setup.region': '¿Dónde jugamos?',
  'setup.level': '¿Qué nivel?',
  'region.world': 'Mundo',
  'region.europe': 'Europa',
  'region.africa': 'África',
  'region.americas': 'América',
  'region.asia': 'Asia',
  'region.oceania': 'Oceanía',
  'level.1': 'Fácil',
  'level.2': 'Medio',
  'level.3': 'Difícil',
  'round.settings': 'Esta partida',
  'round.progress': 'Progreso de la partida',
  'settings.language': 'Idioma',
} as const;

export type MessageKey = keyof typeof es;

/** A complete translation: a missing or unknown key fails the typecheck (NFR-06). */
export type Dictionary = Record<MessageKey, string>;

const en: Dictionary = {
  'home.title': 'What shall we play?',
  'home.soon': 'Soon',
  'topic.flags': 'Flags',
  'topic.capitals': 'Capitals',
  'topic.shapes': 'Shapes',
  'game.FLAG-A.name': 'Flag → Country',
  'game.FLAG-A.question': 'Which country is it?',
  'game.FLAG-B.name': 'Country → Flag',
  'game.FLAG-B.question': 'Which one is its flag?',
  'game.CAP-A.name': 'Country → Capital',
  'game.CAP-A.question': 'What is its capital?',
  'game.CAP-B.name': 'Capital → Country',
  'game.CAP-B.question': 'Which country is it?',
  'game.SHAPE-A.name': 'Shape → Country',
  'game.SHAPE-A.question': 'Which country is it?',
  'game.SHAPE-B.name': 'Country → Shape',
  'game.SHAPE-B.question': 'Which one is its shape?',
  'nav.back': 'Back',
  'setup.region': 'Where shall we play?',
  'setup.level': 'Which level?',
  'region.world': 'World',
  'region.europe': 'Europe',
  'region.africa': 'Africa',
  'region.americas': 'Americas',
  'region.asia': 'Asia',
  'region.oceania': 'Oceania',
  'level.1': 'Easy',
  'level.2': 'Medium',
  'level.3': 'Hard',
  'round.settings': 'This round',
  'round.progress': 'Round progress',
  'settings.language': 'Language',
};

export const dictionaries: Record<Language, Dictionary> = { es, en };
