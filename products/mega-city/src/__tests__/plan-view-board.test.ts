import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * board.html — l'onglet « Plan » est FIDÈLE PAR CONSTRUCTION (même patron que
 * avancement-board.test.ts). Le bloc `window.EZK_PLAN` régénéré en mémoire depuis
 * `features/PLAN.md` + le backlog réel doit être EXACTEMENT le bloc présent sur disque :
 * PLAN.md ou une fiche modifiés sans relancer `pnpm plan-view:regen` ⇒ ce test rougit
 * (fiche 20260825213807501). Les marqueurs `ezk-plan-data:*` sont DISJOINTS de ceux
 * d'avancement — les deux blocs cohabitent sans se marcher dessus.
 */
import { describe, expect, it } from 'vitest';
import {
  PLAN_DATA_BEGIN,
  PLAN_DATA_END,
  buildPlanViewDataBlock,
  upsertPlanViewDataBlock,
} from '../core/plan-view-data.js';
import { loadFiches } from '../loaders/fiches.js';

const here = dirname(fileURLToPath(import.meta.url));
const megaCity = resolve(here, '../..'); // products/mega-city
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz
const boardPath = join(repoRoot, 'diagrams', 'avancement', 'board.html');
const planPath = join(repoRoot, 'features', 'PLAN.md');

function extractBlock(text: string): string {
  const beginIdx = text.indexOf(PLAN_DATA_BEGIN);
  const endIdx = text.indexOf(PLAN_DATA_END);
  if (beginIdx === -1 || endIdx === -1) {
    throw new Error('bloc ezk-plan-data absent de board.html — lancer `pnpm plan-view:regen`');
  }
  return text.slice(beginIdx, endIdx + PLAN_DATA_END.length);
}

describe('diagrams/avancement/board.html — onglet Plan à jour (fidélité par construction)', () => {
  it('le bloc EZK_PLAN régénéré en mémoire est identique au bloc présent sur disque', () => {
    const expected = buildPlanViewDataBlock(readFileSync(planPath, 'utf8'), loadFiches(repoRoot));
    const actual = extractBlock(readFileSync(boardPath, 'utf8'));
    expect(actual).toBe(expected);
  });

  it('upsertPlanViewDataBlock refuse un HTML sans marqueurs (erreur franche, pas d’append)', () => {
    expect(() => upsertPlanViewDataBlock('<title>x</title>', 'bloc')).toThrow(/marqueurs/);
  });

  it('les deux blocs gérés (avancement + plan) coexistent, marqueurs disjoints', () => {
    const html = readFileSync(boardPath, 'utf8');
    expect(html).toContain(PLAN_DATA_BEGIN);
    expect(html).toContain('/*ezk-avancement-data:begin*/');
    expect(html).toContain('window.EZK_PLAN');
    expect(html).toContain('window.EZK_AVANCEMENT');
  });

  it('le rendu du plan n’injecte jamais une donnée (titre/label/texte) via innerHTML (anti-XSS)', () => {
    const html = readFileSync(boardPath, 'utf8');
    expect(html).toMatch(/\.textContent\s*=/);
    // Aucune donnée de carte/ligne/couloir posée par innerHTML.
    expect(html).not.toMatch(/innerHTML\s*=\s*[^;]*\b(c|row|lane)\.(title|label|text|id|status)\b/);
  });
});
