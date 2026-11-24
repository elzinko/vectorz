/**
 * boardProvider — compose les données du board de chaque projet surveillé, chez cop1, SANS importer
 * mega-city (ADR-021). Le PLAN (entonnoir, versions, détail des fiches) et la CONFIG du projet
 * viennent de la méthode par la commande `ezk` (ADR-086), via `EzkPlanSource` et `EzkConfigSource` :
 * cop1 ne lit lui-même ni les fiches ni `.vectorz/config.yml`.
 *
 * Quand le plan n'est pas là (`loading`, `unavailable`), l'entonnoir, les versions et les fiches
 * restent VIDES et `plan` dit pourquoi : jamais un faux chiffre. De même, sans config reçue, `config`
 * est absent et `configState` dit pourquoi. Les runs, eux, se lisent dans `<root>/.supervision/runs`
 * et s'affichent dans tous les cas.
 *
 * Cœur PUR (`shapeProject`) = mise en forme testable sans disque ; bord I/O (`composeProject`,
 * `composeBoardData`, `composeLive`) = lecture des sources de la méthode et des journaux de runs.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { type ChantierInput, projectChantiers } from '@cop1/journal-validator';
import {
  type LiveBoard,
  type LiveChantier,
  type LiveRun,
  adaptChantiers,
} from './chantierAdapter.js';
import type { ConfigSnapshot, EzkConfigSource } from './ezkConfigSource.js';
import type { ProjectConfigData } from './ezkConfigTranslator.js';
import type { EzkPlanSource, PlanSnapshot } from './ezkPlanSource.js';
import type { EzkProcessSource, ProcessSnapshot } from './ezkProcessSource.js';
import type { ProcessViewData } from './ezkProcessTranslator.js';
import type { SourceReading } from './ezkSource.js';
import type {
  FicheDetailData,
  PlanFunnel,
  PlanObjectif,
  PlanPilotage,
  PlanSprint,
  PlanVersions,
  PlanVersionsPage,
} from './planTypes.js';

/** Un projet à composer : son nom (clé du board) et la racine où lire son backlog. */
export interface BoardProjectInput {
  name: string;
  root: string;
  desc?: string;
}

/** Les lectures de la méthode dont le board a besoin. */
export interface BoardSources {
  plan: EzkPlanSource;
  config: EzkConfigSource;
  process: EzkProcessSource;
}

/** L'état d'une lecture de la méthode (le plan, la config), tel que la page l'affiche.
 *  `refreshing` : la méthode est en train d'être relue, la page redemande bientôt. */
export type BoardPlanState = (
  | { state: 'ok' }
  | { state: 'loading' }
  | { state: 'unavailable'; reason: string }
) & { refreshing?: true };

/** La part « plan » d'un `BoardProject` (sous-ensemble structurel des types du board web, ADR-074). */
export interface BoardPlanProject {
  name: string;
  desc: string;
  live: boolean;
  /** Le plan est-il arrivé ? Sinon `funnel`, `versions` et `fiches` sont vides. */
  plan: BoardPlanState;
  funnel: PlanFunnel;
  versions: PlanVersions;
  metrics: {
    done: number;
    tokens: string;
    temps: string;
    perFiche: string;
    /** Comptés par la méthode (`historique` du contrat) ; `'—'` quand elle ne les publie pas, jamais un faux 0. */
    sprints: number | '—';
    runs: number | '—';
    retros: number | '—';
    /** Pourquoi une tuile n'a pas de chiffre, en une phrase chacune (fiche 20261102104443762). */
    notes: string[];
  };
  /** Runs observés via l'adaptateur `projectChantiers` — vide tant qu'aucun journal keyé n'existe (jamais un faux run). */
  runs: Record<string, LiveRun>;
  /** Chantiers multi-sessions (ADR-079), fils du plus récent au plus ancien — présent seulement s'il y en a. */
  chantiers?: LiveChantier[];
  /** Détail des fiches NON livrées (pour la modale du board). */
  fiches: Record<string, FicheDetailData>;
  /** Milestones et sessions closes publiées par la méthode (vue « Pilotage ») ; absent sinon. */
  pilotage?: PlanPilotage;
  /** Les derniers sprints et leurs indicateurs publiés par la méthode (Vue d'ensemble) ; absent sinon. */
  lastSprints?: PlanSprint[];
  /** Les objectifs publiés par la méthode (pages Objectifs et Un objectif) ; absent sinon. */
  objectifs?: PlanObjectif[];
  /** Les versions et la prochaine coupe publiées par la méthode (pages Versions et Une version) ; absent sinon. */
  versionsPage?: PlanVersionsPage;
  /** Le process est-il arrivé (`ezk board process --json`) ? Sinon `process` est absent. */
  processState: BoardPlanState;
  /** Chaque fiche sur son étape, telle que la méthode la place (vue « Process »). */
  process?: ProcessViewData;
  /** La config est-elle arrivée ? Sinon `config` est absent. */
  configState: BoardPlanState;
  /** La config du projet, telle que la méthode la résout (`ezk config show --json`). */
  config?: ProjectConfigData;
}

/** Ce que disent les tuiles sans mesure fiable (fiche 20261102104443762). */
export const UNMEASURED = 'non mesuré';
export const UNMEASURED_NOTE =
  'Temps et jetons : non mesurés — les comptes rendus de sprint ne les mesurent pas encore de façon fiable.';
export const NO_HISTORY_NOTE =
  'Sprints et rétros : la méthode installée ne publie pas encore ces comptes.';

const EMPTY_FUNNEL: PlanFunnel = { idea: 0, ready: 0, wip: 0, unversioned: 0, parked: 0 };
const EMPTY_VERSIONS: PlanVersions = { current: null, upcoming: [], past: [] };

function readState(snapshot: SourceReading<unknown>): BoardPlanState {
  const state: BoardPlanState =
    snapshot.state === 'unavailable'
      ? { state: 'unavailable', reason: snapshot.reason }
      : { state: snapshot.state };
  // « loading » dit déjà à la page de redemander : `refreshing` n'y ajoute rien.
  return snapshot.refreshing && snapshot.state !== 'loading'
    ? { ...state, refreshing: true }
    : state;
}

/** CŒUR PUR — met le plan reçu à la forme d'un `BoardProject`. Les chiffres non encore câblés
 *  (jetons, temps, sprints, runs, rétros) sont des placeholders honnêtes, jamais de faux zéros déguisés. */
export function shapeProject(
  name: string,
  desc: string,
  snapshot: PlanSnapshot,
  live: LiveBoard = { runs: {}, chantiers: [] },
  config: ConfigSnapshot = { state: 'loading' },
  process: ProcessSnapshot = { state: 'loading' },
): BoardPlanProject {
  const runsCount = Object.keys(live.runs).length;
  const anyLive = Object.values(live.runs).some((r) => r.live);
  const received = snapshot.state === 'ok' ? snapshot : null;
  const history = received?.plan.history;
  return {
    name,
    desc,
    live: anyLive,
    plan: readState(snapshot),
    funnel: received ? received.plan.funnel : EMPTY_FUNNEL,
    versions: received ? received.plan.versions : EMPTY_VERSIONS,
    metrics: {
      done: received ? received.plan.done : 0,
      // Plan reçu : on sait que le temps et les jetons ne sont pas mesurés, on le dit. Sinon « — ».
      tokens: received ? UNMEASURED : '—',
      temps: received ? UNMEASURED : '—',
      perFiche: received ? UNMEASURED : '—',
      sprints: history ? history.sprints : '—',
      runs: runsCount > 0 ? runsCount : '—',
      retros: history ? history.retros : '—',
      notes: received ? [UNMEASURED_NOTE, ...(history ? [] : [NO_HISTORY_NOTE])] : [],
    },
    runs: live.runs,
    ...(live.chantiers.length > 0 ? { chantiers: live.chantiers } : {}),
    fiches: received ? received.fiches : {},
    ...(received?.plan.pilotage ? { pilotage: received.plan.pilotage } : {}),
    ...(received?.plan.lastSprints ? { lastSprints: received.plan.lastSprints } : {}),
    ...(received?.plan.objectifs ? { objectifs: received.plan.objectifs } : {}),
    ...(received?.plan.versionsPage ? { versionsPage: received.plan.versionsPage } : {}),
    configState: readState(config),
    ...(config.state === 'ok' ? { config: config.config } : {}),
    processState: readState(process),
    ...(process.state === 'ok' ? { process: process.process } : {}),
  };
}

/**
 * Cache court des runs, par racine de projet. `/api/board` peut être poll souvent ; sans cache,
 * chaque requête relirait tous les journaux du projet sur la boucle unique du daemon.
 */
const LIVE_CACHE_TTL_MS = 5_000;
const liveCache = new Map<string, { at: number; value: LiveBoard }>();

/**
 * BORD I/O — lit les journaux de supervision du projet (`<root>/.supervision/runs/*`) et en tire la
 * part live (runs/chantiers/timeline) via l'adaptateur. Aucun dossier de runs, ou aucun journal keyé
 * (clé de chantier absente — cas d'avant G5), → part live VIDE : jamais un faux run.
 */
export function composeLive(root: string, now: number = Date.now()): LiveBoard {
  const runsDir = join(root, '.supervision', 'runs');
  if (!existsSync(runsDir)) return { runs: {}, chantiers: [] };
  try {
    const inputs: ChantierInput[] = readdirSync(runsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => ({ projectRoot: root, runDir: join(runsDir, e.name) }));
    return adaptChantiers(projectChantiers(inputs, { now }), now);
  } catch {
    return { runs: {}, chantiers: [] };
  }
}

function cachedLive(root: string, now: number): LiveBoard {
  const hit = liveCache.get(root);
  if (hit && now - hit.at < LIVE_CACHE_TTL_MS) return hit.value;
  const value = composeLive(root, now);
  liveCache.set(root, { at: now, value });
  return value;
}

/** BORD I/O — compose un `BoardProject` : plan et config déjà en mémoire (jamais d'attente) + runs du journal. */
export function composeProject(
  input: BoardProjectInput,
  sources: BoardSources,
  now: number = Date.now(),
): BoardPlanProject {
  return shapeProject(
    input.name,
    input.desc ?? '',
    sources.plan.get(input.root),
    cachedLive(input.root, now),
    sources.config.get(input.root),
    sources.process.get(input.root),
  );
}

/** BORD I/O — compose la `BoardData` (projets indexés par nom) des projets surveillés. */
export function composeBoardData(
  projects: readonly BoardProjectInput[],
  sources: BoardSources,
): Record<string, BoardPlanProject> {
  const out: Record<string, BoardPlanProject> = {};
  for (const p of projects) out[p.name] = composeProject(p, sources);
  return out;
}
