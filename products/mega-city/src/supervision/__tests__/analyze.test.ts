import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  analyzeSession,
  formatReportMarkdown,
  projectPathToClaudeSlug,
  summarizeRun,
} from '../analyze.js';
import { Journal } from '../journal.js';

function tmpProject(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-analyze-'));
  return root;
}

describe('analyzeSession (fiche 0104)', () => {
  it('projectPathToClaudeSlug encode comme Claude Code', () => {
    expect(projectPathToClaudeSlug('/Users/elzinko/git/bacasable/vectorz')).toBe(
      '-Users-elzinko-git-bacasable-vectorz',
    );
  });

  it('explique le dogfood 2026-07-29 : start seul → silence_explained + emission_gap', () => {
    const root = tmpProject();
    const runId = '2026-07-29T12-48-47-648Z-2a4f2f22';
    const runDir = path.join(root, '.supervision', 'runs', runId);
    // Horodatage figé (Journal.append utilise Date.now() — trop pour ce scénario).
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(
      path.join(runDir, 'events.jsonl'),
      `${JSON.stringify({
        event_id: 'e1',
        run_id: runId,
        seq: 1,
        ts: '2026-07-29T12:48:47.648Z',
        contract: 'urn:test',
        type: 'run.started',
        payload: {
          method: { name: 'ezk-sprint', version: '0.1.0' },
          seat: 'human',
        },
      })}\n`,
    );

    const claudeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-projects-'));
    const slug = projectPathToClaudeSlug(root);
    const sessionDir = path.join(claudeDir, slug);
    fs.mkdirSync(sessionDir, { recursive: true });
    const sessionFile = path.join(sessionDir, '2809b04c-fake.jsonl');
    const line = JSON.stringify({
      type: 'assistant',
      timestamp: '2026-07-29T12:48:47.000Z',
      message: {
        content: [
          {
            type: 'tool_use',
            name: 'mcp__supervision__run_start',
            input: { method_name: 'ezk-sprint', method_version: '0.1.0', seat: 'human' },
          },
        ],
      },
    });
    fs.writeFileSync(sessionFile, `${line}\n`);

    const now = new Date('2026-07-29T13:10:00.000Z'); // > 5 min after start
    const report = analyzeSession(root, {
      claudeProjectsDir: claudeDir,
      now,
      silenceThresholdMs: 5 * 60_000,
    });

    const codes = report.verdicts.map((v) => v.code);
    expect(codes).toContain('silence_explained');
    expect(codes).toContain('emission_gap');
    expect(codes).toContain('orphan_run');

    const silence = report.verdicts.find((v) => v.code === 'silence_explained');
    expect(silence?.detail).toMatch(/0 heartbeat/i);
    expect(silence?.detail).toMatch(/Silence prolongé/i);

    expect(report.runs).toHaveLength(1);
    expect(report.runs[0].counts).toEqual({ 'run.started': 1 });
    expect(report.mcpCalls).toHaveLength(1);
    expect(report.mcpCalls[0].tool).toBe('run_start');

    const md = formatReportMarkdown(report);
    expect(md).toContain('silence_explained');
    expect(md).toContain('run.started');

    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(claudeDir, { recursive: true, force: true });
  });

  it('healthy quand start + heartbeat + finished', () => {
    const root = tmpProject();
    const runId = 'run-healthy';
    const runDir = path.join(root, '.supervision', 'runs', runId);
    const journal = new Journal(runDir, runId);
    journal.append('run.started', { method: { name: 'm', version: '1' }, seat: 'human' });
    journal.append('heartbeat', { note: 'travail' });
    journal.append('run.finished', { status: 'success' });

    const report = analyzeSession(root, { now: new Date() });
    expect(report.verdicts.some((v) => v.code === 'healthy')).toBe(true);
    expect(report.verdicts.some((v) => v.code === 'silence_explained')).toBe(false);

    fs.rmSync(root, { recursive: true, force: true });
  });

  it('summarizeRun lit le journal', () => {
    const root = tmpProject();
    const runId = 'r1';
    const runDir = path.join(root, '.supervision', 'runs', runId);
    const journal = new Journal(runDir, runId);
    journal.append('run.started', { method: { name: 'demo', version: '0.1.0' } });
    const summary = summarizeRun(root, runId);
    expect(summary.open).toBe(true);
    expect(summary.methodName).toBe('demo');
    fs.rmSync(root, { recursive: true, force: true });
  });
});
