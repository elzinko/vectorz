/**
 * ezkLawTranslator — CŒUR PUR (aucune I/O). Traduit `ezk law show --json` (fiche 20260826222044335,
 * ADR-086) vers la forme de la vue « Loi ». Il TRADUIT : les comptes et la portée de chaque règle
 * viennent tels quels de la méthode ; mission control ne recompte rien.
 */
import { EzkContractError } from './ezkPlanTranslator.js';

const SUPPORTED_SCHEMA_VERSION = 1;
const COMMANDE = 'ezk law show --json';
export const PORTEES = ['partout', 'projet', 'demarrage', 'citee', 'rangee', 'orpheline'] as const;
export type Portee = (typeof PORTEES)[number];

export interface LawRule {
  id: string;
  titre: string;
  niveau: string;
  fichier: string;
  bundles: string[];
  profils: string[];
  /** Les skills et agents qui citent la règle (`skill:<id>`, `agent:<id>`). */
  appliqueePar: string[];
  verifieePar: string[];
  portee: Portee;
}

/** Un skill ou un agent, et les règles qui s'y attachent. */
export interface LawObject {
  id: string;
  type: 'skill' | 'agent';
  regles: string[];
}

export interface LawViewData {
  comptes: Record<Portee | 'total', number>;
  regles: LawRule[];
  objets: LawObject[];
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isStrings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === 'string');
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;

function fail(what: string): never {
  throw new EzkContractError(`${COMMANDE} : ${what}`);
}

function readRule(v: unknown): LawRule {
  if (!isRecord(v)) fail('règle sans objet');
  const { id, titre, niveau, fichier, bundles, profils, appliqueePar, verifieePar, portee } = v;
  if (
    typeof id !== 'string' ||
    typeof titre !== 'string' ||
    typeof niveau !== 'string' ||
    typeof fichier !== 'string'
  ) {
    fail('règle sans id, titre, niveau ou fichier');
  }
  if (
    !isStrings(bundles) ||
    !isStrings(profils) ||
    !isStrings(verifieePar) ||
    !Array.isArray(appliqueePar)
  ) {
    fail(`règle ${id} : listes mal formées`);
  }
  if (!PORTEES.includes(portee as Portee)) fail(`règle ${id} : portée inconnue`);
  const par = appliqueePar.map((a) =>
    isRecord(a) && typeof a.objet === 'string'
      ? a.objet
      : fail(`règle ${id} : application mal formée`),
  );
  return {
    id,
    titre,
    niveau,
    fichier,
    bundles,
    profils,
    appliqueePar: par,
    verifieePar,
    portee: portee as Portee,
  };
}

/** Traduit la réponse ; lève `EzkContractError` si sa forme n'est pas celle du contrat v1. */
export function translateLaw(json: unknown): LawViewData {
  if (!isRecord(json)) fail('réponse sans objet JSON');
  if (json.schema_version !== SUPPORTED_SCHEMA_VERSION) {
    fail(
      `schema_version ${String(json.schema_version)} inconnu (attendu ${SUPPORTED_SCHEMA_VERSION})`,
    );
  }
  const { comptes, regles, objets } = json;
  if (!isRecord(comptes) || !Array.isArray(regles) || !Array.isArray(objets))
    fail('comptes, regles ou objets manquants');
  const counts = {} as LawViewData['comptes'];
  for (const k of ['total', ...PORTEES] as const) {
    if (!isCount(comptes[k])) fail(`compte ${k} manquant`);
    counts[k] = comptes[k] as number;
  }
  const objects: LawObject[] = [];
  for (const o of objets) {
    if (!isRecord(o) || typeof o.id !== 'string' || !Array.isArray(o.regles))
      fail('objet mal formé');
    if (o.type !== 'skill' && o.type !== 'agent') continue; // bundles et profils : montrés dans le détail d'une règle
    const ids = o.regles.map((l) =>
      isRecord(l) && typeof l.id === 'string' ? l.id : fail(`objet ${o.id} : lien mal formé`),
    );
    objects.push({ id: o.id, type: o.type, regles: ids });
  }
  return { comptes: counts, regles: regles.map(readRule), objets: objects };
}
