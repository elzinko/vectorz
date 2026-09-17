import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { RUNS_DATA_BEGIN, RUNS_DATA_END, buildRunsDataBlock } from '../core/runs-data.js';
import { loadRuns } from '../loaders/runs.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz
const viewPath = join(repoRoot, 'diagrams', 'runs', 'runs.html');

describe('runs.html — invariant « régénéré ≡ disque »', () => {
  it('le bloc de données committé correspond au regen depuis docs/sessions/', () => {
    const expected = buildRunsDataBlock(loadRuns(repoRoot));
    const html = readFileSync(viewPath, 'utf8');
    const b = html.indexOf(RUNS_DATA_BEGIN);
    const e = html.indexOf(RUNS_DATA_END);
    expect(b).toBeGreaterThan(-1);
    expect(e).toBeGreaterThan(b);
    const committed = html.slice(b, e + RUNS_DATA_END.length);
    // Si ça rougit : un récit de docs/sessions/ a changé sans `pnpm --dir products/mega-city runs:regen`.
    expect(committed).toBe(expected);
  });
});
