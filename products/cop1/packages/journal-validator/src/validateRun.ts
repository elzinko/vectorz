import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseLines, readLines } from './reader.js';
import type { Notice, RunState, ValidationResult, Violation } from './types.js';

const REQUIRED_ENVELOPE_FIELDS = [
  'event_id',
  'run_id',
  'seq',
  'ts',
  'contract',
  'type',
  'payload',
] as const;
const KNOWN_ENVELOPE_FIELDS = new Set<string>(REQUIRED_ENVELOPE_FIELDS);
const KNOWN_EVENT_TYPES = new Set([
  'run.started',
  'run.finished',
  'gate.reached',
  'gate.resumed',
  'heartbeat',
  'escalation',
]);
const KNOWN_COMMAND_TYPES = new Set(['continue', 'hold', 'abort']);

interface Envelope {
  event_id: string;
  run_id: string;
  seq: number;
  type: string;
  payload: Record<string, unknown>;
}

/** Lit le fichier, découpe en lignes tolérantes et vérifie l'enveloppe de base. */
function readEnvelopes(
  filePath: string,
  violations: Violation[],
  notices: Notice[],
): { envelope: Envelope; lineNumber: number }[] {
  const content = readFileSync(filePath, 'utf-8');
  const parsed = parseLines(readLines(content));

  const result: { envelope: Envelope; lineNumber: number }[] = [];
  for (const line of parsed) {
    if (!line.ok) {
      violations.push({
        code: 'contract.violation',
        message: `Ligne ${line.lineNumber} n'est pas un JSON d'enveloppe valide`,
        line: line.lineNumber,
      });
      continue;
    }

    const missing = REQUIRED_ENVELOPE_FIELDS.filter((field) => !(field in line.value));
    if (missing.length > 0) {
      violations.push({
        code: 'contract.violation',
        message: `Ligne ${line.lineNumber} : champ(s) d'enveloppe manquant(s) : ${missing.join(', ')}`,
        line: line.lineNumber,
      });
      continue;
    }

    for (const field of Object.keys(line.value)) {
      if (!KNOWN_ENVELOPE_FIELDS.has(field)) {
        notices.push({
          code: 'contract.notice',
          message: `Ligne ${line.lineNumber} : champ additionnel inconnu "${field}"`,
          line: line.lineNumber,
        });
      }
    }

    result.push({
      envelope: line.value as unknown as Envelope,
      lineNumber: line.lineNumber,
    });
  }
  return result;
}

export function validateRun(runDir: string): ValidationResult {
  const violations: Violation[] = [];
  const notices: Notice[] = [];

  const eventsPath = join(runDir, 'events.jsonl');
  if (!existsSync(eventsPath)) {
    violations.push({
      code: 'envelope.journal_missing',
      message: `Fichier "events.jsonl" introuvable dans le dossier de run "${runDir}"`,
    });
    return {
      violations,
      notices,
      state: 'launched',
      summary: 'journal absent — validation impossible',
      code: 1,
    };
  }
  const events = readEnvelopes(eventsPath, violations, notices);

  const commandsPath = join(runDir, 'commands.jsonl');
  const commands = existsSync(commandsPath) ? readEnvelopes(commandsPath, violations, notices) : [];

  const state = replayEvents(events, violations, notices);
  replayCommands(commands, events, violations, notices);

  const code: 0 | 1 = violations.length === 0 ? 0 : 1;
  return {
    violations,
    notices,
    state,
    summary: `état final: ${state} — ${violations.length} violation(s), ${notices.length} notice(s)`,
    code,
  };
}

function replayEvents(
  events: { envelope: Envelope; lineNumber: number }[],
  violations: Violation[],
  notices: Notice[],
): RunState {
  let state: RunState = 'launched';
  let openGateEventId: string | null = null;
  let finishedAtSeq: number | null = null;
  let sawRunStarted = false;
  let firstType: string | null = null;
  let firstRunId: string | null = null;
  let prevValidSeq: number | null = null;
  let invalidLinesSinceLastValid = 0;

  let cursorLine = 0;
  for (const { envelope, lineNumber } of events) {
    invalidLinesSinceLastValid += lineNumber - cursorLine - 1;
    cursorLine = lineNumber;

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
      const gateId = envelope.event_id;
      if (openGateEventId !== null) {
        violations.push({
          code: 'state.multiple_gates_open',
          message: `Au plus un gate ouvert à la fois — second gate.reached à la séquence ${envelope.seq}`,
          seq: envelope.seq,
        });
        continue;
      }
      openGateEventId = gateId;
      state = 'at_gate';
      continue;
    }

    if (envelope.type === 'gate.resumed') {
      const referencedGateId = envelope.payload?.gate_event_id;
      if (openGateEventId !== null && referencedGateId === openGateEventId) {
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

  return state;
}

function replayCommands(
  commands: { envelope: Envelope; lineNumber: number }[],
  events: { envelope: Envelope; lineNumber: number }[],
  violations: Violation[],
  notices: Notice[],
): void {
  const knownGateIds = new Set(
    events
      .filter(({ envelope }) => envelope.type === 'gate.reached')
      .map(({ envelope }) => envelope.event_id),
  );
  const continuedGateIds = new Set<string>();

  for (const { envelope } of commands) {
    if (!KNOWN_COMMAND_TYPES.has(envelope.type)) {
      violations.push({
        code: 'command.unknown_type',
        message: `Type de commande hors enum continue|hold|abort : "${envelope.type}" (séquence ${envelope.seq})`,
        seq: envelope.seq,
      });
      continue;
    }

    if (envelope.type === 'continue' || envelope.type === 'hold') {
      const gateEventId = envelope.payload?.gate_event_id as string | undefined;
      if (!gateEventId || !knownGateIds.has(gateEventId)) {
        violations.push({
          code: 'command.unknown_gate',
          message: `gate_event_id inconnu "${String(gateEventId)}" référencé par la commande à la séquence ${envelope.seq}`,
          seq: envelope.seq,
        });
        continue;
      }

      if (envelope.type === 'continue') {
        if (continuedGateIds.has(gateEventId)) {
          notices.push({
            code: 'command.noop',
            message: `Re-continue no-op (idempotence) pour le gate "${gateEventId}" à la séquence ${envelope.seq}`,
            seq: envelope.seq,
          });
        } else {
          continuedGateIds.add(gateEventId);
        }
      }
    }
  }
}
