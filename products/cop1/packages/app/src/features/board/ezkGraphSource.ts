/**
 * ezkGraphSource — le graphe de la méthode (fiche 20261117114544792, ADR-086) :
 * `ezk graph check --json`, vérifié pour le contrat `graph-check/v1`. La méthode publie les briques et
 * leurs liens ; la carte ne recopie aucune liste. Le graphe bouge rarement : relu au plus toutes les
 * cinq minutes, et servi tout de suite depuis la dernière réponse.
 */
import { EzkContractError } from './ezkPlanTranslator.js';
import { EzkSource, type EzkSourceOptions } from './ezkSource.js';

const SUPPORTED_SCHEMA_VERSION = 1;
const COMMANDE = 'ezk graph check --json';
const GRAPH_TTL_MS = 5 * 60_000;

export const GRAPH_KINDS = ['profile', 'skill', 'agent', 'bundle', 'rule', 'tool', 'command', 'recipe'] as const;
export type GraphKind = (typeof GRAPH_KINDS)[number];

export interface GraphNodeView {
  kind: GraphKind;
  id: string;
  fichier?: string;
}

export interface GraphEdgeView {
  from: string;
  fromKind: GraphKind;
  link: string;
  verb: string;
  to: string;
  toKind: GraphKind;
}

export interface GraphView {
  nodes: GraphNodeView[];
  edges: GraphEdgeView[];
  nodeCount: Record<GraphKind, number>;
  edgeCount: number;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function fail(what: string): never {
  throw new EzkContractError(`${COMMANDE} : ${what}`);
}

const text = (v: Record<string, unknown>, k: string): string => {
  const value = v[k];
  return typeof value === 'string' ? value : fail(`champ ${k} absent`);
};

const kind = (v: Record<string, unknown>, k: string): GraphKind => {
  const value = text(v, k);
  return (GRAPH_KINDS as readonly string[]).includes(value) ? (value as GraphKind) : fail(`sorte ${value} inconnue`);
};

const records = (v: Record<string, unknown>, k: string): Record<string, unknown>[] => {
  const value = v[k];
  return Array.isArray(value) && value.every(isRecord) ? value : fail(`champ ${k} mal formé`);
};

function readNodeCount(json: Record<string, unknown>): Record<GraphKind, number> {
  const raw = json.nodeCount;
  if (!isRecord(raw)) return fail('champ nodeCount mal formé');
  const count = {} as Record<GraphKind, number>;
  for (const k of GRAPH_KINDS) {
    const n = raw[k];
    count[k] = typeof n === 'number' ? n : fail(`nodeCount.${k} absent`);
  }
  return count;
}

/** Le JSON publié, vérifié ; un format inconnu est refusé net, jamais deviné. */
export function translateGraphCheck(json: unknown): GraphView {
  if (!isRecord(json)) fail('réponse mal formée');
  if (json.schema_version !== SUPPORTED_SCHEMA_VERSION)
    fail(`schema_version ${String(json.schema_version)} inconnu (attendu ${SUPPORTED_SCHEMA_VERSION})`);
  return {
    nodes: records(json, 'nodes').map((n) => ({
      kind: kind(n, 'kind'),
      id: text(n, 'id'),
      ...(typeof n.fichier === 'string' ? { fichier: n.fichier } : {}),
    })),
    edges: records(json, 'edges').map((e) => ({
      from: text(e, 'from'),
      fromKind: kind(e, 'fromKind'),
      link: text(e, 'link'),
      verb: text(e, 'verb'),
      to: text(e, 'to'),
      toKind: kind(e, 'toKind'),
    })),
    nodeCount: readNodeCount(json),
    edgeCount: typeof json.edgeCount === 'number' ? json.edgeCount : fail('champ edgeCount absent'),
  };
}

/**
 * `ezk graph check` sort en code 1 dès qu'il trouve un lien cassé, mais imprime quand même le graphe
 * complet : c'est justement ce qu'il faut montrer. On garde donc sa sortie si elle n'est pas vide ;
 * sans sortie, l'échec remonte tel quel.
 */
async function graphCheckOutput(run: (args: string[]) => Promise<string>, root: string): Promise<string> {
  try {
    return await run(['--root', root, 'graph', 'check', '--json']);
  } catch (error) {
    const stdout = (error as { stdout?: unknown }).stdout;
    if (typeof stdout === 'string' && stdout.trim() !== '') return stdout;
    throw error;
  }
}

export class EzkGraphSource extends EzkSource<{ graph: GraphView }> {
  constructor(options: EzkSourceOptions) {
    super({ ttlMs: GRAPH_TTL_MS, ...options }, async (root, run) => ({
      graph: translateGraphCheck(JSON.parse(await graphCheckOutput(run, root))),
    }));
  }
}
