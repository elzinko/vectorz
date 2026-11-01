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
  PlanVersion,
} from './planTypes.js';

const SUPPORTED_SCHEMA_VERSION = 1;

/** La réponse d'`ezk` est illisible ou n'a pas la forme connue du contrat. */
export class EzkContractError extends Error {}

interface BoardLot {
  version: string;
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
  };
}

/** Traduit les deux réponses d'`ezk` ; lève `EzkContractError` si leur forme n'est pas celle du contrat v1. */
export function translatePlan(boardJson: unknown, backlogJson: unknown): TranslatedPlan {
  const board = asBoardShow(boardJson);
  const backlog = asBacklogShow(backlogJson);
  const { comptes, versions } = board;

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
    if (!f.done) fiches[f.id] = toFicheDetail(f);
  }

  return {
    plan: {
      funnel,
      versions: {
        current: current ? toPlanVersion(current, enCoursIds) : null,
        upcoming: others
          .filter((lot) => !lot.etiquette)
          .map((lot) => toPlanVersion(lot, enCoursIds)),
        // Le contrat range les lots en croissant ; la page attend la plus récente d'abord.
        past: others
          .filter((lot) => lot.etiquette)
          .map((lot) => toPlanVersion(lot, enCoursIds))
          .reverse(),
      },
      done: comptes.livrees,
    },
    fiches,
  };
}
