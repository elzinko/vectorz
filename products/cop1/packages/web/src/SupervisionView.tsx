import { useEffect, useState } from 'react';

type RunState = 'launched' | 'running' | 'at_gate' | 'finished' | 'finished_at_gate' | 'aborted';
type ResumeOrigin = 'command' | 'self_reported';

interface GateProjection {
  gateEventId: string;
  gateId?: string;
  outcome?: string;
  reportRef?: string;
  resumedAt?: string;
  resumeOrigin?: ResumeOrigin;
}

interface Violation {
  code: string;
  message: string;
  seq?: number;
  line?: number;
}

type Notice = Violation;

/**
 * fiche 0031 (ADR-028) — read-model d'un run affiché en mode moniteur. Recopié
 * localement (même convention que `SseFrame` dans OrchestratorRunView) depuis
 * le contrat serveur `RunSnapshot` (@cop1/journal-validator `RunProjection` +
 * overlay `app/features/supervision/domain/RunSnapshot`). Aucun champ "phase" :
 * c'est le verrou DP2 — zéro mapping gate→phase côté cop1.
 */
interface RunSnapshot {
  runId: string;
  state: RunState;
  lastEventTs?: string;
  lastEventSeq?: number;
  gates: GateProjection[];
  violations: Violation[];
  notices: Notice[];
  tokens: { provenance: 'measured' | 'absent' };
  projectRoot: string;
  runDir: string;
  liveness: 'alive' | 'presumed_dead';
  emissionClass: 'B';
}

interface SseFrame {
  eventType: string;
  payload: unknown;
}

const RESUME_ORIGIN_LABEL: Record<ResumeOrigin, string> = {
  command: 'clairance par commande',
  self_reported: 'reprise self-reported en session',
};

/** fiche 0022/0031 — "il y a Xs" (même patron que le heartbeat existant). */
function formatAge(ms: number): string {
  return `${Math.max(0, Math.floor(ms / 1000))}s`;
}

function isRunSnapshot(value: unknown): value is RunSnapshot {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { runId?: unknown }).runId === 'string'
  );
}

/**
 * Mode moniteur (fiche 0031, ADR-028) : panneau STRICTEMENT read-only affichant
 * les runs surveillés depuis `.supervision/runs/`. Hydrate via
 * `GET /api/supervision/runs` (le SSE ne rejoue pas le passé), puis applique
 * les deltas `supervision.run.updated` du SSE `/events` existant (upsert par
 * `runId`) — même patron que `OrchestratorRunView`. Aucune requête d'écriture
 * n'est jamais émise depuis ce composant (verrou DP2).
 */
export function SupervisionView() {
  const [runs, setRuns] = useState<Record<string, RunSnapshot>>({});
  const [, forceTick] = useState(0);

  // Hydratation initiale : le SSE ne rejoue pas le passé, donc un run déjà sur
  // disque au montage du front doit être hydraté explicitement.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/supervision/runs')
      .then((res) => res.json())
      .then((data: unknown) => {
        if (cancelled || !Array.isArray(data)) return;
        setRuns((prev) => {
          const next = { ...prev };
          for (const snapshot of data) {
            if (isRunSnapshot(snapshot)) next[snapshot.runId] = snapshot;
          }
          return next;
        });
      })
      .catch(() => {
        // POC : silencieux — un run non hydraté reste absent, jamais affiché faux.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Live : upsert par runId depuis les deltas supervision.run.updated.
  useEffect(() => {
    const source = new EventSource('/events');
    source.onmessage = (event: MessageEvent) => {
      let frame: SseFrame;
      try {
        frame = JSON.parse(event.data as string) as SseFrame;
      } catch {
        return;
      }
      if (frame.eventType !== 'supervision.run.updated') return;
      if (!isRunSnapshot(frame.payload)) return;
      const snapshot = frame.payload;
      setRuns((prev) => ({ ...prev, [snapshot.runId]: snapshot }));
    };
    return () => {
      source.close();
    };
  }, []);

  // Tick local pour recalculer "il y a Xs" sans attendre une nouvelle frame
  // (même patron que le heartbeat "silencieux depuis Ns" d'OrchestratorRunView).
  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const list = Object.values(runs);

  return (
    <div className="supervision-view">
      <p className="badge-classe-b">
        <strong>classe B — best-effort</strong>
      </p>
      {list.length === 0 && <p>Aucun run surveillé.</p>}
      {list.map((run) => (
        <RunCard key={run.runId} run={run} />
      ))}
    </div>
  );
}

function RunCard({ run }: { run: RunSnapshot }) {
  const ageMs = run.lastEventTs ? Date.now() - new Date(run.lastEventTs).getTime() : null;
  return (
    <div className="run-card">
      <p>
        <strong>Run :</strong> {run.runId}
      </p>
      <p>
        <strong>État :</strong> {run.state}
      </p>
      {run.liveness === 'presumed_dead' && (
        <p role="alert">Aux dernières nouvelles : run présumé mort (silence prolongé en running).</p>
      )}
      <p>
        <strong>Tokens :</strong>{' '}
        {run.tokens.provenance === 'measured' ? 'mesurés' : 'absents-et-dits-absents'}
      </p>
      {ageMs !== null && <p>Dernier événement il y a {formatAge(ageMs)}</p>}
      {run.gates.length > 0 && (
        <div>
          <strong>Gates :</strong>
          <ul>
            {run.gates.map((gate) => (
              <li key={gate.gateEventId}>
                gate_id : {gate.gateId ?? '—'}
                {gate.resumeOrigin && <> — {RESUME_ORIGIN_LABEL[gate.resumeOrigin]}</>}
                {gate.reportRef && (
                  <>
                    {' '}
                    — report_ref : <code>{gate.reportRef}</code>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {run.violations.length > 0 && (
        <div className="error" role="alert">
          <strong>Violations :</strong>
          <ul>
            {run.violations.map((v, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: violations have no stable id in the read-model
              <li key={`${v.code}-${i}`}>
                {v.code} — {v.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
