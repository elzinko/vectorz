/**
 * La route de la cloche (fiche 20261126170000112) : GET /api/now/<projet> rend ce que le daemon a en
 * mémoire de `ezk now --json`. Même confinement que /api/retros : sans gestionnaire 503, un chemin
 * d'une autre forme 404, un projet inconnu refusé.
 */
import { mkdirSync, rmSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DaemonService } from '../application/DaemonService.js';
import { HttpServer } from '../infrastructure/HttpServer.js';

const PORT = 14269;
const DAEMON_PORT = 14270;

function get(port: number, path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request(
      { host: '127.0.0.1', port, method: 'GET', path, agent: false, headers: { host: `127.0.0.1:${port}` } },
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

describe('GET /api/now/<projet>', () => {
  let server: HttpServer;
  beforeEach(() => {
    server = new HttpServer();
  });
  afterEach(async () => {
    await server.stop();
  });

  it('rend l’état de la cloche du projet, tel que le daemon le tient', async () => {
    server.setNowHandler({ read: (projet) => ({ status: 200, body: { state: 'loading', projet } }) });
    await server.start(PORT);
    const res = await get(PORT, '/api/now/vectorz');
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ state: 'loading', projet: 'vectorz' });
  });

  it('un chemin d’une autre forme : 404 ; sans gestionnaire : 503', async () => {
    server.setNowHandler({ read: () => ({ status: 200, body: {} }) });
    await server.start(PORT);
    expect((await get(PORT, '/api/now/')).status).toBe(404);
    expect((await get(PORT, '/api/now/a/b')).status).toBe(404);
    await server.stop();
    server = new HttpServer();
    await server.start(PORT);
    expect((await get(PORT, '/api/now/vectorz')).status).toBe(503);
  });
});

describe('GET /api/now/<projet> — le daemon câblé', () => {
  let dir: string;
  let daemon: DaemonService;
  beforeEach(() => {
    dir = join(tmpdir(), `cop1-now-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(dir, { recursive: true });
    daemon = new DaemonService({ port: DAEMON_PORT, projectPath: dir });
  });
  afterEach(async () => {
    await daemon.stop();
    rmSync(dir, { recursive: true, force: true });
  });

  it('refuse un projet qu’il ne connaît pas, sans lancer ezk', async () => {
    await daemon.start();
    const res = await get(DAEMON_PORT, '/api/now/inconnu');
    expect(res.status).toBe(404);
    expect(JSON.parse(res.body)).toEqual({ error: 'projet inconnu : inconnu' });
  });
});
