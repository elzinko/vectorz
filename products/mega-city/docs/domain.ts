/**
 * mega-city — modèle de domaine (schema-as-code, à triturer en DDD)
 *
 * « mega-city » (Mega-City One, univers Judge Dredd) = le monde où la loi règne.
 *   les Juges (Agents) appliquent la loi (Rules) pour des projets — « I AM THE LAW ».
 *   iamthelaw = la LOI ; the Judges (agents/skills) = l'ÉQUIPE ; le Profile = le dossier qui lie tout.
 *
 * ─────────────────────────────────────────────────────────────────
 * RÈGLE D'OR (leçon lifefindsaway) :
 *   CŒUR DÉTERMINISTE (scripts sur des listes + git) = ce qui DOIT toujours marcher.
 *   LLM aux BORDS seulement (rédige / juge)          = assistant, JAMAIS load-bearing.
 *   lifefindsaway a échoué en mettant le LLM dans le cœur (transitions d'état). Ici, jamais.
 * ─────────────────────────────────────────────────────────────────
 *
 * FORMAT : la prose → markdown+frontmatter (Rule, Agent, Skill) ;
 *          la composition pure → YAML (Bundle, Profile).
 */

// ADR-0003 : le moteur `bind` est pur et retourne un plan d'écriture.
import type { WritePlan } from '../src/domain/plan.js';
// Fiche 0117 : `expandProfile` reçoit le catalogue chargé (dépendance explicite, pas d'état caché).
import type { Catalog } from '../src/loaders/catalog.js';

// ════════════════════════════════════════════════════════════════
// CATALOGUE 1 — LA LOI (règles)            [ iamthelaw ]
// ════════════════════════════════════════════════════════════════

export type Level = 'MUST' | 'SHOULD' | 'MAY';
export type EnforcementType = 'prompt' | 'agent-check' | 'hook'; // niveau 0 / 1 / 2

/** Comment une règle est garantie. */
export interface Enforcement {
  type: EnforcementType;
  agent?: string; // agent-check → id d'un Agent. SEUL lien inter-catalogue.
  hook?: { stage: string; script: string }; // hook → script déterministe (git hook), bloquant.
  // `script` en frontmatter = CHEMIN (ex. 'hooks/commit-msg.sh') ; le loader (catalog.ts,
  // fiche 0011) le résout en CONTENU avant que le catalogue n'atteigne bind/cap (purs).
}

/** disposition = contrainte sur un artefact ; interaction = protocole de collaboration entre agents (cf. ADR-0002). */
export type RuleKind = 'disposition' | 'interaction';

/** Unité minimale et composable de « comment travailler ». Fichier MARKDOWN + frontmatter. */
export interface Rule {
  id: string; // 'clean-code/no-dead-code'
  kind: RuleKind; // 'disposition' (défaut) | 'interaction' ; le tag = la couture de promotion (ADR-0002)
  level: Level;
  title?: string; // OPTIONNEL — libellé humain du frontmatter (la carte l'affiche ; l'id reste la clé)
  content: string; // la disposition (corps markdown — ce que le LLM lit)
  enforcements?: Enforcement[];
  participants?: string[]; // OPTIONNEL — ids d'Agents, seulement pour kind='interaction'. Latent (ADR-0002).
}

/** Groupe nommé et composable de règles. Fichier YAML (zéro prose → surtout pas du markdown). */
export interface Bundle {
  id: string; // 'base', 'clean-code', 'mobile'
  extends?: string[]; // ids d'autres Bundles → composition
  rules: string[]; // ids de Rules
}

// ════════════════════════════════════════════════════════════════
// CATALOGUE 2 — L'ÉQUIPE (agents + skills)  [ claude-skills ]
// ════════════════════════════════════════════════════════════════

/**
 * Un fichier AUXILIAIRE du dossier d'un skill (hors `SKILL.md`) — ex. `approaches/x.md`,
 * `scripts/y.sh`, `references/`, `templates/`. ADR-0027 : porté par le domaine pour que la
 * matérialisation copy-mode soit ÉQUIVALENTE au symlink-mode (qui expose le dossier entier).
 */
export interface SkillAsset {
  path: string; // RELATIF au dossier du skill, séparateurs POSIX ('approaches/x.md')
  content: string; // contenu VERBATIM (utf8) — non normalisé (fidélité byte des scripts)
  executable?: boolean; // bit d'exécution de la source → mode 0o755 à la matérialisation
}

/**
 * Une slash-command Claude Code (`/ezk-help`) — le 3ᵉ canal de lawgiver, avec les skills et les agents
 * (fiche 20260816151112162). Un fichier MARKDOWN `commands/<id>.md`, déployé tel quel dans
 * `~/.claude/commands/`. Pas de logique ici : la commande est une façade (souvent d'un CLI).
 */
export interface Command {
  id: string; // 'ezk-help' = le nom du fichier sans `.md` : ce qu'on tape après le `/`
  description?: string; // OPTIONNEL — la ligne `description:` du frontmatter (ce que l'aide de Claude Code affiche)
  /** Le fichier ENTIER, frontmatter compris (Claude Code lit `description`, `argument-hint`, `allowed-tools`), `\n` final. */
  content: string;
}

/** Une capacité / un playbook. Fichier MARKDOWN (corps = mode opératoire). Host-agnostique. */
export interface Skill {
  id: string; // 'ezk-commits'
  description?: string; // OPTIONNEL — le déclencheur humain du frontmatter (affiché par la carte / ezk-help)
  argumentHint?: string; // OPTIONNEL — `argument-hint:` du frontmatter : les sous-commandes ('[help|add|…]')
  content: string; // le playbook (markdown)
  /** ADR-0025 — ids de skills INTERNES requis (doivent être présents à la résolution du profil). */
  composes?: string[];
  /** ADR-0025 — refs EXTERNES (`skill-creator`, `product-brainstorming`…) : documentées, jamais warnées. */
  composesExternal?: string[];
  /**
   * ADR-0020 (amendement 2026-08-20) — ids d'AGENTS que cet orchestrateur convoque.
   * `composes` dit « quelles briques j'utilise » ; `roles` dit « quels rôles je fais venir ».
   * C'était la relation centrale du scrum (le sprint convoque l'équipe) et la seule qu'aucun
   * champ ne portait : elle ne vivait qu'en prose.
   */
  roles?: string[];
  /**
   * Fiche 357 (ADR-0040) — ids de RÈGLES que ce skill applique. Le trou que `composes` et `roles`
   * laissaient : « le skill X suit la règle Y » ne vivait qu'en prose, sous forme de lien
   * markdown par chemin (fragile). Déclaré par id, il entre dans le graphe compilé (verbe
   * « applique ») et un id inconnu fait échouer la compilation.
   */
  applies?: string[];
  /** ADR-0027 — fichiers auxiliaires du dossier (hors `SKILL.md`). Absent ⇒ dossier sans asset. */
  assets?: SkillAsset[];
}

/** Un rôle. Fichier MARKDOWN (rôle) + frontmatter (les listes ci-dessous = DATA composable). */
export interface Agent {
  id: string; // 'ezk-reviewer'
  description?: string; // OPTIONNEL — le déclencheur humain du frontmatter (affiché par la carte)
  role: string; // la prose du rôle (markdown — ce que le LLM lit)
  competences: string[]; // ids de Skills  — AJOUTABLES en cours de projet (via capture)
  interactions: string[]; // ids de Rules   — « comment je collabore » (AJOUTABLES via capture)
  // Réglages d'exécution (host natif). Alias OU id versionné (pin).
  // Préférer le pin pour Opus : `claude-opus-4-8` — l'alias `opus` peut dériver vers Opus 5.
  model?: string; // 'claude-opus-4-8' | 'sonnet' | 'haiku' | 'fable' | 'inherit' | …
  /** Secours si l'hôte refuse `model` — lu par le skill appelant (ex. ezk-archive). */
  model_spare?: string; // même vocabulaire que `model` (souvent 'sonnet')
  effort?: string; // 'low' | 'medium' | 'high' | 'xhigh' | 'max'
  isolation?: string; // 'worktree' — exécute l'agent dans un git worktree isolé
}

// ════════════════════════════════════════════════════════════════
// KEYSTONE — LE PROFILE (aggregate root : compose les 2 catalogues)
// ════════════════════════════════════════════════════════════════

/** « Comment ce (sous-)projet travaille ». Fichier YAML. Chargé d'un coup au démarrage de session. */
export interface Profile {
  id: string; // 'mobile', 'webapp', 'website'
  extends?: string[]; // composer d'autres Profiles
  bundles: string[]; // → règles
  agents: string[]; // → l'équipe
  skills: string[]; // → compétences directes du projet
  /** → slash-commands (`commands/<id>.md`), posées dans `~/.claude/commands/` par `bind-global` (fiche 20260816151112162). */
  commands?: string[];
  interactions?: string[]; // → règles d'interaction entre agents
}

// ════════════════════════════════════════════════════════════════
// HÔTES — comment un profil atterrit dans « n'importe quel LLM »
// ════════════════════════════════════════════════════════════════

export type HostId = 'claude-code' | 'claude-desktop' | 'cursor' | 'cop1' | string;

/**
 * Adaptateur par hôte (dossier caps/<host>/). Les CATALOGUES sont host-agnostiques
 * (markdown + yaml) ; le Cap sait les MATÉRIALISER dans la forme native de l'hôte :
 *   - claude-code    → <projet>/.claude/{agents,skills}/ + CLAUDE.md + .git/hooks
 *   - claude-desktop → dossiers de skills importables
 *   - cursor / cop1  → leur format natif
 * C'est ça, « utilisable par n'importe quel LLM » : un Cap de plus, pas un corpus réécrit.
 *
 * ADR-0003 : `materialize` retourne un WritePlan PUR (ne touche pas le disque).
 * Une coquille I/O unique (src/io/apply.ts) applique le plan.
 */
export interface Cap {
  host: HostId;
  materialize(resolved: ResolvedProfile, projectDir: string): WritePlan; // DÉTERMINISTE, PUR
}

// ════════════════════════════════════════════════════════════════
// OPÉRATIONS — cœur déterministe (scripts)  vs  bords (LLM)
// ════════════════════════════════════════════════════════════════

/** Profil composé : extends résolus, dédupliqués. */
export interface ResolvedProfile {
  rules: Rule[];
  agents: Agent[];
  skills: Skill[];
  /** Absent quand le profil n'en déclare aucune : les profils sans commande se résolvent comme avant. */
  commands?: Command[];
}

/**
 * DÉTERMINISTE — pure data : résout extends + déduplique. Aucune IA, aucun I/O.
 * Signature RÉELLE de `src/core/expand.ts` (fiche 0117) : le catalogue est un argument
 * explicite. Dans les ADR, ce geste s'appelle « expand » ; la fonction exportée, `expandProfile`.
 */
export declare function expandProfile(profile: Profile, catalog: Catalog): ResolvedProfile;

/**
 * DÉTERMINISTE — calcule le PLAN d'écriture du projet via le Cap de l'hôte.
 * « Charger d'un coup ». ADR-0003 : retourne un WritePlan, n'écrit RIEN (l'application
 * disque est faite par la coquille I/O, src/io/apply.ts).
 * Signature RÉELLE de `src/core/bind.ts` (fiche 0117) : le profil est désigné par son `id`,
 * et `rootDir` est la racine du catalogue que `bind` LIT (lecture seule, via `loadCatalog`).
 */
export declare function bind(
  profileId: string,
  projectDir: string,
  host: HostId,
  rootDir: string,
): WritePlan;

/** Une ligne du journal append-only = la mémoire du flywheel. */
export interface LearningEntry {
  date: string; // passé en paramètre (pas de Date.now côté script reproductible)
  target: string; // l'id touché (agent / bundle / profile)
  kind: 'rule' | 'skill' | 'agent' | 'interaction';
  summary: string;
  commit?: string;
}

/**
 * capture — UN seul mécanisme, QUATRE cibles (rule | skill | agent | interaction).
 *   BORDS (LLM)   : author() rédige le markdown · judge() donne un avis (cohérence/doublon)
 *   CŒUR (script) : append dans la liste cible + journal + git commit   ← DÉTERMINISTE
 * Le LLM ne RANGE jamais (ce qui a tué lifefindsaway). Il rédige et conseille ; le moteur range.
 */
export interface CapturePorts {
  author(brief: string): Promise<string>; // BORD LLM — génère le markdown
  judge(candidate: string, corpus: Rule[]): Promise<{ ok: boolean; notes: string }>; // BORD LLM — avis, ne bloque pas
}
export declare function capture(
  target: string,
  kind: LearningEntry['kind'],
  ports: CapturePorts,
): Promise<void>; // l'append (liste + journal) et le commit sont faits par le CŒUR, pas par le LLM
