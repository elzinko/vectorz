/**
 * lawfirm — modèle de domaine (schema-as-code, à triturer en DDD)
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

// ════════════════════════════════════════════════════════════════
// CATALOGUE 1 — LA LOI (règles)            [ iamthelaw ]
// ════════════════════════════════════════════════════════════════

export type Level = 'MUST' | 'SHOULD' | 'MAY';
export type EnforcementType = 'prompt' | 'agent-check' | 'hook'; // niveau 0 / 1 / 2

/** Comment une règle est garantie. */
export interface Enforcement {
  type: EnforcementType;
  agent?: string;                            // agent-check → id d'un Agent. SEUL lien inter-catalogue.
  hook?: { stage: string; script: string };  // hook → script déterministe (git hook), bloquant
}

/** Unité minimale et composable de « comment travailler ». Fichier MARKDOWN + frontmatter. */
export interface Rule {
  id: string;             // 'clean-code/no-dead-code'
  level: Level;
  content: string;        // la disposition (corps markdown — ce que le LLM lit)
  enforcements?: Enforcement[];
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
 */
export interface Cap {
  host: HostId;
  materialize(resolved: ResolvedProfile, projectDir: string): void; // DÉTERMINISTE
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

/** DÉTERMINISTE — écrit dans le projet via le Cap de l'hôte. « Charger d'un coup ». */
export declare function bind(profile: Profile, projectDir: string, host: HostId): void;

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
