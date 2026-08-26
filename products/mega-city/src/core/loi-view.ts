/**
 * loi-view — le sous-graphe LA LOI (règles/bundles/profils), lu du graphe compilé.
 * DÉTERMINISTE et PUR (ADR-0003) — pas d'I/O ici, le bord est la page `index.html` de
 * `diagrams/carte-la-loi/` qui fait `fetch('/.ezk/graph.compiled.json')` (D2).
 *
 * POURQUOI (fiche 20260821172716537, ADR-0041) : le graphe compilé (ADR-0040) porte déjà
 * tous les nœuds/liens de la LOI, noyés dans agent(7)/skill(23). Ce module ne fait que
 * DÉCOUPER le sous-graphe utile (« qui active quoi » pour un profil) et donner, par
 * convention (D3), le chemin source de chaque nœud — jamais un 2ᵉ compilateur.
 */
import type { CompiledGraph, CompiledNode } from './compiled-graph.js';
import type { Edge, NodeKind } from './graph.js';

/** Les trois nœuds de LA LOI (par opposition à agent/skill, seulement touchés en bout d'arête). */
export type LoiNodeKind = 'rule' | 'bundle' | 'profile';

const LOI_KINDS: ReadonlySet<NodeKind> = new Set<NodeKind>(['rule', 'bundle', 'profile']);

function isLoiKind(kind: NodeKind): kind is LoiNodeKind {
  return LOI_KINDS.has(kind);
}

export interface LoiGraph {
  nodes: CompiledNode[];
  edges: Edge[];
}

/**
 * Extrait le sous-graphe LOI du graphe compilé complet :
 *   - nodes : uniquement rule/bundle/profile ;
 *   - edges : toute arête dont AU MOINS une extrémité est rule/bundle/profile (inclut
 *     donc `profile→agent`/`profile→skill` et l'héritage `profile-extends`/`bundle-extends`,
 *     tous nécessaires pour répondre « qui active quoi »).
 */
export function extractLoi(graph: CompiledGraph): LoiGraph {
  return {
    nodes: graph.nodes.filter((n) => isLoiKind(n.kind)),
    edges: graph.edges.filter((e) => isLoiKind(e.fromKind) || isLoiKind(e.toKind)),
  };
}

const MEGA_CITY_ROOT = 'products/mega-city';

/**
 * Provenance fichier par convention (D3, ADR-0041) — chemin relatif à la racine du dépôt.
 *   rule    a/b → products/mega-city/rules/a/b.md
 *   bundle  x   → products/mega-city/bundles/x.yml
 *   profile p   → products/mega-city/profiles/p.yml
 */
export function provenancePath(kind: LoiNodeKind, id: string): string {
  switch (kind) {
    case 'rule':
      return `${MEGA_CITY_ROOT}/rules/${id}.md`;
    case 'bundle':
      return `${MEGA_CITY_ROOT}/bundles/${id}.yml`;
    case 'profile':
      return `${MEGA_CITY_ROOT}/profiles/${id}.yml`;
  }
}

/**
 * Fermeture transitive des ancêtres de `startId` par un lien d'héritage donné
 * (`profile-extends` ou `bundle-extends`). Sûre aux cycles (Set de vus).
 */
function ancestors(
  loi: LoiGraph,
  startId: string,
  link: 'profile-extends' | 'bundle-extends',
): Set<string> {
  const seen = new Set<string>();
  const stack = [startId];
  while (stack.length > 0) {
    const cur = stack.pop() as string;
    for (const e of loi.edges) {
      if (e.link === link && e.from === cur && !seen.has(e.to)) {
        seen.add(e.to);
        stack.push(e.to);
      }
    }
  }
  return seen;
}

export interface WhoActivates {
  bundles: string[];
  rules: string[];
  agents: string[];
  skills: string[];
}

/**
 * « Qui active quoi » pour un profil — HÉRITAGE COMPRIS (le trou du POC initial, corrigé
 * après revue adverse le 2026-08-26). Un profil qui `profile-extends` un parent active
 * AUSSI les bundles/agents/skills du parent ; un bundle qui `bundle-extends` un autre
 * hérite de ses règles. Sans cette fermeture, `mobile` (qui étend `base`) apparaissait sans
 * le bundle `base` ni ses règles — réponse fausse à la question-titre de la fiche.
 */
export function whoActivates(loi: LoiGraph, profileId: string): WhoActivates {
  const profiles = new Set<string>([profileId, ...ancestors(loi, profileId, 'profile-extends')]);
  const collectTo = (link: string): string[] => {
    const out = new Set<string>();
    for (const e of loi.edges) {
      if (e.link === link && profiles.has(e.from)) out.add(e.to);
    }
    return [...out].sort();
  };
  const directBundles = collectTo('profile-bundle');
  const allBundles = new Set<string>(directBundles);
  for (const b of directBundles) {
    for (const parent of ancestors(loi, b, 'bundle-extends')) allBundles.add(parent);
  }
  const rules = new Set<string>();
  for (const e of loi.edges) {
    if (e.link === 'bundle-rule' && allBundles.has(e.from)) rules.add(e.to);
  }
  return {
    bundles: [...allBundles].sort(),
    rules: [...rules].sort(),
    agents: collectTo('profile-agent'),
    skills: collectTo('profile-skill'),
  };
}

/** Les règles d'un bundle, héritage `bundle-extends` compris. */
export function bundleRules(loi: LoiGraph, bundleId: string): string[] {
  const bundles = new Set<string>([bundleId, ...ancestors(loi, bundleId, 'bundle-extends')]);
  const rules = new Set<string>();
  for (const e of loi.edges) {
    if (e.link === 'bundle-rule' && bundles.has(e.from)) rules.add(e.to);
  }
  return [...rules].sort();
}

/** Les agents qui GARDENT une règle (arêtes `enforces`, rule→agent — AC3 de la fiche). */
export function enforcingAgents(loi: LoiGraph, ruleId: string): string[] {
  const out = new Set<string>();
  for (const e of loi.edges) {
    if (e.link === 'enforces' && e.from === ruleId) out.add(e.to);
  }
  return [...out].sort();
}
