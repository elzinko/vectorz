/**
 * graph-check — le CONTRAT de `ezk graph check --json` : le graphe de la méthode, brique par brique.
 * DÉTERMINISTE et PUR (ADR-0003). Fiche 20261117114544666, ADR-0089.
 *
 * En clair : la sortie dit tout ce qu'il faut pour dessiner la carte de la méthode — les briques
 * (`nodes`), les liens (`edges`), les liens cassés et les orphelins — sans que le lecteur ait à deviner
 * une brique depuis les liens. Le format est décrit UNE fois, ici, en zod ; `contracts/graph-check/v1/`
 * en est tiré (`pnpm board:contract --write`). `schema_version` monte quand un champ disparaît, change
 * de nom ou de sens ; un champ ajouté le laisse tel quel.
 */
import { z } from 'zod';
import type { Catalog } from '../loaders/catalog.js';
import {
  EDGE_SOURCES,
  LINK_VERBS,
  type LinkType,
  NODE_KINDS,
  type NodeKind,
  graphEdges,
  nodesOf,
  validateGraph,
} from './graph.js';
import type { PathRefReport } from './structural-refs.js';

export const GRAPH_CHECK_SCHEMA_VERSION = 1;

const KindSchema = z.enum(NODE_KINDS as [NodeKind, ...NodeKind[]]);

const EdgeSchema = z.strictObject({
  from: z.string(),
  fromKind: KindSchema,
  link: z
    .enum(EDGE_SOURCES.map((e) => e.link) as [LinkType, ...LinkType[]])
    .describe('Le nom du champ qui porte le lien (`composes`, `uses`, `launches`…).'),
  verb: z.enum(LINK_VERBS).describe('Ce que le lien veut dire : le jeu fermé de verbes.'),
  to: z.string(),
  toKind: KindSchema,
});

const PathRefSchema = z.strictObject({
  from: z.strictObject({ kind: KindSchema, id: z.string() }),
  to: z.strictObject({ kind: KindSchema, id: z.string() }),
  file: z.string(),
  line: z.number().int(),
  href: z.string(),
});

export const GraphCheckSchema = z.strictObject({
  schema_version: z.literal(GRAPH_CHECK_SCHEMA_VERSION),
  nodes: z
    .array(
      z.strictObject({
        kind: KindSchema,
        id: z.string(),
        fichier: z
          .string()
          .optional()
          .describe(
            'Le fichier qui déclare la brique, relatif à `products/mega-city` (une recette : relatif à la racine du dépôt, `recipes/<nom>.md`). Absent si elle n’en a pas.',
          ),
      }),
    )
    .describe(
      'Toutes les briques, triées par sorte puis par id. Leur nombre par sorte égale `nodeCount`.',
    ),
  nodeCount: z.strictObject(
    Object.fromEntries(NODE_KINDS.map((k) => [k, z.number().int()])) as Record<
      NodeKind,
      z.ZodNumber
    >,
  ),
  edgeCount: z.number().int(),
  edges: z.array(EdgeSchema).describe('Tous les liens, source → verbe → cible.'),
  broken: z
    .array(EdgeSchema)
    .describe('Les liens dont la cible n’existe pas. Vide quand la méthode tient.'),
  orphans: z
    .array(z.strictObject({ kind: KindSchema, id: z.string() }))
    .describe('Information, pas erreur : les briques que rien ne cite.'),
  pathRefs: z.strictObject({
    undeclared: z.array(PathRefSchema.extend({ declareWith: z.array(z.string()) })),
    unsupported: z.array(PathRefSchema),
  }),
});

export type GraphCheck = z.infer<typeof GraphCheckSchema>;

/**
 * Le contrat pour un catalogue. `sources` donne le fichier de chaque brique, clé `kind:id` (voir
 * `catalogSources`) ; une brique absente de `sources` sort sans `fichier`.
 */
export function buildGraphCheck(
  catalog: Catalog,
  pathRefs: PathRefReport,
  sources: ReadonlyMap<string, string>,
): GraphCheck {
  const nodes: GraphCheck['nodes'] = [];
  for (const kind of NODE_KINDS) {
    for (const id of [...nodesOf(catalog, kind).keys()].sort()) {
      const fichier = sources.get(`${kind}:${id}`);
      nodes.push({ kind, id, ...(fichier === undefined ? {} : { fichier }) });
    }
  }
  return {
    schema_version: GRAPH_CHECK_SCHEMA_VERSION,
    nodes,
    ...validateGraph(catalog),
    edges: graphEdges(catalog),
    pathRefs,
  };
}
