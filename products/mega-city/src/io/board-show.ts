/**
 * board-show — le bord qui assemble le contrat JSON d'un projet (fiche 20261029112813308).
 *
 * Lit tout ce que le cœur pur (`core/board-contract.ts`) attend : les fiches, les branches de travail
 * ouvertes, les étiquettes git, les pouces de revue, les noms des comptes rendus de sprint et des
 * captures de rétro, les récits des sessions closes, les noms des objectifs et des versions déclarés,
 * et les faits de la prochaine coupe (fiche 20261114131612759) : la date des étiquettes, les fiches
 * rangées dans `done/` depuis la dernière, le dernier verdict de `ezk release` et le carnet de tests.
 * Il ne fait que lire : rien n'est écrit. `bin/avancement.ts --json` et le générateur
 * d'exemples (`bin/board-contract.ts`) passent tous deux par ici : l'exemple rangé sort du même chemin
 * que la commande.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { type BoardContract, buildBoardContract } from '../core/board-contract.js';
import type { CartoStatus } from '../core/carto.js';
import { derniereEtiquette } from '../core/coupe.js';
import { allSprints } from '../core/sprint-report-summary.js';
import { countHistory } from '../core/sprint-reports-since.js';
import { loadFiches } from '../loaders/fiches.js';
import { loadMilestoneNoms, loadVersionNoms } from '../loaders/milestones.js';
import { scrumPaths } from '../loaders/project-config.js';
import { latestReleaseVerdict } from '../loaders/release-passes.js';
import { loadRuns } from '../loaders/runs.js';
import { CartoError, cartoNow, loadTree, statusOfLoaded } from './carto-store.js';
import { addedSince, tagDates } from './git-coupe.js';
import { SPRINTS_DIR, sprintReports } from './sprint-reports.js';
import { collectInProgressIds } from './sessions-collect.js';
import { loadVerdicts } from './verdicts.js';

/** Les noms de fichiers d'un dossier du projet, ou aucun s'il n'existe pas. */
function namesIn(root: string, sub: string): string[] {
  const dir = join(root, sub);
  return existsSync(dir) ? readdirSync(dir) : [];
}

/** Le carnet de tests du projet, par le même calcul que `ezk carto status` ; null sans carnet déclaré. */
function carnetOf(root: string): CartoStatus | null {
  try {
    return statusOfLoaded(root, loadTree(root), cartoNow());
  } catch (error) {
    if (error instanceof CartoError) return null;
    throw error;
  }
}

/** Le contrat JSON du plan du projet `root`. */
export function boardShowData(root: string): BoardContract {
  const datesEtiquettes = tagDates(root);
  const tags = new Set(datesEtiquettes.keys());
  const etiquette = derniereEtiquette(tags);
  return buildBoardContract({
    fiches: loadFiches(root),
    inProgressIds: collectInProgressIds(root),
    tags,
    datesEtiquettes,
    verdicts: loadVerdicts(root),
    // Comme `ezk retro reports` : les captures suivent la config `scrum:`, les comptes rendus restent
    // dans `docs/sprints/` (ce n'est pas une clé scrum).
    historique: countHistory(
      namesIn(root, scrumPaths(root).retroCaptures),
      namesIn(root, join('docs', 'sprints')),
    ),
    sprints: allSprints(SPRINTS_DIR, sprintReports(root)),
    sessions: loadRuns(root),
    nomsMilestones: loadMilestoneNoms(root),
    nomsVersions: loadVersionNoms(root),
    coupe: {
      ajoutees: etiquette === null ? [] : addedSince(root, etiquette),
      gate: latestReleaseVerdict(root) ?? null,
      carnet: carnetOf(root),
    },
  });
}
