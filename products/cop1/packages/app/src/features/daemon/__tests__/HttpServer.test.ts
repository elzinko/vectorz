import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventBus } from '@cop1/shared-kernel';
import { BlockageService, RuleProposalService } from '@cop1/sprint-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BlocageApiHandler } from '../../blocage-api/application/BlocageApiHandler.js';
import { HttpServer } from '../infrastructure/HttpServer.js';

describe('HttpServer', () => {
  let server: HttpServer;
  const TEST_PORT = 14242;

  beforeEach(() => {
    server = new HttpServer();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('should start and listen on the given port', async () => {
    await server.start(TEST_PORT);
    expect(server.listening).toBe(true);
  });

  it('should respond to /health with JSON', async () => {
    await server.start(TEST_PORT);

    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/health`);
    expect(res.status).toBe(200);

    const data = (await res.json()) as {
      status: string;
      uptime: number;
      version: string;
      pid: number;
    };
    expect(data.status).toBe('ok');
    expect(data.version).toBe('0.1.0');
    expect(typeof data.uptime).toBe('number');
    expect(data.pid).toBe(process.pid);
  });

  it('should respond 404 to unknown routes', async () => {
    await server.start(TEST_PORT);

    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/unknown`);
    expect(res.status).toBe(404);
  });

  describe('GET /api/supervision/runs (fiche 0031 / ADR-028)', () => {
    it("renvoie [] quand aucun provider n'est configuré", async () => {
      await server.start(TEST_PORT);

      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/supervision/runs`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([]);
    });

    it('renvoie Object.values() du provider (miroir SprintStatusProvider)', async () => {
      const snapshot = { runId: 'run-1', state: 'running' };
      server.setSupervisionProvider(() => [snapshot]);
      await server.start(TEST_PORT);

      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/supervision/runs`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([snapshot]);
    });
  });

  describe('GET /api/supervision/projects (fiche 0062)', () => {
    it("renvoie [] quand aucun provider n'est configuré", async () => {
      await server.start(TEST_PORT);
      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/supervision/projects`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([]);
    });

    it('renvoie le registre exposé par le provider', async () => {
      const project = {
        id: 'vectorz',
        path: '.',
        method: 'mega-city',
        projectRoot: '/tmp/vectorz',
      };
      server.setProjectsProvider(() => [project]);
      await server.start(TEST_PORT);
      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/supervision/projects`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([project]);
    });
  });

  describe('POST /api/supervision/projects/anchor (fiche 0063)', () => {
    it('503 si handler absent', async () => {
      await server.start(TEST_PORT);
      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/supervision/projects/anchor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectRoot: '/tmp', mode: 'supervised' }),
      });
      expect(res.status).toBe(503);
    });

    it('délègue au handler configuré', async () => {
      server.setProjectAnchorHandler({
        execute: async () => ({
          status: 200,
          body: { ok: true, mode: 'method-only', daemonRestartRequired: false },
        }),
      });
      await server.start(TEST_PORT);
      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/supervision/projects/anchor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectRoot: '/tmp/x', mode: 'method-only' }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ ok: true, mode: 'method-only' });
    });
  });

  it('should stop cleanly', async () => {
    await server.start(TEST_PORT);
    expect(server.listening).toBe(true);
    await server.stop();
    expect(server.listening).toBe(false);
  });

  it('should handle stop when not started', async () => {
    await expect(server.stop()).resolves.toBeUndefined();
  });

  describe('Rule Proposals API', () => {
    let eventBus: EventBus;
    let ruleProposalService: RuleProposalService;

    beforeEach(() => {
      eventBus = new EventBus();
      ruleProposalService = new RuleProposalService(eventBus);
      server.setRuleProposalProvider(ruleProposalService);
    });

    afterEach(() => {
      eventBus.removeAllListeners();
    });

    it('should return empty array when no proposals exist', async () => {
      await server.start(TEST_PORT);

      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/rules/proposals`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toEqual([]);
    });

    it('should return all proposals', async () => {
      ruleProposalService.submit({
        type: 'architecture',
        ruleId: 'RULE-001',
        description: 'Test rule',
        reason: 'Test reason',
        submittedBy: 'dev-agent',
      });
      await server.start(TEST_PORT);

      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/rules/proposals`);
      expect(res.status).toBe(200);

      const data = (await res.json()) as Array<{ ruleId: string; status: string }>;
      expect(data).toHaveLength(1);
      expect(data[0]?.ruleId).toBe('RULE-001');
      expect(data[0]?.status).toBe('pending');
    });

    it('should update proposal status via PATCH', async () => {
      ruleProposalService.submit({
        type: 'architecture',
        ruleId: 'RULE-001',
        description: 'Test rule',
        reason: 'Test reason',
        submittedBy: 'dev-agent',
      });
      await server.start(TEST_PORT);

      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/rules/proposals/RULE-001`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      expect(res.status).toBe(200);

      const data = (await res.json()) as { ruleId: string; status: string };
      expect(data.ruleId).toBe('RULE-001');
      expect(data.status).toBe('approved');
    });

    it('should return 404 for unknown proposal id on PATCH', async () => {
      await server.start(TEST_PORT);

      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/rules/proposals/UNKNOWN`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      expect(res.status).toBe(404);
    });

    it('should return 400 for PATCH without status field', async () => {
      ruleProposalService.submit({
        type: 'architecture',
        ruleId: 'RULE-001',
        description: 'Test rule',
        reason: 'Test reason',
        submittedBy: 'dev-agent',
      });
      await server.start(TEST_PORT);

      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/rules/proposals/RULE-001`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it('should return 400 for PATCH with invalid status value', async () => {
      ruleProposalService.submit({
        type: 'architecture',
        ruleId: 'RULE-001',
        description: 'Test rule',
        reason: 'Test reason',
        submittedBy: 'dev-agent',
      });
      await server.start(TEST_PORT);

      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/rules/proposals/RULE-001`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'garbage' }),
      });
      expect(res.status).toBe(400);

      const data = (await res.json()) as { error: string };
      expect(data.error).toContain('Invalid status');
    });

    it('should pass reason to updateStatus when rejecting', async () => {
      ruleProposalService.submit({
        type: 'architecture',
        ruleId: 'RULE-001',
        description: 'Test rule',
        reason: 'Test reason',
        submittedBy: 'dev-agent',
      });
      await server.start(TEST_PORT);

      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/rules/proposals/RULE-001`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', reason: 'Not aligned with goals' }),
      });
      expect(res.status).toBe(200);

      const data = (await res.json()) as {
        ruleId: string;
        status: string;
        rejectionReason?: string;
      };
      expect(data.status).toBe('rejected');
      expect(data.rejectionReason).toBe('Not aligned with goals');
    });
  });

  it('should serve SSE events on /events', async () => {
    const eventBus = new EventBus();
    server.setEventBus(eventBus);
    await server.start(TEST_PORT);

    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/events`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/event-stream');

    // Read the initial :ok message
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      const { value } = await reader.read();
      const text = decoder.decode(value);
      expect(text).toContain(':ok');

      // Emit an event
      eventBus.emit('test.event', { data: 'hello' });

      // Read the SSE message
      const { value: value2 } = await reader.read();
      const text2 = decoder.decode(value2);
      expect(text2).toContain('data:');
      expect(text2).toContain('test.event');

      reader.cancel();
    }
  });

  it('setEventBus is idempotent: a re-call never double-wraps emit (F4)', async () => {
    const eventBus = new EventBus();
    server.setEventBus(eventBus);
    server.setEventBus(eventBus); // second call must be a no-op
    await server.start(TEST_PORT);

    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/events`);
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (reader) {
      await reader.read(); // consume :ok

      eventBus.emit('test.event', { data: 'once' });

      const { value } = await reader.read();
      const text = decoder.decode(value);
      // Exactly one SSE frame for the single emit (no duplicate from double-wrap).
      const frames = text.split('\n\n').filter((f) => f.includes('test.event'));
      expect(frames).toHaveLength(1);

      reader.cancel();
    }
  });

  it('returns 404 for removed epoch-1 pilot routes (E4)', async () => {
    await server.start(TEST_PORT);

    const sprintStatus = await fetch(`http://127.0.0.1:${TEST_PORT}/api/sprint/status`);
    expect(sprintStatus.status).toBe(404);

    const run = await fetch(`http://127.0.0.1:${TEST_PORT}/api/orchestrator/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ epic: 'EA1' }),
    });
    expect(run.status).toBe(404);
  });

  describe('Blocage API (fiche 0021)', () => {
    let projectRoot: string;
    let eventBus: EventBus;
    let blockage: BlockageService;

    beforeEach(async () => {
      projectRoot = await mkdtemp(join(tmpdir(), 'httpserver-blocage-'));
      eventBus = new EventBus();
      blockage = new BlockageService(projectRoot, eventBus);
      server.setBlocageApiHandler(new BlocageApiHandler(blockage));
    });

    afterEach(async () => {
      eventBus.removeAllListeners();
      await rm(projectRoot, { recursive: true, force: true });
    });

    it('GET /api/blocages returns [] when none are declared', async () => {
      await server.start(TEST_PORT);
      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/blocages`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([]);
    });

    it('GET /api/blocages lists an open blocage once one is declared', async () => {
      blockage.declare('EA1-S1', 'ambiguity', 'need a decision');
      await server.start(TEST_PORT);

      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/blocages`);
      const data = (await res.json()) as Array<{ storyId: string; status: string }>;
      expect(data).toHaveLength(1);
      expect(data[0]?.storyId).toBe('EA1-S1');
      expect(data[0]?.status).toBe('open');
    });

    it('POST /api/blocages/:id/resolve resolves the blocage and clears the open list', async () => {
      const declared = blockage.declare('EA1-S1', 'ambiguity', 'need a decision');
      await server.start(TEST_PORT);

      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/blocages/${declared.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: 'go with A' }),
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as { status: string; response: string };
      expect(data.status).toBe('resolved');
      expect(data.response).toBe('go with A');

      const list = await (await fetch(`http://127.0.0.1:${TEST_PORT}/api/blocages`)).json();
      expect(list).toEqual([]);
    });

    it('falls through to 404 when no blocage route matches (PUT on resolve)', async () => {
      await server.start(TEST_PORT);
      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/blocages/BLK-unknown/resolve`, {
        method: 'PUT',
      });
      expect(res.status).toBe(404);
    });
  });
});
