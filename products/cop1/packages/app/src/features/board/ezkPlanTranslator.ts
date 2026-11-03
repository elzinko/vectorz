/**
 * ezkPlanTranslator — CŒUR PUR (aucune I/O). Traduit les deux JSON publiés par la méthode
 * (`ezk board show --json`, `ezk backlog show --json`, ADR-086) vers la forme que la page du board
 * attend déjà. Il TRADUIT, il ne recalcule rien : les comptes viennent tels quels du contrat.
 */
import type {
  FicheDetailData,
  FicheDetailStatus,
  PlanData,
  PlanFunnel,
  PlanMilestone,
  PlanPilotage,
  PlanSession,
  PlanVersion,
} from './planTypes.js';

const SUPPORTED_SCHEMA_VERSION = 1;

/** La réponse d'`ezk` est illisible ou n'a pas la forme connue du contrat. */
export class EzkContractError extends Error {}

interface BoardLot {
  version: string;
  /** L'état publié par la méthode ; absent d'une méthode plus ancienne. */
  etat?: string;
  etiquette: string | null;
  livrees: string[];
  aFaire: string[];
  pretes: string[];
}

interface BoardShow {
  comptes: {
    idees: number;
    pretes: number;
    enCours: number;
    parkees: number;
    livrees: number;
    sansVersion: number;
  };
  versions: { courante: string | null; lots: BoardLot[] };
  /** Ajouté au contrat v1 (fiche 20261102104443762) : absent d'une méthode plus ancienne. */
  historique?: unknown;
  /** Pouces de revue posés, par id de fiche (ADR-0057) ; lus sans confiance aveugle. */
  verdicts?: unknown;
  /** L'avancement par milestone, lu sans confiance aveugle. */
  milestones?: unknown;
  /** Ajouté au contrat v1 (fiche 20261102123552182) : absent d'une méthode plus ancienne. */
  sessions?: unknown;
}

interface BacklogFiche {
  id: string;
  title: string;
  priority: string;
  status: string;
  version: string;
  blocked: string;
  pr: string;
  enCours: boolean;
  done: boolean;
  enClair: string;
  contexte: string;
  criteres: { texte: string; coche: boolean }[];
  commentVerifier: string;
}

interface BacklogShow {
  fiches: BacklogFiche[];
}

export interface TranslatedPlan {
  plan: PlanData;
  /** Détail des fiches NON livrées, indexé par id. */
  fiches: Record<string, FicheDetailData>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkSchema(value: unknown, commande: string): Record<string, unknown> {
  if (!isRecord(value)) throw new EzkContractError(`${commande} : réponse sans objet JSON`);
  if (value.schema_version !== SUPPORTED_SCHEMA_VERSION) {
    throw new EzkContractError(
      `${commande} : schema_version ${String(value.schema_version)} inconnu (attendu ${SUPPORTED_SCHEMA_VERSION})`,
    );
  }
  return value;
}

function asBoardShow(value: unknown): BoardShow {
  const raw = checkSchema(value, 'board show');
  if (!isRecord(raw.comptes) || !isRecord(raw.versions) || !Array.isArray(raw.versions.lots)) {
    throw new EzkContractError('board show : comptes ou versions manquants');
  }
  return raw as unknown as BoardShow;
}

function asBacklogShow(value: unknown): BacklogShow {
  const raw = checkSchema(value, 'backlog show');
  if (!Array.isArray(raw.fiches))
    throw new EzkContractError('backlog show : liste fiches manquante');
  return raw as unknown as BacklogShow;
}

/**
 * Les fiches closes sans livraison, comme le contrat de la méthode les nomme (`comptes.closes` :
 * superseded, merged, split). Ce n'est pas du travail à faire : la vue d'ensemble ne les compte pas,
 * la vue Fiches ne les montre plus en idées (fiche 20261103191932070).
 */
const CLOSED_STATUSES: ReadonlySet<string> = new Set(['superseded', 'merged', 'split']);

function ficheStatus(f: BacklogFiche): FicheDetailStatus {
  if (f.done) return 'done';
  if (f.enCours) return 'wip';
  return f.status === 'ready' ? 'ready' : 'idea';
}

function toFicheDetail(f: BacklogFiche): FicheDetailData {
  return {
    id: f.id,
    title: f.title,
    prio: f.priority,
    status: ficheStatus(f),
    ver: f.version,
    enclair: f.enClair,
    ctx: f.contexte,
    crit: f.criteres.map((c) => c.texte),
    verif: f.commentVerifier,
    ...(f.pr ? { pr: f.pr } : {}),
    blocked: f.blocked,
  };
}

function toPlanVersion(lot: BoardLot, enCoursIds: ReadonlySet<string>): PlanVersion {
  // Chaque fiche à faire compte une seule fois : en cours d'abord (le contrat la range aussi dans
  // `pretes`), puis prête, sinon idée. Le découpage se fait sur `aFaire` : il somme toujours juste.
  const pretes = new Set(lot.pretes);
  const wip = lot.aFaire.filter((id) => enCoursIds.has(id)).length;
  const ready = lot.aFaire.filter((id) => !enCoursIds.has(id) && pretes.has(id)).length;
  return {
    ver: lot.version,
    name: lot.version,
    done: lot.livrees.length,
    wip,
    ready,
    idea: lot.aFaire.length - ready - wip,
    total: lot.livrees.length + lot.aFaire.length,
    ...(lot.etiquette ? { date: 'taguée' } : {}),
    ...(lot.etat === 'a-clore' ? { toClose: true as const } : {}),
  };
}

/** Un lot réalisé : tagué, ou dit « à clore » par la méthode (tout livré, étiquette à poser). */
const isRealised = (lot: BoardLot): boolean => Boolean(lot.etiquette) || lot.etat === 'a-clore';

/** Les pouces bien formés, par id de fiche ; un pouce illisible est ignoré, jamais deviné. */
function readVerdicts(value: unknown): Record<string, 'up' | 'down'> {
  const out: Record<string, 'up' | 'down'> = {};
  if (!isRecord(value)) return out;
  for (const [id, entry] of Object.entries(value)) {
    if (isRecord(entry) && (entry.verdict === 'up' || entry.verdict === 'down'))
      out[id] = entry.verdict;
  }
  return out;
}

const isCount = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0;

/** L'historique publié, ou `undefined` s'il manque ou est mal formé : la page dit alors « — ». */
function readHistory(value: unknown): PlanData['history'] {
  if (!isRecord(value) || !isCount(value.sprints) || !isCount(value.retros)) return undefined;
  return { sprints: value.sprints, retros: value.retros };
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === 'string');

function readMilestone(value: unknown): PlanMilestone | undefined {
  if (!isRecord(value) || typeof value.milestone !== 'string' || typeof value.status !== 'string')
    return undefined;
  if (!isCount(value.total) || !isCount(value.shipped)) return undefined;
  return {
    name: value.milestone,
    status: value.status,
    total: value.total,
    shipped: value.shipped,
  };
}

function readSession(value: unknown): PlanSession | undefined {
  if (!isRecord(value)) return undefined;
  const { date, title, file, fiches, prs } = value;
  if (typeof date !== 'string' || typeof title !== 'string' || typeof file !== 'string')
    return undefined;
  if (!isStringArray(fiches) || !isStringArray(prs)) return undefined;
  return { date, title, file, fiches, prs };
}

/**
 * Les milestones et les sessions publiées, ou `undefined` si l'un manque ou porte une entrée mal
 * formée : la vue « Pilotage » dit alors qu'elle est indisponible, elle ne montre jamais une liste
 * tronquée comme complète.
 */
function readPilotage(milestones: unknown, sessions: unknown): PlanPilotage | undefined {
  if (!Array.isArray(milestones) || !Array.isArray(sessions)) return undefined;
  const ms = milestones.map(readMilestone);
  const ss = sessions.map(readSession);
  if (ms.some((m) => m === undefined) || ss.some((s) => s === undefined)) return undefined;
  return { milestones: ms as PlanMilestone[], sessions: ss as PlanSession[] };
}

/** Traduit les deux réponses d'`ezk` ; lève `EzkContractError` si leur forme n'est pas celle du contrat v1. */
export function translatePlan(boardJson: unknown, backlogJson: unknown): TranslatedPlan {
  const board = asBoardShow(boardJson);
  const backlog = asBacklogShow(backlogJson);
  const { comptes, versions } = board;
  const history = readHistory(board.historique);
  const verdicts = readVerdicts(board.verdicts);
  const pilotage = readPilotage(board.milestones, board.sessions);

  const funnel: PlanFunnel = {
    idea: comptes.idees,
    ready: comptes.pretes,
    wip: comptes.enCours,
    unversioned: comptes.sansVersion,
    parked: comptes.parkees,
  };

  const enCoursIds = new Set(backlog.fiches.filter((f) => f.enCours).map((f) => f.id));
  const current = versions.lots.find((lot) => lot.version === versions.courante);
  const others = versions.lots.filter((lot) => lot !== current);

  const fiches: Record<string, FicheDetailData> = {};
  for (const f of backlog.fiches) {
    if (f.done || CLOSED_STATUSES.has(f.status)) continue;
    const verdict = verdicts[f.id];
    fiches[f.id] = verdict ? { ...toFicheDetail(f), verdict } : toFicheDetail(f);
  }

  return {
    plan: {
      funnel,
      versions: {
        current: current ? toPlanVersion(current, enCoursIds) : null,
        upcoming: others
          .filter((lot) => !isRealised(lot))
          .map((lot) => toPlanVersion(lot, enCoursIds)),
        // Le contrat range les lots en croissant ; la page attend la plus récente d'abord.
        past: others
          .filter(isRealised)
          .map((lot) => toPlanVersion(lot, enCoursIds))
          .reverse(),
      },
      done: comptes.livrees,
      ...(history ? { history } : {}),
      ...(pilotage ? { pilotage } : {}),
    },
    fiches,
  };
}
