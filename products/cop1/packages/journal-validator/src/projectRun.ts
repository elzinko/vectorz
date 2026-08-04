import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { readEnvelopes } from './reader.js';
import { reduceState } from './reduceState.js';
import type { MethodRef, Notice, RunIssue, RunProjection, Violation } from './types.js';

/**
 * Extraction TOLÉRANTE de la méthode + du siège depuis le payload de
 * `run.started` (fiche 0061). Journal semi-hostile : un `method` absent, non
 * objet, ou sans `name` string ⇒ `method` reste `undefined` (jamais inventé) ;
 * idem pour `seat` (string sinon rien).
 */
function readMethodAndSeat(payload: Record<string, unknown> | undefined): {
  method?: MethodRef;
  seat?: string;
} {
  if (!payload || typeof payload !== 'object') return {};
  const result: { method?: MethodRef; seat?: string } = {};

  const rawMethod = (payload as Record<string, unknown>).method;
  if (rawMethod && typeof rawMethod === 'object') {
    const { name, version } = rawMethod as Record<string, unknown>;
    if (typeof name === 'string' && name.length > 0) {
      result.method =
        typeof version === 'string' && version.length > 0 ? { name, version } : { name };
    }
  }

  const rawSeat = (payload as Record<string, unknown>).seat;
  if (typeof rawSeat === 'string' && rawSeat.length > 0) result.seat = rawSeat;

  return result;
}

/**
 * Read-model d'affichage d'un run (mode moniteur, fiche 0031 / ADR-028).
 * Réutilise `readEnvelopes` + le reducer d'état partagé `reduceState` — la
 * machine à états (et le verrou DP2 "zéro gate→phase") reste dans un seul
 * endroit, testé contre les mêmes fixtures que `validateRun`. Tokens jamais
 * auto-déclarés (D9) : `provenance` est `'absent'` tant qu'aucune mesure
 * runtime n'est câblée (aucune ne l'est dans ce POC).
 */
export function projectRun(runDir: string): RunProjection {
  const violations: Violation[] = [];
  const notices: Notice[] = [];

  const eventsPath = join(runDir, 'events.jsonl');
  if (!existsSync(eventsPath)) {
    violations.push({
      code: 'envelope.journal_missing',
      message: `Fichier "events.jsonl" introuvable dans le dossier de run "${runDir}"`,
    });
    return {
      runId: basename(runDir),
      state: 'launched',
      gates: [],
      violations,
      notices,
      tokens: { provenance: 'absent' },
    };
  }

  const events = readEnvelopes(eventsPath, violations, notices);
  const { state, gates, lastEventTs, lastEventSeq } = reduceState(events, violations, notices);
  const runId = events[0]?.envelope.run_id ?? basename(runDir);

  const started = events.find((e) => e.envelope.type === 'run.started');
  const startedAt = started?.envelope.ts;
  const { method, seat } = readMethodAndSeat(started?.envelope.payload);

  let currentNote: string | undefined;
  for (const entry of events) {
    if (entry.envelope.type !== 'heartbeat') continue;
    const note = entry.envelope.payload?.note;
    if (typeof note === 'string' && note.length > 0) currentNote = note;
  }

  // Fiche 0082 — annotation d'écart de méthode : si le payload `run.started`
  // contient `_method_mismatch`, la méthode déclarée diffère de la méthode
  // attendue selon le registre. On produit une Notice (jamais une violation).
  const rawMismatch = started?.envelope.payload?._method_mismatch;
  if (rawMismatch && typeof rawMismatch === 'object') {
    const { declared, expected } = rawMismatch as Record<string, unknown>;
    if (typeof declared === 'string' && typeof expected === 'string') {
      notices.push({
        code: 'registry.method_mismatch',
        message: `Écart de méthode : déclarée "${declared}", attendue "${expected}" selon le registre (fiche 0082).`,
      });
    }
  }

  // ADR-035 — provenance d'abandon pour la carte finished (Codex / AC1 E2E).
  // Premier `run.finished` uniquement (même ordre que reduceState) : un événement
  // post_finished semi-hostile ne doit pas écraser ni inventer abandonedBy.
  let abandonedBy: 'seat' | 'method' | undefined;
  let endedAt: string | undefined;
  let issue: RunIssue | undefined;
  const finished = events.find((e) => e.envelope.type === 'run.finished');
  if (finished?.envelope.payload) {
    endedAt = finished.envelope.ts;
    const status = finished.envelope.payload.status;
    const by = finished.envelope.payload.abandoned_by;
    if (status === 'abandoned' && (by === 'seat' || by === 'method')) {
      abandonedBy = by;
    }
    if (status === 'success' || status === 'failure' || status === 'abandoned') {
      issue = status;
    }
  }

  return {
    runId,
    state,
    lastEventTs,
    lastEventSeq,
    startedAt,
    endedAt,
    issue,
    currentNote,
    gates,
    violations,
    notices,
    tokens: { provenance: 'absent' },
    method,
    seat,
    abandonedBy,
  };
}
