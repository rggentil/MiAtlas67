/** At most 8 players on a device (PRF-05). */
export const MAX_PLAYERS = 8;

/** A nickname has 1 to 12 letters (PRF-02). */
export const MAX_NICKNAME_LETTERS = 12;

/** Why a nickname cannot be used: the screen says it in the player's language. */
export type NicknameProblem = 'empty' | 'tooLong' | 'taken';

const letters = new Intl.Segmenter('es', { granularity: 'grapheme' });

/** The nickname as it is kept: without spaces at both ends. */
export function cleanNickname(raw: string): string {
  return raw.trim();
}

/** Letters as a person sees them: "í" or an emoji is one, however many code points it takes. */
export function nicknameLetters(nickname: string): number {
  return [...letters.segment(nickname)].length;
}

/**
 * Two nicknames are the same when they differ only in capitals, accents or outer spaces ("lucia" and
 * "Lucía"), so «¿Quién juega?» never shows two names that look alike (PRF-02: unique on the device).
 */
export function sameNickname(a: string, b: string): boolean {
  return cleanNickname(a).localeCompare(cleanNickname(b), 'es', { sensitivity: 'base' }) === 0;
}

/** Why `raw` cannot be a nickname next to the `taken` ones, or `null` when it can (PRF-02). */
export function nicknameProblem(raw: string, taken: readonly string[]): NicknameProblem | null {
  const nickname = cleanNickname(raw);
  if (nickname === '') return 'empty';
  if (nicknameLetters(nickname) > MAX_NICKNAME_LETTERS) return 'tooLong';
  if (taken.some((other) => sameNickname(nickname, other))) return 'taken';
  return null;
}

/** Whether one more player fits on the device (PRF-05). */
export function canAddPlayer(players: number): boolean {
  return players < MAX_PLAYERS;
}
