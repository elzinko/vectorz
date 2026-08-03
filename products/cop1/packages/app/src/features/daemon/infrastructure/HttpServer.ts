import { type IncomingMessage, type Server, type ServerResponse, createServer } from 'node:http';
import type { EventBus } from '@cop1/shared-kernel';
import { COP1_VERSION, type HealthInfo } from '../domain/DaemonState.js';
import type { AuthCheckResult } from './AuthChecker.js';

const MAX_BODY_SIZE = 10_240; // 10 KB
const VALID_STATUSES = ['pending', 'approved', 'rejected', 'debated'] as const;
type RuleProposalStatus = (typeof VALID_STATUSES)[number];

/**
 * fiche 0031 (ADR-028) — hydrate `GET /api/supervision/runs` au montage du
 * front (le SSE `/events` ne rejoue pas le passé).
 */
export type SupervisionProvider = () => unknown[];

/** fiche 0062 — projets déclarés dans le registre (lecture seule). */
export interface SupervisionProjectDto {
  id: string;
  path: string;
  method: string;
  projectRoot: string;
}

export type ProjectsProvider = () => SupervisionProjectDto[];

export interface RuleProposalRecord {
  ruleId: string;
  type: string;
  description: string;
  reason: string;
  submittedBy: string;
  submittedAt: string;
  status: RuleProposalStatus;
  rejectionReason?: string;
}

export interface RuleProposalProvider {
  getAll(): RuleProposalRecord[];
  updateStatus(ruleId: string, status: RuleProposalStatus, reason?: string): RuleProposalRecord;
}

/**
 * Minimal request-handler port for the blocage API (fiche 0021). Structurally
 * satisfied by `BlocageApiHandler` — keeps HttpServer free of a concrete feature
 * dependency. `handle` returns true when it owns the route (the response has
 * already been written).
 */
export interface BlocageApiPort {
  handle(req: IncomingMessage, res: ServerResponse): boolean;
}

/**
 * ADR-035 D4 — Port minimal pour la route POST /api/supervision/runs/abandon.
 * Garde HttpServer sans dépendance concrète à la feature supervision.
 */
export interface RunAbandonHandler {
  execute(runDir: string): Promise<{ status: 200 | 202 | 404 | 409; body: unknown }>;
}

export class HttpServer {
  private server: Server | null = null;
  private readonly startedAt: number = Date.now();
  private sseClients: Set<ServerResponse> = new Set();
  private supervisionProvider: SupervisionProvider | null = null;
  private projectsProvider: ProjectsProvider | null = null;
  private ruleProposalProvider: RuleProposalProvider | null = null;
  private authChecker: (() => Promise<AuthCheckResult>) | null = null;
  private blocageApiHandler: BlocageApiPort | null = null;
  private runAbandonHandler: RunAbandonHandler | null = null;
  private eventBusWired = false;

  setSupervisionProvider(provider: SupervisionProvider): void {
    this.supervisionProvider = provider;
  }

  /** fiche 0062 — liste registre (vide si absent). */
  setProjectsProvider(provider: ProjectsProvider): void {
    this.projectsProvider = provider;
  }

  setRuleProposalProvider(provider: RuleProposalProvider): void {
    this.ruleProposalProvider = provider;
  }

  setAuthChecker(checker: () => Promise<AuthCheckResult>): void {
    this.authChecker = checker;
  }

  setBlocageApiHandler(handler: BlocageApiPort): void {
    this.blocageApiHandler = handler;
  }

  /** ADR-035 D4 — câblage de la route POST /api/supervision/runs/abandon. */
  setRunAbandonHandler(handler: RunAbandonHandler): void {
    this.runAbandonHandler = handler;
  }

  setEventBus(eventBus: EventBus): void {
    // F4: idempotent — wrapping `emit` more than once would broadcast each event
    // multiple times. Guard so a re-call (e.g. composition wiring) is a no-op.
    if (this.eventBusWired) return;
    this.eventBusWired = true;
    // Bridge all events to SSE clients
    const originalEmit = eventBus.emit.bind(eventBus);
    eventBus.emit = (eventType: string, payload: unknown) => {
      originalEmit(eventType, payload);
      this.broadcastSSE(eventType, payload);
    };
  }

  start(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on('error', reject);
      this.server.listen(port, '127.0.0.1', () => {
        resolve();
      });
    });
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    if (req.method === 'GET' && req.url === '/health') {
      const health: HealthInfo = {
        status: 'ok',
        uptime: Math.floor((Date.now() - this.startedAt) / 1000),
        version: COP1_VERSION,
        pid: process.pid,
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health));
      return;
    }

    if (req.method === 'GET' && req.url === '/api/supervision/runs') {
      const data = this.supervisionProvider?.() ?? [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    if (req.method === 'GET' && req.url === '/api/supervision/projects') {
      const data = this.projectsProvider?.() ?? [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    if (req.method === 'GET' && req.url === '/api/rules/proposals') {
      const data = this.ruleProposalProvider?.getAll() ?? [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    const patchMatch = req.url?.match(/^\/api\/rules\/proposals\/(.+)$/);
    if (patchMatch && req.method === 'PATCH') {
      const ruleId = patchMatch[1] ?? '';
      this.handleRuleProposalPatch(req, res, ruleId);
      return;
    }

    if (req.method === 'GET' && req.url === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(':ok\n\n');

      this.sseClients.add(res);
      req.on('close', () => {
        this.sseClients.delete(res);
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/api/auth/check') {
      void this.handleAuthCheck(res);
      return;
    }

    // ADR-035 D4 — abandon d'un run orphelin depuis le Moniteur
    if (req.method === 'POST' && req.url === '/api/supervision/runs/abandon') {
      void this.handleRunAbandon(req, res);
      return;
    }

    // fiche 0021 — GET /api/blocages + POST /api/blocages/:id/resolve. The
    // handler returns true when it owns the route (response already written).
    if (this.blocageApiHandler?.handle(req, res)) {
      return;
    }

    // E4 — epoch-1 pilot routes (/api/orchestrator/*, /api/sprint/status) removed → 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
  }

  /** Chunked JSON body parse with a MAX_BODY_SIZE guard (mirrors the PATCH path). */
  private readJsonBody(
    req: IncomingMessage,
    res: ServerResponse,
    onParsed: (parsed: unknown) => void,
  ): void {
    let body = '';
    let bodySize = 0;
    req.on('data', (chunk: Buffer) => {
      bodySize += chunk.length;
      if (bodySize > MAX_BODY_SIZE) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request body too large' }));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });
    req.on('end', () => {
      if (bodySize > MAX_BODY_SIZE) return;
      try {
        onParsed(body ? JSON.parse(body) : {});
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: message }));
      }
    });
  }

  private async handleAuthCheck(res: ServerResponse): Promise<void> {
    const result: AuthCheckResult = this.authChecker
      ? await this.authChecker()
      : {
          ok: false,
          model: null,
          error: 'auth checker not configured',
          availability: 'unavailable',
        };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  }

  private handleRuleProposalPatch(req: IncomingMessage, res: ServerResponse, ruleId: string): void {
    let body = '';
    let bodySize = 0;
    req.on('data', (chunk: Buffer) => {
      bodySize += chunk.length;
      if (bodySize > MAX_BODY_SIZE) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request body too large' }));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });
    req.on('end', () => {
      if (bodySize > MAX_BODY_SIZE) return;
      try {
        const parsed = JSON.parse(body) as { status?: string; reason?: string };
        if (!parsed.status) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'status field is required' }));
          return;
        }

        if (!(VALID_STATUSES as readonly string[]).includes(parsed.status)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: `Invalid status: must be one of ${VALID_STATUSES.join(', ')}`,
            }),
          );
          return;
        }

        const updated = this.ruleProposalProvider?.updateStatus(
          ruleId,
          parsed.status as RuleProposalStatus,
          parsed.reason,
        );
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(updated));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('not found')) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: message }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: message }));
        }
      }
    });
  }

  private async handleRunAbandon(req: IncomingMessage, res: ServerResponse): Promise<void> {
    this.readJsonBody(req, res, (parsed) => {
      const body = parsed as { runDir?: string };
      if (!body.runDir || typeof body.runDir !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'runDir field is required (string)' }));
        return;
      }

      if (!this.runAbandonHandler) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'abandon handler not configured' }));
        return;
      }

      void this.runAbandonHandler
        .execute(body.runDir)
        .then(({ status, body: responseBody }) => {
          res.writeHead(status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(responseBody));
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: message }));
        });
    });
  }

  private broadcastSSE(eventType: string, payload: unknown): void {
    const data = JSON.stringify({
      eventType,
      timestamp: new Date().toISOString(),
      payload,
    });
    const message = `data: ${data}\n\n`;

    for (const client of this.sseClients) {
      try {
        client.write(message);
      } catch {
        this.sseClients.delete(client);
      }
    }
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      // Close all SSE clients
      for (const client of this.sseClients) {
        client.end();
      }
      this.sseClients.clear();

      if (!this.server) {
        resolve();
        return;
      }
      this.server.close(() => {
        this.server = null;
        resolve();
      });
    });
  }

  get listening(): boolean {
    return this.server?.listening ?? false;
  }
}
