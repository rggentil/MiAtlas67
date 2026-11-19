import type { Entity } from '../../domain/entity.ts';
import { shapeUrl } from '../shapes.ts';

interface ShapeImageProps {
  entity: Entity;
  /** Never the entity's name while it is the answer to guess (SHAPE-01). */
  alt: string;
  className?: string;
}

/** A country's silhouette in a square frame: the outline alone, no label and no neighbours (SHAPE-01). */
export function ShapeImage({ entity, alt, className = '' }: ShapeImageProps) {
  return (
    <img
      src={shapeUrl(entity)}
      alt={alt}
      draggable={false}
      className={`block aspect-square w-full object-contain ${className}`}
    />
  );
}
