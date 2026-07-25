import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SupervisionView } from './SupervisionView.js';

interface FakeEventSource {
  onmessage: ((event: { data: string }) => void) | null;
  close: ReturnType<typeof vi.fn>;
}

let lastEventSource: FakeEventSource | null = null;

function stubEventSource(): void {
  vi.stubGlobal(
    'EventSource',
    vi.fn().mockImplementation(() => {
      const instance: FakeEventSource = { onmessage: null, close: vi.fn() };
      lastEventSource = instance;
      return instance;
    }),
  );
}

/** Minimal valid RunSnapshot (contract from ADR-028 §"Contrat backend"). */
function makeSnapshot(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    runId: 'run-1',
    state: 'running',
    lastEventTs: new Date().toISOString(),
    lastEventSeq: 3,
    gates: [],
    violations: [],
    notices: [],
    tokens: { provenance: 'measured' },
    method: { name: 'demo-methode', version: '0.1.0' },
    seat: 'human',
    projectRoot: '/proj',
    runDir: '/proj/.supervision/runs/run-1',
    liveness: 'alive',
    emissionClass: 'B',
    ...overrides,
  };
}

function stubFetch(runs: unknown[]): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(runs) }),
  );
}

/** Push an SSE frame to the live EventSource (waits for the view to subscribe). */
async function pushSse(eventType: string, payload: Record<string, unknown>): Promise<void> {
  await waitFor(() => {
    expect(lastEventSource?.onmessage).toBeTruthy();
  });
  act(() => {
    lastEventSource?.onmessage?.({ data: JSON.stringify({ eventType, payload }) });
  });
}

describe('SupervisionView', () => {
  beforeEach(() => {
    lastEventSource = null;
    stubEventSource();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('hydrates from GET /api/supervision/runs and shows the run by method name', async () => {
    stubFetch([makeSnapshot()]);
    render(<SupervisionView />);

    expect(await screen.findByText(/demo-methode/)).toBeTruthy();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/supervision/runs');
  });

  it('shows the method version and seat (fiche 0061)', async () => {
    stubFetch([makeSnapshot()]);
    render(<SupervisionView />);

    expect(await screen.findByText(/v0\.1\.0/)).toBeTruthy();
    expect(await screen.findByText(/human/)).toBeTruthy();
  });

  it('shows "méthode non déclarée" when a journal omits method (fiche 0061)', async () => {
    stubFetch([makeSnapshot({ method: undefined })]);
    render(<SupervisionView />);

    expect(await screen.findByText(/méthode non déclarée/i)).toBeTruthy();
  });

  it('translates the state into a French badge, never the raw enum', async () => {
    stubFetch([makeSnapshot({ state: 'at_gate' })]);
    render(<SupervisionView />);

    expect(await screen.findByText(/en attente de ta décision/i)).toBeTruthy();
    expect(screen.queryByText(/^at_gate$/)).toBeNull();
  });

  it('applies a supervision.run.updated SSE frame without reloading', async () => {
    stubFetch([makeSnapshot({ state: 'running' })]);
    render(<SupervisionView />);
    await screen.findByText(/demo-methode/);

    await pushSse('supervision.run.updated', makeSnapshot({ state: 'at_gate' }));

    expect(await screen.findByText(/en attente de ta décision/i)).toBeTruthy();
  });

  it('highlights the open gate awaiting a decision (at_gate)', async () => {
    stubFetch([
      makeSnapshot({
        state: 'at_gate',
        gates: [{ gateEventId: 'g1', gateId: 'mon-jalon', outcome: 'ok' }],
      }),
    ]);
    render(<SupervisionView />);

    expect(await screen.findByText(/arrêtée à ce jalon/i)).toBeTruthy();
    expect(await screen.findByText(/mon-jalon/)).toBeTruthy();
  });

  it('renders command clearance and self-reported resumes distinctly', async () => {
    stubFetch([
      makeSnapshot({
        state: 'finished',
        gates: [
          { gateEventId: 'g1', gateId: 'gate-a', resumedAt: '2026-01-01T00:00:00Z', resumeOrigin: 'command' },
          { gateEventId: 'g2', gateId: 'gate-b', resumedAt: '2026-01-01T00:01:00Z', resumeOrigin: 'self_reported' },
        ],
      }),
    ]);
    render(<SupervisionView />);

    expect(await screen.findByText(/reprise autorisée par commande/i)).toBeTruthy();
    expect(await screen.findByText(/reprise déclarée en session/i)).toBeTruthy();
  });

  it('shows absent token provenance as "non mesurés", never 0', async () => {
    stubFetch([makeSnapshot({ tokens: { provenance: 'absent' } })]);
    render(<SupervisionView />);

    expect(await screen.findByText(/non mesurés/i)).toBeTruthy();
  });

  it('renders a violation message while keeping the run readable', async () => {
    stubFetch([
      makeSnapshot({
        violations: [{ code: 'contract.violation', message: 'ligne invalide', line: 4 }],
      }),
    ]);
    render(<SupervisionView />);

    expect(await screen.findByText(/demo-methode/)).toBeTruthy();
    expect(await screen.findByText(/ligne invalide/)).toBeTruthy();
  });

  it('flags a presumed_dead run', async () => {
    stubFetch([makeSnapshot({ liveness: 'presumed_dead' })]);
    render(<SupervisionView />);

    expect(await screen.findByText(/silence prolongé/i)).toBeTruthy();
    expect(await screen.findByText(/aucun signe de vie/i)).toBeTruthy();
  });

  it('shows the "classe B" reliability note', async () => {
    stubFetch([makeSnapshot()]);
    render(<SupervisionView />);

    expect(await screen.findByText(/classe B/i)).toBeTruthy();
  });

  it('never renders a piloting control (no button, no link, no input anywhere)', async () => {
    stubFetch([makeSnapshot({ state: 'at_gate' })]);
    const { container } = render(<SupervisionView />);
    await screen.findByText(/demo-methode/);

    expect(container.querySelectorAll('button')).toHaveLength(0);
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(container.querySelectorAll('input')).toHaveLength(0);
  });

  it('escapes hostile journal content — no injected link or script', async () => {
    stubFetch([
      makeSnapshot({
        state: 'at_gate',
        gates: [{ gateEventId: 'g1', gateId: '<script>x</script>' }],
      }),
    ]);
    const { container } = render(<SupervisionView />);
    await screen.findByText(/demo-methode/);

    expect(container.querySelector('a')).toBeNull();
    expect(container.innerHTML).not.toContain('<script>x</script>');
  });

  it('does not let a stale REST hydration overwrite a more recent SSE frame (finding 1)', async () => {
    let resolveFetch!: (value: { ok: true; status: 200; json: () => Promise<unknown[]> }) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );
    render(<SupervisionView />);

    await pushSse('supervision.run.updated', makeSnapshot({ state: 'at_gate', lastEventSeq: 4 }));
    await screen.findByText(/en attente de ta décision/i);

    await act(async () => {
      resolveFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve([makeSnapshot({ state: 'running', lastEventSeq: 3 })]),
      });
      await Promise.resolve();
    });

    expect(await screen.findByText(/en attente de ta décision/i)).toBeTruthy();
    expect(screen.queryByText(/^en cours$/i)).toBeNull();
  });

  it('applies a fresher SSE frame over an older one, and ignores a stale SSE frame (finding 1, SSE side)', async () => {
    stubFetch([makeSnapshot({ state: 'running', lastEventSeq: 3 })]);
    render(<SupervisionView />);
    await screen.findByText(/demo-methode/);

    await pushSse('supervision.run.updated', makeSnapshot({ state: 'at_gate', lastEventSeq: 4 }));
    expect(await screen.findByText(/en attente de ta décision/i)).toBeTruthy();

    await pushSse('supervision.run.updated', makeSnapshot({ state: 'running', lastEventSeq: 2 }));
    expect(await screen.findByText(/en attente de ta décision/i)).toBeTruthy();
  });

  it('displays a run with runId "__proto__" without polluting Object.prototype (finding 2)', async () => {
    stubFetch([makeSnapshot({ runId: '__proto__' })]);
    render(<SupervisionView />);

    expect(await screen.findByText(/demo-methode/)).toBeTruthy();
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'state')).toBe(false);
    expect(({} as Record<string, unknown>).state).toBeUndefined();
  });

  it('computes "il y a Xs" from lastAbsorbedAt when present, not lastEventTs (finding 4)', async () => {
    const now = Date.now();
    vi.setSystemTime(now);
    stubFetch([
      makeSnapshot({
        lastEventTs: new Date(now - 60_000).toISOString(),
        lastAbsorbedAt: new Date(now - 5_000).toISOString(),
      }),
    ]);
    render(<SupervisionView />);

    expect(await screen.findByText(/il y a 5s/)).toBeTruthy();
  });

  it('falls back to lastEventTs when lastAbsorbedAt is absent (finding 4)', async () => {
    const now = Date.now();
    vi.setSystemTime(now);
    stubFetch([makeSnapshot({ lastAbsorbedAt: undefined, lastEventTs: new Date(now - 7_000).toISOString() })]);
    render(<SupervisionView />);

    expect(await screen.findByText(/il y a 7s/)).toBeTruthy();
  });

  it('caps rendered violations to the last 100 entries with an overflow notice (finding 3)', async () => {
    const violations = Array.from({ length: 150 }, (_, i) => ({
      code: `contract.violation.${i}`,
      message: `ligne ${i}`,
    }));
    stubFetch([makeSnapshot({ violations })]);
    const { container } = render(<SupervisionView />);
    await screen.findByText(/demo-methode/);

    await waitFor(() => {
      const items = Array.from(container.querySelectorAll('.run-card__problems li')).filter((li) =>
        li.textContent?.startsWith('ligne '),
      );
      expect(items.length).toBe(100);
    });
    expect(await screen.findByText(/et 50 de plus/)).toBeTruthy();
  });
});
