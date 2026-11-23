import type { Entity } from '../../domain/entity.ts';
import { flagUrl } from '../flags.ts';

interface FlagImageProps {
  entity: Entity;
  /** Never the entity's name while it is the answer to guess (FLAG-A, FLAG-B). */
  alt: string;
  className?: string;
  /** Far down a long list (the Atlas): loaded only when it is about to scroll into view (NFR-03). */
  lazy?: boolean;
}

/** A flag in its 4:3 frame with an ink outline, so white flags still stand out on white cards. */
export function FlagImage({ entity, alt, className = '', lazy = false }: FlagImageProps) {
  return (
    <img
      src={flagUrl(entity)}
      alt={alt}
      draggable={false}
      loading={lazy ? 'lazy' : undefined}
      decoding={lazy ? 'async' : undefined}
      className={`block aspect-[4/3] w-full rounded-lg object-cover outline-2 outline-ink ${className}`}
    />
  );
}
