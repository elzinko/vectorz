/**
 * loi-view — le sous-graphe LA LOI (règles/bundles/profils), lu du graphe compilé.
 * DÉTERMINISTE et PUR (ADR-0003) — pas d'I/O ici, le bord est la page `index.html` de
 * `diagrams/carte-la-loi/` qui fait `fetch('/.ezk/graph.compiled.json')` (D2).
 *
 * POURQUOI (fiche 20260821172716537, ADR-0041) : le graphe compilé (ADR-0040) porte déjà
 * tous les nœuds/liens de la LOI, noyés dans agent(7)/skill(23). Ce module DÉCOUPE le
 * sous-graphe utile (« qui active quoi »), donne le chemin source de chaque nœud (D3), et
 * — pour la navigation de la carte — expose le DÉTAIL relationnel de n'importe quel nœud.
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
 *   - edges : toute arête dont AU MOINS une extrémité est rule/bundle/profile.
 */
export function extractLoi(graph: CompiledGraph): LoiGraph {
  return {
    nodes: graph.nodes.filter((n) => isLoiKind(n.kind)),
    edges: graph.edges.filter((e) => isLoiKind(e.fromKind) || isLoiKind(e.toKind)),
  };
}

const MEGA_CITY_ROOT = 'products/mega-city';

/**
 * Chemin source par convention (D3, ADR-0041) — relatif à la racine du dépôt — pour
 * N'IMPORTE quel type de nœud (agents/skills inclus, pour les liens de navigation).
 *   rule    a/b → products/mega-city/rules/a/b.md
 *   bundle  x   → products/mega-city/bundles/x.yml
 *   profile p   → products/mega-city/profiles/p.yml
 *   agent   a   → products/mega-city/agents/a.md
 *   skill   s   → products/mega-city/skills/s/SKILL.md
 */
export function sourcePath(kind: NodeKind, id: string): string {
  switch (kind) {
    case 'rule':
      return `${MEGA_CITY_ROOT}/rules/${id}.md`;
    case 'bundle':
      return `${MEGA_CITY_ROOT}/bundles/${id}.yml`;
    case 'profile':
      return `${MEGA_CITY_ROOT}/profiles/${id}.yml`;
    case 'agent':
      return `${MEGA_CITY_ROOT}/agents/${id}.md`;
    case 'skill':
      return `${MEGA_CITY_ROOT}/skills/${id}/SKILL.md`;
    default:
      return '';
  }
}

/** Provenance d'un nœud LOI (compat historique) — délègue à `sourcePath`. */
export function provenancePath(kind: LoiNodeKind, id: string): string {
  return sourcePath(kind, id);
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
 * « Qui active quoi » pour un profil — HÉRITAGE COMPRIS (corrigé après revue adverse le
 * 2026-08-26). Un profil qui `profile-extends` un parent active AUSSI ses bundles/agents/
 * skills ; un bundle qui `bundle-extends` un autre hérite de ses règles.
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

/** Une référence typée vers un nœud, cliquable dans le panneau de détail. */
export interface DetailRef {
  kind: NodeKind;
  id: string;
}

/** Une section « libellé + nœuds liés » du panneau de détail. */
export interface DetailSection {
  label: string;
  nodes: DetailRef[];
}

/**
 * Le DÉTAIL relationnel d'un nœud, pour la navigation de la carte (clic → sous-nœuds
 * cliquables). Couvre les 5 types du graphe — agents/skills inclus, ce que le POC ne
 * montrait pas (retour PO 2026-08-27). Lit le graphe COMPLET (pas seulement le sous-graphe
 * LOI) : les liens `competences`/`interactions`/`composes` touchent agents et skills.
 */
export function nodeDetail(graph: CompiledGraph, kind: NodeKind, id: string): DetailSection[] {
  const edges = graph.edges;
  const outTo = (link: string, from: string): string[] =>
    edges.filter((e) => e.link === link && e.from === from).map((e) => e.to);
  const inFrom = (link: string, to: string): string[] =>
    edges.filter((e) => e.link === link && e.to === to).map((e) => e.from);
  const sec = (label: string, nodeKind: NodeKind, ids: string[]): DetailSection => ({
    label,
    nodes: [...new Set(ids)].sort().map((nid) => ({ kind: nodeKind, id: nid })),
  });

  switch (kind) {
    case 'profile': {
      const wa = whoActivates(graph, id);
      return [
        sec('Hérite de', 'profile', [...ancestors(graph, id, 'profile-extends')]),
        sec('Bundles', 'bundle', wa.bundles),
        sec('Règles (via ces bundles)', 'rule', wa.rules),
        sec('Agents', 'agent', wa.agents),
        sec('Skills', 'skill', wa.skills),
      ];
    }
    case 'bundle':
      return [
        sec('Étend', 'bundle', outTo('bundle-extends', id)),
        sec('Règles', 'rule', bundleRules(graph, id)),
        sec('Activé par les profils', 'profile', inFrom('profile-bundle', id)),
      ];
    case 'rule':
      return [
        sec('Dans les bundles', 'bundle', inFrom('bundle-rule', id)),
        sec('Gardée par (enforces)', 'agent', outTo('enforces', id)),
      ];
    case 'agent':
      return [
        sec('Garde les règles (enforces)', 'rule', inFrom('enforces', id)),
        sec('Compétences (skills)', 'skill', outTo('competences', id)),
        sec('Règles ciblées (interactions)', 'rule', outTo('interactions', id)),
        sec('Activé par les profils', 'profile', inFrom('profile-agent', id)),
      ];
    case 'skill':
      return [
        sec('Compose', 'skill', outTo('composes', id)),
        sec('Utilisé par les agents (compétence)', 'agent', inFrom('competences', id)),
        sec('Activé par les profils', 'profile', inFrom('profile-skill', id)),
      ];
    default:
      return [];
  }
}
