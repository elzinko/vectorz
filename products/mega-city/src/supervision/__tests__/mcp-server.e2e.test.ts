/**
 * Test E2E — pilote le VRAI process serveur MCP émetteur (bin/supervision-mcp.ts)
 * en stdio, via le client officiel `@modelcontextprotocol/sdk`. Ne teste pas les
 * unités (déjà couvertes par runtime.test.ts / journal.test.ts) : vérifie que le
 * process spawné, le protocole JSON-RPC et le journal sur disque sont cohérents
 * de bout en bout (fiche 0050, kit-emetteur.feature).
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { EXPECTED_SUPERVISION_TOOLS } from '../probe.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const serverEntry = path.join(repoRoot, 'bin', 'supervision-mcp.ts');
const tsxBin = path.join(repoRoot, 'node_modules', '.bin', 'tsx');

let projectRoot: string;
let client: Client;
let transport: StdioClientTransport;

function initProject(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-mcp-e2e-'));
  execFileSync('git', ['init'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root });
  fs.writeFileSync(path.join(root, 'README.md'), '# poc\n');
  execFileSync('git', ['add', '.'], { cwd: root });
  execFileSync('git', ['commit', '-m', 'initial'], { cwd: root });
  return root;
}

async function startClient(root: string): Promise<{ client: Client; transport: StdioClientTransport }> {
  const t = new StdioClientTransport({
    command: tsxBin,
    args: [serverEntry],
    env: { ...process.env, SUPERVISION_PROJECT_ROOT: root },
  });
  const c = new Client({ name: 'e2e-test-client', version: '0.0.1' });
  await c.connect(t);
  return { client: c, transport: t };
}

function readEvents(root: string, runId: string): Array<Record<string, unknown>> {
  const filePath = path.join(root, '.supervision', 'runs', runId, 'events.jsonl');
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw
    .split('\n')
    .filter((l) => l.length > 0)
    .map((l) => JSON.parse(l));
}

function toolResultText(result: unknown): string {
  const r = result as { content: Array<{ type: string; text?: string }> };
  return r.content.map((c) => c.text ?? '').join('');
}

function toolResultJson(result: unknown): any {
  return JSON.parse(toolResultText(result));
}

beforeEach(() => {
  projectRoot = initProject();
});

afterEach(async () => {
  try {
    await transport?.close();
  } catch {
    // déjà fermé
  }
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

describe('Serveur MCP émetteur — E2E stdio (process réel)', () => {
  it('expose exactement les outils attendus, ni plus ni moins', async () => {
    ({ client, transport } = await startClient(projectRoot));

    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();

    expect(names).toEqual([...EXPECTED_SUPERVISION_TOOLS].sort());
    expect(names).not.toContain('emit_event');
  }, 20000);

  it('déroule le parcours nominal complet par le protocole et vérifie le journal sur disque', async () => {
    ({ client, transport } = await startClient(projectRoot));

    const startResult = await client.callTool({
      name: 'run_start',
      arguments: { method_name: 'ezk-product-builder', method_version: '0.1.0', seat: 'pilot' },
    });
    expect(startResult.isError).toBeFalsy();
    const { run_id: runId } = toolResultJson(startResult);
    expect(typeof runId).toBe('string');

    const heartbeatResult = await client.callTool({
      name: 'heartbeat',
      arguments: { note: 'entre start et gate-1' },
    });
    expect(heartbeatResult.isError).toBeFalsy();

    const gateResult = await client.callTool({
      name: 'gate_reached',
      arguments: { gate_id: 'gate-1', outcome: 'ok', report_markdown: '## Étape 1 OK' },
    });
    expect(gateResult.isError).toBeFalsy();
    const gateText = toolResultText(gateResult);
    expect(gateText).toContain('STOP');
    const gatePayload = toolResultJson(gateResult);
    const gateEventId = gatePayload.gate_event_id;
    expect(typeof gateEventId).toBe('string');
    expect(gateEventId.length).toBeGreaterThan(0);

    const resumedResult = await client.callTool({
      name: 'gate_resumed',
      arguments: { gate_event_id: gateEventId },
    });
    expect(resumedResult.isError).toBeFalsy();

    const escalateResult = await client.callTool({
      name: 'escalate',
      arguments: { type: 'blocked', detail: 'attente d\'une dépendance externe' },
    });
    expect(escalateResult.isError).toBeFalsy();
    const escalatePayload = toolResultJson(escalateResult);
    expect(typeof escalatePayload.escalation_id).toBe('string');

    const finishedResult = await client.callTool({
      name: 'run_finished',
      arguments: { status: 'success' },
    });
    expect(finishedResult.isError).toBeFalsy();

    // --- Vérification du journal réel sur disque ---
    const eventsPath = path.join(projectRoot, '.supervision', 'runs', runId, 'events.jsonl');
    expect(fs.existsSync(eventsPath)).toBe(true);

    const events = readEvents(projectRoot, runId);
    expect(events).toHaveLength(6);

    const types = events.map((e) => e.type);
    expect(types).toEqual([
      'run.started',
      'heartbeat',
      'gate.reached',
      'gate.resumed',
      'escalation',
      'run.finished',
    ]);

    // seq strictement croissant sans trou, base 1
    expect(events.map((e) => e.seq)).toEqual([1, 2, 3, 4, 5, 6]);

    // run_id constant sur tout le journal
    for (const event of events) {
      expect(event.run_id).toBe(runId);
    }

    // event_id tous uniques
    const eventIds = new Set(events.map((e) => e.event_id));
    expect(eventIds.size).toBe(events.length);

    // enveloppe complète sur chaque ligne
    for (const event of events) {
      expect(event).toHaveProperty('event_id');
      expect(event).toHaveProperty('run_id');
      expect(event).toHaveProperty('seq');
      expect(event).toHaveProperty('ts');
      expect(event).toHaveProperty('contract');
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('payload');
      expect(event.contract).toBe('cop1/supervisability@0.1');
    }

    // report_ref relatif, pointant vers un fichier md existant sous le dossier du run
    const gateEvent = events[2] as { payload: { report_ref?: string } };
    expect(gateEvent.payload.report_ref).toBeDefined();
    const reportRef = gateEvent.payload.report_ref as string;
    expect(path.isAbsolute(reportRef)).toBe(false);
    const reportAbsPath = path.join(projectRoot, reportRef);
    expect(fs.existsSync(reportAbsPath)).toBe(true);
    const runDir = path.join(projectRoot, '.supervision', 'runs', runId);
    expect(path.resolve(reportAbsPath).startsWith(path.resolve(runDir) + path.sep)).toBe(true);
    expect(fs.readFileSync(reportAbsPath, 'utf8')).toBe('## Étape 1 OK');
  }, 20000);

  it('refuse un second run_start pendant un run ouvert, sans crasher le process', async () => {
    ({ client, transport } = await startClient(projectRoot));

    const first = await client.callTool({
      name: 'run_start',
      arguments: { method_name: 'ezk-product-builder', method_version: '0.1.0' },
    });
    expect(first.isError).toBeFalsy();
    const { run_id: runId } = toolResultJson(first);

    const second = await client.callTool({
      name: 'run_start',
      arguments: { method_name: 'ezk-product-builder', method_version: '0.1.0' },
    });
    expect(second.isError).toBe(true);
    expect(toolResultText(second)).toMatch(/déjà ouvert/);

    // le process est toujours vivant : un appel suivant fonctionne normalement
    const stillAlive = await client.callTool({
      name: 'gate_reached',
      arguments: { gate_id: 'gate-1', outcome: 'attention' },
    });
    expect(stillAlive.isError).toBeFalsy();

    // aucun second dossier de run créé
    const runsDir = path.join(projectRoot, '.supervision', 'runs');
    const runIds = fs.readdirSync(runsDir);
    expect(runIds).toEqual([runId]);
  }, 20000);
});
