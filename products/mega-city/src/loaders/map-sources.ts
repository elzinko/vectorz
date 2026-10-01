/**
 * Loader des SOURCES de la carte — frontière entrante (I/O), comme catalog.ts.
 * Fiche 20260821163346493 : chaque élément de la carte montre le fichier d'où il vient.
 *
 * Rend l'index `clé → chemin du fichier`, chemins relatifs à la racine du dépôt (la carte vit
 * dans `diagrams/`, ses liens se résolvent depuis la racine). Clés : `kind:id` pour une brique
 * du catalogue, `method` pour ceremonies.yml, `taxonomie` pour taxonomie.yml, `bind` et
 * `adr-bind` pour le code du moteur et son ADR.
 * CONTRÔLE MÉCANIQUE : un chemin qui ne pointe pas vers un fichier existant JETTE — la
 * régénération de la carte échoue plutôt que d'afficher une source morte.
 */
import { existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { missingSources } from '../core/map-data.js';
import { catalogSources } from './catalog.js';

export function loadMapSources(megaCity: string, repoRoot: string): Map<string, string> {
  const sources = catalogSources(megaCity, repoRoot);
  const fromRoot = (file: string): string =>
    relative(repoRoot, join(megaCity, file)).split(sep).join('/');
  sources.set('method', fromRoot('method/ceremonies.yml'));
  sources.set('taxonomie', fromRoot('taxonomie.yml'));
  // Le bind n'est pas une brique du catalogue : on cite son code et l'ADR qui le décrit.
  sources.set('bind', fromRoot('src/core/bind.ts'));
  sources.set('adr-bind', fromRoot('docs/adr/0003-moteur-bind-plan-pur-coquille-io.md'));

  const missing = missingSources(sources, (path) => existsSync(join(repoRoot, path)));
  if (missing.length > 0) {
    const shown = missing.map(([key, path]) => `${key} → ${path}`).join('\n');
    throw new Error(`carte : ${missing.length} source(s) qui ne pointe(nt) vers aucun fichier :\n${shown}`);
  }
  return sources;
}
