import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

/**
 * `WorktreeEnumerator` — énumère les worktrees d'un dépôt, en PUR file-system
 * (fiche 20261015082118368, ADR-079 §D9).
 *
 * Recopie légère et LOCALE à cop1 : l'outillage worktree d'`ezk-sessions` vit
 * dans mega-city, mais cop1 n'importe JAMAIS mega-city (ADR-0021) — comme
 * `registry.ts` a recopié le lecteur plutôt que d'en dépendre. Aucun spawn de
 * `git` (indisponible dans l'environnement du daemon) : on lit la plomberie git
 * sur le disque, exactement comme `project-root.ts` côté émetteur.
 *
 * Modèle B (un journal par worktree) : chaque worktree a son `.supervision/` ;
 * pour tous les montrer, le board doit watcher la racine de CHAQUE worktree.
 */

/** Résout le `.git` commun (arbre principal) d'une racine, qu'elle soit l'arbre principal ou un worktree lié. */
function resolveGitCommonDir(baseRoot: string): string | undefined {
  const gitEntry = join(baseRoot, '.git');
  try {
    const stat = statSync(gitEntry);
    if (stat.isDirectory()) return gitEntry; // arbre principal : `.git` est le dossier commun.

    // Worktree lié : `.git` est un fichier « gitdir: <path> » → <gitdir>/commondir pointe le `.git` commun.
    const match = /^gitdir:\s*(.+)$/m.exec(readFileSync(gitEntry, 'utf8'));
    const captured = match?.[1];
    if (captured === undefined) return undefined;
    const gitDir = resolve(baseRoot, captured.trim());
    const commondirFile = join(gitDir, 'commondir');
    if (existsSync(commondirFile)) {
      return resolve(gitDir, readFileSync(commondirFile, 'utf8').trim());
    }
    return gitDir;
  } catch {
    return undefined;
  }
}

/**
 * Énumère les racines à surveiller pour `baseRoot` : la racine elle-même, l'arbre
 * principal, et chaque worktree lié (lu depuis `<commondir>/worktrees/<name>/gitdir`).
 * Best-effort et tolérant : hors dépôt git, ou plomberie illisible, rend au moins
 * `baseRoot` — jamais d'exception.
 */
export function enumerateWorktrees(baseRoot: string): string[] {
  const roots = new Set<string>();
  roots.add(baseRoot);

  const commonDir = resolveGitCommonDir(baseRoot);
  if (commonDir === undefined) return [...roots];

  // `<repo>/.git` → l'arbre principal est son parent.
  if (basename(commonDir) === '.git') roots.add(dirname(commonDir));

  const worktreesDir = join(commonDir, 'worktrees');
  if (!existsSync(worktreesDir)) return [...roots];

  let names: string[];
  try {
    names = readdirSync(worktreesDir);
  } catch {
    return [...roots];
  }

  for (const name of names) {
    try {
      // `gitdir` pointe le `.git` du worktree → sa racine est le dossier parent.
      const pointer = readFileSync(join(worktreesDir, name, 'gitdir'), 'utf8').trim();
      const worktreeRoot = dirname(pointer);
      if (worktreeRoot.length > 0 && existsSync(worktreeRoot)) roots.add(worktreeRoot);
    } catch {
      // worktree à moitié supprimé (gitdir absent/illisible) — ignoré, jamais fatal.
    }
  }

  return [...roots];
}
