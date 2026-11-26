/**
 * Le modèle de la liste Fiches (fiche 20261126170000103) : pour chaque fiche, son étape, son objectif et
 * ses drapeaux, lus dans ce que la méthode publie. Rien n'est inventé : sans objectif publié, la fiche est « libre ».
 */
import type { BoardProject, FicheDetail, FicheStatus, ProcessStageId } from './types.js';

export type FilterKey = 'etape' | 'drapeau' | 'objectif' | 'version' | 'priorite';
export type Filters = Record<FilterKey, string[]>;

export const EMPTY_FILTERS: Filters = { etape: [], drapeau: [], objectif: [], version: [], priorite: [] };

export const STAGE_LABEL: Record<ProcessStageId, string> = {
  idee: 'idée',
  prete: 'prête',
  'en-sprint': 'en sprint',
  'en-revue': 'en revue',
  livree: 'livrée',
};
const STAGES = Object.keys(STAGE_LABEL) as ProcessStageId[];

const STAGE_OF_STATUS: Record<FicheStatus, ProcessStageId> = {
  idea: 'idee',
  ready: 'prete',
  wip: 'en-sprint',
  done: 'livree',
  parked: 'idee',
};

const NO_OBJECTIF = 'sans objectif';
const NO_VERSION = 'sans version';
const FLAGS = ['bloquée', 'parkée', 'libre'];

export interface ListRow {
  fiche: FicheDetail;
  stage: ProcessStageId;
  /** Le nom de l'objectif (ou son slug si le nom n'est pas publié) ; `null` = fiche libre. */
  objectif: string | null;
  flags: string[];
}

const PRIO_N: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

/** Les fiches du projet, chacune avec son étape (process publié, sinon son statut), son objectif et ses drapeaux. */
export function buildRows(project: BoardProject): ListRow[] {
  const stageById = new Map<string, ProcessStageId>();
  for (const s of project.process?.stages ?? []) for (const f of s.fiches) stageById.set(f.id, s.stage);
  const objById = new Map<string, string>();
  for (const o of project.objectifs ?? []) for (const id of [...o.aFaire, ...o.livrees]) objById.set(id, o.slug);
  return Object.values(project.fiches ?? {})
    .map((fiche) => {
      const objectif = objById.get(fiche.id) ?? null;
      const flags: string[] = [];
      if (fiche.blocked) flags.push('bloquée');
      if (fiche.status === 'parked') flags.push('parkée');
      if (!objectif) flags.push('libre');
      return { fiche, stage: stageById.get(fiche.id) ?? STAGE_OF_STATUS[fiche.status], objectif, flags };
    })
    .sort((a, b) => STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage) || (PRIO_N[a.fiche.prio] ?? 9) - (PRIO_N[b.fiche.prio] ?? 9) || a.fiche.title.localeCompare(b.fiche.title));
}

export interface ListCriteria {
  /** Les recherches (champ de la page, barre du haut) : une fiche doit les contenir toutes. */
  searches: string[];
  filters: Filters;
  hideParked: boolean;
}

const anyOf = (picked: string[], value: string): boolean => picked.length === 0 || picked.includes(value);

export function applyCriteria(rows: ListRow[], { searches, filters, hideParked }: ListCriteria): ListRow[] {
  const terms = searches.map((s) => s.trim().toLowerCase()).filter(Boolean);
  return rows.filter(({ fiche, stage, objectif, flags }) => {
    if (hideParked && fiche.status === 'parked') return false;
    const haystack = `${fiche.title} ${fiche.id}`.toLowerCase();
    if (!terms.every((t) => haystack.includes(t))) return false;
    return (
      anyOf(filters.etape, STAGE_LABEL[stage]) &&
      (filters.drapeau.length === 0 || filters.drapeau.some((d) => flags.includes(d))) &&
      anyOf(filters.objectif, objectif ?? NO_OBJECTIF) &&
      anyOf(filters.version, fiche.ver || NO_VERSION) &&
      anyOf(filters.priorite, fiche.prio)
    );
  });
}

/** Une idée libre (sans objectif) et non bloquée : la seule à porter « Groomer ». */
export const isGroomable = (r: ListRow): boolean => r.fiche.status === 'idea' && !r.objectif && !r.fiche.blocked;

/** Les valeurs proposées par chaque menu de filtre. */
export function filterOptions(rows: ListRow[]): Record<FilterKey, string[]> {
  const uniq = (xs: string[]): string[] => [...new Set(xs)].sort();
  return {
    etape: STAGES.map((s) => STAGE_LABEL[s]),
    drapeau: FLAGS,
    objectif: uniq(rows.map((r) => r.objectif ?? NO_OBJECTIF)),
    version: uniq(rows.map((r) => r.fiche.ver || NO_VERSION)),
    priorite: uniq(rows.map((r) => r.fiche.prio)),
  };
}
