/** Contrat `ezk graph check --json` (v1) : les briques de la méthode et leurs liens, tels que le daemon les relaie. */
export type GraphKind = 'profile' | 'skill' | 'agent' | 'bundle' | 'rule' | 'tool' | 'command' | 'recipe';

export interface GraphNode {
  kind: GraphKind;
  id: string;
  fichier?: string;
}

export interface GraphEdge {
  from: string;
  fromKind: GraphKind;
  link: string;
  verb: string;
  to: string;
  toKind: GraphKind;
}

export interface GraphCheck {
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodeCount: Record<GraphKind, number>;
  edgeCount: number;
}
