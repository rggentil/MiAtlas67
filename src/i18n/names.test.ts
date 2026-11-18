import { describe, expect, it } from 'vitest';
import { countries } from '../data/countries.ts';
import type { Entity } from '../domain/entity.ts';
import { nameInSentence, ofName, ofWords, wasWords } from './names.ts';

function byCode(code: string): Entity {
  const entity = countries.find((c) => c.code === code);
  if (!entity) throw new Error(`No entity with code ${code}`);
  return entity;
}

const UNITED_KINGDOM = byCode('GB');
const DOMINICAN_REPUBLIC = byCode('DO');
const NETHERLANDS = byCode('NL');
const FRANCE = byCode('FR');
const EL_SALVADOR = byCode('SV');
const BAHAMAS = byCode('BS');

describe('names in sentences', () => {
  it('DATA-09 a Spanish name with «el» contracts to «del»: «del Reino Unido», «el Reino Unido»', () => {
    expect(ofWords(UNITED_KINGDOM, 'es')).toBe('del');
    expect(ofName(UNITED_KINGDOM, 'es')).toBe('del Reino Unido');
    expect(nameInSentence(UNITED_KINGDOM, 'es')).toBe('el Reino Unido');
  });

  it('DATA-09 a Spanish name with «la»: «de la República Dominicana»', () => {
    expect(ofWords(DOMINICAN_REPUBLIC, 'es')).toBe('de la');
    expect(ofName(DOMINICAN_REPUBLIC, 'es')).toBe('de la República Dominicana');
    expect(nameInSentence(DOMINICAN_REPUBLIC, 'es')).toBe('la República Dominicana');
  });

  it('DATA-09 a name without an article: «de Francia», «of France»', () => {
    expect(ofWords(FRANCE, 'es')).toBe('de');
    expect(ofName(FRANCE, 'es')).toBe('de Francia');
    expect(nameInSentence(FRANCE, 'es')).toBe('Francia');
    expect(ofName(FRANCE, 'en')).toBe('of France');
    expect(nameInSentence(FRANCE, 'en')).toBe('France');
  });

  it('DATA-09 an article that is part of the name is not contracted: «de El Salvador»', () => {
    expect(ofName(EL_SALVADOR, 'es')).toBe('de El Salvador');
    expect(nameInSentence(EL_SALVADOR, 'es')).toBe('El Salvador');
  });

  it('DATA-09 English names with «the»: «of the United Kingdom», «the United Kingdom»', () => {
    expect(ofWords(UNITED_KINGDOM, 'en')).toBe('of the');
    expect(ofName(UNITED_KINGDOM, 'en')).toBe('of the United Kingdom');
    expect(nameInSentence(UNITED_KINGDOM, 'en')).toBe('the United Kingdom');
  });

  it('DATA-09 Países Bajos follows the RAE: «de los Países Bajos», «los Países Bajos» (D18)', () => {
    expect(ofWords(NETHERLANDS, 'es')).toBe('de los');
    expect(ofName(NETHERLANDS, 'es')).toBe('de los Países Bajos');
    expect(nameInSentence(NETHERLANDS, 'es')).toBe('los Países Bajos');
  });

  it('DATA-09 the English name of the Netherlands is unchanged: «of the Netherlands»', () => {
    expect(ofName(NETHERLANDS, 'en')).toBe('of the Netherlands');
    expect(nameInSentence(NETHERLANDS, 'en')).toBe('the Netherlands');
  });

  it.each([
    ['BS', 'de Bahamas', 'Bahamas', 'of the Bahamas'],
    ['US', 'de Estados Unidos', 'Estados Unidos', 'of the United States'],
  ])(
    'DATA-09 %s keeps going without an article in Spanish: «%s» (D18)',
    (code, ofEs, alone, ofEn) => {
      const entity = byCode(code);
      expect(ofName(entity, 'es')).toBe(ofEs);
      expect(nameInSentence(entity, 'es')).toBe(alone);
      expect(ofName(entity, 'en')).toBe(ofEn);
    },
  );

  it('RND-04 DATA-09 the verb of the wrong-answer feedback agrees with a plural name', () => {
    expect(wasWords(NETHERLANDS, 'es')).toBe('Eran');
    expect(wasWords(UNITED_KINGDOM, 'es')).toBe('Era');
    expect(wasWords(DOMINICAN_REPUBLIC, 'es')).toBe('Era');
    expect(wasWords(FRANCE, 'es')).toBe('Era');
    expect(wasWords(BAHAMAS, 'es')).toBe('Era');
  });

  it('RND-04 SET-01 in English the feedback is «It was» for every name, plural ones too', () => {
    expect(wasWords(NETHERLANDS, 'en')).toBe('It was');
    expect(wasWords(FRANCE, 'en')).toBe('It was');
  });
});
