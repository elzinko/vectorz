/**
 * ezkRetroCapturesSource — les rétros capturées d'un projet (ADR-086) : `ezk retro captures --json`,
 * vérifié pour la page « Rétros ». La méthode publie chaque capture avec ses propositions ; la page ne
 * relit aucun fichier. Aucun contrat versionné n'existe encore : on accepte l'absence de `schema_version`
 * et on refuse une version annoncée autre que 1. Les captures bougent rarement : relues au plus toutes
 * les cinq minutes, et servies tout de suite depuis la dernière réponse.
 */
import { EzkContractError } from './ezkPlanTranslator.js';
import { EzkSource, type EzkSourceOptions } from './ezkSource.js';

const SUPPORTED_SCHEMA_VERSION = 1;
const COMMANDE = 'ezk retro captures --json';
const RETROS_TTL_MS = 5 * 60_000;
const STATUSES = ['✅', '❌', '⏳'] as const;

export type RetroStatusView = (typeof STATUSES)[number];

/** Une proposition de rétro, avec ce que le PO en a décidé. */
export interface RetroActionView {
  proposition: string;
  kind: string;
  target?: string;
  by: string[];
  status: RetroStatusView;
  decision: string;
  date?: string;
}

export interface RetroCaptureView {
  file: string;
  date: string;
  theme: string;
  scope: string;
  participants: string[];
  actions: RetroActionView[];
}

export interface RetroProblemView {
  file: string;
  where: string;
  message: string;
}

export interface RetroCapturesViewData {
  captures: RetroCaptureView[];
  problems: RetroProblemView[];
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function fail(what: string): never {
  throw new EzkContractError(`${COMMANDE} : ${what}`);
}

const text = (v: Record<string, unknown>, k: string): string => {
  const value = v[k];
  return typeof value === 'string' ? value : fail(`champ ${k} absent`);
};

const texts = (v: Record<string, unknown>, k: string): string[] => {
  const value = v[k];
  return Array.isArray(value) && value.every((x) => typeof x === 'string') ? [...value] : fail(`champ ${k} mal formé`);
};

const records = (v: Record<string, unknown>, k: string): Record<string, unknown>[] => {
  const value = v[k];
  return Array.isArray(value) && value.every(isRecord) ? value : fail(`champ ${k} mal formé`);
};

const optionalText = (v: Record<string, unknown>, k: string): string | undefined =>
  v[k] === undefined ? undefined : text(v, k);

function readAction(v: Record<string, unknown>): RetroActionView {
  const status = text(v, 'status');
  if (!(STATUSES as readonly string[]).includes(status)) fail(`statut ${status} inconnu`);
  const target = optionalText(v, 'target');
  const date = optionalText(v, 'date');
  return {
    proposition: text(v, 'proposition'),
    kind: text(v, 'kind'),
    ...(target === undefined ? {} : { target }),
    by: texts(v, 'by'),
    status: status as RetroStatusView,
    decision: text(v, 'decision'),
    ...(date === undefined ? {} : { date }),
  };
}

const readCapture = (v: Record<string, unknown>): RetroCaptureView => ({
  file: text(v, 'file'),
  date: text(v, 'date'),
  theme: text(v, 'theme'),
  scope: text(v, 'scope'),
  participants: texts(v, 'participants'),
  actions: records(v, 'actions').map(readAction),
});

const readProblem = (v: Record<string, unknown>): RetroProblemView => ({
  file: text(v, 'file'),
  where: text(v, 'where'),
  message: text(v, 'message'),
});

/** Le JSON publié, vérifié ; un format inconnu est refusé net, jamais deviné. */
export function translateRetroCaptures(json: unknown): RetroCapturesViewData {
  if (!isRecord(json)) fail('réponse mal formée');
  if (json.schema_version !== undefined && json.schema_version !== SUPPORTED_SCHEMA_VERSION)
    fail(`schema_version ${String(json.schema_version)} inconnu (attendu ${SUPPORTED_SCHEMA_VERSION})`);
  return {
    captures: records(json, 'captures').map(readCapture),
    problems: json.problems === undefined ? [] : records(json, 'problems').map(readProblem),
  };
}

/**
 * `ezk retro captures --json` sort en code 1 dès qu'une capture est mal formée, mais imprime quand même
 * toutes les captures valides et la liste des problèmes : c'est ce qu'il faut montrer (même convention que
 * `graphCheckOutput`). On garde donc sa sortie si elle n'est pas vide ; sans sortie, l'échec remonte.
 */
export async function retroCapturesOutput(run: (args: string[]) => Promise<string>, root: string): Promise<string> {
  try {
    return await run(['--root', root, 'retro', 'captures', '--json']);
  } catch (error) {
    const stdout = (error as { stdout?: unknown }).stdout;
    if (typeof stdout === 'string' && stdout.trim() !== '') return stdout;
    throw error;
  }
}

export class EzkRetroCapturesSource extends EzkSource<{ retros: RetroCapturesViewData }> {
  constructor(options: EzkSourceOptions) {
    super({ ttlMs: RETROS_TTL_MS, ...options }, async (root, run) => ({
      retros: translateRetroCaptures(JSON.parse(await retroCapturesOutput(run, root))),
    }));
  }
}
