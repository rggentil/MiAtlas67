import type { Entity } from '../domain/entity.ts';
import type { Language } from './languages.ts';

// A name in a sentence keeps the article it takes (DATA-09, D18). Options, lists and titles use the name alone.

/** What goes before a name to say whose something is: «de», «del», «de la» or «of», «of the». */
export function ofWords(entity: Entity, language: Language): string {
  if (language === 'en') return entity.article?.en ? 'of the' : 'of';
  switch (entity.article?.es) {
    case 'el':
      return 'del';
    case 'la':
      return 'de la';
    default:
      // An article that is part of the name is never contracted: «de El Salvador».
      return 'de';
  }
}

/** «del Reino Unido», «de Francia», «of the United Kingdom». */
export function ofName(entity: Entity, language: Language): string {
  return `${ofWords(entity, language)} ${entity.name[language]}`;
}

/** The name as it reads inside a sentence: «el Reino Unido», «Francia», «the Netherlands». */
export function nameInSentence(entity: Entity, language: Language): string {
  const article = entity.article?.[language];
  return article ? `${article} ${entity.name[language]}` : entity.name[language];
}
