/**
 * Tests unitaires de `AbandonRunUseCase` — politique D4 (ADR-035).
 * Rubrique A du Gherkin abandon-run.feature :
 *   - 404 si runDir inconnu
 *   - 409 si run vivant / at_gate / finished
 *   - 409 + marche à suivre si abandon_command vide
 *   - 200 + appel du port si running + presumed_dead + capacité configurée
 *
 * Rubrique C (D6) — pas de mise à jour optimiste du snapshot
 */
import { describe, expect, it, vi } from 'vitest';
import { AbandonRunUseCase } from '../application/AbandonRunUseCase.js';
import type { RunAbandonPort } from '../domain/RunAbandonPort.js';
import type { RunSnapshot } from '../domain/RunSnapshot.js';

function makeSnapshot(overrides: Partial<RunSnapshot> = {}): RunSnapshot {
  return {
    runId: 'run-test-1',
    state: 'running',
    liveness: 'presumed_dead',
    projectRoot: '/projects/my-project',
    runDir: '/projects/my-project/.supervision/runs/run-test-1',
    emissionClass: 'B',
    gates: [],
    violations: [],
    notices: [],
    tokens: { provenance: 'confirmed' },
    ...overrides,
  } as RunSnapshot;
}

const CONFIGURED_COMMAND = ['npx', 'mega-city', 'supervision:abandon'];

function makePort(outcome: Awaited<ReturnType<RunAbandonPort['abandon']>>): RunAbandonPort {
  return { abandon: vi.fn().mockResolvedValue(outcome) };
}

describe('AbandonRunUseCase — §A Politique D4', () => {
  it('404 si le runDir soumis est inconnu du serveur', async () => {
    const uc = new AbandonRunUseCase({
      getSnapshot: () => undefined,
      abandonPort: makePort({ ok: true, runId: 'irrelevant' }),
      abandonCommand: CONFIGURED_COMMAND,
    });

    const result = await uc.execute('/inconnue/runDir');
    expect(result.status).toBe(404);
  });

  it('409 si le run est running mais liveness=alive (pas presumed_dead)', async () => {
    const snapshot = makeSnapshot({ state: 'running', liveness: 'alive' });
    const port = makePort({ ok: true, runId: snapshot.runId });
    const uc = new AbandonRunUseCase({
      getSnapshot: (runDir) => (runDir === snapshot.runDir ? snapshot : undefined),
      abandonPort: port,
      abandonCommand: CONFIGURED_COMMAND,
    });

    const result = await uc.execute(snapshot.runDir);
    expect(result.status).toBe(409);
    expect((port.abandon as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it('409 si le run est at_gate (silence voulu, jamais presumed_dead)', async () => {
    const snapshot = makeSnapshot({ state: 'at_gate', liveness: 'alive' });
    const port = makePort({ ok: true, runId: snapshot.runId });
    const uc = new AbandonRunUseCase({
      getSnapshot: (runDir) => (runDir === snapshot.runDir ? snapshot : undefined),
      abandonPort: port,
      abandonCommand: CONFIGURED_COMMAND,
    });

    const result = await uc.execute(snapshot.runDir);
    expect(result.status).toBe(409);
    expect((port.abandon as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it('409 si le run est finished', async () => {
    const snapshot = makeSnapshot({ state: 'finished', liveness: 'alive' });
    const port = makePort({ ok: true, runId: snapshot.runId });
    const uc = new AbandonRunUseCase({
      getSnapshot: (runDir) => (runDir === snapshot.runDir ? snapshot : undefined),
      abandonPort: port,
      abandonCommand: CONFIGURED_COMMAND,
    });

    const result = await uc.execute(snapshot.runDir);
    expect(result.status).toBe(409);
    expect((port.abandon as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it('409 avec marche à suivre si abandon_command est vide (capacité dormante)', async () => {
    const snapshot = makeSnapshot({ state: 'running', liveness: 'presumed_dead' });
    const port = makePort({ ok: true, runId: snapshot.runId });
    const uc = new AbandonRunUseCase({
      getSnapshot: (runDir) => (runDir === snapshot.runDir ? snapshot : undefined),
      abandonPort: port,
      abandonCommand: [],
    });

    const result = await uc.execute(snapshot.runDir);
    expect(result.status).toBe(409);
    if (result.status === 409) {
      expect(result.error).toMatch(/abandon_command|configur/i);
    }
    expect((port.abandon as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it('200 et appel du port si running + presumed_dead + capacité configurée', async () => {
    const snapshot = makeSnapshot({ state: 'running', liveness: 'presumed_dead' });
    const port = makePort({ ok: true, runId: snapshot.runId });
    const uc = new AbandonRunUseCase({
      getSnapshot: (runDir) => (runDir === snapshot.runDir ? snapshot : undefined),
      abandonPort: port,
      abandonCommand: CONFIGURED_COMMAND,
    });

    const result = await uc.execute(snapshot.runDir);
    expect(result.status).toBe(200);
    expect((port.abandon as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
    expect((port.abandon as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toMatchObject({
      projectRoot: snapshot.projectRoot,
      expectedRunId: snapshot.runId,
    });
  });
});

describe('AbandonRunUseCase — §C D6 : pas de mise à jour optimiste', () => {
  it('le snapshot en mémoire reste inchangé après un abandon réussi', async () => {
    const snapshot = makeSnapshot({ state: 'running', liveness: 'presumed_dead' });
    const storedSnapshot = snapshot;
    const port = makePort({ ok: true, runId: snapshot.runId });

    const uc = new AbandonRunUseCase({
      getSnapshot: (runDir) => (runDir === snapshot.runDir ? storedSnapshot : undefined),
      abandonPort: port,
      abandonCommand: CONFIGURED_COMMAND,
    });

    await uc.execute(snapshot.runDir);

    // Le snapshot doit être INCHANGÉ — pas de mise à jour optimiste
    expect(storedSnapshot.state).toBe('running');
    expect(storedSnapshot.liveness).toBe('presumed_dead');
    // storedSnapshot n'a pas été muté par le use case
    expect(storedSnapshot).toBe(snapshot);
  });
});

describe('EmitterCliAbandonAdapter — §B Provenance D3', () => {
  it('la commande spawnée est celle de la config du siège, jamais du projet surveillé', async () => {
    const { EmitterCliAbandonAdapter } = await import(
      '../infrastructure/EmitterCliAbandonAdapter.js'
    );

    const spawnCalls: Array<{ command: string; args: string[] }> = [];
    const mockSpawn = async (command: string, args: string[]) => {
      spawnCalls.push({ command, args });
      return { exitCode: 0, stderr: '' };
    };

    const adapter = new EmitterCliAbandonAdapter(
      ['npx', 'mega-city', 'supervision:abandon'],
      mockSpawn,
    );

    await adapter.abandon({ projectRoot: '/projet', expectedRunId: 'run-abc' });

    expect(spawnCalls).toHaveLength(1);
    expect(spawnCalls[0]?.command).toBe('npx');
    expect(spawnCalls[0]?.args).toEqual(['mega-city', 'supervision:abandon', '/projet', 'run-abc']);
  });

  it('retourne ok:false si la commande échoue (exitCode != 0)', async () => {
    const { EmitterCliAbandonAdapter } = await import(
      '../infrastructure/EmitterCliAbandonAdapter.js'
    );

    const mockSpawn = async () => ({ exitCode: 1, stderr: 'run attendu ≠ run ouvert' });
    const adapter = new EmitterCliAbandonAdapter(['npx', 'supervision:abandon'], mockSpawn);

    const result = await adapter.abandon({ projectRoot: '/projet', expectedRunId: 'run-vieux' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('run attendu');
    }
  });
});
