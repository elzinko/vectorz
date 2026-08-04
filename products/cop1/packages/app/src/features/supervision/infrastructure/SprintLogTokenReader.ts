import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { JSONLReader, type LogEntry } from '@cop1/observability';
import type { TokenMeasure } from '@cop1/journal-validator';

export interface TokenBudgetHints {
  sprintMaxTokens?: number;
  maxUsdPerSession?: number;
}

/**
 * Agrège les `llm.call.completed.tokenCount` du sprint-log `.cop1/` sur la
 * fenêtre [startedAt, endedAt] (fiche 0022 — lecture seule, pas de nouvelle
 * collecte). Retourne `provenance: absent` si aucune mesure fiable.
 */
export class SprintLogTokenReader {
  private readonly reader = new JSONLReader();

  measureForWindow(
    projectRoot: string,
    startedAt: string | undefined,
    endedAt: string | undefined,
    budget: TokenBudgetHints = {},
  ): TokenMeasure {
    if (!startedAt) return { provenance: 'absent' };

    const windowStart = Date.parse(startedAt);
    const windowEnd = Date.parse(endedAt ?? new Date().toISOString());
    if (Number.isNaN(windowStart) || Number.isNaN(windowEnd) || windowEnd < windowStart) {
      return { provenance: 'absent' };
    }

    const logDir = join(projectRoot, '.cop1');
    if (!existsSync(logDir)) return { provenance: 'absent' };

    let total = 0;
    let sawMeasured = false;

    for (const fileName of this.listSprintLogFiles(logDir, startedAt, endedAt)) {
      const entries = this.reader.read(join(logDir, fileName));
      for (const entry of entries) {
        const ts = Date.parse(entry.timestamp);
        if (Number.isNaN(ts) || ts < windowStart || ts > windowEnd) continue;
        if (entry.eventType !== 'llm.call.completed') continue;
        const tokenCount = readTokenCount(entry);
        if (tokenCount === undefined) continue;
        total += tokenCount;
        sawMeasured = true;
      }
    }

    if (!sawMeasured) return { provenance: 'absent' };

    const measure: TokenMeasure = { provenance: 'measured', total };
    const usd = estimateUsd(total, budget);
    if (usd !== undefined) measure.usd = usd;
    return measure;
  }

  private listSprintLogFiles(
    logDir: string,
    startedAt: string,
    endedAt: string | undefined,
  ): string[] {
    const startDay = startedAt.slice(0, 10);
    const endDay = (endedAt ?? new Date().toISOString()).slice(0, 10);
    const days = enumerateDays(startDay, endDay);

    const onDisk = new Set(
      readdirSync(logDir).filter((name) => name.startsWith('sprint-log-') && name.endsWith('.jsonl')),
    );

    return days
      .map((day) => `sprint-log-${day}.jsonl`)
      .filter((name) => onDisk.has(name));
  }
}

function readTokenCount(entry: LogEntry): number | undefined {
  const raw = entry.tokenCount;
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : undefined;
}

function estimateUsd(total: number, budget: TokenBudgetHints): number | undefined {
  const { sprintMaxTokens, maxUsdPerSession } = budget;
  if (
    maxUsdPerSession === undefined ||
    sprintMaxTokens === undefined ||
    sprintMaxTokens <= 0
  ) {
    return undefined;
  }
  return Math.round(((total / sprintMaxTokens) * maxUsdPerSession) * 100) / 100;
}

function enumerateDays(startDay: string, endDay: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${startDay}T00:00:00.000Z`);
  const end = new Date(`${endDay}T00:00:00.000Z`);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}
