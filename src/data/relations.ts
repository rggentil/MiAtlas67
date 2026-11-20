import { buildRelations, parseBorder } from '../domain/relations.ts';
import { extendedLandBorders, landBorders } from './neighbours.ts';
import { extendedFlagGroups, similarFlagGroups } from './similarFlags.ts';

const countryBorders = landBorders.map(parseBorder);

/** Neighbours and similar flags of the 195 countries, for level 3 (LVL-06). */
export const relations = buildRelations(countryBorders, similarFlagGroups);

/** Level 4 Experto adds the borders and similar flags of the extended entities (LVL-06, D30). */
export const expertRelations = buildRelations(
  [...countryBorders, ...extendedLandBorders],
  [...similarFlagGroups, ...extendedFlagGroups],
);
