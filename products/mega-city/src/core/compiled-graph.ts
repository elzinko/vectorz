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
import { type NodeKind, graphEdges, nodesOf, validateGraph } from './graph.js';
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
