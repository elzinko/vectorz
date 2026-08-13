import { describe, expect, it } from 'vitest';
import { buildInventory } from './inventory.js';
import { StubSource } from './sources.js';

describe('buildInventory — AC1', () => {
  it('compte PRs mergées, fiches done, et runs .supervision conformes', () => {
    const source = new StubSource(
      [
        { number: 1, branch: 'feat/a', mergedAt: '2026-08-01T00:00:00Z', files: [], commits: [] },
        { number: 2, branch: 'feat/b', mergedAt: '2026-08-02T00:00:00Z', files: [], commits: [] },
      ],
      [
        { id: '0001', path: 'features/done/0001.md', created: '2026-07-01' },
        { id: '0002', path: 'features/done/0002.md', created: '2026-07-05' },
        { id: '0003', path: 'features/done/0003.md', created: '2026-07-10' },
      ],
      [
        { id: 'run-1', conforms: true },
        { id: 'run-2', conforms: false },
      ],
    );

    expect(buildInventory(source)).toEqual({
      mergedAgentPrCount: 2,
      doneFicheCount: 3,
      supervisionRunsAvailable: true,
      supervisionRunsConformCount: 1,
    });
  });

  it("signale l'absence de runs .supervision sans planter", () => {
    const source = new StubSource([], [], []);
    const inv = buildInventory(source);
    expect(inv.supervisionRunsAvailable).toBe(false);
    expect(inv.supervisionRunsConformCount).toBe(0);
  });
});
