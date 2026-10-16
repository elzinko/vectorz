/**
 * Board unifié cop1 — logique d'activité (fiche 20261012231419211), pure.
 *
 * Un *run* contient des *moments* (étapes). On le regarde par *lentille* :
 * côté cadrage (idéation → grooming → prête → release) ou côté développement
 * (sprint → revue → QA → rétro → tag). Les pastilles et libellés viennent d'ici,
 * jamais d'un texte inventé.
 */
import type { BoardProject, BoardRun, FicheStatus, Moment, RunKind } from './types.js';

/** Étape de process → pastille courte. */
export const STEP_LABEL: Record<string, string> = {
  ideation: 'idée',
  grooming: 'groom',
  ready: 'DoR',
  sprint: 'sprint',
  review: 'revue',
  qa: 'QA',
  retro: 'rétro',
  release: 'release-gate',
  livre: 'tag',
};

/** Statut de fiche → libellé singulier. */
export const STATUS_LABEL: Record<FicheStatus, string> = {
  idea: 'idée',
  ready: 'prête',
  wip: 'en cours',
  done: 'livrée',
};

const CAD_STEPS = ['ideation', 'grooming', 'ready', 'release'];
const DEV_STEPS = ['sprint', 'review', 'qa', 'retro', 'livre'];

function lensSteps(lens: RunKind): string[] {
  return lens === 'cadrage' ? CAD_STEPS : DEV_STEPS;
}

/** Un run est visible dans une lentille s'il porte ≥ 1 moment de cette lentille. */
export function runHasLens(run: BoardRun, lens: RunKind): boolean {
  const steps = lensSteps(lens);
  return (run.moments ?? []).some((m) => steps.includes(m.step));
}

/** Les runs d'un projet visibles dans une lentille, dans l'ordre de déclaration. */
export function runsForLens(project: BoardProject, lens: RunKind): BoardRun[] {
  return Object.values(project.runs).filter((r) => runHasLens(r, lens));
}

/** Une pastille d'étape (sprint numéroté → « S1 »). */
export interface Chip {
  key: string;
  label: string;
}

/** Les pastilles de moments d'un run, pour une lentille donnée. */
export function runChips(run: BoardRun, lens: RunKind): Chip[] {
  const steps = lensSteps(lens);
  return (run.moments ?? [])
    .filter((m) => steps.includes(m.step))
    .map((m, i) =>
      m.step === 'sprint'
        ? { key: `sprint-${m.n ?? i}`, label: `S${m.n ?? ''}` }
        : { key: `${m.step}-${i}`, label: STEP_LABEL[m.step] ?? m.step },
    );
}

/** Le libellé d'un moment (son `label`, sinon sa pastille d'étape). */
export function momentLabel(m: Moment): string {
  return m.label ?? STEP_LABEL[m.step] ?? m.step;
}

/** La classe de verdict d'un run (vert / rouge / orange). */
export function verdictClass(run: BoardRun): string {
  const v = run.verdict ?? '';
  if (v.startsWith('GO')) return 'v-go';
  if (v.startsWith('NO')) return 'v-stop';
  return run.live ? 'v-go' : 'v-warn';
}
