import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { projectRun, type RunProjection } from '@cop1/journal-validator';
import {
  SprintLogTokenReader,
  type TokenBudgetHints,
} from '../infrastructure/SprintLogTokenReader.js';

const RUNS_SUBDIR = join('.supervision', 'runs');
const DEFAULT_LIMIT = 20;

export interface RunHistoryEntry extends RunProjection {
  projectRoot: string;
  runDir: string;
  /** Durée en ms (endedAt − startedAt, ou maintenant − startedAt si encore ouvert). */
  durationMs?: number;
}

export interface RunHistoryServiceOptions {
  watchRoots: string[];
  limit?: number;
  tokenBudget?: TokenBudgetHints;
  tokenReader?: SprintLogTokenReader;
}

/**
 * Liste les N derniers runs depuis `.supervision/runs/` (fiche 0022 / ADR-028).
 * Lecture seule — aucun fs.watch, scan ponctuel à la demande.
 */
export class RunHistoryService {
  private readonly watchRoots: string[];
  private readonly limit: number;
  private readonly tokenBudget: TokenBudgetHints;
  private readonly tokenReader: SprintLogTokenReader;

  constructor(options: RunHistoryServiceOptions) {
    this.watchRoots = options.watchRoots;
    this.limit = options.limit ?? DEFAULT_LIMIT;
    this.tokenBudget = options.tokenBudget ?? {};
    this.tokenReader = options.tokenReader ?? new SprintLogTokenReader();
  }

  list(projectRootFilter?: string, limit = this.limit): RunHistoryEntry[] {
    const entries: RunHistoryEntry[] = [];

    for (const root of this.watchRoots) {
      if (projectRootFilter && root !== projectRootFilter) continue;
      const runsDir = join(root, RUNS_SUBDIR);
      if (!existsSync(runsDir)) continue;

      for (const runDirName of this.listRunDirNames(runsDir)) {
        const runDir = join(runsDir, runDirName);
        const projection = projectRun(runDir);
        const tokens =
          projection.tokens.provenance === 'measured'
            ? projection.tokens
            : this.tokenReader.measureForWindow(
                root,
                projection.startedAt,
                projection.endedAt,
                this.tokenBudget,
              );

        entries.push({
          ...projection,
          tokens,
          projectRoot: root,
          runDir,
          durationMs: computeDurationMs(projection.startedAt, projection.endedAt),
        });
      }
    }

    return entries
      .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))
      .slice(0, limit);
  }

  private listRunDirNames(runsDir: string): string[] {
    try {
      return readdirSync(runsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    } catch {
      return [];
    }
  }
}

function computeDurationMs(startedAt?: string, endedAt?: string): number | undefined {
  if (!startedAt) return undefined;
  const start = Date.parse(startedAt);
  const end = Date.parse(endedAt ?? new Date().toISOString());
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return undefined;
  return end - start;
}
