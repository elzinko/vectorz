/**
 * Board unifié cop1 — config des modèles : deux portées + résolveur pur
 * (fiche 20261013132218242, côté board ; ADR-074).
 *
 * Deux portées :
 *  - le PROJET (`.vectorz/config.yml`) fixe un *tier* abstrait par rôle ;
 *  - l'OUTIL (le poste, par IDE) fixe le *mapping* tier → modèle concret + effort.
 * Une fonction pure calcule « projet + rôle + outil → modèle + effort ». Sans
 * réglage, rien ne change. Une valeur inconnue est REFUSÉE (jamais remplacée en
 * silence). Le mapping vit côté outil car un modèle écrit dans le projet casserait
 * dans un autre IDE.
 */

/** Les trois tiers abstraits (performant / standard / économe). */
export const TIERS = ['high', 'middle', 'low'] as const;
export type Tier = (typeof TIERS)[number];

/** Les rôles de l'équipe, dans l'ordre d'affichage. */
export const ROLE_ORDER = ['ezk-architect', 'ezk-dev', 'ezk-reviewer', 'ezk-qa'] as const;
export type Role = (typeof ROLE_ORDER)[number];

export const EFFORTS = ['high', 'medium', 'low', '—'] as const;
export type Effort = (typeof EFFORTS)[number];

/** Le mapping d'un IDE : tier → modèle concret + effort, et le catalogue. */
export interface IdeMapping {
  models: Record<Tier, string>;
  effort: Record<Tier, Effort>;
  catalog: string[];
}

/** Le mapping tier → modèle, par IDE (portée OUTIL, par défaut de la méthode). */
export const DEFAULT_IDE_MAP: Record<string, IdeMapping> = {
  'Claude Code': {
    models: { high: 'Opus 4.8', middle: 'Sonnet 5.5', low: 'Haiku 5.5' },
    effort: { high: 'high', middle: 'medium', low: 'low' },
    catalog: ['Opus 4.8', 'Sonnet 5.5', 'Haiku 5.5'],
  },
  Cursor: {
    models: { high: 'GPT-5', middle: 'Grok 4', low: 'Cursor Small' },
    effort: { high: '—', middle: '—', low: '—' },
    catalog: ['GPT-5', 'Grok 4', 'Sonnet 5.5', 'Cursor Small'],
  },
  'Codex CLI': {
    models: { high: 'GPT-5 Pro', middle: 'GPT-5', low: 'GPT-5 mini' },
    effort: { high: 'high', middle: 'medium', low: 'low' },
    catalog: ['GPT-5 Pro', 'GPT-5', 'GPT-5 mini'],
  },
};

/**
 * La config d'un projet (portée PROJET, `.vectorz/config.yml`, voyage avec le
 * repo). Elle ne porte PAS le mapping tier → modèle (celui-ci vit côté outil).
 * Pour un projet surveillé, elle vient de la méthode (`ezk config show --json`,
 * ADR-086) ; les réglages de lancement n'y existent pas encore, ils restent absents.
 */
export interface ProjectConfig {
  releaseGate: boolean;
  github: string;
  /** Sans PR : comment une story arrive sur main (`local-squash`, `push-ff`). */
  integration?: string;
  root: string;
  /**
   * Le fichier lu, relatif à la racine ; `null` = le projet n'en a pas, la méthode
   * applique ses défauts. Absent = config d'exemple (assistant d'ajout).
   */
  file?: string | null;
  /** Le tier choisi par rôle (config d'exemple) ; un rôle absent prend le défaut de l'outil. */
  roles?: Partial<Record<Role, Tier>>;
  /**
   * Projet surveillé : chaque agent tel que la méthode le résout. Présent = le modèle
   * affiché est celui qu'elle lance, pas celui du mapping de l'outil.
   */
  agents?: AgentModel[];
  /** Le menu de `groom` pré-réglé par la config (contrat `config-show`). Absent = non publié. */
  groomingTechniques?: GroomingTechniques;
  /** La revue adverse d'un sprint : `run` (le plancher) ou `skip` (mode POC). Absent = non publié. */
  adverseReview?: 'run' | 'skip';
}

/** Le grooming tel que la méthode le publie : rien de posé, tout, rien, une sélection, ou l'erreur. */
export type GroomingTechniques =
  | { mode: 'menu' }
  | { mode: 'all' | 'none' | 'selection'; ids: string[] }
  | { mode: 'error'; error: string };

/** Un agent résolu par la méthode (tier, modèle, effort, d'où vient la valeur) ou mal configuré. */
export type AgentModel =
  | { agent: string; tier: string; model: string; effort: string; source: string }
  | { agent: string; error: string };

/**
 * La config de l'outil (portée POSTE) : IDE actif, tier par défaut, et le mapping
 * éditable. L'effort n'a pas de défaut au niveau outil : il vient toujours du
 * mapping du tier (chaque tier porte son effort), donc un « effort par défaut »
 * serait inerte.
 */
export interface ToolConfig {
  ide: string;
  defaultTier: Tier;
  map: Record<string, IdeMapping>;
}

export function defaultToolConfig(): ToolConfig {
  return {
    ide: 'Claude Code',
    defaultTier: 'middle',
    // Copie profonde pour que l'édition de l'outil ne touche pas la constante.
    map: structuredClone(DEFAULT_IDE_MAP),
  };
}

function isTier(v: string): v is Tier {
  return (TIERS as readonly string[]).includes(v);
}

/** Le résultat d'une résolution : le modèle concret et l'effort. */
export interface Resolved {
  tier: Tier;
  model: string;
  effort: Effort;
}

/**
 * Résout « outil + tier → modèle + effort ». Pure. REFUSE un IDE ou un tier
 * inconnu avec un message qui nomme la clé et la valeur (jamais de remplacement
 * silencieux).
 */
export function resolveTier(tool: ToolConfig, tier: string): Resolved {
  const mapping = tool.map[tool.ide];
  if (!mapping) {
    throw new Error(`IDE inconnu : « ${tool.ide} » n'a pas de mapping.`);
  }
  if (!isTier(tier)) {
    throw new Error(`Tier inconnu : « ${tier} » (attendus : ${TIERS.join(', ')}).`);
  }
  return { tier, model: mapping.models[tier], effort: mapping.effort[tier] };
}

/**
 * Résout « projet + rôle + outil → modèle + effort ». Ordre de priorité :
 * tier du rôle dans le projet → défaut de l'outil. (Le repli par agent direct et
 * les défauts de la méthode sont portés par le moteur mega-city, fiche sœur.)
 */
export function resolveRole(
  projectRoles: Partial<Record<Role, Tier>>,
  role: Role,
  tool: ToolConfig,
): Resolved {
  const tier = projectRoles[role] ?? tool.defaultTier;
  return resolveTier(tool, tier);
}

/** Les niveaux en mots : un tier abstrait se dit performant, standard ou économe. */
const TIER_LABEL: Record<Tier, string> = { high: 'performant', middle: 'standard', low: 'économe' };
const EFFORT_LABEL: Record<string, string> = { high: 'élevé', medium: 'moyen', low: 'faible' };

export function tierLabel(tier: Tier): string {
  return TIER_LABEL[tier];
}

/** L'effort en français ; une valeur que la page ne connaît pas s'affiche telle quelle. */
export function effortLabel(effort: string): string {
  return EFFORT_LABEL[effort] ?? effort;
}

/**
 * Le dossier du PROJET : un worktree (`<projet>/.claude/worktrees/<nom>`) est ramené à l'arbre
 * principal. Le contrat ne publie que la racine d'exécution ; celle-ci peut être un worktree.
 */
export function projectFolder(root: string): string {
  const cut = root.indexOf('/.claude/worktrees/');
  return cut === -1 ? root : root.slice(0, cut);
}
