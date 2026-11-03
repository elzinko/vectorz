import { type IncomingMessage, type Server, type ServerResponse, createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { EventBus } from '@cop1/shared-kernel';
import { COP1_VERSION, DEFAULT_WEB_PORT, type HealthInfo } from '../domain/DaemonState.js';
import type { AuthCheckResult } from './AuthChecker.js';
import { guardRequest } from './requestGuard.js';

const MAX_BODY_SIZE = 10_240; // 10 KB

/**
 * fiche 0031 (ADR-028) — hydrate `GET /api/supervision/runs` au montage du
 * front (le SSE `/events` ne rejoue pas le passé).
 */
export type SupervisionProvider = () => unknown[];

/** fiche 0022 — historique des runs terminés / passés (lecture disque). */
export type HistoryProvider = (query: { limit: number; projectRoot?: string }) => unknown[];

/** fiche 0062 — projets déclarés dans le registre (lecture seule). */
export interface SupervisionProjectDto {
  id: string;
  path: string;
  method: string;
  projectRoot: string;
}

export type ProjectsProvider = () => SupervisionProjectDto[];

/** fiche board (ADR-074) — GET /api/board : la donnée du board, projets indexés par nom. */
export type BoardProvider = () => Record<string, unknown>;

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

/** fiche 20261102151630248 — le pouce de revue, posé par la commande de la méthode. */
export interface VerdictHandler {
  execute(body: unknown): Promise<{ status: number; body: unknown }>;
}

/** fiche 20261102123552184 — les documents de la méthode : la liste, puis un fichier listé. */
export interface MapsHandler {
  list(projet: string): Promise<{ status: number; body: unknown }>;
  file(
    projet: string,
    id: string,
    nom: string,
  ): Promise<{ status: number; contentType: string; body: string }>;
}

/** fiche 20260826222044335 — la loi d'un projet, lue depuis la mémoire du daemon (jamais d'attente). */
export interface LawHandler {
  read(projet: string): { status: number; body: unknown };
}

/** fiche 0063 — ancrage projet (geste humain depuis le Moniteur). */
export interface ProjectAnchorHandler {
  execute(body: unknown): Promise<{ status: 200 | 400 | 409; body: unknown }>;
}

export class HttpServer {
  private server: Server | null = null;
  private readonly startedAt: number = Date.now();
  private sseClients: Set<ServerResponse> = new Set();
  private supervisionProvider: SupervisionProvider | null = null;
  private historyProvider: HistoryProvider | null = null;
  private projectsProvider: ProjectsProvider | null = null;
  private boardProvider: BoardProvider | null = null;
  private authChecker: (() => Promise<AuthCheckResult>) | null = null;
  private blocageApiHandler: BlocageApiPort | null = null;
  private runAbandonHandler: RunAbandonHandler | null = null;
  private projectAnchorHandler: ProjectAnchorHandler | null = null;
  private verdictHandler: VerdictHandler | null = null;
  private mapsHandler: MapsHandler | null = null;
  private lawHandler: LawHandler | null = null;
  private eventBusWired = false;
  /** Le port réellement écouté, et celui de la page web : ce que la garde tient pour « local ». */
  private boundPort = 0;
  private webPort = DEFAULT_WEB_PORT;

  /** fiche 20261102165708468 — le port de la page de mission control, dont l'Origin peut écrire. */
  setWebPort(port: number): void {
    this.webPort = port;
  }

  setSupervisionProvider(provider: SupervisionProvider): void {
    this.supervisionProvider = provider;
  }

  /** fiche 0022 — GET /api/supervision/history */
  setHistoryProvider(provider: HistoryProvider): void {
    this.historyProvider = provider;
  }

  /** fiche 0062 — liste registre (vide si absent). */
  setProjectsProvider(provider: ProjectsProvider): void {
    this.projectsProvider = provider;
  }

  /** fiche board (ADR-074) — GET /api/board */
  setBoardProvider(provider: BoardProvider): void {
    this.boardProvider = provider;
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

  /** fiche 0063 — POST /api/supervision/projects/anchor. */
  setProjectAnchorHandler(handler: ProjectAnchorHandler): void {
    this.projectAnchorHandler = handler;
  }

  /** fiche 20261102151630248 — POST /api/verdict. */
  setVerdictHandler(handler: VerdictHandler): void {
    this.verdictHandler = handler;
  }

  /** fiche 20261102123552184 — GET /api/maps/<projet> et GET /api/maps/<projet>/<id>/<nom>. */
  setMapsHandler(handler: MapsHandler): void {
    this.mapsHandler = handler;
  }

  /** fiche 20260826222044335 — GET /api/law/<projet>. */
  setLawHandler(handler: LawHandler): void {
    this.lawHandler = handler;
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
        this.boundPort = (this.server?.address() as AddressInfo).port;
        resolve();
      });
    });
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    // fiche 20261102165708468 — la garde passe avant toute route : un refus n'exécute rien.
    const verdict = guardRequest(
      {
        method: req.method ?? 'GET',
        host: req.headers.host,
        origin: req.headers.origin,
        contentType: req.headers['content-type'],
      },
      { daemonPort: this.boundPort, webPort: this.webPort },
    );
    if (!verdict.ok) {
      req.resume(); // vide le corps non lu : sinon la connexion se coupe en plein envoi
      res.writeHead(verdict.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: verdict.reason }));
      return;
    }

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

    if (req.method === 'GET' && req.url?.startsWith('/api/supervision/history')) {
      const url = new URL(req.url, 'http://127.0.0.1');
      const limitRaw = url.searchParams.get('limit');
      const limitParsed = limitRaw ? Number.parseInt(limitRaw, 10) : 20;
      const limit =
        Number.isFinite(limitParsed) && limitParsed > 0 ? Math.min(limitParsed, 100) : 20;
      const projectRoot = url.searchParams.get('projectRoot') ?? undefined;
      const data = this.historyProvider?.({ limit, projectRoot }) ?? [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
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

    if (req.method === 'GET' && req.url === '/api/board') {
      let data: Record<string, unknown> = {};
      try {
        data = this.boardProvider?.() ?? {};
      } catch {
        data = {}; // le board dégrade proprement plutôt que de faire crasher le daemon
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
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

    // fiche 0063 — ancrage projet (geste humain)
    if (req.method === 'POST' && req.url === '/api/supervision/projects/anchor') {
      void this.handleProjectAnchor(req, res);
      return;
    }

    // fiche 20261102151630248 — le pouce de revue, posé par la commande de la méthode
    if (req.method === 'POST' && req.url === '/api/verdict') {
      this.handleVerdict(req, res);
      return;
    }

    // fiche 20261102123552184 — les documents de la méthode, servis par la commande ezk
    if (req.method === 'GET' && req.url?.startsWith('/api/maps/')) {
      void this.handleMaps(req.url, res);
      return;
    }

    // fiche 20260826222044335 — la loi d'un projet, servie depuis la mémoire du daemon
    if (req.method === 'GET' && req.url?.startsWith('/api/law/')) {
      this.handleLaw(req.url, res);
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

  /** Chunked JSON body parse with a MAX_BODY_SIZE guard. */
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

  private handleLaw(url: string, res: ServerResponse): void {
    if (!this.lawHandler) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'law_unavailable' }));
      return;
    }
    let projet = '';
    try {
      projet = decodeURIComponent((url.split('?')[0] ?? '').slice('/api/law/'.length));
    } catch {
      projet = '';
    }
    const { status, body } =
      projet && !projet.includes('/')
        ? this.lawHandler.read(projet)
        : { status: 404, body: { error: 'not_found' } };
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  }

  private async handleMaps(url: string, res: ServerResponse): Promise<void> {
    if (!this.mapsHandler) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'maps_unavailable' }));
      return;
    }
    let parts: string[];
    try {
      parts = (url.split('?')[0] ?? '')
        .slice('/api/maps/'.length)
        .split('/')
        .map(decodeURIComponent);
    } catch {
      parts = [];
    }
    try {
      if (parts.length === 1 && parts[0]) {
        const { status, body } = await this.mapsHandler.list(parts[0]);
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(body));
        return;
      }
      if (parts.length === 3 && parts.every(Boolean)) {
        const [projet, id, nom] = parts as [string, string, string];
        const { status, contentType, body } = await this.mapsHandler.file(projet, id, nom);
        const headers: Record<string, string> = {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        };
        // Un document s'ouvre isolé, même hors du cadre : ses scripts tournent, sans l'origine du daemon.
        // Un SVG peut porter un script : il est isolé lui aussi.
        if (contentType.startsWith('text/html') || contentType.startsWith('image/svg+xml')) {
          headers['Content-Security-Policy'] = 'sandbox allow-scripts';
        }
        res.writeHead(status, headers);
        res.end(body);
        return;
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not_found' }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    }
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

  private async handleProjectAnchor(req: IncomingMessage, res: ServerResponse): Promise<void> {
    this.readJsonBody(req, res, (parsed) => {
      if (!this.projectAnchorHandler) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'anchor handler not configured' }));
        return;
      }
      void this.projectAnchorHandler
        .execute(parsed)
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

  private handleVerdict(req: IncomingMessage, res: ServerResponse): void {
    this.readJsonBody(req, res, (parsed) => {
      if (!this.verdictHandler) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'verdict handler not configured' }));
        return;
      }
      void this.verdictHandler
        .execute(parsed)
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
