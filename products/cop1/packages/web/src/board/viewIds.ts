/**
 * Les vues de mission control. Le carnet de tests (fiche 20261102182259592) déclare un écran par vue,
 * dans `.vectorz/carto/mission-control.yml` : un test compare les deux listes, pour qu'une vue
 * ajoutée ici n'échappe pas au carnet.
 */
export const VIEW_IDS = [
  'fleet',
  'overview',
  'pilotage',
  'cadrage',
  'dev',
  'fiches',
  'timeline',
  'config',
  'process',
  'maps',
  'law',
  'tool',
] as const;

export type ViewId = (typeof VIEW_IDS)[number];
