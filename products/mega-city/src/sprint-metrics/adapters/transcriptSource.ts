import { closeSync, openSync, readFileSync, readSync, statSync } from 'node:fs';
import { findTranscriptFiles } from '../../supervision/analyze.js';
import type { TranscriptSource, TranscriptSourceOptions, UsageEvent } from '../ports/TranscriptSource.js';

function numberOr0(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/**
 * CŒUR PUR — un fichier peut-il être SAUTÉ sans risque, parce que son intervalle ne chevauche pas la
 * fenêtre ? `mtimeMs` (dernière modif ≈ dernier évènement) et `firstTs` (1er évènement, lu à bas coût)
 * bornent l'intervalle. On ne saute QUE si tout est avant (mtime < début) ou tout après (1er > fin) :
 * jamais un fichier qui pourrait porter un évènement dans la fenêtre (fiche 20261013143324505, AC fenêtre).
 */
export function fileOutsideWindow(
  firstTs: string | undefined,
  mtimeMs: number,
  window: { startTs: string; endTs: string },
): boolean {
  const start = Date.parse(window.startTs);
  const end = Date.parse(window.endTs);
  if (Number.isFinite(mtimeMs) && Number.isFinite(start) && mtimeMs < start) return true; // tout avant
  if (firstTs) {
    const f = Date.parse(firstTs);
    if (Number.isFinite(f) && Number.isFinite(end) && f > end) return true; // tout après
  }
  return false;
}

/** Lit à bas coût (8 Ko) le 1er horodatage d'un transcript, pour borner son intervalle sans le parser. */
function peekFirstTs(file: string): string | undefined {
  let fd: number | undefined;
  try {
    fd = openSync(file, 'r');
    const buf = Buffer.alloc(8192);
    const n = readSync(fd, buf, 0, 8192, 0);
    return buf.toString('utf8', 0, n).match(/"timestamp":"([^"]+)"/)?.[1];
  } catch {
    return undefined;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

/**
 * Adaptateur réel : lit les transcripts Claude Code (`~/.claude/projects/<slug>/*.jsonl`)
 * via `findTranscriptFiles` (réutilisé de `supervision/analyze.ts`). Extrait les lignes
 * assistant qui portent `message.usage` — pas encore fait par `analyze.ts` (qui extrait
 * les appels MCP), c'est l'extension apportée ici. `inputTokens` = l'entrée NEUVE seule ; les jetons
 * de cache (lecture + création) sont captés À PART (`cacheRead` / `cacheCreation`) — facturés bien
 * moins cher, ils sont rapportés sans être fondus dans l'entrée (fiche 20261017110956989). Le total
 * brut (domaine) les additionne quand même, donc le total consommé est inchangé.
 */
export class ClaudeCodeTranscriptSource implements TranscriptSource {
  listUsageEvents(projectRoot: string, options: TranscriptSourceOptions = {}): UsageEvent[] {
    const events: UsageEvent[] = [];
    const window = options.window;
    for (const file of findTranscriptFiles(projectRoot, options)) {
      if (window) {
        let mtimeMs = Number.NaN;
        try {
          mtimeMs = statSync(file).mtimeMs;
        } catch {
          // stat impossible → on ne saute pas (on lira le fichier, comportement d'avant)
        }
        if (fileOutsideWindow(peekFirstTs(file), mtimeMs, window)) continue; // hors fenêtre → pas de lecture complète
      }
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
        const inputTokens = numberOr0(u.input_tokens); // entrée NEUVE seule — le cache est capté à part
        const cacheCreation = numberOr0(u.cache_creation_input_tokens);
        const cacheRead = numberOr0(u.cache_read_input_tokens);
        const outputTokens = numberOr0(u.output_tokens);
        events.push({ ts, sessionId, inputTokens, outputTokens, cacheRead, cacheCreation });
      }
    }
    return events;
  }
}
