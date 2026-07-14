/**
 * `upgrade-ok.ts` — calcul mécanique de `upgrade_ok` au `gate.reached` (D11, §7).
 *
 * `upgrade_ok` mesure la QUIESCENCE de l'arbre projet (jamais la compatibilité de
 * version, qui relève des métadonnées de release de la méthode) : arbre git propre
 * ET aucun worktree additionnel en vol. Le LLM/appelant ne peut JAMAIS le forcer à
 * `true` — la signature n'accepte qu'un veto qui pousse vers `false`, jamais l'inverse.
 * `execFileSync` uniquement (jamais de shell interpolé), cwd = project_root.
 */
import { execFileSync } from 'node:child_process';

/**
 * `.supervision/` est le dossier de bookkeeping du kit émetteur lui-même (le
 * journal en cours d'écriture) : l'exclure du calcul de quiescence évite que
 * `run_start` (qui vient de créer `events.jsonl`) rende l'arbre mécaniquement
 * « sale » à chaque run, ce qui viderait `upgrade_ok` de son sens.
 */
/**
 * `execFileSync` peut échouer (project_root n'est pas un dépôt git — cas légitime
 * en Desktop, M2 revue NO-GO) : jamais fatal, dégradation silencieuse vers `false`
 * plutôt qu'une exception qui ferait planter `gate_reached`.
 */
function isTreeClean(projectRoot: string): boolean {
  try {
    const status = execFileSync('git', ['status', '--porcelain', '--', '.', ':!.supervision'], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return status.trim().length === 0;
  } catch {
    return false;
  }
}

function hasNoAdditionalWorktree(projectRoot: string): boolean {
  try {
    const list = execFileSync('git', ['worktree', 'list'], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const entries = list.trim().split('\n').filter((line) => line.length > 0);
    return entries.length === 1;
  } catch {
    return false;
  }
}

/**
 * Calcule `upgrade_ok`. `veto = true` force `false` inconditionnellement (le seul
 * levier offert à l'appelant) ; il n'existe aucun paramètre qui force `true`.
 */
export function computeUpgradeOk(projectRoot: string, veto = false): boolean {
  if (veto) return false;
  return isTreeClean(projectRoot) && hasNoAdditionalWorktree(projectRoot);
}
