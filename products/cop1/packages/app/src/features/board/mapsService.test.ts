/**
 * Les documents de la méthode dans mission control (fiche 20261102123552184). Le daemon ne lit aucun
 * fichier : il lance `ezk board maps`, et ne demande que les noms que la méthode a listés. Les tests
 * injectent un faux lanceur, jamais un vrai `ezk`.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import type { EzkExecRunner } from './ezkExec.js';
import { MapsService, translateMaps } from './mapsService.js';

const EXAMPLE = readFileSync(
  fileURLToPath(
    new URL('../../../../../../mega-city/contracts/board-maps/v1/example.json', import.meta.url),
  ),
  'utf8',
);
const projects = () => [{ name: 'vectorz', root: '/repos/vectorz' }];

function service(now = () => 0) {
  const run = vi.fn<EzkExecRunner>(async (args) => {
    if (args.includes('--json')) return { code: 0, stdout: EXAMPLE, stderr: '' };
    return { code: 0, stdout: `contenu de ${args.at(-1)}`, stderr: '' };
  });
  return { run, maps: new MapsService({ projects, run, now }) };
}

describe('MapsService — la liste vient de la méthode', () => {
  it('lance `ezk --root <projet> board maps --json` et rend les documents publiés', async () => {
    const { run, maps } = service();
    const res = await maps.list('vectorz');
    expect(run).toHaveBeenCalledWith(['--root', '/repos/vectorz', 'board', 'maps', '--json']);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ documents: JSON.parse(EXAMPLE).documents });
  });

  it('relit la liste au plus toutes les 30 s', async () => {
    let t = 0;
    const { run, maps } = service(() => t);
    await maps.list('vectorz');
    await maps.list('vectorz');
    expect(run).toHaveBeenCalledTimes(1);
    t = 31_000;
    await maps.list('vectorz');
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('un projet inconnu : 404 ; une panne ou un format inconnu : 502 avec la raison', async () => {
    expect((await service().maps.list('ailleurs')).status).toBe(404);
    const down = new MapsService({
      projects,
      run: async () => ({ code: 127, stdout: '', stderr: 'ezk: command not found' }),
    });
    expect(await down.list('vectorz')).toEqual({
      status: 502,
      body: { error: 'ezk a échoué (code 127) : ezk: command not found' },
    });
    const odd = new MapsService({
      projects,
      run: async () => ({ code: 0, stdout: '{"schema_version":2}', stderr: '' }),
    });
    expect((await odd.list('vectorz')).status).toBe(502);
  });

  it('translateMaps refuse une entrée mal formée plutôt que de la deviner', () => {
    expect(translateMaps(JSON.parse(EXAMPLE))).toHaveLength(2);
    expect(
      translateMaps({
        schema_version: 1,
        documents: [{ id: 'x', titre: 't', type: 'pdf', fichier: 'f', donnees: null }],
      }),
    ).toBeNull();
  });
});

describe('MapsService — rien d’autre que le document et ses données', () => {
  it('sert le fichier principal par la commande, avec son type', async () => {
    const { run, maps } = service();
    const res = await maps.file('vectorz', 'qualite-composants', 'diagram.svg');
    expect(run).toHaveBeenCalledWith([
      '--root',
      '/repos/vectorz',
      'board',
      'maps',
      '--file',
      'qualite-composants',
      'diagram.svg',
    ]);
    expect(res).toEqual({
      status: 200,
      contentType: 'image/svg+xml',
      body: 'contenu de diagram.svg',
    });
  });

  it('sert les données d’une page par la commande, en JavaScript', async () => {
    const res = await service().maps.file(
      'vectorz',
      'methode-mega-city',
      'carte-interactive.data.js',
    );
    expect(res.status).toBe(200);
    expect(res.contentType).toBe('text/javascript; charset=utf-8');
  });

  it('un autre nom, un chemin qui remonte ou un document inconnu : 404, sans rien demander à ezk', async () => {
    const { run, maps } = service();
    for (const [id, nom] of [
      ['methode-mega-city', 'meta.yaml'],
      ['methode-mega-city', '../../../etc/passwd'],
      ['inconnu', 'diagram.svg'],
    ] as const) {
      expect((await maps.file('vectorz', id, nom)).status).toBe(404);
    }
    expect(run.mock.calls.filter((c) => c[0].includes('--file'))).toHaveLength(0);
  });
});
