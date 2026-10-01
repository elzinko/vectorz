/**
 * Vues dérivées NON committées (ADR-0055) — le registre et leur construction.
 *
 * Une page HTML de `diagrams/` est écrite à moitié à la main (la COQUE, committée) et générée à
 * moitié (le bloc de DONNÉES). On ne dégite pas la page : on sort ses données dans un fichier
 * voisin `*.data.js`, ignoré par git, que la coque charge par `<script src>`. Deux sessions
 * parallèles ne peuvent plus se disputer ce bloc, puisqu'il n'est dans aucun commit.
 *
 * Qui construit : `ezk:map` calcule le fichier à CHAQUE requête (jamais périmé, même absent du
 * disque) ; `pnpm views:regen` l'écrit sur disque (lecture hors serveur) et régénère aussi
 * `PORTFOLIO.md`. Les `build*Block` restent PURS (ADR-0003) : ce module n'est que la colle I/O.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildAvancementDataBlock } from '../core/avancement-data.js';
import { compileGraph } from '../core/compiled-graph.js';
import { CYCLE_DOC } from '../core/cycle.js';
import { buildMapDataBlock } from '../core/map-data.js';
import { buildPilotageDataBlock } from '../core/pilotage-data.js';
import { buildPlanDeltaBlock } from '../core/plan-delta-data.js';
import { buildPlanViewDataBlock } from '../core/plan-view-data.js';
import { buildRunsDataBlock } from '../core/runs-data.js';
import { buildVerdictsBlock } from '../core/verdicts.js';
import { loadCatalog } from '../loaders/catalog.js';
import { loadFiches } from '../loaders/fiches.js';
import { loadMapSources } from '../loaders/map-sources.js';
import { loadMethodDoc } from '../loaders/method.js';
import { loadRuns } from '../loaders/runs.js';
import { loadTaxonomieDoc } from '../loaders/taxonomie.js';
import { loadVerdicts } from './verdicts.js';

export interface DataView {
  id: 'board' | 'pilotage' | 'runs' | 'carte';
  /** Fichier de données, relatif à la racine du dépôt — ignoré par git. */
  out: string;
  /** Page HTML (committée) qui le charge par `<script src>`. */
  page: string;
  /** Construit le contenu du fichier de données depuis les sources réelles. */
  build(repoRoot: string): string;
}

const HEADER =
  '// Généré — NE PAS committer (ADR-0055). Reconstruit par `pnpm views:regen`, servi à la volée par `ezk:map`.\n';

/** `features/PLAN.md` est curé à la main ; absent, la vue Plan est simplement vide. */
function readPlan(repoRoot: string): string {
  const path = join(repoRoot, 'features', 'PLAN.md');
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

/** Les vues à données sorties de leur page. L'ordre des blocs du board suit celui de la coque. */
export const DATA_VIEWS: readonly DataView[] = [
  {
    id: 'board',
    out: 'diagrams/avancement/board.data.js',
    page: 'diagrams/avancement/board.html',
    build(repoRoot) {
      const fiches = loadFiches(repoRoot);
      const plan = readPlan(repoRoot);
      const blocks = [
        buildAvancementDataBlock(fiches),
        buildPlanViewDataBlock(plan, fiches),
        buildPlanDeltaBlock(plan, fiches),
        // Les pouces 👍/👎 posés depuis le tableau de bord (fiche 20260826072532622) : relus à
        // chaque requête, comme le reste — un redémarrage ne les efface pas, ils sont dans des fichiers.
        buildVerdictsBlock(loadVerdicts(repoRoot)),
      ];
      return `${HEADER}${blocks.join('\n')}\n`;
    },
  },
  {
    id: 'pilotage',
    out: 'diagrams/pilotage/pilotage.data.js',
    page: 'diagrams/pilotage/pilotage.html',
    build: (repoRoot) =>
      `${HEADER}${buildPilotageDataBlock(loadFiches(repoRoot), loadRuns(repoRoot))}\n`,
  },
  {
    id: 'runs',
    out: 'diagrams/runs/runs.data.js',
    page: 'diagrams/runs/runs.html',
    build: (repoRoot) => `${HEADER}${buildRunsDataBlock(loadRuns(repoRoot))}\n`,
  },
  {
    // La carte de la méthode (suite de l'ADR-0055). Ses données ne viennent pas des fiches mais du
    // CATALOGUE (`products/mega-city` : règles, skills, agents, graphe, sources) : même fonction pure
    // qu'avant (`buildMapDataBlock`), appelée ici au lieu d'être collée dans le HTML.
    id: 'carte',
    out: 'diagrams/methode-mega-city/carte-interactive.data.js',
    page: 'diagrams/methode-mega-city/carte-interactive.html',
    build(repoRoot) {
      const megaCity = join(repoRoot, 'products', 'mega-city');
      if (!existsSync(megaCity)) {
        throw new Error(`la carte se construit depuis le catalogue — ${megaCity} est absent`);
      }
      // ceremonies.yml ET taxonomie.yml sont validés contre le catalogue DANS buildMapData, et les
      // sources (fichier de chaque brique) par loadMapSources : une référence fausse, un catalogue
      // mal rangé ou un chemin qui ne mène à aucun fichier fait ÉCHOUER la construction — la carte
      // ne peut dessiner que ce qui existe dans les fichiers (épic « carte fidèle », PR #162).
      const catalog = loadCatalog(megaCity);
      const block = buildMapDataBlock(
        catalog,
        compileGraph(catalog),
        loadMethodDoc(megaCity),
        loadTaxonomieDoc(megaCity),
        { sources: loadMapSources(megaCity, repoRoot), cycle: CYCLE_DOC },
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

/** La vue dont `rel` (chemin relatif à la racine, `/` ou `\`) est le fichier de données. */
export function dataViewForPath(rel: string): DataView | undefined {
  const norm = rel.replace(/\\/g, '/').replace(/^\.?\/+/, '');
  return DATA_VIEWS.find((v) => v.out === norm);
}

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
