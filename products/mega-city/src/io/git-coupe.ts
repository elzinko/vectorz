/**
 * git-coupe — le bord git de la coupe (fiche 20261114131612759, volet a).
 *
 * Deux lectures, best-effort comme `git-tags.ts` : hors dépôt, sans git ou sur une étiquette
 * inconnue, elles rendent du vide sans planter. Le calcul (dernière étiquette, fiches livrées) vit
 * dans le cœur pur `core/coupe.ts`.
 *
 *   - la date de chaque étiquette : `git for-each-ref` (date du tag annoté, ou du commit d'un tag léger) ;
 *   - les fichiers ajoutés à `features/done/` depuis une étiquette : `git log --diff-filter=A`, sans
 *     détection de renommage, pour qu'une fiche déplacée de `features/` vers `done/` compte comme ajoutée.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

/** Le dossier des fiches livrées, relatif à la racine du projet. */
const DONE_DIR = join('features', 'done');

function git(root: string, args: string[]): string | null {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

/** Chaque étiquette locale de `root` et sa date ISO 8601. Hors dépôt : une table vide. */
export function tagDates(root: string): Map<string, string> {
  const out = git(root, ['for-each-ref', 'refs/tags', '--format=%(refname:short)%09%(creatordate:iso-strict)']) ?? '';
  const dates = new Map<string, string>();
  for (const line of out.split('\n')) {
    const [tag, date] = line.split('\t');
    if (tag && date) dates.set(tag, date);
  }
  return dates;
}

/** Les fichiers ajoutés à `features/done/` entre l'étiquette et HEAD, relatifs à la racine du projet. */
export function addedSince(root: string, tag: string): string[] {
  const out = git(root, [
    'log',
    '--no-renames',
    '--diff-filter=A',
    '--name-only',
    '--relative',
    '--pretty=format:',
    `${tag}..HEAD`,
    '--',
    DONE_DIR,
  ]);
  return (out ?? '').split('\n').filter((line) => line !== '');
}
