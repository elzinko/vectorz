/**
 * boardProvider — compose la part « PLAN » des données du board (ADR-074) depuis le backlog de
 * chaque projet surveillé, chez cop1, SANS importer mega-city (ADR-021). Il réutilise le lecteur
 * sœur `backlogReader` (`projectPlan` + `readBacklogFiches`).
 *
 * Ce qu'il remplit : `funnel`, `versions`, `metrics.done`. Ce qu'il LAISSE vide sciemment : les
 * `runs` (et `chantiers`/`timeline`), qui demandent l'adaptateur `projectChantiers → BoardRun`
 * (fiche sœur « runs réels », à brancher). `BoardProject` les déclare optionnels/vides : un projet
 * sans runs s'affiche donc honnêtement avec son seul plan, jamais un faux run.
 *
 * Cœur PUR (`shapeProject`) = mise en forme testable sans disque ; bord I/O (`composeProject`,
 * `composeBoardData`, `readTags`) = lecture du backlog + des étiquettes git.
 */
import { execFileSync } from 'node:child_process';
import { type PlanData, projectPlan, readBacklogFiches } from './backlogReader.js';
import { type FicheDetailData, readFicheDetails } from './ficheDetail.js';

/** Un projet à composer : son nom (clé du board) et la racine où lire son backlog. */
export interface BoardProjectInput {
  name: string;
  root: string;
  desc?: string;
}

/** La part « plan » d'un `BoardProject` (sous-ensemble structurel des types du board web, ADR-074). */
export interface BoardPlanProject {
  name: string;
  desc: string;
  live: boolean;
  funnel: PlanData['funnel'];
  versions: PlanData['versions'];
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
  /** Vide tant que l'adaptateur des runs (fiche sœur) n'est pas branché — jamais un faux run. */
  runs: Record<string, never>;
  /** Détail des fiches ACTIVES (pour la modale du board) — part « plan réel ». */
  fiches: Record<string, FicheDetailData>;
}

/** CŒUR PUR — met le plan calculé à la forme d'un `BoardProject`. Les chiffres non encore câblés
 *  (jetons, temps, sprints, runs, rétros) sont des placeholders honnêtes, jamais de faux zéros déguisés. */
export function shapeProject(
  name: string,
  desc: string,
  plan: PlanData,
  fiches: Record<string, FicheDetailData> = {},
): BoardPlanProject {
  return {
    name,
    desc,
    live: false,
    funnel: plan.funnel,
    versions: plan.versions,
    metrics: { done: plan.done, tokens: '—', temps: '—', perFiche: '—', sprints: '—', runs: '—', retros: '—' },
    runs: {},
    fiches,
  };
}

/** Lit les étiquettes de version d'un dépôt git (`v*`) pour classer les versions. Best-effort. */
export function readTags(root: string): Set<string> {
  try {
    const out = execFileSync('git', ['-C', root, 'tag', '--list', 'v*'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 2000, // ne jamais figer le daemon si git bloque (lock, dépôt géant)
      maxBuffer: 1 << 20,
    });
    return new Set(
      out
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    );
  } catch {
    return new Set(); // pas de git / pas de tags → versions non taguées, dégrade proprement
  }
}

/**
 * Cache court, par racine de projet. `/api/board` peut être poll souvent ; sans cache, chaque
 * requête relirait TOUT le backlog et relancerait `git` par projet, sur la boucle unique du daemon.
 * TTL volontairement bas : le board reste frais à quelques secondes près.
 */
const CACHE_TTL_MS = 5_000;
const cache = new Map<string, { at: number; value: BoardPlanProject }>();

/** BORD I/O — compose un `BoardProject` (part plan) en lisant le backlog + les tags d'un projet. */
export function composeProject(input: BoardProjectInput, now: number = Date.now()): BoardPlanProject {
  const hit = cache.get(input.root);
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.value;
  const plan = projectPlan(readBacklogFiches(input.root), readTags(input.root));
  const value = shapeProject(input.name, input.desc ?? '', plan, readFicheDetails(input.root));
  cache.set(input.root, { at: now, value });
  return value;
}

/** BORD I/O — compose la `BoardData` (projets indexés par nom) des projets surveillés. */
export function composeBoardData(projects: readonly BoardProjectInput[]): Record<string, BoardPlanProject> {
  const out: Record<string, BoardPlanProject> = {};
  for (const p of projects) out[p.name] = composeProject(p);
  return out;
}
