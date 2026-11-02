/**
 * Vues dérivées NON committées (ADR-0055) — le registre et leur construction.
 *
 * Une page HTML de `diagrams/` est écrite à moitié à la main (la COQUE, committée) et générée à
 * moitié (le bloc de DONNÉES). On ne dégite pas la page : on sort ses données dans un fichier
 * voisin `*.data.js`, ignoré par git, que la coque charge par `<script src>`. Deux sessions
 * parallèles ne peuvent plus se disputer ce bloc, puisqu'il n'est dans aucun commit.
 *
 * Qui construit : `ezk board maps --file` calcule le fichier à CHAQUE demande (jamais périmé, même
 * absent du disque) ; `pnpm views:regen` l'écrit sur disque et régénère aussi `PORTFOLIO.md`. Les
 * `build*Block` restent PURS (ADR-0003) : ce module n'est que la colle I/O.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileGraph } from '../core/compiled-graph.js';
import { CYCLE_DOC } from '../core/cycle.js';
import { buildMapDataBlock } from '../core/map-data.js';
import { loadCatalog } from '../loaders/catalog.js';
import { loadMapSources } from '../loaders/map-sources.js';
import { loadMethodDoc } from '../loaders/method.js';
import { loadTaxonomieDoc } from '../loaders/taxonomie.js';

export interface DataView {
  id: 'carte';
  /** Fichier de données, relatif à la racine du dépôt — ignoré par git. */
  out: string;
  /** Page HTML (committée) qui le charge par `<script src>`. */
  page: string;
  /**
   * Construit le contenu du fichier de données depuis les sources réelles. `repoRoot` est le PROJET
   * dont on lit les fiches (la méthode par défaut) ; la vue `carte` l'ignore et lit toujours la méthode.
   */
  build(repoRoot: string): string;
}

/** La MÉTHODE : le dépôt où vit ce code (products/mega-city, puis la racine vectorz). Elle ne change jamais. */
const MEGA_CITY = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const METHOD_ROOT = resolve(MEGA_CITY, '..', '..');

const HEADER =
  '// Généré — NE PAS committer (ADR-0055). Reconstruit par `pnpm --dir products/mega-city views:regen`, servi à la volée par `ezk board maps --file`.\n';

/**
 * Les vues à données sorties de leur page. Depuis le retrait de la page web de la méthode (fiche
 * 20261102123552185), il n'en reste qu'une : la carte de la méthode, que `ezk board maps --file`
 * calcule à la demande pour mission control.
 */
export const DATA_VIEWS: readonly DataView[] = [
  {
    // La carte de la méthode (suite de l'ADR-0055). Ses données ne viennent pas des fiches mais du
    // CATALOGUE (`products/mega-city` : règles, skills, agents, graphe, sources) : même fonction pure
    // qu'avant (`buildMapDataBlock`), appelée ici au lieu d'être collée dans le HTML.
    //
    // La carte décrit la MÉTHODE, jamais le projet dont on lit les fiches (`ezk --root <projet>`,
    // fiche 20260826173221323) : son catalogue est celui du dépôt où vit ce code. Elle ignore donc
    // la racine qu'on lui passe : le projet visé n'a pas de catalogue.
    id: 'carte',
    out: 'diagrams/methode-mega-city/carte-interactive.data.js',
    page: 'diagrams/methode-mega-city/carte-interactive.html',
    build() {
      // ceremonies.yml ET taxonomie.yml sont validés contre le catalogue DANS buildMapData, et les
      // sources (fichier de chaque brique) par loadMapSources : une référence fausse, un catalogue
      // mal rangé ou un chemin qui ne mène à aucun fichier fait ÉCHOUER la construction — la carte
      // ne peut dessiner que ce qui existe dans les fichiers (épic « carte fidèle », PR #162).
      const catalog = loadCatalog(MEGA_CITY);
      const block = buildMapDataBlock(
        catalog,
        compileGraph(catalog),
        loadMethodDoc(MEGA_CITY),
        loadTaxonomieDoc(MEGA_CITY),
        { sources: loadMapSources(MEGA_CITY, METHOD_ROOT), cycle: CYCLE_DOC },
      );
      return `${HEADER}${block}\n`;
    },
  },
];

/** Tout ce que git ne doit PAS suivre : les données ci-dessus, plus `PORTFOLIO.md` (bash). */
export const UNTRACKED_VIEW_PATHS: readonly string[] = [
  ...DATA_VIEWS.map((v) => v.out),
  'PORTFOLIO.md',
];

export interface WriteReport {
  written: string[];
  unchanged: string[];
}

/**
 * Écrit chaque fichier de données ; n'y touche pas s'il est déjà identique (idempotent).
 * `views` : par défaut toutes ; un dépôt jetable sans catalogue (les tests) écarte la carte.
 */
export function writeDataViews(
  repoRoot: string,
  views: readonly DataView[] = DATA_VIEWS,
): WriteReport {
  const report: WriteReport = { written: [], unchanged: [] };
  for (const view of views) {
    const path = join(repoRoot, view.out);
    const content = view.build(repoRoot);
    if (existsSync(path) && readFileSync(path, 'utf8') === content) {
      report.unchanged.push(view.out);
      continue;
    }
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    report.written.push(view.out);
  }
  return report;
}
