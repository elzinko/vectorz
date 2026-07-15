import type {
  Envelope,
  EnvelopeEntry,
  GateProjection,
  Notice,
  ReduceStateResult,
  RunState,
  Violation,
} from './types.js';

const KNOWN_EVENT_TYPES = new Set([
  'run.started',
  'run.finished',
  'gate.reached',
  'gate.resumed',
  'heartbeat',
  'escalation',
]);

/**
 * Transition d'état pure factorisée : rejoue une séquence d'enveloppes déjà
 * lues (`readEnvelopes`) et retourne l'état final de la machine à états
 * (`launched → running ⇄ at_gate → finished | finished_at_gate | aborted`)
 * ainsi que le read-model des gates rencontrés. Seul endroit qui connaît la
 * machine à états — partagé par `validateRun` (résultat batch) et
 * `projectRun` (read-model d'affichage live). Aucun mapping gate→phase ici
 * (verrou DP2) : `gates[].gateId` est la valeur brute du contrat, jamais
 * traduite vers un nom de phase métier.
 *
 * Mute `violations`/`notices` (même convention que `readEnvelopes`).
 */
export function reduceState(
  events: EnvelopeEntry[],
  violations: Violation[],
  notices: Notice[],
): ReduceStateResult {
  let state: RunState = 'launched';
  let openGateEventId: string | null = null;
  let finishedAtSeq: number | null = null;
  let sawRunStarted = false;
  let firstType: string | null = null;
  let firstRunId: string | null = null;
  let prevValidSeq: number | null = null;
  let invalidLinesSinceLastValid = 0;
  let lastEventTs: string | undefined;
  let lastEventSeq: number | undefined;

  const gates: GateProjection[] = [];
  const gateByEventId = new Map<string, GateProjection>();

  let cursorLine = 0;
  for (const { envelope, lineNumber } of events) {
    invalidLinesSinceLastValid += lineNumber - cursorLine - 1;
    cursorLine = lineNumber;

    lastEventTs = envelope.ts;
    lastEventSeq = envelope.seq;

    if (firstRunId === null) firstRunId = envelope.run_id;
    else if (envelope.run_id !== firstRunId) {
      violations.push({
        code: 'contract.violation',
        message: `run_id incohérent à la séquence ${envelope.seq} (attendu "${firstRunId}")`,
        seq: envelope.seq,
      });
    }

    if (prevValidSeq === null) {
      prevValidSeq = envelope.seq;
    } else {
      const expected: number = prevValidSeq + 1 + invalidLinesSinceLastValid;
      if (envelope.seq !== expected) {
        violations.push({
          code: 'envelope.seq_gap',
          message: `Trou de séquence entre ${prevValidSeq} et ${envelope.seq}`,
          seq: envelope.seq,
        });
      }
      prevValidSeq = envelope.seq;
    }
    invalidLinesSinceLastValid = 0;

    if (firstType === null) firstType = envelope.type;

    if (!KNOWN_EVENT_TYPES.has(envelope.type)) {
      notices.push({
        code: 'contract.notice',
        message: `Type d'événement inconnu du contrat v0.1 : "${envelope.type}"`,
        seq: envelope.seq,
      });
    }

    if (finishedAtSeq !== null) {
      violations.push({
        code: 'envelope.post_finished',
        message: `Activité à la séquence ${envelope.seq} après run.finished (séquence ${finishedAtSeq})`,
        seq: envelope.seq,
      });
      continue;
    }

    if (envelope.type === 'run.started') {
      sawRunStarted = true;
      state = 'running';
      continue;
    }

    if (envelope.type === 'run.finished') {
      finishedAtSeq = envelope.seq;
      if (openGateEventId !== null) {
        state = 'finished_at_gate';
        notices.push({
          code: 'state.finished_at_gate',
          message: `Run terminé (séquence ${envelope.seq}) alors qu'un gate restait ouvert — arrêt libre, pas une violation`,
          seq: envelope.seq,
        });
      } else {
        state = 'finished';
      }
      continue;
    }

    if (envelope.type === 'gate.reached') {
      if (openGateEventId !== null) {
        violations.push({
          code: 'state.multiple_gates_open',
          message: `Au plus un gate ouvert à la fois — second gate.reached à la séquence ${envelope.seq}`,
          seq: envelope.seq,
        });
        continue;
      }
      openGateEventId = registerGateReached(envelope, gates, gateByEventId);
      state = 'at_gate';
      continue;
    }

    if (envelope.type === 'gate.resumed') {
      const referencedGateId = envelope.payload?.gate_event_id;
      if (openGateEventId !== null && referencedGateId === openGateEventId) {
        applyGateResumed(envelope, openGateEventId, gateByEventId);
        openGateEventId = null;
        state = 'running';
      } else {
        violations.push({
          code: 'state.gate_resumed_orphan',
          message: `gate.resumed orphelin à la séquence ${envelope.seq} (gate_event_id "${String(referencedGateId)}")`,
          seq: envelope.seq,
        });
      }
      continue;
    }

    // Tout autre événement (heartbeat, escalation, type inconnu du contrat...)
    if (openGateEventId !== null) {
      violations.push({
        code: 'state.activity_while_gate_open',
        message: `Activité à la séquence ${envelope.seq} après un gate.reached sans gate.resumed corrélé`,
        seq: envelope.seq,
      });
    }
  }

  if (!sawRunStarted) {
    violations.push({
      code: 'envelope.run_started_missing',
      message: 'run.started manquant du journal',
    });
  } else if (firstType !== 'run.started') {
    violations.push({
      code: 'envelope.run_started_not_first',
      message: 'run.started doit être le premier événement du journal',
    });
  }

  return { state, gates, lastEventTs, lastEventSeq };
}

/** Ajoute le read-model d'un gate nouvellement ouvert ; retourne son id de corrélation. */
function registerGateReached(
  envelope: Envelope,
  gates: GateProjection[],
  gateByEventId: Map<string, GateProjection>,
): string {
  const gateEventId = envelope.event_id;
  const gate: GateProjection = {
    gateEventId,
    gateId: typeof envelope.payload?.gate_id === 'string' ? envelope.payload.gate_id : undefined,
    outcome: typeof envelope.payload?.outcome === 'string' ? envelope.payload.outcome : undefined,
    reportRef:
      typeof envelope.payload?.report_ref === 'string' ? envelope.payload.report_ref : undefined,
  };
  gates.push(gate);
  gateByEventId.set(gateEventId, gate);
  return gateEventId;
}

/**
 * Renseigne l'origine de la reprise sur le gate corrélé : `command` quand le
 * payload de `gate.resumed` porte un `command_ref`, `self_reported` sinon.
 */
function applyGateResumed(
  envelope: Envelope,
  gateEventId: string,
  gateByEventId: Map<string, GateProjection>,
): void {
  const gate = gateByEventId.get(gateEventId);
  if (!gate) return;
  gate.resumedAt = envelope.ts;
  gate.resumeOrigin = envelope.payload?.command_ref ? 'command' : 'self_reported';
}
