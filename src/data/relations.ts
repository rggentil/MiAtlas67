import { buildRelations } from '../domain/relations.ts';
import { landBorders } from './neighbours.ts';
import { similarFlagGroups } from './similarFlags.ts';

/** Neighbours and similar flags of the 195 countries (LVL-06). */
export const relations = buildRelations(landBorders, similarFlagGroups);
