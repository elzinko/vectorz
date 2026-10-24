import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { ClaudeCodeTranscriptSource } from '../adapters/transcriptSource.js';

let dir: string;
let transcriptPath: string;

function line(obj: Record<string, unknown>): string {
  return JSON.stringify(obj);
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'sprint-metrics-transcript-'));
  transcriptPath = join(dir, 'session.jsonl');
});

describe('ClaudeCodeTranscriptSource (fixture jsonl réelle sur disque)', () => {
  it('extrait les lignes assistant qui portent message.usage, avec ts et sessionId', () => {
    const lines = [
      line({ type: 'user', timestamp: '2026-08-30T09:00:00.000Z', sessionId: 's1', message: { role: 'user' } }),
      line({
        type: 'assistant',
        timestamp: '2026-08-30T09:30:00.000Z',
        sessionId: 's1',
        message: { usage: { input_tokens: 10, output_tokens: 5, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } },
      }),
      line({ type: 'assistant', timestamp: '2026-08-30T09:31:00.000Z', sessionId: 's1', message: { content: [] } }), // pas d'usage
    ];
    writeFileSync(transcriptPath, `${lines.join('\n')}\n`, 'utf8');

    const source = new ClaudeCodeTranscriptSource();
    expect(source.listUsageEvents('/fake/project', { transcript: transcriptPath })).toEqual([
      { ts: '2026-08-30T09:30:00.000Z', sessionId: 's1', inputTokens: 10, outputTokens: 5, cacheRead: 0, cacheCreation: 0 },
    ]);
  });

  it('capte les tokens de cache À PART : inputTokens = entrée neuve seule (fiche 20261017110956989)', () => {
    const lines = [
      line({
        type: 'assistant',
        timestamp: '2026-08-30T09:30:00.000Z',
        sessionId: 's1',
        message: { usage: { input_tokens: 2, output_tokens: 100, cache_creation_input_tokens: 500, cache_read_input_tokens: 300 } },
      }),
    ];
    writeFileSync(transcriptPath, `${lines.join('\n')}\n`, 'utf8');

    const source = new ClaudeCodeTranscriptSource();
    const [event] = source.listUsageEvents('/fake/project', { transcript: transcriptPath });
    expect(event.inputTokens).toBe(2); // entrée NEUVE seule, le cache n'est plus fondu dedans
    expect(event.cacheCreation).toBe(500);
    expect(event.cacheRead).toBe(300);
    expect(event.outputTokens).toBe(100);
  });

  it('ligne JSON corrompue → ignorée, jamais fatale', () => {
    writeFileSync(transcriptPath, '{not json\n', 'utf8');
    const source = new ClaudeCodeTranscriptSource();
    expect(source.listUsageEvents('/fake/project', { transcript: transcriptPath })).toEqual([]);
  });
});
