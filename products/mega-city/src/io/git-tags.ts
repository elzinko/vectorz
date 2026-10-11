/**
 * Les étiquettes git LOCALES d'un dépôt (lecture best-effort, fiche 20261010215345931 / ADR-0070).
 *
 * Extrait de `bin/backlog-version.ts` pour être partagé par les bords qui ont besoin de l'état des
 * versions : `backlog:version` (clôture) et le garde-fou de tirage (`plan:lot`, `plan:head` via
 * `version-scope`). Les étiquettes sont LOCALES : git les partage entre worktrees, jamais poussées.
 * Hors dépôt git, sans git, ou sans aucune étiquette : un `Set` vide — le calcul d'état dégrade sans
 * planter (même doctrine que le reste de la méthode).
 */
import { execFileSync } from 'node:child_process';

/** Les étiquettes git locales de `root`. Hors dépôt / sans git : `Set` vide (best-effort). */
export function localTags(root: string): ReadonlySet<string> {
  try {
    const out = execFileSync('git', ['tag', '-l'], { cwd: root, encoding: 'utf8', stdio: 'pipe' });
    return new Set(out.split('\n').filter((t) => t !== ''));
  } catch {
    return new Set();
  }
}
