/**
 * graph — le modèle compilé de la méthode, et sa VALIDATION. DÉTERMINISTE et PUR (ADR-0003).
 *
 * POURQUOI ce fichier existe (synthèse PR #162, fiche « câbler la méthode ») :
 *   le graphe de la méthode était jusqu'ici RE-DEVINÉ à chaque lecture (webapp, carte,
 *   checkers), reconstruit à la main depuis trente fichiers. Ici on le compile UNE fois :
 *   `loadCatalog()` (le loader) rend les NŒUDS ; `graphEdges()` rend les ARÊTES typées ;
 *   `validateGraph()` dit si les concepts tiennent (aucun lien ne pointe dans le vide).
 *
 * L'UNIFICATION des cinq vocabulaires de liens (`composes`, `roles`, `competences`,
 * `interactions`, `enforcements`) se lit d'un coup d'œil dans `LinkType` + `EDGE_SOURCES` :
 *   un seul endroit énumère « qui peut pointer vers qui ». C'est le premier pas concret
 *   vers « un seul mot de lien » — d'abord on les RÉUNIT dans un type, ensuite (décision
 *   produit séparée) on décide s'il faut les FUSIONNER.
 *
 * Aucun I/O ici (le bord = `bin/ezk-graph.ts`). Tri stable partout → sortie reproductible.
 */
import type { Catalog } from '../loaders/catalog.js';

/** Les cinq catalogues = les cinq types de nœud du graphe. */
export type NodeKind = 'rule' | 'agent' | 'skill' | 'bundle' | 'profile';

/**
 * Le VOCABULAIRE de lien réuni. Chaque variante = un champ de frontmatter/YAML aujourd'hui
 * éparpillé sur un type différent. Les nommer ici, ensemble, EST l'unification demandée.
 *   composes   skill → skill   (ADR-0025)      · roles       skill → agent  (ADR-0020 amend.)
 *   competences agent → skill                   · interactions agent → rule
 *   enforces   rule  → agent   (enforcement agent-check, seul lien inter-catalogue, domain.ts)
 *   participants rule(interaction) → agent      (ADR-0002)
 *   les `*-…` = composition STRUCTURELLE des bundles/profiles (le keystone).
 */
export type LinkType =
  | 'composes'
  | 'roles'
  | 'competences'
  | 'interactions'
  | 'enforces'
  | 'participants'
  | 'bundle-extends'
  | 'bundle-rule'
  | 'profile-extends'
  | 'profile-bundle'
  | 'profile-agent'
  | 'profile-skill'
  | 'profile-interaction';

/** Une arête du graphe : `from` (un nœud `fromKind`) référence `to` (attendu dans `toKind`) via `link`. */
export interface Edge {
  from: string;
  fromKind: NodeKind;
  link: LinkType;
  to: string;
  toKind: NodeKind;
}

/**
 * Table déclarative : pour chaque type de lien, d'où on le lit et vers quel catalogue il pointe.
 * `field` est le champ portant les ids cibles. `single` marque un champ scalaire (enforcement.agent).
 * Tout est ici : ajouter un lien à la méthode = une ligne, pas une fouille dans trente fichiers.
 */
interface EdgeSource {
  link: LinkType;
  fromKind: NodeKind;
  toKind: NodeKind;
}

export const EDGE_SOURCES: readonly EdgeSource[] = [
  { link: 'composes', fromKind: 'skill', toKind: 'skill' },
  { link: 'roles', fromKind: 'skill', toKind: 'agent' },
  { link: 'competences', fromKind: 'agent', toKind: 'skill' },
  { link: 'interactions', fromKind: 'agent', toKind: 'rule' },
  { link: 'enforces', fromKind: 'rule', toKind: 'agent' },
  { link: 'participants', fromKind: 'rule', toKind: 'agent' },
  { link: 'bundle-extends', fromKind: 'bundle', toKind: 'bundle' },
  { link: 'bundle-rule', fromKind: 'bundle', toKind: 'rule' },
  { link: 'profile-extends', fromKind: 'profile', toKind: 'profile' },
  { link: 'profile-bundle', fromKind: 'profile', toKind: 'bundle' },
  { link: 'profile-agent', fromKind: 'profile', toKind: 'agent' },
  { link: 'profile-skill', fromKind: 'profile', toKind: 'skill' },
  { link: 'profile-interaction', fromKind: 'profile', toKind: 'rule' },
];

/** La `Map` de nœuds d'un catalogue pour un `NodeKind`. */
export function nodesOf(catalog: Catalog, kind: NodeKind): Map<string, { id: string }> {
  switch (kind) {
    case 'rule':
      return catalog.rules;
    case 'agent':
      return catalog.agents;
    case 'skill':
      return catalog.skills;
    case 'bundle':
      return catalog.bundles;
    case 'profile':
      return catalog.profiles;
  }
}

/** Les ids cibles portés par un nœud pour un type de lien donné (jamais `composesExternal` : hors catalogue). */
function targetsFor(catalog: Catalog, src: EdgeSource): { from: string; to: string }[] {
  const out: { from: string; to: string }[] = [];
  const push = (from: string, tos: readonly string[] | undefined): void => {
    for (const to of tos ?? []) out.push({ from, to });
  };
  switch (src.link) {
    case 'composes':
      for (const s of catalog.skills.values()) push(s.id, s.composes);
      break;
    case 'roles':
      for (const s of catalog.skills.values()) push(s.id, s.roles);
      break;
    case 'competences':
      for (const a of catalog.agents.values()) push(a.id, a.competences);
      break;
    case 'interactions':
      for (const a of catalog.agents.values()) push(a.id, a.interactions);
      break;
    case 'enforces':
      for (const r of catalog.rules.values())
        for (const e of r.enforcements ?? []) if (e.agent) out.push({ from: r.id, to: e.agent });
      break;
    case 'participants':
      for (const r of catalog.rules.values()) push(r.id, r.participants);
      break;
    case 'bundle-extends':
      for (const b of catalog.bundles.values()) push(b.id, b.extends);
      break;
    case 'bundle-rule':
      for (const b of catalog.bundles.values()) push(b.id, b.rules);
      break;
    case 'profile-extends':
      for (const p of catalog.profiles.values()) push(p.id, p.extends);
      break;
    case 'profile-bundle':
      for (const p of catalog.profiles.values()) push(p.id, p.bundles);
      break;
    case 'profile-agent':
      for (const p of catalog.profiles.values()) push(p.id, p.agents);
      break;
    case 'profile-skill':
      for (const p of catalog.profiles.values()) push(p.id, p.skills);
      break;
    case 'profile-interaction':
      for (const p of catalog.profiles.values()) push(p.id, p.interactions);
      break;
  }
  return out;
}

/** Toutes les arêtes du catalogue, dédupliquées et triées stablement (déterminisme, F4). */
export function graphEdges(catalog: Catalog): Edge[] {
  const seen = new Set<string>();
  const edges: Edge[] = [];
  for (const src of EDGE_SOURCES) {
    for (const { from, to } of targetsFor(catalog, src)) {
      const key = `${src.link} ${from} ${to}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from, fromKind: src.fromKind, link: src.link, to, toKind: src.toKind });
    }
  }
  return edges.sort((a, b) =>
    a.link !== b.link
      ? a.link < b.link
        ? -1
        : 1
      : a.from !== b.from
        ? a.from < b.from
          ? -1
          : 1
        : a.to < b.to
          ? -1
          : a.to > b.to
            ? 1
            : 0,
  );
}

/** Une arête cassée : sa cible `to` est absente du catalogue `toKind`. */
export type BrokenLink = Edge;

/** Un nœud que rien ne référence (info, pas erreur : un profil racine est orphelin par nature). */
export interface Orphan {
  kind: NodeKind;
  id: string;
}

export interface GraphReport {
  nodeCount: Record<NodeKind, number>;
  edgeCount: number;
  /** Le VRAI signal : des liens qui pointent dans le vide. Un concept qui ne tient pas. */
  broken: BrokenLink[];
  /** Info : nœuds jamais cités comme cible. Les profils y figurent légitimement (racines). */
  orphans: Orphan[];
}

const NODE_KINDS: readonly NodeKind[] = ['rule', 'agent', 'skill', 'bundle', 'profile'];

/**
 * Compile le graphe et le valide. PUR : ne lit pas le disque (on lui passe un `Catalog` déjà chargé).
 * `broken` = arêtes dont la cible n'existe pas dans son catalogue → l'exit-code du CLI en dépend.
 * `orphans` = purement informatif (un profil racine ou une règle pas encore bundlée est orphelin, sans faute).
 */
export function validateGraph(catalog: Catalog): GraphReport {
  const edges = graphEdges(catalog);

  const broken = edges.filter((e) => !nodesOf(catalog, e.toKind).has(e.to));

  const referenced = new Set(edges.map((e) => `${e.toKind} ${e.to}`));
  const orphans: Orphan[] = [];
  for (const kind of NODE_KINDS) {
    for (const id of [...nodesOf(catalog, kind).keys()].sort()) {
      if (!referenced.has(`${kind} ${id}`)) orphans.push({ kind, id });
    }
  }

  const nodeCount = Object.fromEntries(
    NODE_KINDS.map((k) => [k, nodesOf(catalog, k).size]),
  ) as Record<NodeKind, number>;

  return { nodeCount, edgeCount: edges.length, broken, orphans };
}
