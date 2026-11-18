import { describe, expect, it } from 'vitest';
import { countries } from '../data/countries.ts';
import type { Entity } from '../domain/entity.ts';
import { nameInSentence, ofName, ofWords } from './names.ts';

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

  it('DATA-09 a plural name goes without an article in Spanish and with «the» in English (D18)', () => {
    expect(ofName(NETHERLANDS, 'es')).toBe('de Países Bajos');
    expect(nameInSentence(NETHERLANDS, 'es')).toBe('Países Bajos');
    expect(ofName(NETHERLANDS, 'en')).toBe('of the Netherlands');
    expect(nameInSentence(NETHERLANDS, 'en')).toBe('the Netherlands');
  });
});
