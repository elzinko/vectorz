/**
 * La route du pouce de revue (fiche 20261102151630248) : `POST /api/verdict` passe le corps à son
 * gestionnaire, qui lance la commande de la méthode. Une requête d'un autre site, ou d'un autre type
 * que JSON, est refusée par la garde du daemon SANS que le gestionnaire soit appelé.
 */
import { request } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpServer } from '../infrastructure/HttpServer.js';

const PORT = 14262; // un port à lui : les autres tests du daemon prennent 14242 à 14261

function post(
  headers: Record<string, string>,
  body: string,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: '127.0.0.1',
        port: PORT,
        method: 'POST',
        path: '/api/verdict',
        agent: false,
        headers: { host: `127.0.0.1:${PORT}`, ...headers },
      },
      (res) => {
        let text = '';
        res.on('data', (c) => {
          text += c;
        });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: text }));
      },
    );
    req.on('error', reject);
    req.end(body);
  });
}

const BODY = JSON.stringify({ projet: 'vectorz', id: '20261102123552181', pouce: 'up' });

describe('POST /api/verdict', () => {
  let server: HttpServer;
  const execute = vi.fn(async (_body: unknown) => ({ status: 200, body: { ok: true } }));

  beforeEach(() => {
    vi.clearAllMocks();
    server = new HttpServer();
  });
  afterEach(async () => {
    await server.stop();
  });

  it('passe le corps au gestionnaire et rend sa réponse', async () => {
    server.setVerdictHandler({ execute });
    await server.start(PORT);
    const res = await post({ 'content-type': 'application/json' }, BODY);
    expect(res.status).toBe(200);
    expect(execute).toHaveBeenCalledWith(JSON.parse(BODY));
  });

  it('503 si le gestionnaire n’est pas branché', async () => {
    await server.start(PORT);
    const res = await post({ 'content-type': 'application/json' }, BODY);
    expect(res.status).toBe(503);
  });

  it('une requête d’un autre site est refusée, sans lancer la commande', async () => {
    server.setVerdictHandler({ execute });
    await server.start(PORT);
    const res = await post(
      { 'content-type': 'application/json', origin: 'https://exemple.test' },
      BODY,
    );
    expect(res.status).toBe(403);
    expect(execute).not.toHaveBeenCalled();
  });

  it('un corps d’un autre type que JSON est refusé, sans lancer la commande', async () => {
    server.setVerdictHandler({ execute });
    await server.start(PORT);
    const res = await post({ 'content-type': 'text/plain' }, BODY);
    expect(res.status).toBe(415);
    expect(execute).not.toHaveBeenCalled();
  });
});
