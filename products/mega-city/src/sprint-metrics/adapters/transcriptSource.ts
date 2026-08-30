import { readFileSync } from 'node:fs';
import { findTranscriptFiles } from '../../supervision/analyze.js';
import type { TranscriptSource, TranscriptSourceOptions, UsageEvent } from '../ports/TranscriptSource.js';

function numberOr0(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/**
 * Adaptateur réel : lit les transcripts Claude Code (`~/.claude/projects/<slug>/*.jsonl`)
 * via `findTranscriptFiles` (réutilisé de `supervision/analyze.ts`). Extrait les lignes
 * assistant qui portent `message.usage` — pas encore fait par `analyze.ts` (qui extrait
 * les appels MCP), c'est l'extension apportée ici. `inputTokens` inclut les tokens de
 * cache (création + lecture) : ils sont facturés, donc comptés dans le total consommé.
 */
export class ClaudeCodeTranscriptSource implements TranscriptSource {
  listUsageEvents(projectRoot: string, options: TranscriptSourceOptions = {}): UsageEvent[] {
    const events: UsageEvent[] = [];
    for (const file of findTranscriptFiles(projectRoot, options)) {
      const raw = readFileSync(file, 'utf8');
      for (const line of raw.split('\n')) {
        if (!line.includes('"usage"')) continue;
        let obj: unknown;
        try {
          obj = JSON.parse(line);
        } catch {
          continue;
        }
        if (!obj || typeof obj !== 'object') continue;
        const o = obj as Record<string, unknown>;
        if (o.type !== 'assistant') continue;
        const ts = typeof o.timestamp === 'string' ? o.timestamp : undefined;
        const sessionId = typeof o.sessionId === 'string' ? o.sessionId : file;
        const message = o.message;
        if (!ts || !message || typeof message !== 'object') continue;
        const usage = (message as Record<string, unknown>).usage;
        if (!usage || typeof usage !== 'object') continue;
        const u = usage as Record<string, unknown>;
        const inputTokens =
          numberOr0(u.input_tokens) + numberOr0(u.cache_creation_input_tokens) + numberOr0(u.cache_read_input_tokens);
        const outputTokens = numberOr0(u.output_tokens);
        events.push({ ts, sessionId, inputTokens, outputTokens });
      }
    }
    return events;
  }
}
