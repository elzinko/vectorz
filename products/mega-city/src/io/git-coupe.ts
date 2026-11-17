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

/**
 * Les fichiers ajoutés à `features/done/` entre l'étiquette et HEAD, relatifs à la racine du projet.
 * Sans étiquette (`null`) : tout l'historique jusqu'à HEAD.
 */
export function addedSince(root: string, tag: string | null): string[] {
  const out = git(root, [
    'log',
    '--no-renames',
    '--diff-filter=A',
    '--name-only',
    '--relative',
    '--pretty=format:',
    tag === null ? 'HEAD' : `${tag}..HEAD`,
    '--',
    DONE_DIR,
  ]);
  return (out ?? '').split('\n').filter((line) => line !== '');
}

/** Les étiquettes dont le commit est un ancêtre de HEAD : « atteignables » (ADR-0088 §2.1). */
export function tagsAtteignables(root: string): Set<string> {
  const out = git(root, ['tag', '--merged', 'HEAD']) ?? '';
  return new Set(out.split('\n').filter((t) => t !== ''));
}

/**
 * Pour chaque sha de livraison (`pr:`) : « dans » la fenêtre s'il est ancêtre de HEAD sans l'être de
 * l'étiquette, « avant » s'il l'est de l'étiquette. Un sha inconnu ou hors de l'ascendance de HEAD
 * n'apparaît pas : la fiche retombe sur son ajout à `features/done/`.
 */
export function fenetreDesSha(root: string, etiquette: string | null, shas: ReadonlyMap<string, string>): Map<string, 'dans' | 'avant'> {
  const est = (sha: string, de: string): boolean => git(root, ['merge-base', '--is-ancestor', sha, de]) !== null;
  const fenetre = new Map<string, 'dans' | 'avant'>();
  for (const [id, sha] of shas) {
    if (!est(sha, 'HEAD')) continue;
    fenetre.set(id, etiquette !== null && est(sha, etiquette) ? 'avant' : 'dans');
  }
  return fenetre;
}
