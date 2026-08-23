/**
 * map-data — les données de la carte interactive, compilées depuis le catalogue.
 * DÉTERMINISTE et PUR (ADR-0003) — le bord I/O est `bin/regen-map-data.ts`.
 *
 * POURQUOI (épic « carte fidèle », synthèse PR #162) : la carte dessinait des données
 * écrites À LA MAIN dans son HTML — impossible de prouver qu'un trait venait des fichiers.
 * Ici, chaque entrée de la carte est DÉRIVÉE du catalogue chargé par `loadCatalog` et du
 * graphe validé par `validateGraph`. La carte ne peut plus montrer que ce qui existe.
 *
 * Le bloc est posé dans le HTML entre deux marqueurs gérés (même patron que
 * `composes-graph.ts` pour skills/README.md) ; un test d'invariant compare le bloc sur
 * disque au bloc régénéré — carte périmée ⇒ CI rouge.
 */
import type { Catalog } from '../loaders/catalog.js';
import { validateGraph } from './graph.js';

export const MAP_DATA_BEGIN = '/*ezk-map-data:begin*/';
export const MAP_DATA_END = '/*ezk-map-data:end*/';

/**
 * Les QUATRE BANDES officielles — recopiées d'ADR-0020 (amendement 2026-08-20, §1).
 * La bande « Rôles » = les agents (pas listée ici : ce sont tous les agents du catalogue).
 * Un skill absent de cette table n'a JAMAIS reçu de bande par ADR : la carte le range
 * dans « hors bande » au lieu de décider à sa place — le bruit doit se voir, pas se lisser.
 */
export const BANDES: Record<'ceremonies' | 'artefacts' | 'outillage', readonly string[]> = {
  ceremonies: ['ezk-product-builder', 'ezk-sprint', 'ezk-pr', 'ezk-retro'],
  artefacts: ['ezk-backlog', 'ezk-commits', 'ezk-archive', 'ezk-start'],
  outillage: [
    'ezk-ci',
    'ezk-docker',
    'ezk-npm-scripts',
    'ezk-device',
    'ezk-apk',
    'ezk-preview',
    'ezk-diagram',
    'ezk-readme',
    'ezk-article',
    'ezk-design-system',
  ],
};

export type Bande = keyof typeof BANDES | 'hors-bande';

export interface MapSkill {
  id: string;
  description: string;
  usage: string; // `argument-hint:` du frontmatter — les sous-commandes, verbatim
  bande: Bande;
  composes: string[]; // skills internes que je compose
  composesExternal: string[]; // refs hors catalogue (documentées, jamais warnées — ADR-0025)
  roles: string[]; // agents que je convoque
  composedBy: string[]; // ← skills qui me composent
  profiles: string[]; // ⊃ profils qui m'embarquent
}

export interface MapAgent {
  id: string;
  description: string;
  model: string;
  effort: string;
  competences: string[]; // skills
  interactions: string[]; // rules
  convokedBy: string[]; // ← skills dont roles: me cite
  profiles: string[];
}

export interface MapRule {
  id: string;
  title: string;
  kind: string;
  level: string;
  enforcements: string[]; // types ('prompt' | 'agent-check' | 'hook'), dédupliqués
  bundles: string[]; // ← bundles qui me contiennent
  agents: string[]; // ← agents dont interactions: me cite
}

export interface MapBundle {
  id: string;
  extends: string[];
  rules: string[];
  profiles: string[]; // ← profils qui me citent
}

export interface MapProfile {
  id: string;
  extends: string[];
  bundles: string[];
  agents: string[];
  skills: string[];
  interactions: string[];
}

export interface MapData {
  counts: { rules: number; agents: number; skills: number; bundles: number; profiles: number };
  liens: { total: number; casses: number };
  orphans: { kind: string; id: string }[];
  bandes: Record<Bande, string[]>;
  skills: Record<string, MapSkill>;
  agents: Record<string, MapAgent>;
  rules: Record<string, MapRule>;
  bundles: Record<string, MapBundle>;
  profiles: Record<string, MapProfile>;
}

const sorted = (xs: Iterable<string>): string[] => [...xs].sort();

/** Compile les données de la carte. Tout est trié → sortie stable (F4). */
export function buildMapData(catalog: Catalog): MapData {
  const report = validateGraph(catalog);

  // Index inverses — calculés une fois, jamais devinés par la carte.
  const composedBy = new Map<string, Set<string>>();
  const convokedBy = new Map<string, Set<string>>();
  const skillProfiles = new Map<string, Set<string>>();
  const agentProfiles = new Map<string, Set<string>>();
  const ruleBundles = new Map<string, Set<string>>();
  const ruleAgents = new Map<string, Set<string>>();
  const bundleProfiles = new Map<string, Set<string>>();
  const add = (m: Map<string, Set<string>>, key: string, value: string): void => {
    const set = m.get(key) ?? new Set();
    set.add(value);
    m.set(key, set);
  };

  for (const s of catalog.skills.values()) {
    for (const to of s.composes ?? []) add(composedBy, to, s.id);
    for (const to of s.roles ?? []) add(convokedBy, to, s.id);
  }
  for (const a of catalog.agents.values()) {
    for (const r of a.interactions) add(ruleAgents, r, a.id);
  }
  for (const b of catalog.bundles.values()) {
    for (const r of b.rules) add(ruleBundles, r, b.id);
  }
  for (const p of catalog.profiles.values()) {
    for (const s of p.skills) add(skillProfiles, s, p.id);
    for (const a of p.agents) add(agentProfiles, a, p.id);
    for (const b of p.bundles) add(bundleProfiles, b, p.id);
  }

  const bandeOf = (skillId: string): Bande => {
    for (const bande of ['ceremonies', 'artefacts', 'outillage'] as const) {
      if (BANDES[bande].includes(skillId)) return bande;
    }
    return 'hors-bande';
  };

  const skills: Record<string, MapSkill> = {};
  for (const id of sorted(catalog.skills.keys())) {
    const s = catalog.skills.get(id);
    if (!s) continue;
    skills[id] = {
      id,
      description: s.description ?? '',
      usage: s.argumentHint ?? '',
      bande: bandeOf(id),
      composes: sorted(s.composes ?? []),
      composesExternal: sorted(s.composesExternal ?? []),
      roles: sorted(s.roles ?? []),
      composedBy: sorted(composedBy.get(id) ?? []),
      profiles: sorted(skillProfiles.get(id) ?? []),
    };
  }

  const agents: Record<string, MapAgent> = {};
  for (const id of sorted(catalog.agents.keys())) {
    const a = catalog.agents.get(id);
    if (!a) continue;
    agents[id] = {
      id,
      description: a.description ?? '',
      model: a.model ?? '',
      effort: a.effort ?? '',
      competences: sorted(a.competences),
      interactions: sorted(a.interactions),
      convokedBy: sorted(convokedBy.get(id) ?? []),
      profiles: sorted(agentProfiles.get(id) ?? []),
    };
  }

  const rules: Record<string, MapRule> = {};
  for (const id of sorted(catalog.rules.keys())) {
    const r = catalog.rules.get(id);
    if (!r) continue;
    rules[id] = {
      id,
      title: r.title ?? '',
      kind: r.kind,
      level: r.level ?? '',
      enforcements: sorted(new Set((r.enforcements ?? []).map((e) => e.type))),
      bundles: sorted(ruleBundles.get(id) ?? []),
      agents: sorted(ruleAgents.get(id) ?? []),
    };
  }

  const bundles: Record<string, MapBundle> = {};
  for (const id of sorted(catalog.bundles.keys())) {
    const b = catalog.bundles.get(id);
    if (!b) continue;
    bundles[id] = {
      id,
      extends: sorted(b.extends ?? []),
      rules: sorted(b.rules),
      profiles: sorted(bundleProfiles.get(id) ?? []),
    };
  }

  const profiles: Record<string, MapProfile> = {};
  for (const id of sorted(catalog.profiles.keys())) {
    const p = catalog.profiles.get(id);
    if (!p) continue;
    profiles[id] = {
      id,
      extends: sorted(p.extends ?? []),
      bundles: sorted(p.bundles),
      agents: sorted(p.agents),
      skills: sorted(p.skills),
      interactions: sorted(p.interactions ?? []),
    };
  }

  const bandes: Record<Bande, string[]> = {
    ceremonies: [],
    artefacts: [],
    outillage: [],
    'hors-bande': [],
  };
  for (const id of Object.keys(skills)) bandes[skills[id].bande].push(id);

  return {
    counts: {
      rules: catalog.rules.size,
      agents: catalog.agents.size,
      skills: catalog.skills.size,
      bundles: catalog.bundles.size,
      profiles: catalog.profiles.size,
    },
    liens: { total: report.edgeCount, casses: report.broken.length },
    orphans: report.orphans.map(({ kind, id }) => ({ kind, id })),
    bandes,
    skills,
    agents,
    rules,
    bundles,
    profiles,
  };
}

/** Le bloc géré complet (marqueurs + affectation JS), prêt à poser dans le HTML de la carte. */
export function buildMapDataBlock(catalog: Catalog): string {
  // `<` échappé en < : une description contenant `</script>` ne peut pas fermer la balise.
  const json = JSON.stringify(buildMapData(catalog), null, 1).replace(/</g, '\\u003c');
  return `${MAP_DATA_BEGIN}\nwindow.EZK = ${json};\n${MAP_DATA_END}`;
}

/**
 * Pose `block` dans `text` entre les marqueurs. Les marqueurs DOIVENT déjà exister dans le
 * HTML (posés une fois par l'auteur de la carte) : contrairement au README, on n'appende
 * jamais une section en fin de page HTML. Absents ⇒ erreur franche.
 */
export function upsertMapDataBlock(text: string, block: string): string {
  const beginIdx = text.indexOf(MAP_DATA_BEGIN);
  const endIdx = text.indexOf(MAP_DATA_END);
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) {
    throw new Error(
      `marqueurs ${MAP_DATA_BEGIN} … ${MAP_DATA_END} introuvables dans la carte — le HTML doit les porter`,
    );
  }
  return text.slice(0, beginIdx) + block + text.slice(endIdx + MAP_DATA_END.length);
}
