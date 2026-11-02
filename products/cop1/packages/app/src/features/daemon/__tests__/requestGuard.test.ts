/**
 * La garde des requêtes du daemon (fiche 20261102165708468). Le daemon écoute sur 127.0.0.1, mais le
 * navigateur du poste est déjà « à l'intérieur » : une page d'un autre site peut lui envoyer une
 * écriture, ou l'atteindre par un nom de domaine qui pointe vers 127.0.0.1. La garde est pure :
 * chaque cas se teste sans serveur.
 */
import { describe, expect, it } from 'vitest';
import { guardRequest } from '../infrastructure/requestGuard.js';

const ctx = { daemonPort: 4343, webPort: 5273 };
const json = 'application/json';

describe('guardRequest — le Host, sur toutes les routes', () => {
  it('accepte 127.0.0.1 et localhost sur le port du daemon', () => {
    expect(guardRequest({ method: 'GET', host: '127.0.0.1:4343' }, ctx)).toEqual({ ok: true });
    expect(guardRequest({ method: 'GET', host: 'localhost:4343' }, ctx)).toEqual({ ok: true });
  });

  it('refuse un Host étranger, lecture comprise (rebond DNS)', () => {
    expect(guardRequest({ method: 'GET', host: 'piege.test:4343' }, ctx)).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it('refuse un Host local sur un autre port, ou absent', () => {
    expect(guardRequest({ method: 'GET', host: '127.0.0.1:9999' }, ctx)).toMatchObject({
      ok: false,
    });
    expect(guardRequest({ method: 'GET' }, ctx)).toMatchObject({ ok: false, status: 403 });
  });
});

describe('guardRequest — les écritures', () => {
  const write = { method: 'POST', host: '127.0.0.1:4343', contentType: json };

  it('accepte une écriture du terminal : sans Origin, au type JSON', () => {
    expect(guardRequest(write, ctx)).toEqual({ ok: true });
  });

  it('accepte une écriture de la page de mission control', () => {
    expect(guardRequest({ ...write, origin: 'http://localhost:5273' }, ctx)).toEqual({ ok: true });
    expect(guardRequest({ ...write, origin: 'http://127.0.0.1:5273' }, ctx)).toEqual({ ok: true });
  });

  it('refuse une écriture venue d’un autre site, quelle que soit la méthode', () => {
    for (const method of ['POST', 'PATCH', 'PUT', 'DELETE']) {
      expect(guardRequest({ ...write, method, origin: 'https://exemple.test' }, ctx)).toMatchObject(
        { ok: false, status: 403 },
      );
    }
  });

  it('refuse une Origin « null » (page locale ou bac à sable)', () => {
    expect(guardRequest({ ...write, origin: 'null' }, ctx)).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it('refuse une écriture qui n’est pas du JSON (requête « simple » du navigateur)', () => {
    expect(guardRequest({ ...write, contentType: 'text/plain' }, ctx)).toMatchObject({
      ok: false,
      status: 415,
    });
    expect(guardRequest({ ...write, contentType: undefined }, ctx)).toMatchObject({ status: 415 });
  });

  it('accepte le type JSON avec un jeu de caractères', () => {
    expect(guardRequest({ ...write, contentType: 'application/json; charset=utf-8' }, ctx)).toEqual(
      {
        ok: true,
      },
    );
  });

  it('ne demande ni Origin ni type à une lecture', () => {
    expect(
      guardRequest({ method: 'GET', host: '127.0.0.1:4343', origin: 'https://exemple.test' }, ctx),
    ).toEqual({ ok: true });
  });
});
