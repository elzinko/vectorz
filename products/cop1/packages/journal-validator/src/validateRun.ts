import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readEnvelopes } from './reader.js';
import { reduceState } from './reduceState.js';
import type { EnvelopeEntry, Notice, ValidationResult, Violation } from './types.js';

const KNOWN_COMMAND_TYPES = new Set(['continue', 'hold', 'abort']);

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

  const { state } = reduceState(events, violations, notices);
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

function replayCommands(
  commands: EnvelopeEntry[],
  events: EnvelopeEntry[],
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
