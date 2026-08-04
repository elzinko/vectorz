import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RunHistoryService } from './RunHistoryService.js';
import { SprintLogTokenReader } from '../infrastructure/SprintLogTokenReader.js';

describe('RunHistoryService (fiche 0022)', () => {
  it('liste les runs triés par startedAt desc avec issue et durée', () => {
    const root = mkdtempSync(join(tmpdir(), 'history-root-'));
    const runsDir = join(root, '.supervision', 'runs');
    mkdirSync(runsDir, { recursive: true });

    const olderDir = join(runsDir, '2026-01-01T10-00-00-000Z-old');
    const newerDir = join(runsDir, '2026-01-02T10-00-00-000Z-new');
    mkdirSync(olderDir);
    mkdirSync(newerDir);

    writeFileSync(
      join(olderDir, 'events.jsonl'),
      `${JSON.stringify({
        event_id: 'e1',
        run_id: 'old',
        seq: 1,
        ts: '2026-01-01T10:00:00.000Z',
        contract: 'cop1/supervisability@0.1',
        type: 'run.started',
        payload: { method: { name: 'alpha' }, seat: 'human' },
      })}\n${JSON.stringify({
        event_id: 'e2',
        run_id: 'old',
        seq: 2,
        ts: '2026-01-01T10:05:00.000Z',
        contract: 'cop1/supervisability@0.1',
        type: 'run.finished',
        payload: { status: 'success' },
      })}\n`,
    );

    writeFileSync(
      join(newerDir, 'events.jsonl'),
      `${JSON.stringify({
        event_id: 'e1',
        run_id: 'new',
        seq: 1,
        ts: '2026-01-02T10:00:00.000Z',
        contract: 'cop1/supervisability@0.1',
        type: 'run.started',
        payload: { method: { name: 'beta' }, seat: 'human' },
      })}\n${JSON.stringify({
        event_id: 'e2',
        run_id: 'new',
        seq: 2,
        ts: '2026-01-02T10:02:00.000Z',
        contract: 'cop1/supervisability@0.1',
        type: 'run.finished',
        payload: { status: 'abandoned', abandoned_by: 'seat' },
      })}\n`,
    );

    try {
      const service = new RunHistoryService({ watchRoots: [root], limit: 10 });
      const entries = service.list();

      expect(entries).toHaveLength(2);
      expect(entries[0]?.method?.name).toBe('beta');
      expect(entries[0]?.issue).toBe('abandoned');
      expect(entries[0]?.durationMs).toBe(120_000);
      expect(entries[1]?.method?.name).toBe('alpha');
      expect(entries[1]?.issue).toBe('success');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('agrège les tokens sprint-log sur la fenêtre du run', () => {
    const root = mkdtempSync(join(tmpdir(), 'history-tokens-'));
    const runsDir = join(root, '.supervision', 'runs');
    const runDir = join(runsDir, '2026-01-03T10-00-00-000Z-tokens');
    mkdirSync(runDir, { recursive: true });

    writeFileSync(
      join(runDir, 'events.jsonl'),
      `${JSON.stringify({
        event_id: 'e1',
        run_id: 'tokens',
        seq: 1,
        ts: '2026-01-03T10:00:00.000Z',
        contract: 'cop1/supervisability@0.1',
        type: 'run.started',
        payload: { method: { name: 'm' } },
      })}\n${JSON.stringify({
        event_id: 'e2',
        run_id: 'tokens',
        seq: 2,
        ts: '2026-01-03T10:10:00.000Z',
        contract: 'cop1/supervisability@0.1',
        type: 'run.finished',
        payload: { status: 'success' },
      })}\n`,
    );

    const logDir = join(root, '.cop1');
    mkdirSync(logDir, { recursive: true });
    writeFileSync(
      join(logDir, 'sprint-log-2026-01-03.jsonl'),
      `${JSON.stringify({
        timestamp: '2026-01-03T10:01:00.000Z',
        eventType: 'llm.call.completed',
        tokenCount: 40,
      })}\n${JSON.stringify({
        timestamp: '2026-01-03T10:02:00.000Z',
        eventType: 'llm.call.completed',
        tokenCount: 60,
      })}\n`,
    );

    try {
      const reader = new SprintLogTokenReader();
      const service = new RunHistoryService({
        watchRoots: [root],
        tokenReader: reader,
        tokenBudget: { sprintMaxTokens: 1000, maxUsdPerSession: 10 },
      });
      const [entry] = service.list();
      expect(entry?.tokens).toEqual({ provenance: 'measured', total: 100, usd: 1 });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
