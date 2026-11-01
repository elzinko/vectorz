/**
 * board-show — le bord qui assemble le contrat JSON d'un projet (fiche 20261029112813308).
 *
 * Lit tout ce que le cœur pur (`core/board-contract.ts`) attend : les fiches, les branches de travail
 * ouvertes, les étiquettes git et les pouces de revue. `bin/avancement.ts --json` et le générateur
 * d'exemples (`bin/board-contract.ts`) passent tous deux par ici : l'exemple rangé sort du même chemin
 * que la commande.
 */
import { type BoardContract, buildBoardContract } from '../core/board-contract.js';
import { loadFiches } from '../loaders/fiches.js';
import { localTags } from './git-tags.js';
import { collectInProgressIds } from './sessions-collect.js';
import { loadVerdicts } from './verdicts.js';

/** Le contrat JSON du plan du projet `root`. */
export function boardShowData(root: string): BoardContract {
  return buildBoardContract({
    fiches: loadFiches(root),
    inProgressIds: collectInProgressIds(root),
    tags: localTags(root),
    verdicts: loadVerdicts(root),
  });
}
