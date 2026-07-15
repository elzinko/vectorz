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

  it('hydrates from GET /api/supervision/runs and shows the run', async () => {
    stubFetch([makeSnapshot({ runId: 'run-1' })]);
    render(<SupervisionView />);

    expect(await screen.findByText(/run-1/)).toBeTruthy();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/supervision/runs');
  });

  it('applies a supervision.run.updated SSE frame without reloading', async () => {
    stubFetch([makeSnapshot({ runId: 'run-1', state: 'running' })]);
    render(<SupervisionView />);
    await screen.findByText(/run-1/);

    await pushSse('supervision.run.updated', makeSnapshot({ runId: 'run-1', state: 'at_gate' }));

    expect(await screen.findByText(/at_gate/)).toBeTruthy();
  });

  it('renders command clearance and self-reported resumes distinctly', async () => {
    stubFetch([
      makeSnapshot({
        runId: 'run-1',
        state: 'at_gate',
        gates: [
          { gateEventId: 'g1', gateId: 'gate-a', resumeOrigin: 'command' },
          { gateEventId: 'g2', gateId: 'gate-b', resumeOrigin: 'self_reported' },
        ],
      }),
    ]);
    render(<SupervisionView />);

    expect(await screen.findByText(/clairance par commande/i)).toBeTruthy();
    expect(await screen.findByText(/self-reported en session/i)).toBeTruthy();
  });

  it('shows absent token provenance as "absents-et-dits-absents", never 0', async () => {
    stubFetch([makeSnapshot({ tokens: { provenance: 'absent' } })]);
    render(<SupervisionView />);

    expect(await screen.findByText(/absents-et-dits-absents/i)).toBeTruthy();
  });

  it('renders violations while keeping the run readable', async () => {
    stubFetch([
      makeSnapshot({
        violations: [{ code: 'contract.violation', message: 'ligne invalide', line: 4 }],
      }),
    ]);
    render(<SupervisionView />);

    expect(await screen.findByText(/run-1/)).toBeTruthy();
    expect(await screen.findByText(/contract\.violation/)).toBeTruthy();
  });

  it('flags a presumed_dead run with "aux dernières nouvelles"', async () => {
    stubFetch([makeSnapshot({ liveness: 'presumed_dead' })]);
    render(<SupervisionView />);

    expect(await screen.findByText(/aux dernières nouvelles/i)).toBeTruthy();
  });

  it('shows the "classe B — best-effort" badge', async () => {
    stubFetch([makeSnapshot()]);
    render(<SupervisionView />);

    expect(await screen.findByText(/classe B.*best-effort/i)).toBeTruthy();
  });

  it('never renders a piloting control (no button, no link, anywhere in the panel)', async () => {
    stubFetch([makeSnapshot({ state: 'at_gate' })]);
    const { container } = render(<SupervisionView />);
    await screen.findByText(/run-1/);

    expect(container.querySelectorAll('button')).toHaveLength(0);
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(container.querySelectorAll('input')).toHaveLength(0);
  });

  it('renders report_ref as inert escaped text, never a clickable link', async () => {
    stubFetch([
      makeSnapshot({
        gates: [
          {
            gateEventId: 'g1',
            gateId: 'gate-a',
            reportRef: '/proj/reports/<script>x</script>.md',
          },
        ],
      }),
    ]);
    const { container } = render(<SupervisionView />);

    expect(await screen.findByText(/reports/)).toBeTruthy();
    expect(container.querySelector('a')).toBeNull();
    expect(container.innerHTML).not.toContain('<script>x</script>');
  });

  it('does not let a stale REST hydration overwrite a more recent SSE frame (finding 1)', async () => {
    // Real sequence: fetch /api/supervision/runs starts (in flight, will resolve
    // with seq:3 "running"), a fresher SSE frame (seq:4 "at_gate") arrives and is
    // applied first, then the stale fetch response resolves. The stale response
    // must NOT overwrite the fresher SSE state.
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

    await pushSse(
      'supervision.run.updated',
      makeSnapshot({ runId: 'run-1', state: 'at_gate', lastEventSeq: 4 }),
    );
    await screen.findByText(/at_gate/);

    await act(async () => {
      resolveFetch({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve([makeSnapshot({ runId: 'run-1', state: 'running', lastEventSeq: 3 })]),
      });
      await Promise.resolve();
    });

    expect(await screen.findByText(/at_gate/)).toBeTruthy();
    expect(screen.queryByText(/^running$/)).toBeNull();
  });

  it('applies a fresher SSE frame over an older one, and ignores a stale SSE frame (finding 1, SSE side)', async () => {
    stubFetch([makeSnapshot({ runId: 'run-1', state: 'running', lastEventSeq: 3 })]);
    render(<SupervisionView />);
    await screen.findByText(/run-1/);

    await pushSse(
      'supervision.run.updated',
      makeSnapshot({ runId: 'run-1', state: 'at_gate', lastEventSeq: 4 }),
    );
    expect(await screen.findByText(/at_gate/)).toBeTruthy();

    // A stale SSE frame (lower seq) must not regress the displayed state.
    await pushSse(
      'supervision.run.updated',
      makeSnapshot({ runId: 'run-1', state: 'running', lastEventSeq: 2 }),
    );
    expect(await screen.findByText(/at_gate/)).toBeTruthy();
  });

  it('displays a run with runId "__proto__" without polluting Object.prototype (finding 2)', async () => {
    stubFetch([makeSnapshot({ runId: '__proto__' })]);
    render(<SupervisionView />);

    expect(await screen.findByText(/__proto__/)).toBeTruthy();
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
    stubFetch([makeSnapshot({ lastEventTs: new Date(now - 7_000).toISOString() })]);
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
    await screen.findByText(/run-1/);

    await waitFor(() => {
      const items = Array.from(container.querySelectorAll('.error li')).filter((li) =>
        li.textContent?.includes('contract.violation.'),
      );
      expect(items.length).toBe(100);
    });
    expect(await screen.findByText(/et 50 de plus/)).toBeTruthy();
  });
});