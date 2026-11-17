/**
 * coupe — ce qui attend la prochaine coupe : les fiches livrées depuis la dernière étiquette. PUR (ADR-0003).
 *
 * En clair : une « coupe » pose une étiquette de version sur tout ce qui a été livré depuis la
 * précédente (ADR-0088 §2). Ce module calcule les deux faits de la coupe à venir : la dernière
 * étiquette, et les fiches rangées dans `features/done/` depuis. Fiche 20261114131612759, volet a.
 *
 * C'est le SEUL calcul de « livré depuis la dernière étiquette » de la méthode : `board show` le
 * publie, le verbe de coupe (`ezk backlog version tag`) le réutilisera. Git est lu au bord
 * (`io/git-coupe.ts`), jamais ici.
 */
import { basename } from 'node:path';
import { VERSION_FORMAT, compareVersions } from '../backlog/versions.js';
import type { Fiche } from '../loaders/fiches.js';

/** Une fiche livrée depuis la dernière étiquette, telle que la coupe la publie. */
export interface FicheCoupe {
  id: string;
  titre: string;
  /** Son objectif (`milestone`), '' sans objectif. */
  objectif: string;
}

/** La plus haute étiquette semver stricte (`vX.Y.Z`), ou `null` sans aucune. Gels et pré-versions ne comptent pas. */
export function derniereEtiquette(tags: Iterable<string>): string | null {
  const versions = [...tags].filter((t) => VERSION_FORMAT.test(t)).sort(compareVersions);
  return versions.at(-1) ?? null;
}

/** L'id d'une fiche lu dans son nom de fichier (`<id>_slug.md`, legacy `<id>-slug.md`). */
function idOfPath(chemin: string): string {
  const name = basename(chemin, '.md');
  return /^(\d{4,})[-_]/.exec(name)?.[1] ?? name;
}

/**
 * Les fiches des chemins ajoutés à `done/` depuis l'étiquette, une fois chacune, triées par id.
 * Un chemin qui n'existe plus (fiche renommée ou effacée) retombe sur l'id de son nom de fichier.
 */
export function livreesDepuis(chemins: readonly string[], fiches: readonly Fiche[]): FicheCoupe[] {
  const parFichier = new Map(fiches.map((f) => [f.file, f]));
  const parId = new Map(fiches.map((f) => [f.id, f]));
  const livrees = new Map<string, FicheCoupe>();
  for (const chemin of chemins) {
    if (!chemin.endsWith('.md')) continue;
    const id = parFichier.get(chemin)?.id ?? idOfPath(chemin);
    if (livrees.has(id)) continue;
    const f = parId.get(id);
    livrees.set(id, { id, titre: f?.title ?? '', objectif: f?.milestone ?? '' });
  }
  return [...livrees.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
