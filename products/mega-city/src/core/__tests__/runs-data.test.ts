import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { RunReport } from '../../loaders/runs.js';
import { loadRuns } from '../../loaders/runs.js';
import {
  RUNS_DATA_BEGIN,
  RUNS_DATA_END,
  buildRunsData,
  buildRunsDataBlock,
  upsertRunsDataBlock,
} from '../runs-data.js';

const R = (over: Partial<RunReport>): RunReport => ({
  file: 'docs/sessions/2026-01-01-x.md',
  date: '2026-01-01',
  slug: 'x',
  title: 'X',
  fiches: [],
  prs: [],
  ...over,
});

describe('buildRunsData', () => {
  it('compte total, avec-PR, PR distinctes, fiches distinctes (dédupliquées)', () => {
    const data = buildRunsData([
      R({ prs: ['1', '2'], fiches: ['a'] }),
      R({ prs: ['2'], fiches: ['a', 'b'] }), // PR 2 et fiche a dédupliquées au global
      R({ prs: [], fiches: [] }),
    ]);
    expect(data.counts).toEqual({ total: 3, withPr: 2, prs: 2, fiches: 2 });
  });

  it("préserve l'ordre reçu (le tri est fait par le loader)", () => {
    const data = buildRunsData([R({ slug: 'a' }), R({ slug: 'b' })]);
    expect(data.runs.map((r) => r.slug)).toEqual(['a', 'b']);
  });
});

describe('bloc de données de runs.html', () => {
  it('upsert remplace le contenu entre les marqueurs (round-trip)', () => {
    const html = `avant ${RUNS_DATA_BEGIN}\nOLD\n${RUNS_DATA_END} après`;
    const out = upsertRunsDataBlock(html, buildRunsDataBlock([R({})]));
    expect(out.startsWith('avant ')).toBe(true);
    expect(out.endsWith(' après')).toBe(true);
    expect(out).toContain('window.EZK_RUNS =');
    expect(out).not.toContain('OLD');
  });

  it('échoue franchement si les marqueurs manquent', () => {
    expect(() => upsertRunsDataBlock('<title>x</title>', 'bloc')).toThrow(/marqueurs/);
  });

  it('échappe `<` pour qu\'un titre ne ferme pas la balise <script>', () => {
    const block = buildRunsDataBlock([R({ title: 'a </script> b' })]);
    expect(block).not.toContain('</script>');
    expect(block).toContain('\\u003c');
  });
});

describe('loadRuns — invariant sur les récits RÉELS de docs/sessions/', () => {
  // Ce test vit dans src/core/__tests__/ → 5 niveaux jusqu'à la racine vectorz.
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');

  it('charge des récits datés, triés du plus récent au plus ancien', () => {
    const runs = loadRuns(repoRoot);
    expect(runs.length).toBeGreaterThan(5); // le dossier docs/sessions/ existe et est peuplé
    for (const r of runs) {
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.file.startsWith('docs/sessions/')).toBe(true);
      expect(r.title.length).toBeGreaterThan(0);
    }
    const dates = runs.map((r) => r.date);
    expect([...dates].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))).toEqual(dates); // décroissant
  });

  it('extrait au moins une PR (mode structuré) sur un récit qui en cite', () => {
    expect(loadRuns(repoRoot).some((r) => r.prs.length > 0)).toBe(true);
  });
});
