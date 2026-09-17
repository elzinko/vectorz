import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  PILOTAGE_DATA_BEGIN,
  PILOTAGE_DATA_END,
  buildPilotageDataBlock,
} from '../core/pilotage-data.js';
import { loadFiches } from '../loaders/fiches.js';
import { loadRuns } from '../loaders/runs.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz
const viewPath = join(repoRoot, 'diagrams', 'pilotage', 'pilotage.html');

describe('pilotage.html — invariant « régénéré ≡ disque »', () => {
  it('le bloc committé correspond au regen (milestones + runs)', () => {
    const expected = buildPilotageDataBlock(loadFiches(repoRoot), loadRuns(repoRoot));
    const html = readFileSync(viewPath, 'utf8');
    const b = html.indexOf(PILOTAGE_DATA_BEGIN);
    const e = html.indexOf(PILOTAGE_DATA_END);
    expect(b).toBeGreaterThan(-1);
    expect(e).toBeGreaterThan(b);
    const committed = html.slice(b, e + PILOTAGE_DATA_END.length);
    // Si ça rougit : le backlog ou docs/sessions/ a changé sans `pnpm --dir products/mega-city pilotage:regen`.
    expect(committed).toBe(expected);
  });
});
