/**
 * Board unifié cop1 — libellés d'activité (fiche 20261012231419211), purs.
 *
 * Un *run* contient des *moments* (étapes). Les pastilles d'étape, les libellés de
 * statut et la couleur d'un verdict viennent d'ici, jamais d'un texte inventé.
 */
import type { BoardRun, FicheStatus, Moment } from './types.js';

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
  parked: 'parkée',
};

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
