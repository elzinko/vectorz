/**
 * ezkConfigTranslator — CŒUR PUR (aucune I/O). Traduit la config publiée par la méthode
 * (`ezk config show --json`, ADR-086) vers la forme que l'onglet « Configuration » du board attend.
 * Il TRADUIT, il ne recalcule rien : les défauts et les modèles viennent tels quels du contrat.
 */
import { EzkContractError } from './ezkPlanTranslator.js';

const SUPPORTED_SCHEMA_VERSION = 1;
const COMMANDE = 'ezk config show --json';

/** La config d'un projet telle que la page l'affiche (sous-ensemble structurel du board web). */
export interface ProjectConfigData {
  /** Le fichier lu, relatif à la racine du projet ; `null` = pas de config, défauts de la méthode. */
  file: string | null;
  /** Les capacités GitHub, en mots. */
  github: string;
  /** Sans PR : comment une story arrive sur main (`local-squash`, `push-ff`). */
  integration: string;
  releaseGate: boolean;
  /** La racine du projet, telle que le registre la donne. */
  root: string;
  /** Le tier de chaque agent, tel que la méthode le résout. */
  roles: Record<string, string>;
  /** Les agents dont la config est mal saisie, avec la raison donnée par la méthode. */
  errors: Record<string, string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fail(what: string): never {
  throw new EzkContractError(`${COMMANDE} : ${what}`);
}

function githubText(github: Record<string, unknown>): string {
  const { pr, ci, codexReview } = github;
  if (typeof pr !== 'boolean' || typeof ci !== 'boolean' || typeof codexReview !== 'boolean') {
    fail('champ github illisible');
  }
  if (!pr && !ci && !codexReview) return 'coupé (100 % local)';
  if (pr && ci && codexReview) return 'branché (PR, CI, revue Codex)';
  const flag = (on: boolean): string => (on ? 'on' : 'off');
  return `PR ${flag(pr)} · CI ${flag(ci)} · revue Codex ${flag(codexReview)}`;
}

/** Traduit la réponse d'`ezk config show --json` pour le projet `root`. Une forme inconnue lève `EzkContractError`. */
export function translateConfig(raw: unknown, root: string): ProjectConfigData {
  if (!isRecord(raw)) fail('réponse sans objet JSON');
  if (raw.schema_version !== SUPPORTED_SCHEMA_VERSION) {
    fail(
      `schema_version ${String(raw.schema_version)} inconnu (attendu ${SUPPORTED_SCHEMA_VERSION})`,
    );
  }
  const { file, github, integration, releaseGate, agents } = raw;
  if (file !== null && typeof file !== 'string') fail('champ file illisible');
  if (!isRecord(github)) fail('champ github illisible');
  if (typeof integration !== 'string') fail('champ integration illisible');
  if (typeof releaseGate !== 'boolean') fail('champ releaseGate illisible');
  if (!Array.isArray(agents)) fail('champ agents illisible');

  const roles: Record<string, string> = {};
  const errors: Record<string, string> = {};
  for (const a of agents) {
    if (!isRecord(a) || typeof a.agent !== 'string') fail('un agent sans nom');
    if (typeof a.error === 'string') errors[a.agent] = a.error;
    else if (typeof a.tier === 'string') roles[a.agent] = a.tier;
    else fail(`agent ${a.agent} sans tier ni erreur`);
  }
  return { file, github: githubText(github), integration, releaseGate, root, roles, errors };
}
