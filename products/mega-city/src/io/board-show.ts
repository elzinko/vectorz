/**
 * board-show — le bord qui assemble le contrat JSON d'un projet (fiche 20261029112813308).
 *
 * Lit tout ce que le cœur pur (`core/board-contract.ts`) attend : les fiches, les branches de travail
 * ouvertes, les étiquettes git, les pouces de revue, les noms des comptes rendus de sprint et des
 * captures de rétro, et les récits des sessions closes. `bin/avancement.ts --json` et le générateur
 * d'exemples (`bin/board-contract.ts`) passent tous deux par ici : l'exemple rangé sort du même chemin
 * que la commande.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { type BoardContract, buildBoardContract } from '../core/board-contract.js';
import { latestSprints } from '../core/sprint-report-summary.js';
import { countHistory } from '../core/sprint-reports-since.js';
import { loadFiches } from '../loaders/fiches.js';
import { scrumPaths } from '../loaders/project-config.js';
import { loadRuns } from '../loaders/runs.js';
import { localTags } from './git-tags.js';
import { collectInProgressIds } from './sessions-collect.js';
import { loadVerdicts } from './verdicts.js';

/** Les noms de fichiers d'un dossier du projet, ou aucun s'il n'existe pas. */
function namesIn(root: string, sub: string): string[] {
  const dir = join(root, sub);
  return existsSync(dir) ? readdirSync(dir) : [];
}

const SPRINTS_DIR = 'docs/sprints';

/** Les comptes rendus de sprint du projet, lus pour en résumer les derniers. */
function sprintReports(root: string): { name: string; text: string }[] {
  // Seuls les comptes rendus (`AAAA-MM-JJ-sprint-<slug>.md`) sont lus, et un dossier homonyme n'est pas lu.
  return namesIn(root, SPRINTS_DIR)
    .filter((name) => /^\d{4}-\d{2}-\d{2}-sprint-.+\.md$/.test(name))
    .filter((name) => statSync(join(root, SPRINTS_DIR, name)).isFile())
    .map((name) => ({ name, text: readFileSync(join(root, SPRINTS_DIR, name), 'utf8') }));
}

/** Le contrat JSON du plan du projet `root`. */
export function boardShowData(root: string): BoardContract {
  return buildBoardContract({
    fiches: loadFiches(root),
    inProgressIds: collectInProgressIds(root),
    tags: localTags(root),
    verdicts: loadVerdicts(root),
    // Comme `ezk retro reports` : les captures suivent la config `scrum:`, les comptes rendus restent
    // dans `docs/sprints/` (ce n'est pas une clé scrum).
    historique: countHistory(
      namesIn(root, scrumPaths(root).retroCaptures),
      namesIn(root, join('docs', 'sprints')),
    ),
    derniersSprints: latestSprints(SPRINTS_DIR, sprintReports(root)),
    sessions: loadRuns(root),
  });
}
