import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * board.html — la COQUE de l'onglet « Plan » (fiche 20260825213807501).
 *
 * Les données `window.EZK_PLAN` ne sont plus dans la page : elles vivent dans `board.data.js`,
 * non committé (ADR-0055). Leur fidélité à `features/PLAN.md` + au backlog est prouvée dans
 * `untracked-views.test.ts`. Ici on garde le garde-fou propre à la coque : le rendu ne pose
 * jamais une donnée via innerHTML.
 */
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const megaCity = resolve(here, '../..'); // products/mega-city
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz
const boardPath = join(repoRoot, 'diagrams', 'avancement', 'board.html');

describe('diagrams/avancement/board.html — onglet Plan (la coque)', () => {
  it('le rendu du plan n’injecte jamais une donnée (titre/label/texte) via innerHTML (anti-XSS)', () => {
    const html = readFileSync(boardPath, 'utf8');
    expect(html).toMatch(/\.textContent\s*=/);
    // Aucune donnée de carte/ligne/couloir posée par innerHTML.
    expect(html).not.toMatch(/innerHTML\s*=\s*[^;]*\b(c|row|lane)\.(title|label|text|id|status)\b/);
  });
});
