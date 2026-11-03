import type { IncomingMessage, ServerResponse } from 'node:http';
import type { BlockageService } from '@cop1/sprint-core';

// Mirrors the daemon HttpServer's own body-size cap (10 KB). The daemon binds
// 127.0.0.1, so this guards against a runaway/buggy local client OOMing us.
const MAX_BODY_SIZE = 10_240; // 10 KB

/** The body as a JSON object, or `null` when it is empty, malformed, or not an object. */
function parseJsonObject(body: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(body);
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export class BlocageApiHandler {
  constructor(private readonly blockageService: BlockageService) {}

  handle(req: IncomingMessage, res: ServerResponse): boolean {
    const resolveMatch = req.url?.match(/^\/api\/blocages\/([^/]+)\/resolve$/);

    if (resolveMatch && req.method === 'POST') {
      const blocageId = resolveMatch[1] ?? '';
      return this.handleResolve(req, res, blocageId);
    }

    if (req.url === '/api/blocages' && req.method === 'GET') {
      return this.handleList(res);
    }

    return false;
  }

  private handleResolve(req: IncomingMessage, res: ServerResponse, blocageId: string): boolean {
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
      // fiche 20261102100506119 — a malformed request is the client's error (400), never an
      // unknown blocage (404): the body is read before the blocage is looked up.
      const parsed = parseJsonObject(body);
      if (!parsed) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid JSON body' }));
        return;
      }
      const { response } = parsed;
      if (typeof response !== 'string' || response === '') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'response field required' }));
        return;
      }
      try {
        const resolved = this.blockageService.resolve(blocageId, response);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(resolved));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.writeHead(message.includes('not found') ? 404 : 500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ error: message }));
      }
    });
    return true;
  }

  private handleList(res: ServerResponse): boolean {
    const blocages = this.blockageService.getOpen();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(blocages));
    return true;
  }
}
