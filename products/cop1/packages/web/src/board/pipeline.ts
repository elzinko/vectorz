/**
 * Board unifié cop1 — quand un lot est *lançable* (fiche 20261012231419198), pur.
 */
import type { BoardProject, Version } from './types.js';
import { cadre, runByVer } from './helpers.js';

/**
 * Un lot est *lançable* quand il est cadré, pas encore commencé, ET sans run en
 * cours (sinon le bouton serait « Voir le run », pas « Lancer »).
 */
export function isLaunchable(project: BoardProject, v: Version): boolean {
  return cadre(v) && v.done === 0 && !runByVer(project)[v.ver];
}
