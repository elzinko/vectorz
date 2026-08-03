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

// ════════════════════════════════════════════════════════════════
// CATALOGUE 1 — LA LOI (règles)            [ iamthelaw ]
// ════════════════════════════════════════════════════════════════

export type Level = 'MUST' | 'SHOULD' | 'MAY';
export type EnforcementType = 'prompt' | 'agent-check' | 'hook'; // niveau 0 / 1 / 2

/** Comment une règle est garantie. */
export interface Enforcement {
  type: EnforcementType;
  agent?: string;                            // agent-check → id d'un Agent. SEUL lien inter-catalogue.
  hook?: { stage: string; script: string };  // hook → script déterministe (git hook), bloquant.
  // `script` en frontmatter = CHEMIN (ex. 'hooks/commit-msg.sh') ; le loader (catalog.ts,
  // fiche 0011) le résout en CONTENU avant que le catalogue n'atteigne bind/cap (purs).
}

/** disposition = contrainte sur un artefact ; interaction = protocole de collaboration entre agents (cf. ADR-0002). */
export type RuleKind = 'disposition' | 'interaction';

/** Unité minimale et composable de « comment travailler ». Fichier MARKDOWN + frontmatter. */
export interface Rule {
  id: string;             // 'clean-code/no-dead-code'
  kind: RuleKind;         // 'disposition' (défaut) | 'interaction' ; le tag = la couture de promotion (ADR-0002)
  level: Level;
  content: string;        // la disposition (corps markdown — ce que le LLM lit)
  enforcements?: Enforcement[];
  participants?: string[];// OPTIONNEL — ids d'Agents, seulement pour kind='interaction'. Latent (ADR-0002).
}

/** Groupe nommé et composable de règles. Fichier YAML (zéro prose → surtout pas du markdown). */
export interface Bundle {
  id: string;             // 'base', 'clean-code', 'mobile'
  extends?: string[];     // ids d'autres Bundles → composition
  rules: string[];        // ids de Rules
}

// ════════════════════════════════════════════════════════════════
// CATALOGUE 2 — L'ÉQUIPE (agents + skills)  [ claude-skills ]
// ════════════════════════════════════════════════════════════════

/** Une capacité / un playbook. Fichier MARKDOWN (corps = mode opératoire). Host-agnostique. */
export interface Skill {
  id: string;             // 'ezk-commits'
  content: string;        // le playbook (markdown)
}

/** Un rôle. Fichier MARKDOWN (rôle) + frontmatter (les listes ci-dessous = DATA composable). */
export interface Agent {
  id: string;             // 'ezk-reviewer'
  role: string;           // la prose du rôle (markdown — ce que le LLM lit)
  competences: string[];  // ids de Skills  — AJOUTABLES en cours de projet (via capture)
  interactions: string[]; // ids de Rules   — « comment je collabore » (AJOUTABLES via capture)
  // Réglages d'exécution (host natif). Alias uniquement, jamais d'id épinglé (fiche 0039).
  model?: string;         // 'opus' | 'sonnet' | 'haiku' | 'fable' | 'inherit' — défaut host = inherit
  /** Secours si l'hôte refuse `model` — lu par le skill appelant (ex. ezk-archive). */
  model_spare?: string;   // même vocabulaire d'alias que `model`
  effort?: string;        // 'low' | 'medium' | 'high' | 'xhigh' | 'max'
  isolation?: string;     // 'worktree' — exécute l'agent dans un git worktree isolé
}

// ════════════════════════════════════════════════════════════════
// KEYSTONE — LE PROFILE (aggregate root : compose les 2 catalogues)
// ════════════════════════════════════════════════════════════════

/** « Comment ce (sous-)projet travaille ». Fichier YAML. Chargé d'un coup au démarrage de session. */
export interface Profile {
  id: string;             // 'mobile', 'webapp', 'website'
  extends?: string[];     // composer d'autres Profiles
  bundles: string[];      // → règles
  agents: string[];       // → l'équipe
  skills: string[];       // → compétences directes du projet
  interactions?: string[];// → règles d'interaction entre agents
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
}

/** DÉTERMINISTE — pure data : résout extends + déduplique. Aucune IA. */
export declare function expand(profile: Profile): ResolvedProfile;

/**
 * DÉTERMINISTE — calcule le PLAN d'écriture du projet via le Cap de l'hôte.
 * « Charger d'un coup ». ADR-0003 : pur, retourne un WritePlan (l'application
 * disque est faite par la coquille I/O, src/io/apply.ts).
 */
export declare function bind(profile: Profile, projectDir: string, host: HostId): WritePlan;

/** Une ligne du journal append-only = la mémoire du flywheel. */
export interface LearningEntry {
  date: string;           // passé en paramètre (pas de Date.now côté script reproductible)
  target: string;         // l'id touché (agent / bundle / profile)
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
  author(brief: string): Promise<string>;                                    // BORD LLM — génère le markdown
  judge(candidate: string, corpus: Rule[]): Promise<{ ok: boolean; notes: string }>; // BORD LLM — avis, ne bloque pas
}
export declare function capture(
  target: string,
  kind: LearningEntry['kind'],
  ports: CapturePorts,
): Promise<void>; // l'append (liste + journal) et le commit sont faits par le CŒUR, pas par le LLM
