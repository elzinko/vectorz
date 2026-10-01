/**
 * verdicts — le pouce 👍/👎 posé sur une fiche depuis le tableau de bord (fiche 20260826072532622).
 *
 * Ici on tient le cœur PUR : le format du fichier de verdict, et le garde-fou de la SEULE route
 * d'écriture du tableau de bord. Chaque refus du garde-fou a son test : un refus qui ne rougirait
 * pas si on le retirait ne protège rien.
 */
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import {
  MAX_BODY_BYTES,
  type RequestEnvelope,
  VERDICTS_DIR,
  buildVerdictsBlock,
  checkVerdictRequest,
  parseVerdict,
  serializeVerdict,
  verdictFile,
} from '../core/verdicts.js';

const FICHES = new Set(['20260826072532622', '20260826072532623', '0094']);
const KNOWN = (id: string): boolean => FICHES.has(id);

/** Une requête valide telle que le navigateur du tableau de bord l'envoie. */
function valid(over: Partial<RequestEnvelope> = {}, body: unknown = undefined): RequestEnvelope {
  return {
    method: 'POST',
    headers: {
      host: '127.0.0.1:4173',
      origin: 'http://127.0.0.1:4173',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body ?? { id: '20260826072532622', verdict: 'up' }),
    ...over,
  };
}

const withHeaders = (headers: RequestEnvelope['headers']): RequestEnvelope => ({
  ...valid(),
  headers,
});

describe('format du fichier de verdict', () => {
  it('un fichier par fiche, rangé sous features/reviews/verdicts/<id>.json', () => {
    expect(VERDICTS_DIR).toBe('features/reviews/verdicts');
    expect(verdictFile('20260826072532622')).toBe('features/reviews/verdicts/20260826072532622.json');
  });

  it('s’écrit et se relit à l’identique (JSON stable, une ligne finale)', () => {
    const text = serializeVerdict({ verdict: 'down', date: '2026-10-01' });
    expect(text).toBe('{\n  "verdict": "down",\n  "date": "2026-10-01"\n}\n');
    expect(parseVerdict(text)).toEqual({ ok: true, record: { verdict: 'down', date: '2026-10-01' } });
  });

  it.each([
    ['du JSON cassé (marqueurs de conflit git)', '<<<<<<< HEAD\n{"verdict":"up"}\n>>>>>>> x'],
    ['un verdict inconnu', '{"verdict":"maybe","date":"2026-10-01"}'],
    ['une date qui n’en est pas une', '{"verdict":"up","date":"hier"}'],
    ['un tableau', '[]'],
    ['un fichier vide', ''],
  ])('refuse %s : jamais ignoré en silence', (_cas, text) => {
    const parsed = parseVerdict(text);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.reason.length).toBeGreaterThan(0);
  });
});

describe('garde-fou de POST /api/verdict', () => {
  it('accepte une requête du tableau de bord lui-même', () => {
    expect(checkVerdictRequest(valid(), KNOWN)).toEqual({
      ok: true,
      request: { id: '20260826072532622', verdict: 'up' },
    });
  });

  it('accepte « none » (retirer le verdict) et l’ancien format d’id à 4 chiffres', () => {
    expect(checkVerdictRequest(valid({}, { id: '0094', verdict: 'none' }), KNOWN)).toEqual({
      ok: true,
      request: { id: '0094', verdict: 'none' },
    });
  });

  it('accepte un appel sans Origin (curl, tests) : seul un navigateur peut être trompé par un autre site', () => {
    const req = withHeaders({ host: 'localhost:4173', 'content-type': 'application/json' });
    expect(checkVerdictRequest(req, KNOWN).ok).toBe(true);
  });

  it('refuse toute méthode autre que POST (405)', () => {
    for (const method of ['GET', 'PUT', 'DELETE', 'OPTIONS']) {
      expect(checkVerdictRequest(valid({ method }), KNOWN)).toMatchObject({ ok: false, status: 405 });
    }
  });

  it.each([
    ['un nom de domaine (DNS rebinding)', 'evil.example:4173'],
    ['une adresse du réseau', '192.168.1.20:4173'],
    ['un nom qui commence par localhost', 'localhost.evil.example:4173'],
  ])('refuse un Host qui est %s (403)', (_cas, host) => {
    const req = withHeaders({ host, origin: `http://${host}`, 'content-type': 'application/json' });
    expect(checkVerdictRequest(req, KNOWN)).toMatchObject({ ok: false, status: 403 });
  });

  it('refuse l’absence de Host (403)', () => {
    expect(checkVerdictRequest(withHeaders({ 'content-type': 'application/json' }), KNOWN)).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it.each([
    ['un autre site', 'https://evil.example'],
    ['un autre port local', 'http://127.0.0.1:9999'],
    ['« null » (page locale ou bac à sable)', 'null'],
  ])('refuse un Origin qui est %s (403)', (_cas, origin) => {
    const req = withHeaders({
      host: '127.0.0.1:4173',
      origin,
      'content-type': 'application/json',
    });
    expect(checkVerdictRequest(req, KNOWN)).toMatchObject({ ok: false, status: 403 });
  });

  it('refuse un corps qui n’est pas annoncé en JSON (415) : un formulaire d’un autre site n’en fait pas partie', () => {
    for (const type of ['text/plain', 'application/x-www-form-urlencoded', undefined]) {
      const req = withHeaders({
        host: '127.0.0.1:4173',
        origin: 'http://127.0.0.1:4173',
        ...(type ? { 'content-type': type } : {}),
      });
      expect(checkVerdictRequest(req, KNOWN)).toMatchObject({ ok: false, status: 415 });
    }
  });

  it('refuse un corps trop gros (413), même si c’est du JSON valide', () => {
    const big = valid({ body: JSON.stringify({ id: '0094', verdict: 'up', pad: 'x'.repeat(MAX_BODY_BYTES) }) });
    expect(checkVerdictRequest(big, KNOWN)).toMatchObject({ ok: false, status: 413 });
  });

  it.each([
    ['du JSON cassé', '{id:'],
    ['un tableau', '[]'],
    ['un id absent', '{"verdict":"up"}'],
    ['un verdict absent', '{"id":"0094"}'],
    ['un id qui n’est pas du texte', '{"id":94,"verdict":"up"}'],
  ])('refuse %s (400)', (_cas, body) => {
    expect(checkVerdictRequest(valid({ body }), KNOWN)).toMatchObject({ ok: false, status: 400 });
  });

  it.each([
    '../../etc/passwd',
    '..%2F..%2Fsecret',
    '0094/../../x',
    '0094.json',
    'abc',
    '12',
    '',
    ' 0094',
    '00940094009400940094009',
  ])('refuse l’id %j : jamais un chemin saisi (400)', (id) => {
    expect(checkVerdictRequest(valid({}, { id, verdict: 'up' }), KNOWN)).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it('refuse l’id d’une fiche qui n’existe pas (404)', () => {
    expect(checkVerdictRequest(valid({}, { id: '20990101000000000', verdict: 'up' }), KNOWN)).toMatchObject({
      ok: false,
      status: 404,
    });
  });

  it.each(['maybe', 'UP', '', 'delete', null, 1])('refuse le verdict %j (400)', (verdict) => {
    expect(checkVerdictRequest(valid({}, { id: '0094', verdict }), KNOWN)).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});

describe('bloc de données du board', () => {
  it('pose window.EZK_VERDICTS, lisible tel quel par la page', () => {
    const block = buildVerdictsBlock({
      verdicts: { '0094': { verdict: 'up', date: '2026-10-01' } },
      illisibles: ['features/reviews/verdicts/0095.json'],
    });
    const sandbox: { window: Record<string, unknown> } = { window: {} };
    runInNewContext(block, sandbox);
    expect(sandbox.window.EZK_VERDICTS).toEqual({
      verdicts: { '0094': { verdict: 'up', date: '2026-10-01' } },
      illisibles: ['features/reviews/verdicts/0095.json'],
    });
  });

  it('un nom de fichier contenant </script> ne peut pas fermer la balise qui porte le bloc', () => {
    const block = buildVerdictsBlock({ verdicts: {}, illisibles: ['</script><img onerror=x>'] });
    expect(block).not.toContain('</script>');
  });
});
