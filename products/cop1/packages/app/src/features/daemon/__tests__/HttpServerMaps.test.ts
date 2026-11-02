/**
 * Les routes des documents de la méthode (fiche 20261102123552184) : la liste en JSON, et un document
 * servi isolé. Une page HTML porte `Content-Security-Policy: sandbox allow-scripts` : même ouverte hors
 * du cadre de mission control, ses scripts tournent sans l'origine du daemon.
 */
import { request } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HttpServer, type MapsHandler } from '../infrastructure/HttpServer.js';

const PORT = 14263; // un port à lui : les autres tests du daemon prennent 14242 à 14262

function get(
  path: string,
): Promise<{ status: number; headers: Record<string, unknown>; body: string }> {
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
        res.on('end', () =>
          resolve({ status: res.statusCode ?? 0, headers: res.headers, body: text }),
        );
      },
    );
    req.on('error', reject);
    req.end();
  });
}

const handler: MapsHandler = {
  list: async (projet) => ({ status: 200, body: { documents: [], projet } }),
  file: async (_projet, id, nom) =>
    id === 'carte'
      ? { status: 200, contentType: 'text/html; charset=utf-8', body: `<p>${nom}</p>` }
      : { status: 404, contentType: 'text/plain; charset=utf-8', body: 'introuvable' },
};

describe('GET /api/maps', () => {
  let server: HttpServer;
  beforeEach(() => {
    server = new HttpServer();
  });
  afterEach(async () => {
    await server.stop();
  });

  it('la liste d’un projet, en JSON', async () => {
    server.setMapsHandler(handler);
    await server.start(PORT);
    const res = await get('/api/maps/vectorz');
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ documents: [], projet: 'vectorz' });
  });

  it('une page HTML est servie isolée : sandbox, nosniff, jamais en cache', async () => {
    server.setMapsHandler(handler);
    await server.start(PORT);
    const res = await get('/api/maps/vectorz/carte/carte.html');
    expect(res.status).toBe(200);
    expect(res.headers['content-security-policy']).toBe('sandbox allow-scripts');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toBe('<p>carte.html</p>');
  });

  it('un SVG est isolé lui aussi : il peut porter un script', async () => {
    server.setMapsHandler({
      ...handler,
      file: async () => ({
        status: 200,
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg"/>',
      }),
    });
    await server.start(PORT);
    const res = await get('/api/maps/vectorz/schema/diagram.svg');
    expect(res.headers['content-security-policy']).toBe('sandbox allow-scripts');
  });

  it('un chemin d’une autre forme : 404 ; sans gestionnaire : 503', async () => {
    server.setMapsHandler(handler);
    await server.start(PORT);
    expect((await get('/api/maps/vectorz/carte')).status).toBe(404);
    expect((await get('/api/maps/vectorz/inconnu/x.svg')).status).toBe(404);
    await server.stop();
    server = new HttpServer();
    await server.start(PORT);
    expect((await get('/api/maps/vectorz')).status).toBe(503);
  });
});
