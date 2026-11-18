import { isAvatar, type AvatarId } from '../domain/players.ts';
import type { MessageKey } from '../i18n/dictionaries.ts';

const AVATAR_DIRECTORY = '../assets/avatars/';

/**
 * URL of every bundled avatar (OpenMoji, D21), by path. Nothing is fetched from another site (NFR-04).
 * `?no-inline`: each avatar stays its own file instead of a data URL inside the JavaScript bundle.
 */
const AVATAR_URLS = import.meta.glob<string>('../assets/avatars/*.svg', {
  eager: true,
  query: '?no-inline',
  import: 'default',
});

/** The bundled picture of an avatar; a missing file is a data error. */
export function avatarUrl(avatar: AvatarId): string {
  const url = AVATAR_URLS[`${AVATAR_DIRECTORY}${avatar}.svg`];
  if (url === undefined) throw new Error(`No file for the avatar ${avatar}`);
  return url;
}

/** The name of an avatar in the player's language: "Zorro", "Fox". */
export function avatarName(avatar: AvatarId): MessageKey {
  return `avatar.${avatar}`;
}

/**
 * The avatar to show for a stored one: a player saved with an avatar that is no longer in the set shows the
 * first one instead of a broken picture.
 */
export function shownAvatar(stored: string): AvatarId {
  return isAvatar(stored) ? stored : 'fox';
}
