import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { listRunDirs } from '../../supervision/analyze.js';
import { readJournalEvents, type JournalEvent } from '../../supervision/journal.js';
import type { BlockedEscalationEvent, JournalSource, SprintCheckpointEvent } from '../ports/JournalSource.js';

const CHECKPOINT_GATE_PATTERN = /^sprint-(.+)-checkpoint$/;

/**
 * La racine où le serveur de supervision ÉCRIT réellement ses runs (fiche 20261002230039863) : la
 * valeur `SUPERVISION_PROJECT_ROOT` déclarée dans le `.mcp.json` du projet — jamais présumée être le
 * dossier de travail courant. Depuis un worktree secondaire (sans `.supervision/`), on remonte
 * l'arborescence jusqu'au `.mcp.json` (celui du checkout principal, qui contient les worktrees) et on
 * suit sa racine déclarée. Sans `.mcp.json` lisible, on retombe sur `projectRoot` (comportement d'avant).
 */
export function resolveSupervisionRoot(projectRoot: string): string {
  let dir = resolve(projectRoot);
  for (;;) {
    const mcp = join(dir, '.mcp.json');
    if (existsSync(mcp)) {
      try {
        const cfg = JSON.parse(readFileSync(mcp, 'utf8')) as {
          mcpServers?: { supervision?: { env?: { SUPERVISION_PROJECT_ROOT?: unknown } } };
        };
        const root = cfg.mcpServers?.supervision?.env?.SUPERVISION_PROJECT_ROOT;
        if (typeof root === 'string' && root.length > 0) return root;
      } catch {
        // `.mcp.json` malformé : on ne s'arrête pas dessus, on continue à remonter.
      }
    }
    const parent = dirname(dir);
    if (parent === dir) return projectRoot;
    dir = parent;
  }
}

/** Les événements, chacun tagué par le run qui le porte (pour apparier au run courant). */
function readAllEventsWithRun(projectRoot: string): { runId: string; event: JournalEvent }[] {
  const root = resolveSupervisionRoot(projectRoot);
  return listRunDirs(root).flatMap((runId) =>
    readJournalEvents(join(root, '.supervision', 'runs', runId, 'events.jsonl')).map((event) => ({ runId, event })),
  );
}

/** Adaptateur réel : réutilise `supervision/journal.ts` + `supervision/analyze.ts` (aucune I/O propre). */
export class SupervisionJournalSource implements JournalSource {
  listSprintCheckpoints(projectRoot: string): SprintCheckpointEvent[] {
    const checkpoints: SprintCheckpointEvent[] = [];
    for (const { runId, event: e } of readAllEventsWithRun(projectRoot)) {
      if (e.type !== 'gate.reached') continue;
      const gateId = e.payload.gate_id;
      if (typeof gateId !== 'string') continue;
      const m = CHECKPOINT_GATE_PATTERN.exec(gateId);
      if (!m) continue;
      checkpoints.push({ ts: e.ts, slug: m[1], runId });
    }
    return checkpoints;
  }

  listBlockedEscalations(projectRoot: string): BlockedEscalationEvent[] {
    const events: BlockedEscalationEvent[] = [];
    for (const { event: e } of readAllEventsWithRun(projectRoot)) {
      if (e.type !== 'escalation') continue;
      if (e.payload.type !== 'blocked') continue;
      events.push({ ts: e.ts, detail: typeof e.payload.detail === 'string' ? e.payload.detail : undefined });
    }
    return events;
  }

  earliestRunStartedTs(projectRoot: string): string | undefined {
    let earliest: string | undefined;
    for (const { event: e } of readAllEventsWithRun(projectRoot)) {
      if (e.type !== 'run.started') continue;
      if (earliest === undefined || e.ts < earliest) earliest = e.ts;
    }
    return earliest;
  }

  latestRunId(projectRoot: string): string | undefined {
    // Les ids de run sont préfixés par un horodatage ISO → le max lexicographique est le plus récent.
    const runs = listRunDirs(resolveSupervisionRoot(projectRoot));
    return runs.length === 0 ? undefined : runs.reduce((m, r) => (r > m ? r : m), runs[0]);
  }
}
