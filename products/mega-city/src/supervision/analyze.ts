/**
 * Kit d’analyse de session supervision (fiche 0104).
 * Lecture seule : croise journal `.supervision/runs` + transcripts Claude Code.
 * Aucun LLM, aucun démarrage Moniteur — déterministe et testable.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import { readJournalEvents, type JournalEvent } from './journal.js';

const RUNS_SEGMENTS = ['.supervision', 'runs'] as const;

export type AnalyzeVerdictCode =
  | 'healthy'
  | 'emission_gap'
  | 'silence_explained'
  | 'orphan_run'
  | 'mcp_without_journal'
  | 'no_runs'
  | 'no_transcript';

export interface AnalyzeVerdict {
  code: AnalyzeVerdictCode;
  detail: string;
}

export interface McpToolCall {
  ts?: string;
  tool: string;
  /** Args résumés (pas le plein texte utilisateur). */
  argsSummary: string;
  sessionFile: string;
}

export interface RunSummary {
  runId: string;
  events: Array<{ seq: number; ts: string; type: string; payloadSummary: string }>;
  methodName?: string;
  finished: boolean;
  open: boolean;
  counts: Record<string, number>;
  lastEventTs?: string;
}

export interface AnalyzeReport {
  projectRoot: string;
  generatedAt: string;
  runs: RunSummary[];
  mcpCalls: McpToolCall[];
  transcriptFiles: string[];
  verdicts: AnalyzeVerdict[];
  timeline: Array<{ ts: string; source: 'journal' | 'mcp'; label: string }>;
}

function summarizePayload(payload: Record<string, unknown>): string {
  const keys = Object.keys(payload);
  if (keys.length === 0) return '{}';
  const bits: string[] = [];
  if (payload.method && typeof payload.method === 'object') {
    const m = payload.method as { name?: string; version?: string };
    bits.push(`method=${m.name ?? '?'}${m.version ? `@${m.version}` : ''}`);
  }
  if (typeof payload.note === 'string') bits.push(`note=${JSON.stringify(payload.note).slice(0, 80)}`);
  if (typeof payload.gate_id === 'string') bits.push(`gate_id=${payload.gate_id}`);
  if (typeof payload.status === 'string') bits.push(`status=${payload.status}`);
  if (typeof payload.outcome === 'string') bits.push(`outcome=${payload.outcome}`);
  if (bits.length === 0) bits.push(`keys=${keys.slice(0, 5).join(',')}`);
  return bits.join(' ');
}

function countTypes(events: JournalEvent[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.type] = (counts[e.type] ?? 0) + 1;
  }
  return counts;
}

/** Encode un chemin absolu comme slug Claude Code / Cursor (`~/.claude/projects/…`). */
export function projectPathToClaudeSlug(projectRoot: string): string {
  const normalized = projectRoot.replace(/\\/g, '/');
  // Claude Code : /Users/foo/bar → -Users-foo-bar
  return normalized.replace(/\//g, '-');
}

export function defaultClaudeProjectsDir(): string {
  return join(homedir(), '.claude', 'projects');
}

export function listRunDirs(projectRoot: string): string[] {
  const runsDir = join(projectRoot, ...RUNS_SEGMENTS);
  if (!existsSync(runsDir)) return [];
  return readdirSync(runsDir)
    .filter((name) => {
      try {
        return statSync(join(runsDir, name)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
}

export function summarizeRun(projectRoot: string, runId: string): RunSummary {
  const eventsPath = join(projectRoot, ...RUNS_SEGMENTS, runId, 'events.jsonl');
  const events = readJournalEvents(eventsPath);
  const counts = countTypes(events);
  const finished = (counts['run.finished'] ?? 0) > 0;
  const started = events.find((e) => e.type === 'run.started');
  let methodName: string | undefined;
  if (started?.payload.method && typeof started.payload.method === 'object') {
    methodName = (started.payload.method as { name?: string }).name;
  }
  return {
    runId,
    events: events.map((e) => ({
      seq: e.seq,
      ts: e.ts,
      type: e.type,
      payloadSummary: summarizePayload(e.payload),
    })),
    methodName,
    finished,
    open: events.length > 0 && !finished,
    counts,
    lastEventTs: events.length > 0 ? events[events.length - 1].ts : undefined,
  };
}

function extractToolCallsFromTranscript(
  filePath: string,
  full: boolean,
): McpToolCall[] {
  if (!existsSync(filePath)) return [];
  const calls: McpToolCall[] = [];
  const raw = readFileSync(filePath, 'utf8');
  for (const line of raw.split('\n')) {
    if (!line.includes('mcp__supervision__') && !line.includes('"tool_use"')) continue;
    let obj: unknown;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    if (!obj || typeof obj !== 'object') continue;
    const o = obj as Record<string, unknown>;
    const ts =
      typeof o.timestamp === 'string'
        ? o.timestamp
        : typeof o.ts === 'string'
          ? o.ts
          : undefined;
    const message = o.message;
    if (!message || typeof message !== 'object') continue;
    const content = (message as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== 'object') continue;
      const p = part as { type?: string; name?: string; input?: unknown };
      if (p.type !== 'tool_use' || typeof p.name !== 'string') continue;
      if (!p.name.startsWith('mcp__supervision__') && !p.name.startsWith('supervision__')) {
        // aussi noms courts si présents
        const short = ['run_start', 'gate_reached', 'gate_resumed', 'escalate', 'heartbeat', 'run_finished'];
        if (!short.includes(p.name)) continue;
      }
      const tool = p.name.replace(/^mcp__supervision__/, '').replace(/^supervision__/, '');
      let argsSummary = '';
      if (p.input && typeof p.input === 'object') {
        const input = p.input as Record<string, unknown>;
        argsSummary = summarizePayload(input);
        if (full && typeof input.report_markdown === 'string') {
          argsSummary += ` report_len=${input.report_markdown.length}`;
        }
      }
      calls.push({ ts, tool, argsSummary, sessionFile: basename(filePath) });
    }
  }
  return calls;
}

export function findTranscriptFiles(
  projectRoot: string,
  options: { transcript?: string; claudeProjectsDir?: string } = {},
): string[] {
  if (options.transcript) {
    return existsSync(options.transcript) ? [options.transcript] : [];
  }
  const projectsDir = options.claudeProjectsDir ?? defaultClaudeProjectsDir();
  const slug = projectPathToClaudeSlug(projectRoot);
  const dir = join(projectsDir, slug);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => join(dir, f))
    .sort((a, b) => {
      try {
        return statSync(b).mtimeMs - statSync(a).mtimeMs;
      } catch {
        return 0;
      }
    });
}

function parseSinceMs(since: string | undefined): number | undefined {
  if (!since) return undefined;
  const m = since.trim().match(/^(\d+)\s*(h|m|d)?$/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  const unit = (m[2] ?? 'h').toLowerCase();
  const mult = unit === 'm' ? 60_000 : unit === 'd' ? 86_400_000 : 3_600_000;
  return n * mult;
}

export interface AnalyzeOptions {
  runId?: string;
  since?: string;
  transcript?: string;
  claudeProjectsDir?: string;
  full?: boolean;
  /** Seuil silence (ms) pour verdict silence_explained — défaut 5 min. */
  silenceThresholdMs?: number;
  now?: Date;
}

export function analyzeSession(projectRoot: string, options: AnalyzeOptions = {}): AnalyzeReport {
  const now = options.now ?? new Date();
  const sinceMs = parseSinceMs(options.since);
  const silenceThresholdMs = options.silenceThresholdMs ?? 5 * 60_000;

  let runIds = options.runId ? [options.runId] : listRunDirs(projectRoot);
  if (sinceMs !== undefined) {
    const cutoff = now.getTime() - sinceMs;
    runIds = runIds.filter((id) => {
      const summary = summarizeRun(projectRoot, id);
      if (!summary.lastEventTs) return false;
      return Date.parse(summary.lastEventTs) >= cutoff;
    });
  }

  const runs = runIds.map((id) => summarizeRun(projectRoot, id));
  const transcriptFiles = findTranscriptFiles(projectRoot, {
    transcript: options.transcript,
    claudeProjectsDir: options.claudeProjectsDir,
  });
  // Limiter aux N plus récents pour perf (sauf --transcript explicite)
  const filesToScan = options.transcript ? transcriptFiles : transcriptFiles.slice(0, 8);
  const mcpCalls = filesToScan.flatMap((f) => extractToolCallsFromTranscript(f, options.full === true));

  const timeline: AnalyzeReport['timeline'] = [];
  for (const run of runs) {
    for (const e of run.events) {
      timeline.push({
        ts: e.ts,
        source: 'journal',
        label: `${run.runId.slice(0, 24)}… seq=${e.seq} ${e.type} ${e.payloadSummary}`.trim(),
      });
    }
  }
  for (const call of mcpCalls) {
    timeline.push({
      ts: call.ts ?? '',
      source: 'mcp',
      label: `${call.tool} ${call.argsSummary} (${call.sessionFile})`.trim(),
    });
  }
  timeline.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));

  const verdicts = deriveVerdicts(runs, mcpCalls, transcriptFiles, {
    now,
    silenceThresholdMs,
  });

  return {
    projectRoot,
    generatedAt: now.toISOString(),
    runs,
    mcpCalls,
    transcriptFiles: filesToScan,
    verdicts,
    timeline,
  };
}

function deriveVerdicts(
  runs: RunSummary[],
  mcpCalls: McpToolCall[],
  transcriptFiles: string[],
  ctx: { now: Date; silenceThresholdMs: number },
): AnalyzeVerdict[] {
  const verdicts: AnalyzeVerdict[] = [];

  if (runs.length === 0) {
    verdicts.push({
      code: 'no_runs',
      detail: 'Aucun run sous .supervision/runs/ — rien à expliquer côté journal.',
    });
  }

  if (transcriptFiles.length === 0) {
    verdicts.push({
      code: 'no_transcript',
      detail:
        'Aucun transcript Claude Code trouvé (slug ~/.claude/projects/…). Passe --transcript si besoin.',
    });
  }

  for (const run of runs) {
    const started = run.counts['run.started'] ?? 0;
    const finished = run.counts['run.finished'] ?? 0;
    const heartbeats = run.counts.heartbeat ?? 0;
    const gates = run.counts['gate.reached'] ?? 0;

    if (started > 0 && finished === 0) {
      verdicts.push({
        code: 'emission_gap',
        detail: `Run ${run.runId} : run.started sans run.finished (run encore ouvert / orphelin possible).`,
      });
      verdicts.push({
        code: 'orphan_run',
        detail: `Run ${run.runId} ouvert — clôture via run_finished {status: abandoned|success|failure} si plus actif.`,
      });
    }

    if (started > 0 && heartbeats === 0 && gates === 0 && finished === 0) {
      const last = run.lastEventTs ? Date.parse(run.lastEventTs) : NaN;
      const age = Number.isFinite(last) ? ctx.now.getTime() - last : Infinity;
      if (age >= ctx.silenceThresholdMs) {
        verdicts.push({
          code: 'silence_explained',
          detail:
            `Run ${run.runId} : 1× run.started, 0 heartbeat, 0 gate, run ouvert → ` +
            `« Silence prolongé » Moniteur attendu (pas un bug lecteur). Émettre heartbeat (fiche 0103) ou clore le run.`,
        });
      } else {
        verdicts.push({
          code: 'silence_explained',
          detail: `Run ${run.runId} : seulement run.started pour l’instant — sans heartbeat/gate le silence Moniteur arrivera au seuil.`,
        });
      }
    }

    if (started > 0 && (heartbeats > 0 || gates > 0) && finished > 0) {
      verdicts.push({
        code: 'healthy',
        detail: `Run ${run.runId} : journal cohérent (start + activité + fin).`,
      });
    }
  }

  const journalToolish = new Set(
    runs.flatMap((r) =>
      r.events.map((e) => {
        if (e.type === 'run.started') return 'run_start';
        if (e.type === 'run.finished') return 'run_finished';
        if (e.type === 'gate.reached') return 'gate_reached';
        if (e.type === 'gate.resumed') return 'gate_resumed';
        if (e.type === 'escalation') return 'escalate';
        if (e.type === 'heartbeat') return 'heartbeat';
        return e.type;
      }),
    ),
  );
  const mcpTools = new Set(mcpCalls.map((c) => c.tool));
  if (mcpTools.size > 0 && runs.every((r) => r.events.length === 0)) {
    verdicts.push({
      code: 'mcp_without_journal',
      detail: 'Appels MCP supervision dans le transcript, mais aucun event journal — mauvaise racine / worktree ?',
    });
  } else if (mcpTools.has('run_start') && !journalToolish.has('run_start') && runs.length === 0) {
    verdicts.push({
      code: 'mcp_without_journal',
      detail: 'run_start vu dans transcript sans journal local.',
    });
  }

  if (verdicts.length === 0) {
    verdicts.push({ code: 'healthy', detail: 'Rien d’anormal détecté sur le périmètre analysé.' });
  }

  return verdicts;
}

export function formatReportMarkdown(report: AnalyzeReport): string {
  const lines: string[] = [];
  lines.push(`# Analyse session supervision`);
  lines.push('');
  lines.push(`- **Projet** : \`${report.projectRoot}\``);
  lines.push(`- **Généré** : ${report.generatedAt}`);
  lines.push(`- **Runs** : ${report.runs.length}`);
  lines.push(`- **Appels MCP (transcript)** : ${report.mcpCalls.length}`);
  lines.push('');
  lines.push(`## Verdicts`);
  lines.push('');
  for (const v of report.verdicts) {
    lines.push(`- **\`${v.code}\`** — ${v.detail}`);
  }
  lines.push('');
  lines.push(`## Runs (journal)`);
  lines.push('');
  if (report.runs.length === 0) {
    lines.push('_Aucun run._');
  }
  for (const run of report.runs) {
    lines.push(`### \`${run.runId}\`${run.methodName ? ` — ${run.methodName}` : ''}`);
    lines.push('');
    lines.push(
      `Ouvert : **${run.open ? 'oui' : 'non'}** · counts : ${JSON.stringify(run.counts)}`,
    );
    lines.push('');
    lines.push('| seq | ts | type | payload |');
    lines.push('|-----|----|------|---------|');
    for (const e of run.events) {
      lines.push(`| ${e.seq} | ${e.ts} | \`${e.type}\` | ${e.payloadSummary.replace(/\|/g, '\\|')} |`);
    }
    lines.push('');
  }
  lines.push(`## Appels MCP supervision (transcript)`);
  lines.push('');
  if (report.mcpCalls.length === 0) {
    lines.push('_Aucun appel `mcp__supervision__*` trouvé (ou transcript absent)._');
  } else {
    lines.push('| ts | tool | args | session |');
    lines.push('|----|------|------|---------|');
    for (const c of report.mcpCalls) {
      lines.push(
        `| ${c.ts ?? '—'} | \`${c.tool}\` | ${c.argsSummary.replace(/\|/g, '\\|')} | \`${c.sessionFile}\` |`,
      );
    }
  }
  lines.push('');
  lines.push(`## Transcripts scannés`);
  lines.push('');
  for (const f of report.transcriptFiles) {
    lines.push(`- \`${f}\``);
  }
  if (report.transcriptFiles.length === 0) lines.push('_aucun_');
  lines.push('');
  lines.push(`> Privacy : prompts utilisateur non dumpés (passe \`--full\` seulement si besoin).`);
  lines.push('');
  return lines.join('\n');
}
