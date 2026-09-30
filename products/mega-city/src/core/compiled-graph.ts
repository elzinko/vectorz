/**
 * compiled-graph — l'INSTANCE compilée du graphe de la méthode. DÉTERMINISTE et PUR
 * (ADR-0003). Fiche 357, étape 1 de l'ADR-0040.
 *
 * POURQUOI ce fichier existe (D5 de l'ADR-0040) : `graph.ts` sait déjà calculer les
 * arêtes et RAPPORTER les liens cassés (`validateGraph`, non-bloquant — la carte et les
 * checkers l'utilisent en info). Mais rien n'émettait encore d'OBJET typé unique,
 * interrogeable, qu'on puisse écrire tel quel sur disque. C'est le rôle de `compileGraph` :
 *   - les NŒUDS (kind + id) de tout le catalogue, à plat ;
 *   - les ARÊTES telles que `graphEdges` les calcule (vocabulaire inchangé — D1, aucun
 *     rename de clé sur disque) ;
 *   - et il ÉCHOUE (lève) si une arête référence un id inconnu — fin du lien pendouillant
 *     silencieux (D5). `validateGraph` reste le rapport non-bloquant (carte, orphelins) ;
 *     `compileGraph` est la porte qui REFUSE de produire une instance incohérente.
 *
 * Aucun I/O ici : lire le catalogue, écrire l'artefact = le bord (`bin/graph-compile.ts`).
 */
import {
  EDGE_SOURCES,
  LINK_VERB,
  LINK_VERBS,
  type LinkType,
  type LinkVerb,
  type NodeKind,
  graphEdges,
  nodesOf,
  validateGraph,
} from './graph.js';
import type { Edge } from './graph.js';
import type { Catalog } from '../loaders/catalog.js';

export interface CompiledNode {
  kind: NodeKind;
  id: string;
}

/** L'instance compilée : tous les nœuds, toutes les arêtes — un objet, pas un Mermaid. */
export interface CompiledGraph {
  nodes: CompiledNode[];
  edges: Edge[];
}

const NODE_KINDS: readonly NodeKind[] = ['rule', 'agent', 'skill', 'bundle', 'profile'];

function compileNodes(catalog: Catalog): CompiledNode[] {
  const nodes: CompiledNode[] = [];
  for (const kind of NODE_KINDS) {
    for (const id of [...nodesOf(catalog, kind).keys()].sort()) nodes.push({ kind, id });
  }
  return nodes;
}

/**
 * Compile l'instance et la VALIDE en même temps : une arête vers un id inconnu fait
 * échouer la compilation (lève une `Error` listant les liens cassés), plutôt que de
 * produire silencieusement un graphe troué.
 */
export function compileGraph(catalog: Catalog): CompiledGraph {
  const { broken } = validateGraph(catalog);
  if (broken.length > 0) {
    const shown = broken.map((e) => `${e.from} --(${e.link})--> ${e.to}`).join('\n');
    throw new Error(`compileGraph : ${broken.length} lien(s) cassé(s) — id inconnu :\n${shown}`);
  }
  return { nodes: compileNodes(catalog), edges: graphEdges(catalog) };
}

/** Ce qu'on peut demander au graphe : un lien (nom historique du champ) OU un verbe (le sens). */
export type Relation = LinkType | LinkVerb;

const RELATIONS: ReadonlySet<string> = new Set<string>([
  ...EDGE_SOURCES.map((s) => s.link),
  ...LINK_VERBS,
]);

/** `name` est-il un lien ou un verbe connu ? Une faute de frappe ne doit pas répondre « rien trouvé ». */
export function isRelation(name: string): name is Relation {
  return RELATIONS.has(name);
}

/**
 * Interroge l'objet compilé SANS recalcul ni grep (le préflight LIT, ne recompile jamais — D5).
 * Sens direct : ce que `id` atteint par `relation`. Sens `inverse` : qui atteint `id`
 * (« qui applique cette règle ? »). Résultat trié, sans doublon.
 * Le verbe d'une arête est relu depuis son lien si l'artefact date d'avant les verbes.
 */
export function queryGraph(
  graph: CompiledGraph,
  relation: Relation,
  id: string,
  inverse = false,
): string[] {
  const matches = (e: Edge): boolean =>
    e.link === relation || (e.verb ?? LINK_VERB[e.link]) === relation;
  const found = graph.edges
    .filter((e) => matches(e) && (inverse ? e.to : e.from) === id)
    .map((e) => (inverse ? e.from : e.to));
  return [...new Set(found)].sort();
}
