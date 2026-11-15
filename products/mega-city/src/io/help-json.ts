/**
 * help-json — le bord I/O de `ezk help --json` (fiche 20261114131613129).
 *
 * Lit le catalogue et la taxonomie du dossier visé, compile la carte comme la vue `carte` le fait,
 * puis laisse le cœur pur (`src/core/help-json.ts`) assembler l'annuaire. Le manifeste arrive déjà lu :
 * c'est celui que `ezk help` texte affiche, la même source.
 */
import { compileGraph } from '../core/compiled-graph.js';
import type { Manifest } from '../core/ezk-cli.js';
import { type HelpJson, buildHelpJson } from '../core/help-json.js';
import { buildMapData } from '../core/map-data.js';
import { catalogSources, loadCatalog } from '../loaders/catalog.js';
import { loadTaxonomieDoc } from '../loaders/taxonomie.js';

/** `megaCity` : le dossier du catalogue (products/mega-city) ; `repoRoot` : la racine d'où se lisent les fichiers. */
export function helpJsonData(manifest: Manifest, megaCity: string, repoRoot: string): HelpJson {
  const catalog = loadCatalog(megaCity);
  const taxonomie = loadTaxonomieDoc(megaCity);
  const carte = buildMapData(catalog, compileGraph(catalog), undefined, taxonomie, {
    sources: catalogSources(megaCity, repoRoot),
  });
  return buildHelpJson(manifest, carte, taxonomie);
}
