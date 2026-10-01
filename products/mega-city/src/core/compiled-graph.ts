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
  NODE_KINDS,
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

/** Le résultat de « quel nœud veut-on interroger ? » — l'id seul ne suffit pas toujours. */
export type NodeResolution =
  | { status: 'found'; node: CompiledNode }
  | { status: 'unknown' }
  | { status: 'ambiguous'; kinds: NodeKind[] };

/** `kind:id` ou `id` nu. Un préfixe qui n'est pas un kind reste dans l'id : il n'est pas avalé. */
function parseNodeRef(ref: string): { kind?: NodeKind; id: string } {
  const colon = ref.indexOf(':');
  if (colon > 0) {
    const kind = NODE_KINDS.find((k) => k === ref.slice(0, colon));
    if (kind) return { kind, id: ref.slice(colon + 1) };
  }
  return { id: ref };
}

/**
 * Trouve LE nœud que `ref` désigne. Un nœud s'identifie par {kind, id}, pas par l'id seul :
 * le catalogue a un agent ET un skill `ezk-archive` (et un bundle ET un profil `base`).
 *   - `skill:ezk-archive` désigne exactement ce nœud ;
 *   - `ezk-archive` nu suffit quand un seul nœud porte ce nom ;
 *   - sinon le LIEN demandé tranche s'il ne part (ou, en sens `inverse`, n'arrive) que d'un
 *     des kinds candidats : `composes` part d'un skill, `competences` d'un agent ;
 *   - sinon (un VERBE couvre plusieurs kinds) → `ambiguous` : on REFUSE plutôt que de
 *     mélanger les relations de deux nœuds.
 */
export function resolveNode(
  graph: CompiledGraph,
  relation: Relation,
  ref: string,
  inverse = false,
): NodeResolution {
  const { kind, id } = parseNodeRef(ref);
  const named = graph.nodes.filter((n) => n.id === id && (kind === undefined || n.kind === kind));
  const [first, ...others] = named;
  if (!first) return { status: 'unknown' };
  if (others.length === 0) return { status: 'found', node: first };

  const ends = new Set<NodeKind>(
    EDGE_SOURCES.filter((s) => s.link === relation || s.verb === relation).map((s) =>
      inverse ? s.toKind : s.fromKind,
    ),
  );
  const fitting = named.filter((n) => ends.has(n.kind));
  const [only, ...more] = fitting;
  if (only && more.length === 0) return { status: 'found', node: only };
  // Plusieurs kinds conviennent → on propose ceux-là ; aucun ne convient → on liste les candidats.
  return { status: 'ambiguous', kinds: (fitting.length > 1 ? fitting : named).map((n) => n.kind) };
}

/**
 * Interroge l'objet compilé SANS recalcul ni grep (le préflight LIT, ne recompile jamais — D5).
 * Sens direct : ce que `node` atteint par `relation`. Sens `inverse` : qui atteint `node`
 * (« qui applique cette règle ? »). Résultat trié, sans doublon.
 * Le nœud est {kind, id} (voir `resolveNode`) : deux nœuds de même id ne se mélangent jamais.
 * Le verbe d'une arête est relu depuis son lien si l'artefact date d'avant les verbes.
 */
export function queryGraph(
  graph: CompiledGraph,
  relation: Relation,
  node: CompiledNode,
  inverse = false,
): string[] {
  const matches = (e: Edge): boolean =>
    e.link === relation || (e.verb ?? LINK_VERB[e.link]) === relation;
  const isNode = inverse
    ? (e: Edge): boolean => e.toKind === node.kind && e.to === node.id
    : (e: Edge): boolean => e.fromKind === node.kind && e.from === node.id;
  const found = graph.edges
    .filter((e) => matches(e) && isNode(e))
    .map((e) => (inverse ? e.from : e.to));
  return [...new Set(found)].sort();
}
