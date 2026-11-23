import type { Entity } from '../../domain/entity.ts';
import { flagAspectOf, flagUrl } from '../flags.ts';

/** The shape of the box every flag sits in (D39): the 107 flags of 2:3 fill it, the others sit in its middle. */
export const FLAG_FRAME_ASPECT = 3 / 2;

interface FlagImageProps {
  entity: Entity;
  /** Never the entity's name while it is the answer to guess (FLAG-A, FLAG-B). */
  alt: string;
  className?: string;
  /** Far down a long list (the Atlas): loaded only when it is about to scroll into view (NFR-03). */
  lazy?: boolean;
}

/**
 * A flag in its real ratio (D39), in the middle of a 3:2 box as wide as its container, so flags side by side take
 * the same room (GAME-03) and none is stretched or cropped. A wide flag spans the box, a tall one (Suiza, Nepal)
 * its height. Its ink outline follows the flag's own shape, so white flags still stand out on white cards.
 */
export function FlagImage({ entity, alt, className = '', lazy = false }: FlagImageProps) {
  const aspect = flagAspectOf(entity);
  const size = aspect >= FLAG_FRAME_ASPECT ? 'h-auto w-full' : 'h-full w-auto';

  return (
    <span className="flex aspect-[3/2] w-full items-center justify-center">
      <img
        src={flagUrl(entity)}
        alt={alt}
        draggable={false}
        loading={lazy ? 'lazy' : undefined}
        decoding={lazy ? 'async' : undefined}
        style={{ aspectRatio: aspect }}
        className={`block max-h-full max-w-full rounded-lg flag-outline ${size} ${className}`}
      />
    </span>
  );
}
