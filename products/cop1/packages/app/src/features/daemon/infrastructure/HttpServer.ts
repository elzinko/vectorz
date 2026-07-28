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
 * Minimal request-handler port for the blocage API (fiche 0021).
 */
export interface BlocageApiPort {
  handle(req: IncomingMessage, res: ServerResponse): boolean;
}

export class HttpServer {
  private server: Server | null = null;
  private readonly startedAt: number = Date.now();
  private sseClients: Set<ServerResponse> = new Set();
  private supervisionProvider: SupervisionProvider | null = null;
  private ruleProposalProvider: RuleProposalProvider | null = null;
  private authChecker: (() => Promise<AuthCheckResult>) | null = null;
  private blocageApiHandler: BlocageApiPort | null = null;
  private eventBusWired = false;

  setSupervisionProvider(provider: SupervisionProvider): void {
    this.supervisionProvider = provider;
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

  setEventBus(eventBus: EventBus): void {
    if (this.eventBusWired) return;
    this.eventBusWired = true;
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

    if (this.blocageApiHandler?.handle(req, res)) {
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
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
