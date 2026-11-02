/**
 * La garde, branchée dans le serveur (fiche 20261102165708468). Constaté le 2026-11-02 : une requête
 * `text/plain` venue de `https://exemple.test` atteignait la levée d'un blocage, et un Host étranger
 * lisait `/api/board`. Ici, chaque route d'écriture refuse ces requêtes SANS appeler son action.
 * `node:http` sert à poser librement les en-têtes Host et Origin, que `fetch` ne laisse pas choisir.
 */
import { request } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpServer } from '../infrastructure/HttpServer.js';

const PORT = 14261; // un port à lui : 14242 à 14249 servent déjà aux autres tests du daemon

interface Answer {
  status: number;
  body: string;
}

function send(opts: {
  method: string;
  path: string;
  host?: string;
  origin?: string;
  contentType?: string;
  body?: string;
}): Promise<Answer> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = { host: opts.host ?? `127.0.0.1:${PORT}` };
    if (opts.origin) headers.origin = opts.origin;
    if (opts.contentType) headers['content-type'] = opts.contentType;
    // `agent: false` : une connexion neuve par requête, jamais une connexion gardée d'un serveur arrêté.
    const req = request(
      {
        host: '127.0.0.1',
        port: PORT,
        method: opts.method,
        path: opts.path,
        headers,
        agent: false,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
      },
    );
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

describe('HttpServer — la garde des requêtes', () => {
  let server: HttpServer;
  const abandon = vi.fn(async () => ({ status: 200 as const, body: { ok: true } }));
  const anchor = vi.fn(async () => ({ status: 200 as const, body: { ok: true } }));
  const blocages = vi.fn(() => false);
  const updateStatus = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    server = new HttpServer();
    server.setRunAbandonHandler({ execute: abandon });
    server.setProjectAnchorHandler({ execute: anchor });
    server.setBlocageApiHandler({ handle: blocages });
    server.setRuleProposalProvider({ getAll: () => [], updateStatus });
    server.setBoardProvider(() => ({ vectorz: {} }));
    await server.start(PORT);
  });

  afterEach(async () => {
    await server.stop();
  });

  const writes = [
    {
      method: 'POST',
      path: '/api/supervision/runs/abandon',
      body: '{"runDir":"/tmp/x"}',
      called: () => abandon,
    },
    {
      method: 'POST',
      path: '/api/supervision/projects/anchor',
      body: '{"projectRoot":"/tmp/x"}',
      called: () => anchor,
    },
    {
      method: 'PATCH',
      path: '/api/rules/proposals/r1',
      body: '{"status":"approved"}',
      called: () => updateStatus,
    },
    {
      method: 'POST',
      path: '/api/blocages/b1/resolve',
      body: '{"response":"ok"}',
      called: () => blocages,
    },
  ];

  for (const w of writes) {
    it(`${w.method} ${w.path} : un autre site est refusé, sans exécuter l’action`, async () => {
      const res = await send({
        ...w,
        origin: 'https://exemple.test',
        contentType: 'application/json',
      });
      expect(res.status).toBe(403);
      expect(w.called()).not.toHaveBeenCalled();
    });

    it(`${w.method} ${w.path} : un corps text/plain est refusé, sans exécuter l’action`, async () => {
      const res = await send({ ...w, contentType: 'text/plain' });
      expect(res.status).toBe(415);
      expect(w.called()).not.toHaveBeenCalled();
    });
  }

  it('un Host étranger est refusé, même pour lire le board', async () => {
    const res = await send({ method: 'GET', path: '/api/board', host: `piege.test:${PORT}` });
    expect(res.status).toBe(403);
  });

  it('le terminal écrit toujours : sans Origin, au type JSON', async () => {
    const res = await send({
      method: 'POST',
      path: '/api/supervision/projects/anchor',
      contentType: 'application/json',
      body: '{"projectRoot":"/tmp/x"}',
    });
    expect(res.status).toBe(200);
    expect(anchor).toHaveBeenCalledTimes(1);
  });

  it('la page de mission control écrit toujours : Origin de la page, Host réécrit par le proxy', async () => {
    const res = await send({
      method: 'POST',
      path: '/api/supervision/projects/anchor',
      host: `localhost:${PORT}`,
      origin: 'http://localhost:5273',
      contentType: 'application/json',
      body: '{"projectRoot":"/tmp/x"}',
    });
    expect(res.status).toBe(200);
  });

  it('la page lit toujours le board par le proxy', async () => {
    const res = await send({ method: 'GET', path: '/api/board', host: `localhost:${PORT}` });
    expect(res.status).toBe(200);
  });
});
