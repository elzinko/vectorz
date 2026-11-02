/**
 * La route de la loi (fiche 20260826222044335) : GET /api/law/<projet> rend ce que le daemon a en
 * mémoire, sans attendre `ezk`. Un chemin d'une autre forme rend 404 ; sans gestionnaire, 503.
 */
import { request } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HttpServer } from '../infrastructure/HttpServer.js';

const PORT = 14264; // un port à lui : les autres tests du daemon prennent 14242 à 14263

function get(path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: '127.0.0.1',
        port: PORT,
        method: 'GET',
        path,
        agent: false,
        headers: { host: `127.0.0.1:${PORT}` },
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
    req.end();
  });
}

describe('GET /api/law/<projet>', () => {
  let server: HttpServer;
  beforeEach(() => {
    server = new HttpServer();
  });
  afterEach(async () => {
    await server.stop();
  });

  it('rend l’état de la loi du projet, tel que le daemon le tient', async () => {
    server.setLawHandler({
      read: (projet) => ({ status: 200, body: { state: 'loading', projet } }),
    });
    await server.start(PORT);
    const res = await get('/api/law/vectorz');
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ state: 'loading', projet: 'vectorz' });
  });

  it('un chemin d’une autre forme : 404 ; sans gestionnaire : 503', async () => {
    server.setLawHandler({ read: () => ({ status: 200, body: {} }) });
    await server.start(PORT);
    expect((await get('/api/law/')).status).toBe(404);
    expect((await get('/api/law/a/b')).status).toBe(404);
    await server.stop();
    server = new HttpServer();
    await server.start(PORT);
    expect((await get('/api/law/vectorz')).status).toBe(503);
  });
});
