import { describe, expect, it } from 'vitest';
import {
  canAddPlayer,
  cleanNickname,
  MAX_NICKNAME_LETTERS,
  MAX_PLAYERS,
  nicknameLetters,
  nicknameProblem,
  sameNickname,
} from './players.ts';

describe('nickname rules', () => {
  it('PRF-02 accepts a nickname of 1 to 12 letters', () => {
    expect(MAX_NICKNAME_LETTERS).toBe(12);
    expect(nicknameProblem('L', [])).toBeNull();
    expect(nicknameProblem('Mariaisabela', [])).toBeNull();
  });

  it('PRF-02 an empty nickname, or one with only spaces, is "empty"', () => {
    expect(nicknameProblem('', [])).toBe('empty');
    expect(nicknameProblem('   ', [])).toBe('empty');
  });

  it('PRF-02 a nickname of more than 12 letters is "tooLong"', () => {
    expect(nicknameProblem('Superlucianita', [])).toBe('tooLong');
    expect(nicknameProblem('Mariaisabela1', [])).toBe('tooLong');
  });

  it('PRF-02 counts the letters a person sees: an accent or an emoji is one letter', () => {
    expect(nicknameLetters('Lucía')).toBe(5);
    // "í" written as "i" plus a combining accent, as some keyboards do.
    expect(nicknameLetters('Lucía')).toBe(5);
    expect(nicknameLetters('Ana 👩‍👧')).toBe(5);
    expect(nicknameProblem('Pablo 🦊🦊🦊🦊🦊🦊', [])).toBeNull();
  });

  it('PRF-02 spaces at both ends do not count and are not kept', () => {
    expect(cleanNickname('  Lucía  ')).toBe('Lucía');
    expect(nicknameProblem('   Mariaisabela   ', [])).toBeNull();
  });

  it('PRF-02 a nickname that differs only in capitals or accents is "taken"', () => {
    const taken = ['Lucía', 'Pablo'];

    expect(nicknameProblem('lucia', taken)).toBe('taken');
    expect(nicknameProblem('LUCÍA', taken)).toBe('taken');
    expect(nicknameProblem(' pablo ', taken)).toBe('taken');
    expect(nicknameProblem('Lucas', taken)).toBeNull();
  });

  it('PRF-02 two nicknames are the same when they differ only in capitals, accents or outer spaces', () => {
    expect(sameNickname('Lucía', 'lucia')).toBe(true);
    expect(sameNickname('Lucía', ' LUCIA ')).toBe(true);
    expect(sameNickname('Lucía', 'Lucas')).toBe(false);
    expect(sameNickname('Ana', 'Anna')).toBe(false);
  });
});

describe('number of players', () => {
  it('PRF-05 a device holds at most 8 players', () => {
    expect(MAX_PLAYERS).toBe(8);
    expect(canAddPlayer(0)).toBe(true);
    expect(canAddPlayer(7)).toBe(true);
    expect(canAddPlayer(8)).toBe(false);
  });
});
