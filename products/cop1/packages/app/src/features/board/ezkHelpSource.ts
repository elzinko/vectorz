/**
 * ezkHelpSource — l'annuaire de la méthode (fiche 20261128093846629, ADR-086) : `ezk help --json`
 * (contrat `help/v1`), traduit pour la page « Annuaire ». La méthode publie ses commandes, skills et
 * agents ; mission control ne recopie aucune liste. L'annuaire bouge rarement : relu au plus toutes
 * les cinq minutes, et servi tout de suite depuis la dernière réponse.
 */
import { EzkContractError } from './ezkPlanTranslator.js';
import { EzkSource, type EzkSourceOptions } from './ezkSource.js';

const SUPPORTED_SCHEMA_VERSION = 1;
const COMMANDE = 'ezk help --json';
const HELP_TTL_MS = 5 * 60_000;

export interface HelpCommand {
  domaine: string;
  /** `null` : le domaine EST la commande. */
  verbe: string | null;
  enClair: string;
  script: string;
  ecritLeProjet: boolean;
  /** Le nouveau nom quand la commande est un ancien nom ; `null` sinon. */
  deprecie: string | null;
  etage: string;
  famille: string | null;
}

export interface HelpSkill {
  id: string;
  description: string;
  sousCommandes: string[];
  fichier: string | null;
  etage: string;
  famille: string | null;
}

export interface HelpAgent {
  id: string;
  description: string;
  fichier: string | null;
  etage: string;
  famille: string | null;
  modele: string;
  effort: string;
}

export interface HelpView {
  commandes: HelpCommand[];
  skills: HelpSkill[];
  agents: HelpAgent[];
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

const textOrNull = (v: Record<string, unknown>, k: string): string | null => {
  const value = v[k];
  return value === null || typeof value === 'string' ? value : fail(`champ ${k} mal formé`);
};

const flag = (v: Record<string, unknown>, k: string): boolean => {
  const value = v[k];
  return typeof value === 'boolean' ? value : fail(`champ ${k} mal formé`);
};

const strings = (v: Record<string, unknown>, k: string): string[] => {
  const value = v[k];
  return Array.isArray(value) && value.every((s) => typeof s === 'string')
    ? value
    : fail(`champ ${k} mal formé`);
};

const records = (v: Record<string, unknown>, k: string): Record<string, unknown>[] => {
  const value = v[k];
  return Array.isArray(value) && value.every(isRecord) ? value : fail(`champ ${k} mal formé`);
};

/** Le JSON publié, vérifié ; un format inconnu est refusé net, jamais deviné. */
export function translateHelp(json: unknown): HelpView {
  if (!isRecord(json)) fail('réponse mal formée');
  if (json.schema_version !== SUPPORTED_SCHEMA_VERSION)
    fail(
      `schema_version ${String(json.schema_version)} inconnu (attendu ${SUPPORTED_SCHEMA_VERSION})`,
    );
  return {
    commandes: records(json, 'commandes').map((c) => ({
      domaine: text(c, 'domaine'),
      verbe: textOrNull(c, 'verbe'),
      enClair: text(c, 'enClair'),
      script: text(c, 'script'),
      ecritLeProjet: flag(c, 'ecritLeProjet'),
      deprecie: textOrNull(c, 'deprecie'),
      etage: text(c, 'etage'),
      famille: textOrNull(c, 'famille'),
    })),
    skills: records(json, 'skills').map((s) => ({
      id: text(s, 'id'),
      description: text(s, 'description'),
      sousCommandes: strings(s, 'sousCommandes'),
      fichier: textOrNull(s, 'fichier'),
      etage: text(s, 'etage'),
      famille: textOrNull(s, 'famille'),
    })),
    agents: records(json, 'agents').map((a) => ({
      id: text(a, 'id'),
      description: text(a, 'description'),
      fichier: textOrNull(a, 'fichier'),
      etage: text(a, 'etage'),
      famille: textOrNull(a, 'famille'),
      modele: text(a, 'modele'),
      effort: text(a, 'effort'),
    })),
  };
}

export class EzkHelpSource extends EzkSource<{ help: HelpView }> {
  constructor(options: EzkSourceOptions) {
    super({ ttlMs: HELP_TTL_MS, ...options }, async (root, run) => ({
      help: translateHelp(JSON.parse(await run(['--root', root, 'help', '--json']))),
    }));
  }
}
