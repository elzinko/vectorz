/**
 * structural-refs — le validateur des références structurelles PAR CHEMIN. PUR (ADR-0003).
 * Fiche 357, ADR-0040 : « un chemin n'est pas une identité ».
 *
 * Le problème : « le skill X applique la règle Y » s'écrivait comme un lien markdown par
 * chemin (`[Y](../../rules/…/Y.md)`). Déplacer le fichier casse le lien, et le graphe ne
 * voit rien. La structure doit passer par un ID déclaré (`applies:`, `composes:`, `roles:`…)
 * que le graphe compilé résout — et dont il refuse l'id inconnu.
 *
 * Ce module compare deux choses que le bord I/O lui donne :
 *   - les liens par chemin DÉJÀ résolus vers une entité du catalogue (`scanPathRefs`) ;
 *   - les arêtes du graphe compilé (ce qui est déclaré par id).
 * Un lien de lecture reste libre tant que la relation est AUSSI déclarée par id.
 *
 * Deux verdicts, pas un :
 *   - `undeclared`  un champ d'id existe pour cette relation et n'est pas renseigné → À CORRIGER ;
 *   - `unsupported` aucun champ d'id n'existe encore pour (source → cible) → information,
 *                   reliquat assumé (ex. règle → règle) : on ne bloque pas ce qu'on ne sait
 *                   pas encore déclarer.
 */
import { EDGE_SOURCES } from './graph.js';
import type { Edge, NodeKind } from './graph.js';

export interface EntityRef {
  kind: NodeKind;
  id: string;
}

/** Un lien markdown par chemin dont la cible est une entité du catalogue. */
export interface PathRef {
  from: EntityRef;
  to: EntityRef;
  /** Fichier qui porte le lien, relatif à la racine du catalogue, séparateurs POSIX. */
  file: string;
  /** Ligne (à partir de 1) du lien dans ce fichier. */
  line: number;
  /** La cible du lien, telle qu'écrite (fragment compris). */
  href: string;
}

export interface UndeclaredRef extends PathRef {
  /** Les champs de frontmatter qui déclareraient cette relation par id. */
  declareWith: string[];
}

export interface PathRefReport {
  undeclared: UndeclaredRef[];
  unsupported: PathRef[];
}

const pair = (fromKind: NodeKind, from: string, toKind: NodeKind, to: string): string =>
  `${fromKind}:${from} -> ${toKind}:${to}`;

/** Le nom du champ de frontmatter qui porte un type de lien (seul `enforces` diffère). */
const fieldOf = (link: string): string => (link === 'enforces' ? 'enforcements' : link);

export function checkPathRefs(refs: readonly PathRef[], edges: readonly Edge[]): PathRefReport {
  const declared = new Set(edges.map((e) => pair(e.fromKind, e.from, e.toKind, e.to)));
  const report: PathRefReport = { undeclared: [], unsupported: [] };

  for (const ref of refs) {
    if (declared.has(pair(ref.from.kind, ref.from.id, ref.to.kind, ref.to.id))) continue;
    const declareWith = EDGE_SOURCES.filter(
      (s) => s.fromKind === ref.from.kind && s.toKind === ref.to.kind,
    ).map((s) => fieldOf(s.link));
    if (declareWith.length > 0) report.undeclared.push({ ...ref, declareWith });
    else report.unsupported.push(ref);
  }
  return report;
}
