import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * board.html — l'encart « écart plan » est FIDÈLE PAR CONSTRUCTION (même patron que
 * plan-view-board.test.ts). Le bloc `window.EZK_PLAN_DELTA` régénéré en mémoire depuis
 * `features/PLAN.md` + le backlog réel doit être EXACTEMENT le bloc présent sur disque :
 * PLAN.md ou une fiche modifiés sans relancer `pnpm plan-delta:regen` ⇒ ce test rougit
 * (fiche 20260828165644386). Les marqueurs `ezk-plan-delta:*` sont DISJOINTS de ceux
 * d'avancement ET de plan-view — les trois blocs cohabitent sans se marcher dessus.
 */
import { describe, expect, it } from 'vitest';
import {
  PLAN_DELTA_BEGIN,
  PLAN_DELTA_END,
  buildPlanDeltaBlock,
  upsertPlanDeltaBlock,
} from '../core/plan-delta-data.js';
import { loadFiches } from '../loaders/fiches.js';

const here = dirname(fileURLToPath(import.meta.url));
const megaCity = resolve(here, '../..'); // products/mega-city
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz
const boardPath = join(repoRoot, 'diagrams', 'avancement', 'board.html');
const planPath = join(repoRoot, 'features', 'PLAN.md');

function extractBlock(text: string): string {
  const beginIdx = text.indexOf(PLAN_DELTA_BEGIN);
  const endIdx = text.indexOf(PLAN_DELTA_END);
  if (beginIdx === -1 || endIdx === -1) {
    throw new Error('bloc ezk-plan-delta absent de board.html — lancer `pnpm plan-delta:regen`');
  }
  return text.slice(beginIdx, endIdx + PLAN_DELTA_END.length);
}

describe('diagrams/avancement/board.html — encart « écart plan » à jour (fidélité par construction)', () => {
  it('le bloc EZK_PLAN_DELTA régénéré en mémoire est identique au bloc présent sur disque', () => {
    const expected = buildPlanDeltaBlock(readFileSync(planPath, 'utf8'), loadFiches(repoRoot));
    const actual = extractBlock(readFileSync(boardPath, 'utf8'));
    expect(actual).toBe(expected);
  });

  it('upsertPlanDeltaBlock refuse un HTML sans marqueurs (erreur franche, pas d’append)', () => {
    expect(() => upsertPlanDeltaBlock('<title>x</title>', 'bloc')).toThrow(/marqueurs/);
  });

  it('les trois blocs gérés (avancement + plan + delta) coexistent, marqueurs disjoints', () => {
    const html = readFileSync(boardPath, 'utf8');
    expect(html).toContain(PLAN_DELTA_BEGIN);
    expect(html).toContain('/*ezk-plan-data:begin*/');
    expect(html).toContain('/*ezk-avancement-data:begin*/');
    expect(html).toContain('window.EZK_PLAN_DELTA');
  });
});
