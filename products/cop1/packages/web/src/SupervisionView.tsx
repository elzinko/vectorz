import { memo, type ReactNode, useEffect, useState } from 'react';

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
 *
 * `lastAbsorbedAt` (horloge SERVEUR de l'absorption) est la source fiable pour
 * l'âge affiché — contrairement à `lastEventTs`, déclaré par le journal (donc
 * potentiellement mensonger ou décalé).
 */
interface RunSnapshot {
  runId: string;
  state: RunState;
  lastEventTs?: string;
  lastEventSeq?: number;
  lastAbsorbedAt?: string;
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

/** POC : plafond d'affichage pour les listes (violations/gates) du journal. */
const MAX_LIST_ITEMS = 100;

/** fiche 0022/0031 — "il y a Xs" (même patron que le heartbeat existant). */
function formatAge(ms: number): string {
  return `${Math.max(0, Math.floor(ms / 1000))}s`;
}

function isRunSnapshot(value: unknown): value is RunSnapshot {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { runId?: unknown }).runId === 'string' &&
    typeof (value as { runDir?: unknown }).runDir === 'string'
  );
}

/**
 * finding 1 (revue FRONT 0031) : garde d'anti-régression contre la course
 * hydratation REST vs SSE. N'écrase un snapshot existant que si le candidat a
 * un `lastEventSeq` au moins aussi récent (ou si aucun snapshot n'est encore
 * en place). Un `lastEventSeq` absent est traité comme "le plus vieux possible"
 * côté candidat (ne régresse jamais un snapshot déjà seq-é), et comme
 * "toujours dépassable" côté existant.
 */
function isFresherOrEqual(candidate: RunSnapshot, existing: RunSnapshot | undefined): boolean {
  if (!existing) return true;
  const candidateSeq = candidate.lastEventSeq ?? Number.NEGATIVE_INFINITY;
  const existingSeq = existing.lastEventSeq ?? Number.NEGATIVE_INFINITY;
  return candidateSeq >= existingSeq;
}

/**
 * finding 2 (revue FRONT 0031) : keye par `runDir` (chemin serveur unique)
 * plutôt que `runId` (déclaré par le journal, donc semi-hostile — un
 * `runId: '__proto__'` corromprait un objet littéral). Une `Map` est en outre
 * immunisée à la pollution de prototype par construction.
 */
function upsertSnapshot(
  runs: Map<string, RunSnapshot>,
  snapshot: RunSnapshot,
): Map<string, RunSnapshot> {
  const existing = runs.get(snapshot.runDir);
  if (!isFresherOrEqual(snapshot, existing)) return runs;
  const next = new Map(runs);
  next.set(snapshot.runDir, snapshot);
  return next;
}

/**
 * Mode moniteur (fiche 0031, ADR-028) : panneau STRICTEMENT read-only affichant
 * les runs surveillés depuis `.supervision/runs/`. Hydrate via
 * `GET /api/supervision/runs` (le SSE ne rejoue pas le passé), puis applique
 * les deltas `supervision.run.updated` du SSE `/events` existant (upsert par
 * `runDir`) — même patron que `OrchestratorRunView`. Aucune requête d'écriture
 * n'est jamais émise depuis ce composant (verrou DP2).
 */
export function SupervisionView() {
  const [runs, setRuns] = useState<Map<string, RunSnapshot>>(() => new Map());

  // Hydratation initiale : le SSE ne rejoue pas le passé, donc un run déjà sur
  // disque au montage du front doit être hydraté explicitement.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/supervision/runs')
      .then((res) => res.json())
      .then((data: unknown) => {
        if (cancelled || !Array.isArray(data)) return;
        setRuns((prev) => {
          let next = prev;
          for (const snapshot of data) {
            if (isRunSnapshot(snapshot)) next = upsertSnapshot(next, snapshot);
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

  // Live : upsert par runDir depuis les deltas supervision.run.updated.
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
      setRuns((prev) => upsertSnapshot(prev, snapshot));
    };
    return () => {
      source.close();
    };
  }, []);

  const list = Array.from(runs.values());

  return (
    <div className="supervision-view">
      <p className="badge-classe-b">
        <strong>classe B — best-effort</strong>
      </p>
      {list.length === 0 && <p>Aucun run surveillé.</p>}
      {list.map((run) => (
        <RunCard key={run.runDir} run={run} />
      ))}
    </div>
  );
}

/**
 * finding 3 (revue FRONT 0031) : mémoïsée pour que le tick "il y a Xs" (isolé
 * dans `RunAge`) ne re-rende pas la carte entière à chaque seconde. Ne se
 * re-rend que si le snapshot du run change réellement.
 */
const RunCard = memo(function RunCard({ run }: { run: RunSnapshot }) {
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
      <RunAge lastAbsorbedAt={run.lastAbsorbedAt} lastEventTs={run.lastEventTs} />
      {run.gates.length > 0 && (
        <div>
          <strong>Gates :</strong>
          <CappedList
            items={run.gates}
            renderItem={(gate) => (
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
            )}
          />
        </div>
      )}
      {run.violations.length > 0 && (
        <div className="error" role="alert">
          <strong>Violations :</strong>
          <CappedList
            items={run.violations}
            renderItem={(v, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: violations have no stable id in the read-model
              <li key={`${v.code}-${i}`}>
                {v.code} — {v.message}
              </li>
            )}
          />
        </div>
      )}
    </div>
  );
});

/**
 * finding 4 (revue FRONT 0031) : âge calculé depuis `lastAbsorbedAt` (horloge
 * serveur de l'absorption, fiable) quand présent, sinon repli sur
 * `lastEventTs` (déclaré par le journal). Isolée dans son propre composant
 * avec son propre tick 1s pour ne pas re-rendre `RunCard` entière (finding 3).
 */
function RunAge({
  lastAbsorbedAt,
  lastEventTs,
}: {
  lastAbsorbedAt?: string;
  lastEventTs?: string;
}) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const referenceTs = lastAbsorbedAt ?? lastEventTs;
  const ageMs = referenceTs ? Date.now() - new Date(referenceTs).getTime() : null;
  if (ageMs === null) return null;
  return <p>Dernier événement il y a {formatAge(ageMs)}</p>;
}

/**
 * finding 3 (revue FRONT 0031) : plafonne l'affichage à `MAX_LIST_ITEMS`
 * dernières entrées (POC sobre, pas de virtualisation) pour éviter des
 * milliers de <li> re-diffés si le journal est pollué.
 */
function CappedList<T>({
  items,
  renderItem,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
}) {
  const overflow = items.length - MAX_LIST_ITEMS;
  const shown = overflow > 0 ? items.slice(-MAX_LIST_ITEMS) : items;
  const shownStartIndex = overflow > 0 ? overflow : 0;
  return (
    <ul>
      {shown.map((item, i) => renderItem(item, shownStartIndex + i))}
      {overflow > 0 && <li>… et {overflow} de plus</li>}
    </ul>
  );
}
