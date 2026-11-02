/**
 * Le pouce de revue posé depuis mission control (fiche 20261102151630248). Mission control n'écrit
 * jamais le fichier : il lance `ezk review verdict` (ADR-086). Les tests injectent un faux lanceur
 * (jamais un vrai `ezk`) et vérifient les arguments exacts, les refus, et la relecture du plan.
 */
import { describe, expect, it, vi } from 'vitest';
import type { EzkExecRunner } from './ezkExec.js';
import { writeVerdictThroughEzk } from './verdictWriter.js';

const ID = '20261102123552181';
const projects = () => [
  { name: 'vectorz', root: '/repos/vectorz' },
  { name: 'muti', root: '/repos/muti' },
];

function deps(result: { code: number; stdout?: string; stderr?: string }) {
  const run = vi.fn<EzkExecRunner>(async () => ({ stdout: '', stderr: '', ...result }));
  const onWritten = vi.fn();
  return { run, onWritten, deps: { projects, run, onWritten } };
}

describe('writeVerdictThroughEzk — le pouce passe par la méthode', () => {
  it('lance `ezk --root <dossier du projet> review verdict <id> <pouce>`, puis fait relire le plan', async () => {
    const d = deps({ code: 0 });
    const res = await writeVerdictThroughEzk({ projet: 'vectorz', id: ID, pouce: 'up' }, d.deps);
    expect(res.status).toBe(200);
    expect(d.run).toHaveBeenCalledWith(['--root', '/repos/vectorz', 'review', 'verdict', ID, 'up']);
    expect(d.onWritten).toHaveBeenCalledWith('/repos/vectorz');
  });

  it('le dossier vient du registre, par le nom du projet : jamais un chemin de la requête', async () => {
    const d = deps({ code: 0 });
    const res = await writeVerdictThroughEzk({ projet: '/etc', id: ID, pouce: 'up' }, d.deps);
    expect(res.status).toBe(404);
    expect(d.run).not.toHaveBeenCalled();
  });

  it('`none` retire le pouce, comme la commande', async () => {
    const d = deps({ code: 0 });
    await writeVerdictThroughEzk({ projet: 'muti', id: ID, pouce: 'none' }, d.deps);
    expect(d.run).toHaveBeenCalledWith(['--root', '/repos/muti', 'review', 'verdict', ID, 'none']);
  });
});

describe('writeVerdictThroughEzk — refuse avant de lancer quoi que ce soit', () => {
  const invalid: Array<[string, unknown]> = [
    ['un corps qui n’est pas un objet', 'up'],
    ['un id qui n’est pas un id de fiche', { projet: 'vectorz', id: '../x', pouce: 'up' }],
    ['une valeur inconnue', { projet: 'vectorz', id: ID, pouce: 'bof' }],
    ['un projet absent', { id: ID, pouce: 'up' }],
  ];
  for (const [cas, body] of invalid) {
    it(`${cas} → 400, la commande n’est pas lancée`, async () => {
      const d = deps({ code: 0 });
      const res = await writeVerdictThroughEzk(body, d.deps);
      expect(res.status).toBe(400);
      expect(d.run).not.toHaveBeenCalled();
      expect(d.onWritten).not.toHaveBeenCalled();
    });
  }
});

describe('writeVerdictThroughEzk — rend la réponse de la méthode', () => {
  it('un refus de la méthode (code 1) rend 400 et son message, sans relire le plan', async () => {
    const d = deps({ code: 1, stderr: 'refusé : fiche inconnue : 20261102123552181\n' });
    const res = await writeVerdictThroughEzk({ projet: 'vectorz', id: ID, pouce: 'up' }, d.deps);
    expect(res).toEqual({
      status: 400,
      body: { ok: false, error: 'refusé : fiche inconnue : 20261102123552181' },
    });
    expect(d.onWritten).not.toHaveBeenCalled();
  });

  it('une autre panne d’ezk rend 502 et le dit', async () => {
    const d = deps({ code: 127, stderr: 'ezk: command not found' });
    const res = await writeVerdictThroughEzk({ projet: 'vectorz', id: ID, pouce: 'up' }, d.deps);
    expect(res.status).toBe(502);
    expect(res.body).toMatchObject({ ok: false });
  });
});
