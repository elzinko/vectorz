/**
 * boardProvider — compose les données du board de chaque projet surveillé, chez cop1, SANS importer
 * mega-city (ADR-021). Le PLAN (entonnoir, versions, détail des fiches) vient de la méthode par la
 * commande `ezk` (ADR-086), via `EzkPlanSource` : cop1 ne lit plus lui-même les fiches.
 *
 * Quand le plan n'est pas là (`loading`, `unavailable`), l'entonnoir, les versions et les fiches
 * restent VIDES et `plan` dit pourquoi : jamais un faux chiffre. Les runs, eux, se lisent dans
 * `<root>/.supervision/runs` et s'affichent dans tous les cas.
 *
 * Cœur PUR (`shapeProject`) = mise en forme testable sans disque ; bord I/O (`composeProject`,
 * `composeBoardData`, `composeLive`) = lecture de la source de plan et des journaux de runs.
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
import type { EzkPlanSource, PlanSnapshot } from './ezkPlanSource.js';
import type { FicheDetailData, PlanFunnel, PlanVersions } from './planTypes.js';

/** Un projet à composer : son nom (clé du board) et la racine où lire son backlog. */
export interface BoardProjectInput {
  name: string;
  root: string;
  desc?: string;
}

/** L'état du plan d'un projet, tel que la page l'affiche. */
export type BoardPlanState =
  | { state: 'ok' }
  | { state: 'loading' }
  | { state: 'unavailable'; reason: string };

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
    /** Non encore câblés par le read-model : `'—'`, jamais un faux 0. Viennent avec l'adaptateur des runs. */
    sprints: number | '—';
    runs: number | '—';
    retros: number | '—';
  };
  /** Runs observés via l'adaptateur `projectChantiers` — vide tant qu'aucun journal keyé n'existe (jamais un faux run). */
  runs: Record<string, LiveRun>;
  /** Chantiers multi-sessions (ADR-079), fils du plus récent au plus ancien — présent seulement s'il y en a. */
  chantiers?: LiveChantier[];
  /** Détail des fiches NON livrées (pour la modale du board). */
  fiches: Record<string, FicheDetailData>;
}

const EMPTY_FUNNEL: PlanFunnel = { idea: 0, ready: 0, wip: 0, unversioned: 0, parked: 0 };
const EMPTY_VERSIONS: PlanVersions = { current: null, upcoming: [], past: [] };

function planState(snapshot: PlanSnapshot): BoardPlanState {
  if (snapshot.state === 'unavailable') return { state: 'unavailable', reason: snapshot.reason };
  return { state: snapshot.state };
}

/** CŒUR PUR — met le plan reçu à la forme d'un `BoardProject`. Les chiffres non encore câblés
 *  (jetons, temps, sprints, runs, rétros) sont des placeholders honnêtes, jamais de faux zéros déguisés. */
export function shapeProject(
  name: string,
  desc: string,
  snapshot: PlanSnapshot,
  live: LiveBoard = { runs: {}, chantiers: [] },
): BoardPlanProject {
  const runsCount = Object.keys(live.runs).length;
  const anyLive = Object.values(live.runs).some((r) => r.live);
  const received = snapshot.state === 'ok' ? snapshot : null;
  return {
    name,
    desc,
    live: anyLive,
    plan: planState(snapshot),
    funnel: received ? received.plan.funnel : EMPTY_FUNNEL,
    versions: received ? received.plan.versions : EMPTY_VERSIONS,
    metrics: {
      done: received ? received.plan.done : 0,
      tokens: '—',
      temps: '—',
      perFiche: '—',
      sprints: '—',
      runs: runsCount > 0 ? runsCount : '—',
      retros: '—',
    },
    runs: live.runs,
    ...(live.chantiers.length > 0 ? { chantiers: live.chantiers } : {}),
    fiches: received ? received.fiches : {},
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

/** BORD I/O — compose un `BoardProject` : plan déjà en mémoire (jamais d'attente) + runs du journal. */
export function composeProject(
  input: BoardProjectInput,
  source: EzkPlanSource,
  now: number = Date.now(),
): BoardPlanProject {
  return shapeProject(
    input.name,
    input.desc ?? '',
    source.get(input.root),
    cachedLive(input.root, now),
  );
}

/** BORD I/O — compose la `BoardData` (projets indexés par nom) des projets surveillés. */
export function composeBoardData(
  projects: readonly BoardProjectInput[],
  source: EzkPlanSource,
): Record<string, BoardPlanProject> {
  const out: Record<string, BoardPlanProject> = {};
  for (const p of projects) out[p.name] = composeProject(p, source);
  return out;
}
