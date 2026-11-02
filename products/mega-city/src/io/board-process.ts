/**
 * board-process — le bord qui assemble `ezk board process --json` d'un projet (fiche 20261102123552183).
 *
 * Lit les fiches du projet `root`, puis ses branches, ses sessions et, si le projet n'a pas coupé
 * GitHub, ses PR ouvertes. Tout est lu DANS `root`, jamais dans le dossier d'où la commande part.
 */
import { buildProcessData } from '../core/process-data.js';
import { type ProcessContract, buildProcessContract } from '../core/process-contract.js';
import { loadFiches } from '../loaders/fiches.js';
import { githubCapabilities } from '../loaders/project-config.js';
import { collectProcessIo } from './sessions-collect.js';

export interface BoardProcessOptions {
  /** Lire GitHub ? Absent : ce que dit la config du projet (`github.pr`). */
  github?: boolean;
}

/** Le contrat JSON du process du projet `root`. */
export function boardProcessData(root: string, options: BoardProcessOptions = {}): ProcessContract {
  const github = options.github ?? githubCapabilities(root).pr;
  const data = buildProcessData({ fiches: loadFiches(root), ...collectProcessIo(root, { github }) });
  return buildProcessContract(data, github);
}
