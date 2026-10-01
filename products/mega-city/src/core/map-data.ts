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
import type { CompiledGraph } from './compiled-graph.js';
import { type MethodDoc, validateMethod } from './ceremonies.js';
import { type CycleStep, type CycleStepDoc, compileCycle } from './cycle.js';
import type { LinkType, NodeKind } from './graph.js';
import { validateGraph } from './graph.js';
import { type Etage, type Famille, type TaxonomieDoc, validateTaxonomie } from './taxonomie.js';

export const MAP_DATA_BEGIN = '/*ezk-map-data:begin*/';
export const MAP_DATA_END = '/*ezk-map-data:end*/';

/**
 * ADR-0039 : la classification vit dans `taxonomie.yml` (les trois étages + les bandes
 * internes à l'étage méthode), validée en COMPLÉTUDE — plus aucune table recopiée ici.
 * `hors-bande` ne peut plus contenir que des skills de l'étage méthode oubliés des
 * bandes : le bruit reste visible s'il apparaît, mais il n'a plus le droit d'exister
 * par construction pour les autres étages.
 */
export type Bande = 'ceremonies' | 'artefacts' | 'hors-bande';

/**
 * Provenance (fiche 20260821163346493) : chaque brique porte, si on la connaît, le chemin du
 * fichier qui la déclare (relatif à la racine du dépôt). `source` ABSENT ⇒ la brique compte
 * « déduite » : la carte ne la présente jamais à égalité avec du prouvé.
 */
export interface MapSkill {
  id: string;
  source?: string;
  description: string;
  usage: string; // `argument-hint:` du frontmatter — les sous-commandes, verbatim
  etage: Etage; // ADR-0039 — méthode | modules | librairie
  famille?: Famille; // pour l'étage modules (hote-llm, github, observabilite, techno, overlay)
  bande?: Bande; // interne à l'étage méthode uniquement
  composes: string[]; // skills internes que je compose
  composesExternal: string[]; // refs hors catalogue (documentées, jamais warnées — ADR-0025)
  roles: string[]; // agents que je convoque
  composedBy: string[]; // ← skills qui me composent
  profiles: string[]; // ⊃ profils qui m'embarquent
}

export interface MapAgent {
  id: string;
  source?: string;
  description: string;
  etage: Etage; // ADR-0039
  famille?: Famille;
  model: string;
  effort: string;
  competences: string[]; // skills
  interactions: string[]; // rules
  convokedBy: string[]; // ← skills dont roles: me cite
  profiles: string[];
}

export interface MapRule {
  id: string;
  source?: string;
  title: string;
  kind: string;
  level: string;
  enforcements: string[]; // types ('prompt' | 'agent-check' | 'hook'), dédupliqués
  bundles: string[]; // ← bundles qui me contiennent
  agents: string[]; // ← agents dont interactions: me cite
}

export interface MapBundle {
  id: string;
  source?: string;
  extends: string[];
  rules: string[];
  profiles: string[]; // ← profils qui me citent
}

export interface MapProfile {
  id: string;
  source?: string;
  extends: string[];
  bundles: string[];
  agents: string[];
  skills: string[];
  interactions: string[];
}

/** Index des sources : `kind:id` → chemin du fichier ; `method` et `taxonomie` → leurs YAML. */
export type SourceIndex = ReadonlyMap<string, string>;

/** Ce que l'appelant (le bord I/O) fournit en plus du catalogue : d'où vient chaque chose, et le cycle écrit à la main. */
export interface MapExtras {
  sources?: SourceIndex;
  cycle?: readonly CycleStepDoc[];
}

/** Les éléments dessinés, rangés par nature. */
export interface ProvenanceCounts {
  briques: number; // règles, juges, commandes, bundles, profils
  liens: number; // arêtes du graphe compilé
  ceremonies: number; // éléments de ceremonies.yml
  cycle: number; // puces du cycle écrit à la main
}

/**
 * Prouvé = déclaré dans un fichier versionné et vérifié à la compilation.
 * Déduit = écrit à la main dans la carte, sans fichier qui l'appuie.
 */
export interface Provenance {
  prouve: ProvenanceCounts;
  deduit: ProvenanceCounts;
}

export interface MapData {
  counts: { rules: number; agents: number; skills: number; bundles: number; profiles: number };
  liens: { total: number; casses: number };
  provenance: Provenance;
  orphans: { kind: string; id: string }[];
  /** La carte totale de la méthode scrum (method/ceremonies.yml), VALIDÉE — lot 1. */
  method?: MethodDoc;
  methodSource?: string; // chemin de ceremonies.yml
  taxonomieSource?: string; // chemin de taxonomie.yml (qui range chaque brique dans son étage)
  /** Le cycle en 5 temps, écrit à la main : chaque puce est classée prouvée / déduite (cycle.ts). */
  cycle: CycleStep[];
  bandes: Record<Bande, string[]>;
  skills: Record<string, MapSkill>;
  agents: Record<string, MapAgent>;
  rules: Record<string, MapRule>;
  bundles: Record<string, MapBundle>;
  profiles: Record<string, MapProfile>;
}

const sorted = (xs: Iterable<string>): string[] => [...xs].sort();

/**
 * Le contrôle mécanique des sources : les entrées dont le fichier n'existe pas.
 * `exists` est fourni par le bord (I/O) — le cœur reste pur.
 */
export function missingSources(
  sources: SourceIndex,
  exists: (path: string) => boolean,
): [string, string][] {
  return [...sources].filter(([, path]) => !exists(path));
}

/**
 * Compile les données de la carte. Tout est trié → sortie stable (F4).
 * `graph` (`compileGraph(catalog)`) est l'UNIQUE source des liens/index de la carte —
 * fiche 357/ADR-0040 : plus de second parcours du catalogue en parallèle du graphe compilé.
 * `method` (ceremonies.yml) et `taxonomie` (taxonomie.yml) sont VALIDÉS ici — une
 * référence fausse ou un catalogue incomplètement rangé fait échouer la compilation.
 * Sans `taxonomie` (tests unitaires ciblés uniquement), repli dégénéré : tout en
 * étage méthode, hors-bande — le bord (regen) passe TOUJOURS le document réel.
 * `extras.sources` dit d'où vient chaque brique ; sans source, elle compte « déduite ».
 * `extras.cycle` est le cycle écrit à la main : compilé ici, ses puces sont classées.
 */
export function buildMapData(
  catalog: Catalog,
  graph: CompiledGraph,
  method?: MethodDoc,
  taxonomie?: TaxonomieDoc,
  extras: MapExtras = {},
): MapData {
  const report = validateGraph(catalog);
  const taxo = taxonomie ? validateTaxonomie(catalog, taxonomie) : undefined;
  const sources: SourceIndex = extras.sources ?? new Map();
  // La source d'une brique, posée seulement si on la connaît (absente ⇒ déduite).
  const sourceOf = (kind: NodeKind, id: string): { source?: string } => {
    const source = sources.get(`${kind}:${id}`);
    return source === undefined ? {} : { source };
  };

  // Liens/index — lus dans les arêtes du graphe compilé, jamais re-devinés par la carte.
  const outTo = (link: LinkType, from: string): string[] =>
    sorted(graph.edges.filter((e) => e.link === link && e.from === from).map((e) => e.to));
  const inFrom = (link: LinkType, to: string): string[] =>
    sorted(graph.edges.filter((e) => e.link === link && e.to === to).map((e) => e.from));

  // Placement d'une brique : depuis la taxonomie validée ; repli dégénéré sinon.
  const placeSkill = (id: string) => taxo?.skills[id] ?? { etage: 'methode' as const };
  const placeAgent = (id: string) => taxo?.agents[id] ?? { etage: 'methode' as const };
  const bandeOf = (skillId: string): Bande | undefined => {
    if (placeSkill(skillId).etage !== 'methode') return undefined; // bande = interne à la méthode
    if (!taxo) return 'hors-bande';
    for (const bande of ['ceremonies', 'artefacts'] as const) {
      if (taxo.bandes[bande].includes(skillId)) return bande;
    }
    return 'hors-bande';
  };

  const skills: Record<string, MapSkill> = {};
  for (const id of sorted(catalog.skills.keys())) {
    const s = catalog.skills.get(id);
    if (!s) continue;
    const place = placeSkill(id);
    const bande = bandeOf(id);
    skills[id] = {
      id,
      ...sourceOf('skill', id),
      description: s.description ?? '',
      usage: s.argumentHint ?? '',
      etage: place.etage,
      ...(place.famille ? { famille: place.famille } : {}),
      ...(bande ? { bande } : {}),
      composes: outTo('composes', id),
      composesExternal: sorted(s.composesExternal ?? []), // hors catalogue (ADR-0025) — hors graphe
      roles: outTo('roles', id),
      composedBy: inFrom('composes', id),
      profiles: inFrom('profile-skill', id),
    };
  }

  const agents: Record<string, MapAgent> = {};
  for (const id of sorted(catalog.agents.keys())) {
    const a = catalog.agents.get(id);
    if (!a) continue;
    const place = placeAgent(id);
    agents[id] = {
      id,
      ...sourceOf('agent', id),
      description: a.description ?? '',
      etage: place.etage,
      ...(place.famille ? { famille: place.famille } : {}),
      model: a.model ?? '',
      effort: a.effort ?? '',
      competences: outTo('competences', id),
      interactions: outTo('interactions', id),
      convokedBy: inFrom('roles', id),
      profiles: inFrom('profile-agent', id),
    };
  }

  const rules: Record<string, MapRule> = {};
  for (const id of sorted(catalog.rules.keys())) {
    const r = catalog.rules.get(id);
    if (!r) continue;
    rules[id] = {
      id,
      ...sourceOf('rule', id),
      title: r.title ?? '',
      kind: r.kind,
      level: r.level ?? '',
      enforcements: sorted(new Set((r.enforcements ?? []).map((e) => e.type))),
      bundles: inFrom('bundle-rule', id),
      agents: inFrom('interactions', id),
    };
  }

  const bundles: Record<string, MapBundle> = {};
  for (const id of sorted(catalog.bundles.keys())) {
    const b = catalog.bundles.get(id);
    if (!b) continue;
    bundles[id] = {
      id,
      ...sourceOf('bundle', id),
      extends: outTo('bundle-extends', id),
      rules: outTo('bundle-rule', id),
      profiles: inFrom('profile-bundle', id),
    };
  }

  const profiles: Record<string, MapProfile> = {};
  for (const id of sorted(catalog.profiles.keys())) {
    const p = catalog.profiles.get(id);
    if (!p) continue;
    profiles[id] = {
      id,
      ...sourceOf('profile', id),
      extends: outTo('profile-extends', id),
      bundles: outTo('profile-bundle', id),
      agents: outTo('profile-agent', id),
      skills: outTo('profile-skill', id),
      interactions: outTo('profile-interaction', id),
    };
  }

  // Bandes internes à l'étage méthode, dans l'ordre du document (= ordre du flux).
  // `hors-bande` = skills méthode oubliés des bandes — doit rester vide par construction.
  const bandes: Record<Bande, string[]> = {
    ceremonies: taxo?.bandes.ceremonies ?? [],
    artefacts: taxo?.bandes.artefacts ?? [],
    'hors-bande': Object.keys(skills).filter((id) => skills[id].bande === 'hors-bande'),
  };

  // Le cycle écrit à la main : validé ici (id inconnu ⇒ jette), ses puces classées.
  const cycle = extras.cycle ? compileCycle(catalog, graph, method, extras.cycle) : [];
  const methodSource = method ? sources.get('method') : undefined;

  // Prouvé / déduit. Une brique est prouvée si on connaît son fichier ; un lien l'est si le
  // fichier de la brique qui le DÉCLARE (`from`) est connu ; une puce du cycle, si un fichier
  // l'appuie (cycle.ts) — les humains n'ont pas de fichier, donc toujours déduits.
  const provenance: Provenance = {
    prouve: { briques: 0, liens: 0, ceremonies: 0, cycle: 0 },
    deduit: { briques: 0, liens: 0, ceremonies: 0, cycle: 0 },
  };
  const tally = (nature: keyof ProvenanceCounts, prouve: boolean, n = 1): void => {
    provenance[prouve ? 'prouve' : 'deduit'][nature] += n;
  };
  for (const n of graph.nodes) tally('briques', sources.has(`${n.kind}:${n.id}`));
  for (const e of graph.edges) tally('liens', sources.has(`${e.fromKind}:${e.from}`));
  tally('ceremonies', methodSource !== undefined, method?.elements.length ?? 0);
  for (const s of cycle) {
    for (const chip of [...s.etape, ...s.acteurs]) tally('cycle', chip.prouve);
    tally('cycle', false, s.humains.length);
  }

  const taxonomieSource = taxonomie ? sources.get('taxonomie') : undefined;
  return {
    counts: {
      rules: catalog.rules.size,
      agents: catalog.agents.size,
      skills: catalog.skills.size,
      bundles: catalog.bundles.size,
      profiles: catalog.profiles.size,
    },
    liens: { total: report.edgeCount, casses: report.broken.length },
    provenance,
    orphans: report.orphans.map(({ kind, id }) => ({ kind, id })),
    // Validée ICI : une référence fausse dans ceremonies.yml fait échouer la compilation.
    ...(method ? { method: validateMethod(catalog, method) } : {}),
    ...(methodSource ? { methodSource } : {}),
    ...(taxonomieSource ? { taxonomieSource } : {}),
    cycle,
    bandes,
    skills,
    agents,
    rules,
    bundles,
    profiles,
  };
}

/** Le bloc géré complet (marqueurs + affectation JS), prêt à poser dans le HTML de la carte. */
export function buildMapDataBlock(
  catalog: Catalog,
  graph: CompiledGraph,
  method?: MethodDoc,
  taxonomie?: TaxonomieDoc,
  extras: MapExtras = {},
): string {
  // `<` échappé en < : une description contenant `</script>` ne peut pas fermer la balise.
  const json = JSON.stringify(
    buildMapData(catalog, graph, method, taxonomie, extras),
    null,
    1,
  ).replace(/</g, '\\u003c');
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
