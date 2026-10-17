/**
 * `projectChantier.ts` — read-model MULTI-journaux (ADR-079 §D8, fiche 20261015082118353).
 *
 * Le projecteur mono-journal (`projectRun`) lit UN run et rend des agrégats. Ici on
 * RÉUNIT plusieurs journaux par leur **clé de chantier** (posée par l'émetteur T3),
 * **qualifiée par la racine de projet** : deux racines différentes ne fusionnent jamais,
 * même clé. Le **dossier de run reste la clé de stockage** ; le `run_id` n'est JAMAIS une
 * clé de fusion (anti-collision, ADR-079 §D2). On rend un chantier par couple
 * (racine, clé), avec ses sessions (le « qui ») et son fil d'évènements fusionné, ordonné
 * par une règle tolérante, chacun étiqueté par sa session.
 *
 * « Live, jamais committé » (ADR-0043/0055) : ce read-model lit, il n'écrit rien.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readEnvelopes } from './reader.js';
import { reduceState } from './reduceState.js';
import type {
  ChantierEvent,
  ChantierLifecycle,
  ChantierProjection,
  Notice,
  RunState,
  SessionProjection,
  Violation,
} from './types.js';

export interface ChantierInput {
  /** Racine de projet qui qualifie la clé (deux racines ≠ ne fusionnent jamais). */
  projectRoot: string;
  /** Dossier de run = clé de STOCKAGE (jamais le `run_id`). */
  runDir: string;
}

export interface ProjectChantiersOptions {
  /** Horloge injectée pour présumer morts les runs silencieux (orphelins). Sans elle, aucun orphelin. */
  now?: number;
  /** Seuil de silence avant de présumer un run mort (défaut 5 min, comme le Moniteur). */
  presumedDeadMs?: number;
}

const DEFAULT_PRESUMED_DEAD_MS = 5 * 60 * 1000;

interface RunRead {
  projectRoot: string;
  runDir: string;
  chantier: string;
  sessionId?: string;
  branch?: string;
  pilotedBy?: string;
  state: RunState;
  lastEventTs?: string;
  events: ChantierEvent[];
}

/** Lit un journal de run pour le read-model chantier. `undefined` si pas de clé de chantier (hors read-model). */
function readRun(input: ChantierInput): RunRead | undefined {
  const eventsPath = join(input.runDir, 'events.jsonl');
  if (!existsSync(eventsPath)) return undefined;

  const violations: Violation[] = [];
  const notices: Notice[] = [];
  const entries = readEnvelopes(eventsPath, violations, notices);
  if (entries.length === 0) return undefined;

  const started = entries.find((e) => e.envelope.type === 'run.started');
  const chantier = started?.envelope.payload?.chantier;
  if (typeof chantier !== 'string' || chantier.length === 0) return undefined;

  const { state, lastEventTs } = reduceState(entries, violations, notices);

  const sessionId =
    typeof started?.envelope.session_id === 'string' && started.envelope.session_id.length > 0
      ? started.envelope.session_id
      : entries.find((e) => typeof e.envelope.session_id === 'string')?.envelope.session_id;

  const sessionStarted = entries.find((e) => e.envelope.type === 'session.started');
  const branch =
    typeof sessionStarted?.envelope.payload?.branch === 'string'
      ? (sessionStarted.envelope.payload.branch as string)
      : undefined;
  const pilotedByRaw = started?.envelope.payload?.piloted_by;
  const pilotedBy = typeof pilotedByRaw === 'string' ? pilotedByRaw : undefined;

  const events: ChantierEvent[] = entries.map((e) => ({
    sessionId:
      typeof e.envelope.session_id === 'string' && e.envelope.session_id.length > 0
        ? e.envelope.session_id
        : sessionId,
    runId: e.envelope.run_id,
    type: e.envelope.type,
    ts: e.envelope.ts,
    seq: e.envelope.seq,
    payload: e.envelope.payload,
  }));

  return {
    projectRoot: input.projectRoot,
    runDir: input.runDir,
    chantier,
    sessionId,
    branch,
    pilotedBy,
    state,
    lastEventTs,
    events,
  };
}

/**
 * Comparateur tolérant (ADR-079 §D8) : `ts` quand les DEUX sont lisibles et distincts,
 * sinon départage STABLE par `session_id` puis `seq`. Un `ts` absent/cassé ne saute pas
 * en tête — il retombe sur l'ordre intra-session (dérive bornée).
 */
function compareEvents(a: ChantierEvent, b: ChantierEvent): number {
  const ta = Date.parse(a.ts);
  const tb = Date.parse(b.ts);
  if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return ta - tb;
  const sa = a.sessionId ?? '';
  const sb = b.sessionId ?? '';
  if (sa !== sb) return sa < sb ? -1 : 1;
  return a.seq - b.seq;
}

const TERMINAL_STATES: ReadonlySet<RunState> = new Set(['finished', 'finished_at_gate', 'aborted']);
const STATE_RANK: Record<RunState, number> = {
  at_gate: 5,
  running: 4,
  launched: 3,
  finished_at_gate: 2,
  finished: 1,
  aborted: 0,
};

/** État agrégé d'une session : le plus « actif » de ses runs (gate > running > … > terminal). */
function mostAdvancedState(states: RunState[]): RunState {
  return states.reduce((best, s) => (STATE_RANK[s] > STATE_RANK[best] ? s : best));
}

/** Cycle de vie du chantier : jalon > en cours > orphelin (si horloge) > fini. Sans double compte. */
function deriveLifecycle(runs: RunRead[], opts: ProjectChantiersOptions): ChantierLifecycle {
  const nonTerminal = runs.filter((r) => !TERMINAL_STATES.has(r.state));
  if (nonTerminal.some((r) => r.state === 'at_gate')) return 'at_gate';
  if (nonTerminal.length === 0) return 'finished';

  if (opts.now !== undefined) {
    const threshold = opts.presumedDeadMs ?? DEFAULT_PRESUMED_DEAD_MS;
    const allStale = nonTerminal.every((r) => {
      const t = r.lastEventTs ? Date.parse(r.lastEventTs) : Number.NaN;
      return Number.isNaN(t) || opts.now! - t > threshold;
    });
    if (allStale) return 'orphan';
  }

  return 'running';
}

export function projectChantiers(
  inputs: ChantierInput[],
  options: ProjectChantiersOptions = {},
): ChantierProjection[] {
  const runs = inputs
    .map(readRun)
    .filter((r): r is RunRead => r !== undefined);

  // Groupe par (racine, clé) — séparateur NUL, impossible dans un chemin ou une clé.
  const groups = new Map<string, RunRead[]>();
  for (const run of runs) {
    const groupKey = `${run.projectRoot}\u0000${run.chantier}`;
    const bucket = groups.get(groupKey);
    if (bucket) bucket.push(run);
    else groups.set(groupKey, [run]);
  }

  const chantiers: ChantierProjection[] = [];
  for (const bucket of groups.values()) {
    const first = bucket[0];
    if (first === undefined) continue;
    const { projectRoot, chantier } = first;

    // Sessions : une session (sessionId) peut couvrir plusieurs runs.
    const bySession = new Map<string, RunRead[]>();
    for (const run of bucket) {
      const sid = run.sessionId ?? `(sans-session:${run.runDir})`;
      const b = bySession.get(sid);
      if (b) b.push(run);
      else bySession.set(sid, [run]);
    }

    const sessions: SessionProjection[] = [];
    for (const [sid, sessionRuns] of bySession) {
      sessions.push({
        sessionId: sid,
        branch: sessionRuns.find((r) => r.branch !== undefined)?.branch,
        pilotedBy: sessionRuns.find((r) => r.pilotedBy !== undefined)?.pilotedBy,
        runDirs: sessionRuns.map((r) => r.runDir),
        state: mostAdvancedState(sessionRuns.map((r) => r.state)),
        eventCount: sessionRuns.reduce((n, r) => n + r.events.length, 0),
      });
    }

    const events = bucket.flatMap((r) => r.events).sort(compareEvents);

    chantiers.push({ key: chantier, projectRoot, sessions, events, lifecycle: deriveLifecycle(bucket, options) });
  }

  return chantiers;
}
