import { join } from 'node:path';
import { listRunDirs } from '../../supervision/analyze.js';
import { readJournalEvents, type JournalEvent } from '../../supervision/journal.js';
import type { BlockedEscalationEvent, JournalSource, SprintCheckpointEvent } from '../ports/JournalSource.js';

const CHECKPOINT_GATE_PATTERN = /^sprint-(.+)-checkpoint$/;

function readAllEvents(projectRoot: string): JournalEvent[] {
  return listRunDirs(projectRoot).flatMap((runId) =>
    readJournalEvents(join(projectRoot, '.supervision', 'runs', runId, 'events.jsonl')),
  );
}

/** Adaptateur réel : réutilise `supervision/journal.ts` + `supervision/analyze.ts` (aucune I/O propre). */
export class SupervisionJournalSource implements JournalSource {
  listSprintCheckpoints(projectRoot: string): SprintCheckpointEvent[] {
    const checkpoints: SprintCheckpointEvent[] = [];
    for (const e of readAllEvents(projectRoot)) {
      if (e.type !== 'gate.reached') continue;
      const gateId = e.payload.gate_id;
      if (typeof gateId !== 'string') continue;
      const m = CHECKPOINT_GATE_PATTERN.exec(gateId);
      if (!m) continue;
      checkpoints.push({ ts: e.ts, slug: m[1] });
    }
    return checkpoints;
  }

  listBlockedEscalations(projectRoot: string): BlockedEscalationEvent[] {
    const events: BlockedEscalationEvent[] = [];
    for (const e of readAllEvents(projectRoot)) {
      if (e.type !== 'escalation') continue;
      if (e.payload.type !== 'blocked') continue;
      events.push({ ts: e.ts, detail: typeof e.payload.detail === 'string' ? e.payload.detail : undefined });
    }
    return events;
  }

  earliestRunStartedTs(projectRoot: string): string | undefined {
    let earliest: string | undefined;
    for (const e of readAllEvents(projectRoot)) {
      if (e.type !== 'run.started') continue;
      if (earliest === undefined || e.ts < earliest) earliest = e.ts;
    }
    return earliest;
  }
}
