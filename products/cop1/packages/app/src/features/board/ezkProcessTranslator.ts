/**
 * ezkProcessTranslator — CŒUR PUR (aucune I/O). Traduit `ezk board process --json` (fiche
 * 20261102123552183, ADR-086) vers la forme que la vue « Process » attend. Il TRADUIT : l'étape de
 * chaque fiche vient telle quelle de la méthode, mission control ne place aucune fiche lui-même.
 */
import { EzkContractError } from './ezkPlanTranslator.js';

const SUPPORTED_SCHEMA_VERSION = 1;
const COMMANDE = 'ezk board process --json';
/** Les livrées sont des centaines : la vue montre les plus récentes, et dit combien il y en a en tout. */
export const SHIPPED_SHOWN = 20;

export type ProcessStageId = 'idee' | 'prete' | 'en-sprint' | 'en-revue' | 'livree';
const STAGES: readonly ProcessStageId[] = ['idee', 'prete', 'en-sprint', 'en-revue', 'livree'];

/** Une fiche sur son étape, avec le signal qui l'y place. */
export interface ProcessFicheData {
  id: string;
  title: string;
  priority: string;
  version: string;
  branch: string | null;
  pr: string | null;
  /** Le dossier de la session qui travaille la fiche, ou `null`. */
  session: string | null;
}

export interface ProcessStageData {
  stage: ProcessStageId;
  label: string;
  fiches: ProcessFicheData[];
  /** Le nombre de fiches de l'étape publié par la méthode ; plus grand que `fiches` si la liste est coupée. */
  total: number;
}

export interface ProcessViewData {
  /** GitHub a-t-il été lu ? Faux pour un projet qui l'a coupé. */
  github: boolean;
  /** « En revue » n'a pas pu être calculée (GitHub non lu ou muet). */
  reviewUnknown: boolean;
  stages: ProcessStageData[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fail(what: string): never {
  throw new EzkContractError(`${COMMANDE} : ${what}`);
}

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

function readFiche(value: unknown): ProcessFicheData {
  if (!isRecord(value)) fail('fiche sans objet');
  const { id, title, priority, version, branch, pr, session } = value;
  if (
    typeof id !== 'string' ||
    typeof title !== 'string' ||
    typeof priority !== 'string' ||
    typeof version !== 'string'
  ) {
    fail('fiche sans id, titre, priorité ou version');
  }
  if (!isNullableString(branch) || !isNullableString(pr))
    fail(`fiche ${id} : branche ou PR mal formée`);
  if (session !== null && !(isRecord(session) && typeof session.path === 'string')) {
    fail(`fiche ${id} : session mal formée`);
  }
  return {
    id,
    title,
    priority,
    version,
    branch,
    pr,
    session: session === null ? null : (session as { path: string }).path,
  };
}

/** Traduit la réponse ; lève `EzkContractError` si sa forme n'est pas celle du contrat v1. */
export function translateProcess(json: unknown): ProcessViewData {
  if (!isRecord(json)) fail('réponse sans objet JSON');
  if (json.schema_version !== SUPPORTED_SCHEMA_VERSION) {
    fail(
      `schema_version ${String(json.schema_version)} inconnu (attendu ${SUPPORTED_SCHEMA_VERSION})`,
    );
  }
  if (
    typeof json.github !== 'boolean' ||
    typeof json.reviewIndetermine !== 'boolean' ||
    !Array.isArray(json.stages)
  ) {
    fail('github, reviewIndetermine ou stages manquants');
  }
  const stages = json.stages.map((g): ProcessStageData => {
    if (
      !isRecord(g) ||
      !STAGES.includes(g.stage as ProcessStageId) ||
      typeof g.label !== 'string' ||
      !Array.isArray(g.fiches)
    ) {
      fail('étape mal formée');
    }
    const fiches = g.fiches.map(readFiche);
    const shown = g.stage === 'livree' ? fiches.slice(0, SHIPPED_SHOWN) : fiches;
    return {
      stage: g.stage as ProcessStageId,
      label: g.label,
      fiches: shown,
      total: fiches.length,
    };
  });
  return { github: json.github, reviewUnknown: json.reviewIndetermine, stages };
}
