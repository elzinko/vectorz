/**
 * Board unifié cop1 — les deux pipelines (fiche 20261012231419198), pur.
 *
 * Une version a DEUX jauges indépendantes : le *cadrage* (amener ses fiches à
 * « prête ») et le *développement* (les livrer). On range les versions en trois
 * colonnes par pipeline, et on dit quand un lot est *lançable*.
 */
import type { BoardProject, Version } from './types.js';
import { allVersions, cadre, groomed, runByVer } from './helpers.js';

/** Les trois colonnes du pipeline de cadrage. */
export interface CadrageColumns {
  acadrer: Version[];
  encadr: Version[];
  cadres: Version[];
}

/** Range les versions par étape de grooming. */
export function cadrageColumns(project: BoardProject): CadrageColumns {
  const all = allVersions(project);
  return {
    acadrer: all.filter((v) => v.total > 0 && groomed(v) === 0 && v.done < v.total),
    encadr: all.filter((v) => groomed(v) > 0 && groomed(v) < v.total),
    cadres: all.filter((v) => cadre(v) && v.done < v.total),
  };
}

/** Les trois colonnes du pipeline de développement. */
export interface DevColumns {
  avenir: Version[];
  encours: Version[];
  faits: Version[];
}

/** Range les versions par étape de développement. */
export function devColumns(project: BoardProject): DevColumns {
  const all = allVersions(project);
  return {
    avenir: all.filter((v) => cadre(v) && v.done === 0),
    encours: all.filter((v) => v.done > 0 && v.done < v.total),
    faits: all.filter((v) => v.total > 0 && v.done === v.total),
  };
}

/**
 * Un lot est *lançable* quand il est cadré, pas encore commencé, ET sans run en
 * cours (sinon le bouton serait « Voir le run », pas « Lancer »).
 */
export function isLaunchable(project: BoardProject, v: Version): boolean {
  return cadre(v) && v.done === 0 && !runByVer(project)[v.ver];
}
