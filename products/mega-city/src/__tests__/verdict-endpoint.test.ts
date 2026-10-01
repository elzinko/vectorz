/**
 * La route d'écriture du tableau de bord, de bout en bout : un vrai serveur HTTP sur la boucle
 * locale, un faux dépôt dans un dossier temporaire (fiche 20260826072532622, ADR-0057).
 *
 * Ce qu'on prouve : un verdict valide écrit son fichier ; chaque refus répond le bon code ET
 * n'écrit rien ; et le tableau de bord n'écrit JAMAIS ailleurs que dans `features/reviews/verdicts/`
 * (les fiches restent identiques à l'octet près).
 */
import { type Server, createServer, request } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { runInNewContext } from 'node:vm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MAX_BODY_BYTES, VERDICTS_DIR } from '../core/verdicts.js';
import { dataViewForPath } from '../io/derived-views.js';
import { VERDICT_ROUTE, serveVerdict } from '../io/verdict-endpoint.js';
import { loadVerdicts } from '../io/verdicts.js';

const ID = '20260826072532622';
const OTHER = '20260826072532623';
const FICHE = `---\nid: "${ID}"\ntitle: "Une fiche"\ntype: feature\npriority: P2\nstatus: idea\n---\n\n# Une fiche\n`;
const AUTRE = FICHE.replaceAll(ID, OTHER);

let repo: string;
let server: Server;
let port: number;

/** Tous les fichiers du faux dépôt, relatifs à sa racine : de quoi prouver ce qui a (ou n'a pas) bougé. */
function tree(dir: string = repo): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? tree(join(dir, e.name)) : [relative(repo, join(dir, e.name))],
    )
    .sort();
}

function post(
  headers: Record<string, string>,
  body: string,
  method = 'POST',
): Promise<{ status: number; json: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const req = request(
      { host: '127.0.0.1', port, path: VERDICT_ROUTE, method, headers },
      (res) => {
        let text = '';
        res.on('data', (c) => (text += c));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, json: JSON.parse(text) }));
      },
    );
    req.on('error', reject);
    req.end(body);
  });
}

/** Les en-têtes d'une requête de la page du tableau de bord. */
const own = (): Record<string, string> => ({
  host: `127.0.0.1:${port}`,
  origin: `http://127.0.0.1:${port}`,
  'content-type': 'application/json',
});
const ask = (verdict: string, id = ID): string => JSON.stringify({ id, verdict });

beforeAll(async () => {
  repo = mkdtempSync(join(tmpdir(), 'ezk-verdicts-'));
  server = createServer((req, res) => {
    void serveVerdict(req, res, { repoRoot: repo, today: () => '2026-10-01' });
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  port = (server.address() as AddressInfo).port;
});

afterAll(async () => {
  await new Promise<void>((ok) => server.close(() => ok()));
  rmSync(repo, { recursive: true, force: true });
});

beforeEach(() => {
  rmSync(repo, { recursive: true, force: true });
  mkdirSync(join(repo, 'features'), { recursive: true });
  writeFileSync(join(repo, 'features', `${ID}_une-fiche.md`), FICHE);
  writeFileSync(join(repo, 'features', `${OTHER}_autre.md`), AUTRE);
});

describe('POST /api/verdict — l’écriture', () => {
  it('un 👍 écrit features/reviews/verdicts/<id>.json et rien d’autre', async () => {
    const before = tree();
    const res = await post(own(), ask('up'));

    expect(res).toEqual({ status: 200, json: { ok: true, id: ID, verdict: 'up', date: '2026-10-01' } });
    expect(tree()).toEqual([...before, `${VERDICTS_DIR}/${ID}.json`].sort());
    expect(readFileSync(join(repo, VERDICTS_DIR, `${ID}.json`), 'utf8')).toBe(
      '{\n  "verdict": "up",\n  "date": "2026-10-01"\n}\n',
    );
  });

  it('les fiches restent identiques à l’octet près : le front-matter n’est jamais touché', async () => {
    await post(own(), ask('up'));
    await post(own(), ask('down', OTHER));

    expect(readFileSync(join(repo, 'features', `${ID}_une-fiche.md`), 'utf8')).toBe(FICHE);
    expect(readFileSync(join(repo, 'features', `${OTHER}_autre.md`), 'utf8')).toBe(AUTRE);
  });

  it('un second verdict remplace le premier ; none le retire (la fiche redevient « non revue »)', async () => {
    await post(own(), ask('up'));
    await post(own(), ask('down'));
    expect(loadVerdicts(repo).verdicts[ID]).toEqual({ verdict: 'down', date: '2026-10-01' });

    const gone = await post(own(), ask('none'));
    expect(gone).toEqual({ status: 200, json: { ok: true, id: ID, verdict: 'none' } });
    expect(loadVerdicts(repo).verdicts[ID]).toBeUndefined();
  });

  it('survit à un redémarrage : un nouveau chargement relit les verdicts posés', async () => {
    await post(own(), ask('up'));
    await post(own(), ask('down', OTHER));

    expect(loadVerdicts(repo)).toEqual({
      verdicts: {
        [ID]: { verdict: 'up', date: '2026-10-01' },
        [OTHER]: { verdict: 'down', date: '2026-10-01' },
      },
      illisibles: [],
    });
  });

  it('le board relit les verdicts posés : board.data.js porte window.EZK_VERDICTS', async () => {
    await post(own(), ask('up'));

    const js = dataViewForPath('diagrams/avancement/board.data.js')?.build(repo) ?? '';
    const sandbox: { window: Record<string, unknown> } = { window: {} };
    runInNewContext(js, sandbox);

    expect(sandbox.window.EZK_VERDICTS).toEqual({
      verdicts: { [ID]: { verdict: 'up', date: '2026-10-01' } },
      illisibles: [],
    });
  });

  it('un fichier de verdict illisible est signalé, pas ignoré', async () => {
    await post(own(), ask('up'));
    writeFileSync(join(repo, VERDICTS_DIR, `${OTHER}.json`), '<<<<<<< HEAD\n{}\n>>>>>>> autre');

    const data = loadVerdicts(repo);
    expect(data.verdicts[ID]).toBeDefined();
    expect(data.illisibles).toEqual([`${VERDICTS_DIR}/${OTHER}.json`]);
  });

  it('une lecture qui échoue ne fait pas tomber le board : le chemin part dans les illisibles', async () => {
    await post(own(), ask('up'));
    mkdirSync(join(repo, VERDICTS_DIR, `${OTHER}.json`)); // un dossier nommé comme un verdict

    const data = loadVerdicts(repo);
    expect(data.verdicts[ID]).toBeDefined();
    expect(data.illisibles).toEqual([`${VERDICTS_DIR}/${OTHER}.json`]);
  });
});

describe('POST /api/verdict — les refus n’écrivent rien', () => {
  const refus: [string, number, () => Promise<{ status: number }>][] = [
    ['une autre méthode', 405, () => post(own(), '', 'GET')],
    ['un Host qui n’est pas local (DNS rebinding)', 403, () => post({ ...own(), host: 'evil.example' }, ask('up'))],
    ['un Origin d’un autre site', 403, () => post({ ...own(), origin: 'https://evil.example' }, ask('up'))],
    ['un type qui n’est pas du JSON (formulaire d’un autre site)', 415, () => post({ ...own(), 'content-type': 'text/plain' }, ask('up'))],
    ['un corps trop gros', 413, () => post(own(), JSON.stringify({ id: ID, verdict: 'up', pad: 'x'.repeat(MAX_BODY_BYTES * 8) }))],
    ['du JSON cassé', 400, () => post(own(), '{id:')],
    ['un id qui est un chemin', 400, () => post(own(), ask('up', '../../etc/passwd'))],
    ['une fiche inconnue', 404, () => post(own(), ask('up', '20990101000000000'))],
    ['un verdict inconnu', 400, () => post(own(), ask('maybe'))],
  ];

  it.each(refus)('refuse %s (%i)', async (_cas, status, send) => {
    const before = tree();
    const res = await send();
    expect(res.status).toBe(status);
    expect(tree()).toEqual(before);
  });

  it('refuse un corps trop gros envoyé par morceaux, sans Content-Length (413, rien d’écrit)', async () => {
    const before = tree();
    const res = await new Promise<{ status: number }>((resolve, reject) => {
      const req = request(
        { host: '127.0.0.1', port, path: VERDICT_ROUTE, method: 'POST', headers: own() },
        (r) => {
          r.resume();
          r.on('end', () => resolve({ status: r.statusCode ?? 0 }));
        },
      );
      req.on('error', (err: NodeJS.ErrnoException) => {
        // Le serveur coupe la connexion après son 413 : si la réponse est déjà partie, c'est normal.
        if (err.code === 'ECONNRESET' || err.code === 'EPIPE') return;
        reject(err);
      });
      expect(req.getHeader('content-length')).toBeUndefined(); // pas de taille annoncée : c'est le but
      for (let i = 0; i < 8; i++) req.write('x'.repeat(MAX_BODY_BYTES));
      req.end();
    });

    expect(res.status).toBe(413);
    expect(tree()).toEqual(before);
  });

  it('le serveur reste vivant après un corps trop gros', async () => {
    await post(own(), JSON.stringify({ pad: 'x'.repeat(MAX_BODY_BYTES * 8) }));
    const res = await post(own(), ask('up'));
    expect(res.status).toBe(200);
  });
});
