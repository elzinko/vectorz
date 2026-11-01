/**
 * La source de plan appelle `ezk` en arrière-plan et garde la dernière réponse : une requête
 * n'attend jamais. Les tests injectent un faux runner (jamais un vrai `ezk`) qui rend les exemples
 * du contrat de la méthode.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { EzkPlanSource, type EzkRunner } from './ezkPlanSource.js';

const example = (path: string): string =>
  readFileSync(
    fileURLToPath(new URL(`../../../../../../mega-city/contracts/${path}`, import.meta.url)),
    'utf8',
  );
const BOARD = example('board-show/v1/example.json');
const BACKLOG = example('backlog-show/v1/example.json');

/** Un runner qui répond selon la sous-commande, et note chaque appel. */
function fakeRunner(overrides: { board?: string; backlog?: string } = {}) {
  const calls: string[][] = [];
  const run: EzkRunner = async (args) => {
    calls.push(args);
    return args.includes('board') ? (overrides.board ?? BOARD) : (overrides.backlog ?? BACKLOG);
  };
  return { run, calls };
}

function deferredRunner() {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const calls: string[][] = [];
  const run: EzkRunner = async (args) => {
    calls.push(args);
    await gate;
    return args.includes('board') ? BOARD : BACKLOG;
  };
  return { run, calls, release };
}

const failing =
  (error: Error): EzkRunner =>
  async () => {
    throw error;
  };

describe('EzkPlanSource — jamais d’attente', () => {
  it('répond tout de suite « loading » pendant qu’un ezk lent tourne, puis « ok »', async () => {
    const slow = deferredRunner();
    const source = new EzkPlanSource({ command: ['ezk'], run: slow.run });

    const t0 = performance.now();
    const first = source.get('/p');
    expect(performance.now() - t0).toBeLessThan(100);
    expect(first).toEqual({ state: 'loading' });

    slow.release();
    await vi.waitFor(() => expect(source.get('/p').state).toBe('ok'));
    const ok = source.get('/p');
    if (ok.state !== 'ok') throw new Error('attendu ok');
    expect(ok.plan.done).toBe(1);
    expect(Object.keys(ok.fiches)).toContain('20990101000000003');
  });

  it('ne lance pas un second rafraîchissement tant que le premier tourne', async () => {
    const slow = deferredRunner();
    const source = new EzkPlanSource({ command: ['ezk'], run: slow.run });
    source.get('/p');
    source.get('/p');
    source.get('/p');
    expect(slow.calls).toHaveLength(2); // board show + backlog show, une seule fois
    slow.release();
    await vi.waitFor(() => expect(source.get('/p').state).toBe('ok'));
  });

  it('appelle `<commande> --root <racine> board show --json` et `… backlog show --json`', async () => {
    const { run, calls } = fakeRunner();
    const source = new EzkPlanSource({ command: ['ezk'], run });
    source.get('/mon/projet');
    await vi.waitFor(() => expect(source.get('/mon/projet').state).toBe('ok'));
    expect(calls).toContainEqual(['--root', '/mon/projet', 'board', 'show', '--json']);
    expect(calls).toContainEqual(['--root', '/mon/projet', 'backlog', 'show', '--json']);
  });

  it('garde une réponse fraîche (< 30 s), puis relance en arrière-plan quand elle a vieilli', async () => {
    let now = 1_000;
    const { run, calls } = fakeRunner();
    const source = new EzkPlanSource({ command: ['ezk'], run, now: () => now });
    source.get('/p');
    await vi.waitFor(() => expect(source.get('/p').state).toBe('ok'));
    expect(calls).toHaveLength(2);

    now += 29_000;
    expect(source.get('/p').state).toBe('ok');
    expect(calls).toHaveLength(2);

    now += 2_000; // 31 s
    expect(source.get('/p').state).toBe('ok'); // répond d’abord avec l’ancien état
    await vi.waitFor(() => expect(calls).toHaveLength(4));
  });

  it('suit chaque projet séparément', async () => {
    const { run, calls } = fakeRunner();
    const source = new EzkPlanSource({ command: ['ezk'], run });
    source.get('/a');
    source.get('/b');
    expect(calls).toHaveLength(4);
    await vi.waitFor(() => expect(source.get('/a').state).toBe('ok'));
  });
});

describe('EzkPlanSource — jamais de faux chiffre', () => {
  async function unavailableReason(run: EzkRunner): Promise<string> {
    const source = new EzkPlanSource({ command: ['ezk'], run });
    source.get('/p');
    await vi.waitFor(() => expect(source.get('/p').state).toBe('unavailable'));
    const snapshot = source.get('/p');
    if (snapshot.state !== 'unavailable') throw new Error('attendu unavailable');
    return snapshot.reason;
  }

  it('ezk introuvable (ENOENT)', async () => {
    const reason = await unavailableReason(
      failing(Object.assign(new Error('spawn ezk ENOENT'), { code: 'ENOENT' })),
    );
    expect(reason).toMatch(/ezk.*introuvable/);
  });

  it('code de sortie non nul, avec la première ligne de stderr', async () => {
    const reason = await unavailableReason(
      failing(Object.assign(new Error('Command failed'), { code: 2, stderr: 'boum\nsuite' })),
    );
    expect(reason).toMatch(/code 2/);
    expect(reason).toContain('boum');
    expect(reason).not.toContain('suite');
  });

  it('délai dépassé', async () => {
    const reason = await unavailableReason(
      failing(Object.assign(new Error('timed out'), { killed: true, signal: 'SIGTERM' })),
    );
    expect(reason).toMatch(/trop long|délai/);
  });

  it('JSON cassé', async () => {
    const reason = await unavailableReason(fakeRunner({ board: '{pas du json' }).run);
    expect(reason).toMatch(/illisible/);
  });

  it('schema_version inconnu', async () => {
    const board = JSON.stringify({ ...JSON.parse(BOARD), schema_version: 2 });
    const reason = await unavailableReason(fakeRunner({ board }).run);
    expect(reason).toMatch(/schema_version 2/);
  });

  it('un échec après un succès remplace l’ancien plan par la raison, et un nouvel essai reste possible', async () => {
    let now = 0;
    let broken = false;
    const run: EzkRunner = async (args) => {
      if (broken) throw Object.assign(new Error('x'), { code: 1 });
      return args.includes('board') ? BOARD : BACKLOG;
    };
    const source = new EzkPlanSource({ command: ['ezk'], run, now: () => now });
    source.get('/p');
    await vi.waitFor(() => expect(source.get('/p').state).toBe('ok'));

    broken = true;
    now += 31_000;
    source.get('/p');
    await vi.waitFor(() => expect(source.get('/p').state).toBe('unavailable'));

    broken = false;
    now += 31_000;
    source.get('/p');
    await vi.waitFor(() => expect(source.get('/p').state).toBe('ok'));
  });

  it('une commande à plusieurs mots passe tous ses mots à l’exécuteur par défaut', async () => {
    const source = new EzkPlanSource({ command: ['/bin/sh', '-c', 'exit 3', 'ezk'] });
    source.get('/p');
    await vi.waitFor(() => expect(source.get('/p').state).toBe('unavailable'));
    const snapshot = source.get('/p');
    if (snapshot.state !== 'unavailable') throw new Error('attendu unavailable');
    expect(snapshot.reason).toMatch(/code 3/);
  });
});
