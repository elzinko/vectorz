/**
 * ezkProcessShowSource — les étapes fines de chaque skill (fiche 20261110191135802, ADR-086) :
 * `ezk process show --json`, vérifié pour le schéma Process. La méthode déclare les étapes et donne la
 * valeur des réglages du projet ; la page ne recopie aucune liste. Les étapes bougent rarement :
 * relues au plus toutes les cinq minutes, et servies tout de suite depuis la dernière réponse.
 */
import { EzkContractError } from './ezkPlanTranslator.js';
import { EzkSource, type EzkSourceOptions } from './ezkSource.js';

const SUPPORTED_SCHEMA_VERSION = 1;
const COMMANDE = 'ezk process show --json';
const PROCESS_SHOW_TTL_MS = 5 * 60_000;

/** Une étape telle que la méthode la publie. */
export interface EtapeView {
  id: string;
  num: number;
  titre: string;
  enClair: string;
  /** Qui la réalise : `humain`, `agent:<id>`, `<skill>` ou `<skill>:<sous-commande>`. */
  joueePar: string[];
  agents: string[];
  commandes: string[];
  regles: string[];
  /** Les réglages du projet qui gouvernent l'étape, avec leur valeur pour ce projet. */
  reglages: { cle: string; valeur: string }[];
}

export interface SkillStepsView {
  id: string;
  nom: string;
  enClair: string;
  /** Un outil se lance à côté du flux (l'archive) : l'écran le range dans sa boîte à outils. */
  outil: boolean;
  etapes: EtapeView[];
}

interface Arrow {
  de: string;
  vers: string;
  libelle: string;
}

export interface ProcessShowViewData {
  skills: SkillStepsView[];
  liens: Arrow[];
  /** Les retours entre étapes, `<skill>:<étape>` (fiche 20261117223348250). */
  boucles: Arrow[];
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
  return Array.isArray(value) && value.every((x) => typeof x === 'string')
    ? [...value]
    : fail(`champ ${k} mal formé`);
};

const records = (v: Record<string, unknown>, k: string): Record<string, unknown>[] => {
  const value = v[k];
  return Array.isArray(value) && value.every(isRecord) ? value : fail(`champ ${k} mal formé`);
};

function readEtape(v: Record<string, unknown>): EtapeView {
  if (typeof v.num !== 'number') fail('champ num absent');
  return {
    id: text(v, 'id'),
    num: v.num,
    titre: text(v, 'titre'),
    enClair: text(v, 'enClair'),
    joueePar: texts(v, 'joueePar'),
    agents: texts(v, 'agents'),
    commandes: texts(v, 'commandes'),
    regles: texts(v, 'regles'),
    reglages: records(v, 'reglages').map((r) => ({
      cle: text(r, 'cle'),
      valeur: text(r, 'valeur'),
    })),
  };
}

/** Un champ ajouté en v1 : absent chez une méthode plus ancienne, il prend sa valeur neutre ; mal formé, il est refusé. */
function outilOf(v: Record<string, unknown>): boolean {
  if (v.outil === undefined) return false;
  return typeof v.outil === 'boolean' ? v.outil : fail('champ outil mal formé');
}

const arrow = (l: Record<string, unknown>): Arrow => ({
  de: text(l, 'de'),
  vers: text(l, 'vers'),
  libelle: text(l, 'libelle'),
});

/** Le JSON publié, vérifié ; un format inconnu est refusé net, jamais deviné. */
export function translateProcessShow(json: unknown): ProcessShowViewData {
  if (!isRecord(json)) fail('réponse mal formée');
  if (json.schema_version !== SUPPORTED_SCHEMA_VERSION)
    fail(
      `schema_version ${String(json.schema_version)} inconnu (attendu ${SUPPORTED_SCHEMA_VERSION})`,
    );
  return {
    skills: records(json, 'skills').map((s) => ({
      id: text(s, 'id'),
      nom: text(s, 'nom'),
      enClair: text(s, 'enClair'),
      outil: outilOf(s),
      etapes: records(s, 'etapes').map(readEtape),
    })),
    liens: records(json, 'liens').map(arrow),
    boucles: json.boucles === undefined ? [] : records(json, 'boucles').map(arrow),
  };
}

export class EzkProcessShowSource extends EzkSource<{ process: ProcessShowViewData }> {
  constructor(options: EzkSourceOptions) {
    super({ ttlMs: PROCESS_SHOW_TTL_MS, ...options }, async (root, run) => ({
      process: translateProcessShow(
        JSON.parse(await run(['--root', root, 'process', 'show', '--json'])),
      ),
    }));
  }
}
