import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ledgerPath } from './ledger.js';
import { measure } from './measure.js';
import { StubSource } from './sources.js';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), '0044-measure-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function agentCommit(sha: string) {
  return {
    sha,
    message: `feat: ${sha}\n\nCo-authored-by: Claude Opus 4.8 <noreply@anthropic.com>`,
    timestamp: '2026-08-01T00:00:00Z',
    authorType: 'agent' as const,
    isMergeCommit: false,
    isRebase: false,
    isFormatting: false,
  };
}

describe('measure — AC2 : un event outcome.measured par sujet de la baseline', () => {
  it('produit un event par PR mergée et par fiche done', () => {
    const source = new StubSource(
      [
        {
          number: 1,
          branch: 'feat/a',
          mergedAt: '2026-08-05T00:00:00Z',
          files: ['x.ts'],
          commits: [agentCommit('a1')],
        },
      ],
      [
        {
          id: '0001',
          path: 'features/done/0001.md',
          created: '2026-08-01',
          mergedAt: '2026-08-03T00:00:00Z',
        },
      ],
      [],
    );

    const result = measure(source, root);

    expect(result.events).toHaveLength(2);
    expect(result.events.every((e) => e.event === 'outcome.measured')).toBe(true);
    expect(result.events[0]).toMatchObject({ subject: { pr: 1 } });
    expect(result.events[1]).toMatchObject({ subject: { fiche: '0001' } });
    expect(result.events.every((e) => typeof e.ts === 'string' && e.measurer_version)).toBe(true);
  });

  it('écrit réellement dans .improvement/outcomes.jsonl', () => {
    const source = new StubSource(
      [{ number: 1, branch: 'feat/a', mergedAt: '2026-08-05T00:00:00Z', files: [], commits: [] }],
      [],
      [],
    );
    measure(source, root);
    const lines = readFileSync(ledgerPath(root), 'utf8').trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] as string).event).toBe('outcome.measured');
  });

  it('respecte la taille de baseline N (options.baselineSize)', () => {
    const prs = Array.from({ length: 5 }, (_, i) => ({
      number: i,
      branch: 'feat/x',
      mergedAt: '2026-08-01T00:00:00Z',
      files: [],
      commits: [],
    }));
    const source = new StubSource(prs, [], []);
    const result = measure(source, root, { baselineSize: 2 });
    expect(result.events).toHaveLength(2);
  });
});

describe('measure — AC6 idempotence bout-en-bout', () => {
  it('deux exécutions successives sur la même source ⇒ aucun doublon dans le ledger', () => {
    const source = new StubSource(
      [{ number: 1, branch: 'feat/a', mergedAt: '2026-08-05T00:00:00Z', files: [], commits: [] }],
      [
        {
          id: '0001',
          path: 'features/done/0001.md',
          created: '2026-08-01',
          mergedAt: '2026-08-03T00:00:00Z',
        },
      ],
      [],
    );

    measure(source, root);
    measure(source, root);

    const lines = readFileSync(ledgerPath(root), 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);
  });
});

describe('measure — signal reprise_post_merge (AC4) intégré à la baseline', () => {
  it('marque une PR comme requalifiée si un correctif sur les mêmes fichiers suit sous la fenêtre', () => {
    const source = new StubSource(
      [
        {
          number: 1,
          branch: 'feat/a',
          mergedAt: '2026-08-01T00:00:00Z',
          files: ['x.ts'],
          commits: [],
        },
        {
          number: 2,
          branch: 'fix/a',
          mergedAt: '2026-08-02T00:00:00Z',
          files: ['x.ts'],
          commits: [],
        },
      ],
      [],
      [],
    );
    const result = measure(source, root);
    const first = result.events.find((e) => e.subject.pr === 1);
    expect(first?.metrics.reprise_post_merge).toBe(true);
  });
});
