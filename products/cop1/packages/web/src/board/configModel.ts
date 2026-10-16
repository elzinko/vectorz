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
 */
export interface ProjectConfig {
  groomPolicy: string;
  sprintSize: string;
  retro: string;
  releaseGate: boolean;
  github: string;
  root: string;
  /** Le tier choisi par rôle ; un rôle absent prend le défaut de l'outil. */
  roles: Partial<Record<Role, Tier>>;
}

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
