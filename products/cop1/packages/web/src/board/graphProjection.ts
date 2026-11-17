/**
 * Projection pure du contrat `graph check` en nœuds et arêtes de la carte de la méthode zoomable
 * (fiche 20261117114544792). Aucun React ici : le rendu consomme ce résultat.
 *
 * Les positions et tailles ne dépendent PAS du niveau : changer de niveau n'ajoute ou ne retire que du
 * contenu, jamais ne déplace la caméra (règle ux/no-layout-shift).
 */
import type { GraphCheck, GraphEdge, GraphKind } from './graphCheck.js';
import type { FlowEdge } from './processProjection.js';
import { levelForZoom, type ZoomLevel, type ZoomThresholds } from './semanticZoom.js';

export type GraphLevel = ZoomLevel;

export interface GraphFlowNode {
  id: string;
  type: 'famille' | 'brique';
  position: { x: number; y: number };
  width: number;
  height: number;
  parentId?: string;
  extent?: 'parent';
  data: Record<string, unknown>;
}

export const FAMILY_LABELS: Record<GraphKind, string> = {
  profile: 'Profils',
  bundle: 'Paquets',
  skill: 'Compétences',
  agent: 'Agents',
  rule: 'Règles',
  tool: 'Outils',
  command: 'Commandes',
};

/** Les familles rangées en trois rangées : de ce qui compose (en haut) à ce qui s'exécute (en bas). */
const FAMILY_ROWS: GraphKind[][] = [
  ['profile', 'bundle', 'skill', 'agent'],
  ['rule', 'tool'],
  ['command'],
];

/**
 * Seuils de zoom : sous le premier, niveau 1 ; au-dessus du second, niveau 3. Calés sur la carte
 * réelle (337 briques) : cadrée en entier dans une fenêtre de 1000 px, elle s'affiche vers 0,12-0,15.
 * Les briques arrivent dès qu'on a doublé ce zoom (0,3, un id de 24 px y fait 7 px), leur détail
 * quand une brique fait à peu près le quart de l'écran (0,8).
 */
export const GRAPH_ZOOM_THRESHOLDS: ZoomThresholds = [0.3, 0.8];

export const graphLevelForZoom = (zoom: number, previous?: GraphLevel): GraphLevel =>
  levelForZoom(zoom, GRAPH_ZOOM_THRESHOLDS, previous);

const CELL_W = 300;
const CELL_H = 120;
const CELL_GAP = 14;
const PAD = 20;
/** Place du titre de la famille : de loin, il fait ~120 px de haut. */
const HEADER = 240;
const FAMILY_GAP = 120;

/** Les ids de brique peuvent contenir `/` et des espaces : on les préfixe par leur sorte. */
export const graphNodeId = (kind: GraphKind, id: string): string => `${kind}:${id}`;
const familyId = (kind: GraphKind): string => `famille:${kind}`;

const columnsFor = (count: number): number => Math.max(1, Math.ceil(Math.sqrt(count)));

function familySize(count: number): { width: number; height: number } {
  const cols = columnsFor(count);
  const rows = Math.max(1, Math.ceil(count / cols));
  return {
    width: 2 * PAD + cols * CELL_W + (cols - 1) * CELL_GAP,
    height: HEADER + rows * CELL_H + (rows - 1) * CELL_GAP + PAD,
  };
}

function familyOrigins(counts: Record<GraphKind, number>): Map<GraphKind, { x: number; y: number }> {
  const origins = new Map<GraphKind, { x: number; y: number }>();
  let y = 0;
  for (const row of FAMILY_ROWS) {
    let x = 0;
    for (const kind of row) {
      origins.set(kind, { x, y });
      x += familySize(counts[kind]).width + FAMILY_GAP;
    }
    y += Math.max(...row.map((kind) => familySize(counts[kind]).height)) + FAMILY_GAP;
  }
  return origins;
}

/** Les comptes réels, tirés des nœuds eux-mêmes : une famille vide existe, avec 0. */
function countByKind(contract: GraphCheck): Record<GraphKind, number> {
  const counts = Object.fromEntries(Object.keys(FAMILY_LABELS).map((k) => [k, 0])) as Record<GraphKind, number>;
  for (const node of contract.nodes) counts[node.kind] += 1;
  return counts;
}

interface CountedVerb {
  verb: string;
  count: number;
}

const bump = (map: Map<string, number>, key: string): void => void map.set(key, (map.get(key) ?? 0) + 1);

function familyNodes(contract: GraphCheck, level: GraphLevel): GraphFlowNode[] {
  const counts = countByKind(contract);
  const origins = familyOrigins(counts);
  return FAMILY_ROWS.flat().map((kind) => {
    const internal = new Map<string, number>();
    for (const e of contract.edges) if (e.fromKind === kind && e.toKind === kind) bump(internal, e.verb);
    const internalList: CountedVerb[] = [...internal].map(([verb, count]) => ({ verb, count }));
    return {
      id: familyId(kind),
      type: 'famille',
      position: origins.get(kind)!,
      ...familySize(counts[kind]),
      data: { level, kind, label: FAMILY_LABELS[kind], count: counts[kind], internal: internalList },
    };
  });
}

/** Les liens d'une brique, comptés par verbe : les sortants d'abord, puis les entrants. */
function linksOf(contract: GraphCheck, flowId: string): { sens: 'sortant' | 'entrant'; verb: string; count: number }[] {
  const out = new Map<string, number>();
  const into = new Map<string, number>();
  for (const e of contract.edges) {
    if (graphNodeId(e.fromKind, e.from) === flowId) bump(out, e.verb);
    if (graphNodeId(e.toKind, e.to) === flowId) bump(into, e.verb);
  }
  const sorted = (m: Map<string, number>, sens: 'sortant' | 'entrant') =>
    [...m].sort(([a], [b]) => a.localeCompare(b)).map(([verb, count]) => ({ sens, verb, count }));
  return [...sorted(out, 'sortant'), ...sorted(into, 'entrant')];
}

/** Les ids de brique voisins directs de la brique choisie, dans les deux sens. */
function neighborsOf(contract: GraphCheck, selection: string): Set<string> {
  const neighbors = new Set<string>();
  for (const e of contract.edges) {
    const from = graphNodeId(e.fromKind, e.from);
    const to = graphNodeId(e.toKind, e.to);
    if (from === selection) neighbors.add(to);
    if (to === selection) neighbors.add(from);
  }
  return neighbors;
}

function brickNodes(contract: GraphCheck, level: GraphLevel, selection: string | undefined): GraphFlowNode[] {
  const counts = countByKind(contract);
  const known = selection !== undefined && contract.nodes.some((n) => graphNodeId(n.kind, n.id) === selection);
  const neighbors = known ? neighborsOf(contract, selection) : new Set<string>();
  const seen = Object.fromEntries(Object.keys(counts).map((k) => [k, 0])) as Record<GraphKind, number>;
  return contract.nodes.map((node) => {
    const flowId = graphNodeId(node.kind, node.id);
    const index = seen[node.kind]++;
    const cols = columnsFor(counts[node.kind]);
    const data: Record<string, unknown> = { level, kind: node.kind, nom: node.id };
    if (level === 3) {
      data.fichier = node.fichier;
      data.liens = linksOf(contract, flowId);
    }
    if (known) {
      if (flowId === selection) data.highlight = 'self';
      else if (neighbors.has(flowId)) data.highlight = 'neighbor';
      else data.dim = true;
    }
    return {
      id: flowId,
      type: 'brique' as const,
      parentId: familyId(node.kind),
      extent: 'parent' as const,
      position: {
        x: PAD + (index % cols) * (CELL_W + CELL_GAP),
        y: HEADER + Math.floor(index / cols) * (CELL_H + CELL_GAP),
      },
      width: CELL_W,
      height: CELL_H,
      data,
    };
  });
}

/** Niveau 1 : une arête par (famille source, verbe, famille cible), avec son compte. */
function familyEdges(contract: GraphCheck): FlowEdge[] {
  const counts = new Map<string, number>();
  for (const e of contract.edges) if (e.fromKind !== e.toKind) bump(counts, `${e.fromKind}\t${e.verb}\t${e.toKind}`);
  return [...counts].map(([key, count]) => {
    const [from, verb, to] = key.split('\t') as [GraphKind, string, GraphKind];
    return { id: `famille:${from}>${verb}>${to}`, source: familyId(from), target: familyId(to), label: `${verb} · ${count}` };
  });
}

/** Les liens de la brique choisie, un par lien distinct, libellés de leur verbe. */
function selectionEdges(edges: GraphEdge[], selection: string): FlowEdge[] {
  const result = new Map<string, FlowEdge>();
  for (const e of edges) {
    const source = graphNodeId(e.fromKind, e.from);
    const target = graphNodeId(e.toKind, e.to);
    if (source !== selection && target !== selection) continue;
    const id = `lien:${source}>${e.verb}>${target}`;
    result.set(id, { id, source, target, label: e.verb });
  }
  return [...result.values()];
}

export function projectGraphToFlow(
  contract: GraphCheck,
  level: GraphLevel,
  selection?: string,
): { nodes: GraphFlowNode[]; edges: FlowEdge[] } {
  const families = familyNodes(contract, level);
  if (level < 2) return { nodes: families, edges: familyEdges(contract) };
  const bricks = brickNodes(contract, level, selection);
  const selected = selection !== undefined && bricks.some((b) => b.id === selection);
  return { nodes: [...families, ...bricks], edges: selected ? selectionEdges(contract.edges, selection) : [] };
}
