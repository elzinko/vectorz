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
import { TERMINAUX, isParked } from './fiche-schema.js';

const croissant = (a: { id: string }, b: { id: string }): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

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
  return [...livrees.values()].sort(croissant);
}

/** Où tombe le commit de livraison d'une fiche, par rapport à la dernière étiquette. */
export type Fenetre = ReadonlyMap<string, 'dans' | 'avant'>;

/** Une fiche de la coupe, avec ce que le numéro et l'écriture en demandent. */
export interface FicheDeCoupe extends FicheCoupe {
  type: string;
  /** Le `version:` déjà posé sur la fiche, '' sans. Une valeur posée est réécrite par la coupe. */
  versionPosee: string;
  file: string;
}

/** Un objectif touché par la coupe : complet quand toutes ses fiches actives sont livrées. */
export interface ObjectifDeCoupe {
  objectif: string;
  /** Les fiches de l'objectif qui entrent dans la coupe (correctifs exclus). */
  fiches: FicheDeCoupe[];
  /** k : fiches de l'objectif livrées. */
  livrees: number;
  /** n : fiches actives de l'objectif, livrées ou non (terminales et parkées exclues). */
  total: number;
  complet: boolean;
}

export interface Coupe {
  derniereEtiquette: string | null;
  fiches: FicheDeCoupe[];
  objectifs: ObjectifDeCoupe[];
  sansObjectif: FicheDeCoupe[];
  correctifs: FicheDeCoupe[];
  /** Les fiches de la coupe dont `version:` est déjà posé : la coupe le réécrit. */
  reecrites: FicheDeCoupe[];
  /** Les livrées sans numéro qui n'entrent pas : l'historique, sans commit de livraison dans la fenêtre. */
  horsCoupe: number;
}

const SHA = /^[0-9a-f]{7,40}$/;

/** Le sha de livraison écrit dans `pr:`, ou `null` (`#295`, `local (…)`, vide : pas un sha). */
export function shaDeLivraison(pr: string): string | null {
  return SHA.test(pr) ? pr : null;
}

/**
 * La coupe : les fiches livrées (`shipped`) dont le commit de livraison suit la dernière étiquette
 * (ADR-0088 §2.1). Un sha de `pr:` ancêtre de HEAD fait foi ; sinon l'ajout à `features/done/`.
 * `fenetre` dit, pour les fiches qui portent un sha, s'il est « dans » la fenêtre ou « avant » l'étiquette.
 */
export function composerCoupe(input: {
  chemins: readonly string[];
  fiches: readonly Fiche[];
  derniereEtiquette: string | null;
  fenetre: Fenetre;
}): Coupe {
  const { chemins, fiches, derniereEtiquette: etiquette, fenetre } = input;
  const cheminsDuSha = fiches.filter((f) => fenetre.get(f.id) === 'dans').map((f) => f.file);
  const ficheParId = new Map(fiches.map((f) => [f.id, f]));
  const retenues: FicheDeCoupe[] = [];
  for (const livree of livreesDepuis([...chemins, ...cheminsDuSha], fiches)) {
    const f = ficheParId.get(livree.id);
    if (f === undefined || f.status !== 'shipped' || fenetre.get(f.id) === 'avant') continue;
    retenues.push({ ...livree, type: f.type, versionPosee: f.version, file: f.file });
  }
  const sansCorrectifs = retenues.filter((f) => f.type !== 'bug');
  const entrees = new Set(retenues.map((f) => f.id));
  return {
    derniereEtiquette: etiquette,
    fiches: retenues,
    objectifs: objectifsDe(sansCorrectifs, fiches),
    sansObjectif: sansCorrectifs.filter((f) => f.objectif === ''),
    correctifs: retenues.filter((f) => f.type === 'bug'),
    reecrites: retenues.filter((f) => f.versionPosee !== ''),
    horsCoupe: fiches.filter((f) => f.status === 'shipped' && f.version === '' && !entrees.has(f.id)).length,
  };
}

function objectifsDe(entrees: readonly FicheDeCoupe[], fiches: readonly Fiche[]): ObjectifDeCoupe[] {
  const noms = [...new Set(entrees.map((f) => f.objectif).filter((o) => o !== ''))].sort();
  return noms.map((objectif) => {
    const actives = fiches.filter((f) => f.milestone === objectif && !TERMINAUX.includes(f.status) && !isParked(f));
    const livrees = actives.filter((f) => f.status === 'shipped').length;
    return {
      objectif,
      fiches: entrees.filter((f) => f.objectif === objectif),
      livrees,
      total: actives.length,
      complet: livrees === actives.length,
    };
  });
}
