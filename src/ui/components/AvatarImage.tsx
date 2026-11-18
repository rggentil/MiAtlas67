import { useI18n } from '../../i18n/context.ts';
import { avatarName, avatarUrl, shownAvatar } from '../avatars.ts';

interface AvatarImageProps {
  /** The avatar as stored with the player. */
  avatar: string;
  /** Size in px of the square picture. */
  size: number;
  /** Decorative when the text next to it already says who it is: no name for screen readers then. */
  decorative?: boolean;
}

/** A player's animal (PRF-02, D21), named after it ("Zorro") unless it is decorative. */
export function AvatarImage({ avatar, size, decorative = false }: AvatarImageProps) {
  const { t } = useI18n();
  const shown = shownAvatar(avatar);

  return (
    <img
      src={avatarUrl(shown)}
      alt={decorative ? '' : t(avatarName(shown))}
      width={size}
      height={size}
      className="flex-none"
      draggable={false}
    />
  );
}
