/**
 * Cœur pur — config des modèles : schéma à deux portées + résolveur.
 * Fiche 20261013132218242 (ADR-074). AUCUNE I/O ici (ADR-0003) : ce module ne
 * fait que RÉSOUDRE « projet + agent + hôte → modèle + effort ».
 *
 * Deux portées :
 *  - le PROJET (`.vectorz/config.yml`) fixe un *tier* abstrait par rôle (`roles:`),
 *    plus un repli direct par agent (`agents:`) et, en soupape rare, un mapping
 *    tier → modèle propre au projet (`modeles:`) ;
 *  - l'OUTIL (le poste, par IDE) fixe le *mapping* tier → modèle concret + effort.
 *    Il n'est pas résolu ici (il casserait dans un autre IDE) : la part utile arrive
 *    via `modeles`, sinon on prend le défaut de la méthode.
 *
 * Ordre de priorité : réglage de l'agent → tier du projet → mapping de l'outil →
 * défaut de la méthode. Une valeur inconnue est REFUSÉE (jamais remplacée en silence).
 */

export const TIERS = ['high', 'middle', 'low'] as const;
export type Tier = (typeof TIERS)[number];

export const EFFORTS = ['high', 'medium', 'low'] as const;
export type Effort = (typeof EFFORTS)[number];

/** Un modèle concret et son effort. */
export interface ModelEffort {
  model: string;
  effort: Effort;
}

/**
 * Les défauts de la méthode = EXACTEMENT les réglages des fichiers d'agents
 * (`agents/ezk-*.md`). Un test (`model-config.test.ts`) casse si l'un des deux
 * bouge sans l'autre.
 */
export const TIER_DEFAULTS: Record<Tier, ModelEffort> = {
  high: { model: 'claude-opus-4-8', effort: 'high' },
  middle: { model: 'sonnet', effort: 'medium' },
  low: { model: 'sonnet', effort: 'low' },
};

/** Le tier par défaut de chaque rôle (performant / standard / économe). */
export const ROLE_TIER = {
  'ezk-architect': 'high',
  'ezk-pm': 'high',
  'ezk-reviewer': 'high',
  'ezk-dev': 'middle',
  'ezk-qa': 'middle',
  'ezk-archive': 'middle',
  'ezk-steward': 'low',
  'ezk-chef': 'low',
} as const satisfies Record<string, Tier>;

export type Role = keyof typeof ROLE_TIER;
export const ROLES = Object.keys(ROLE_TIER) as Role[];

/** La config des modèles d'un projet (+ la part utile de l'outil). */
export interface ModelConfig {
  /** Portée projet : quel tier chaque rôle emploie (`roles: { ezk-dev: high }`). */
  roles?: Partial<Record<Role, Tier>>;
  /**
   * Mapping tier → modèle et/ou effort : soupape projet (`modeles:`). Partiel, comme
   * `agents:` : une entrée « modèle seul » est permise (le CLI l'écrit ainsi), l'effort
   * manquant retombe alors sur le défaut du tier au moment de résoudre.
   */
  modeles?: Partial<Record<Tier, Partial<ModelEffort>>>;
  /** Repli direct par agent : modèle et/ou effort imposés (`agents:`). */
  agents?: Partial<Record<Role, Partial<ModelEffort>>>;
}

/** D'où vient la valeur résolue. */
export type Source = 'agent' | 'tier-projet' | 'defaut';

export interface Resolved extends ModelEffort {
  tier: Tier;
  source: Source;
}

function isRole(x: string): x is Role {
  return Object.prototype.hasOwnProperty.call(ROLE_TIER, x);
}
function isTier(x: string): x is Tier {
  return (TIERS as readonly string[]).includes(x);
}
function isEffort(x: string): x is Effort {
  return (EFFORTS as readonly string[]).includes(x);
}

/**
 * Résout « config + agent → modèle + effort », avec la source.
 * Lève une erreur nommant la clé et la valeur sur un inconnu.
 */
export function resolveAgent(config: ModelConfig, agent: string): Resolved {
  if (!isRole(agent)) {
    throw new Error(`Agent inconnu : « ${agent} » (connus : ${ROLES.join(', ')}).`);
  }

  const tier = config.roles?.[agent] ?? ROLE_TIER[agent];
  if (!isTier(tier)) {
    throw new Error(`Tier inconnu pour ${agent} : « ${tier} » (attendus : ${TIERS.join(', ')}).`);
  }
  // La soupape projet (`modeles`) peut ne donner QUE le modèle : on hérite alors
  // l'effort du défaut du tier (même repli que la portée `agents`, `?? base`).
  const soupape = config.modeles?.[tier];
  const base: ModelEffort = {
    model: soupape?.model ?? TIER_DEFAULTS[tier].model,
    effort: soupape?.effort ?? TIER_DEFAULTS[tier].effort,
  };
  // Un effort PRÉSENT mais inconnu (saisi à la main dans le YAML) reste refusé.
  if (!isEffort(base.effort)) {
    throw new Error(`Effort inconnu pour le tier ${tier} : « ${base.effort} » (attendus : ${EFFORTS.join(', ')}).`);
  }

  const direct = config.agents?.[agent];
  if (direct !== undefined && typeof direct !== 'object') {
    throw new Error(`Réglage d'agent malformé pour ${agent} : attendu un objet { model?, effort? }.`);
  }
  if (direct && (direct.model !== undefined || direct.effort !== undefined)) {
    if (direct.effort !== undefined && !isEffort(direct.effort)) {
      throw new Error(`Effort inconnu pour ${agent} : « ${direct.effort} » (attendus : ${EFFORTS.join(', ')}).`);
    }
    return {
      model: direct.model ?? base.model,
      effort: direct.effort ?? base.effort,
      tier,
      source: 'agent',
    };
  }

  // Source « tier-projet » si une valeur du projet a joué (tier du rôle OU soupape
  // `modeles` du tier), sinon « défaut de la méthode ».
  const fromProject = config.roles?.[agent] !== undefined || config.modeles?.[tier] !== undefined;
  return {
    model: base.model,
    effort: base.effort,
    tier,
    source: fromProject ? 'tier-projet' : 'defaut',
  };
}
