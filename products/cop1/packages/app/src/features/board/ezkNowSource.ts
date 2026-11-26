/**
 * ezkNowSource — les alertes de la cloche (ADR-086) : `ezk now --json` publie le contrat `now-show/v1`.
 * La méthode décide ce qui alerte ; le daemon vérifie et relaie, sans rien calculer. Un format inconnu
 * est refusé net, jamais deviné. Les alertes bougent peu : relues au plus toutes les minutes, et servies
 * tout de suite depuis la dernière réponse.
 */
import { EzkContractError } from './ezkPlanTranslator.js';
import { EzkSource, type EzkSourceOptions } from './ezkSource.js';

const SUPPORTED_SCHEMA_VERSION = 1;
const COMMANDE = 'ezk now --json';
const NOW_TTL_MS = 60_000;
const ALERT_TYPES = [
  'fiche-bloquee',
  'idee-a-groomer',
  'proposition-retro',
  'question-session',
  'version-a-poser',
  'sprint-sans-retro',
] as const;

export type AlertTypeView = (typeof ALERT_TYPES)[number];

/** Une alerte, une par élément : jamais de regroupement. */
export interface AlertView {
  type: AlertTypeView;
  id: string;
  titre: string;
  raison: string;
  decision: string;
  /** Le fichier source, relatif à la racine du projet ; '' si la source n'est pas un fichier. */
  fichier: string;
  /** `AAAA-MM-JJ`, ou '' si la méthode ne la connaît pas. */
  date: string;
}

export interface NowViewData {
  alertes: AlertView[];
  /** Ce que la méthode ne calcule pas encore, en mots : ce n'est pas un zéro. */
  nonMesure: string[];
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

function readAlert(v: Record<string, unknown>): AlertView {
  const type = text(v, 'type');
  if (!(ALERT_TYPES as readonly string[]).includes(type)) fail(`type ${type} inconnu`);
  return {
    type: type as AlertTypeView,
    id: text(v, 'id'),
    titre: text(v, 'titre'),
    raison: text(v, 'raison'),
    decision: text(v, 'decision'),
    fichier: text(v, 'fichier'),
    date: text(v, 'date'),
  };
}

/** Le JSON publié, vérifié. */
export function translateNow(json: unknown): NowViewData {
  if (!isRecord(json)) fail('réponse mal formée');
  if (json.schema_version !== SUPPORTED_SCHEMA_VERSION)
    fail(`schema_version ${String(json.schema_version)} inconnu (attendu ${SUPPORTED_SCHEMA_VERSION})`);
  const { alertes, non_mesure: nonMesure } = json;
  if (!Array.isArray(alertes) || !alertes.every(isRecord)) fail('champ alertes mal formé');
  if (!Array.isArray(nonMesure) || !nonMesure.every((x) => typeof x === 'string')) fail('champ non_mesure mal formé');
  return { alertes: alertes.map(readAlert), nonMesure: [...nonMesure] };
}

/**
 * `ezk now --json` peut sortir en code non nul en imprimant quand même son contrat : on garde sa sortie
 * si elle n'est pas vide (même convention que `retroCapturesOutput`). Sans sortie, l'échec remonte :
 * c'est une méthode trop ancienne, la cloche dit « non publié ».
 */
export async function nowOutput(run: (args: string[]) => Promise<string>, root: string): Promise<string> {
  try {
    return await run(['--root', root, 'now', '--json']);
  } catch (error) {
    const stdout = (error as { stdout?: unknown }).stdout;
    if (typeof stdout === 'string' && stdout.trim() !== '') return stdout;
    throw error;
  }
}

export class EzkNowSource extends EzkSource<{ now: NowViewData }> {
  constructor(options: EzkSourceOptions) {
    super({ ttlMs: NOW_TTL_MS, ...options }, async (root, run) => ({
      now: translateNow(JSON.parse(await nowOutput(run, root))),
    }));
  }
}
