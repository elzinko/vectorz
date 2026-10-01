/**
 * Le lanceur `bin/ezk.mjs` (champ `bin` du paquet) pour de vrai : vrais processus, depuis un
 * dossier jetable, avec un PATH réduit à l'essentiel — donc sans `tsx` installé sur le poste
 * (fiche 20260903134906920). Tout passe par `--dry-run` : rien n'est régénéré ni écrit.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const launcher = join(megaCity, 'bin', 'ezk.mjs');
const repoRoot = realpathSync(resolve(megaCity, '..', '..'));

let elsewhere: string;
beforeAll(() => {
  elsewhere = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-launcher-')));
});
afterAll(() => {
  rmSync(elsewhere, { recursive: true, force: true });
});

function ezk(args: string[]): { code: number | null; out: string; err: string } {
  const r = spawnSync(process.execPath, [launcher, ...args], {
    cwd: elsewhere,
    encoding: 'utf8',
    env: { PATH: '/usr/bin:/bin', HOME: elsewhere },
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

describe('bin/ezk.mjs depuis un dossier jetable, sans tsx dans le PATH', () => {
  it('« help » marche de partout et liste les deux familles', { timeout: 60_000 }, () => {
    const r = ezk(['help']);
    expect(r.code).toBe(0);
    expect(r.out.startsWith('En clair.')).toBe(true);
    expect(r.out).toContain('law status');
    expect(r.out).toContain('/ezk-sprint');
  });

  it('« help <domaine> » et « help <skill> » détaillent', { timeout: 60_000 }, () => {
    expect(ezk(['help', 'board']).out).toMatch(/regen[\s\S]*regen-avancement\.ts/);
    expect(ezk(['help', 'ezk-sprint']).out).toContain('usage');
    expect(ezk(['help', 'nimporte-quoi']).code).toBe(2);
  });

  it('refuse une commande qui touche aux fichiers du dépôt quand on est ailleurs', { timeout: 60_000 }, () => {
    const r = ezk(['--dry-run', 'board', 'regen']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('dépôt de la méthode');
    expect(r.err).toContain('--root');
    expect(r.out).not.toContain('regen-avancement');
  });

  it('avec --root vers le dépôt de la méthode, elle passe : trois étapes, dans l’ordre', { timeout: 60_000 }, () => {
    const r = ezk(['--root', repoRoot, '--dry-run', 'board', 'regen']);
    expect(r.code).toBe(0);
    const steps = r.out.split('\n').filter((l) => l.includes('bin/regen-'));
    expect(steps.map((l) => l.replace(/^.*(bin\/regen-[\w-]+\.ts).*$/, '$1'))).toEqual([
      'bin/regen-avancement.ts',
      'bin/regen-plan-delta.ts',
      'bin/regen-plan-view.ts',
    ]);
  });

  it('un autre dépôt derrière --root est refusé, avec la fiche qui le permettra', { timeout: 60_000 }, () => {
    const r = ezk(['--root', elsewhere, '--dry-run', 'board', 'regen']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('20260826173221323');
  });

  it('« law » ne dépend pas du dépôt courant ; « map » prévient et vise le même script que « dashboard »', { timeout: 60_000 }, () => {
    expect(ezk(['--dry-run', 'law', 'status', 'global']).code).toBe(0);
    const old = ezk(['--root', repoRoot, '--dry-run', 'map', '--list']);
    const now = ezk(['--root', repoRoot, '--dry-run', 'dashboard', '--list']);
    expect(old.err).toContain('dashboard');
    expect(old.out).toContain('bin/ezk-map.ts --list');
    expect(now.err).toBe('');
    expect(now.out).toContain('bin/ezk-map.ts --list');
  });

  it('une commande inconnue sort en code 2 avec une marche à suivre', { timeout: 60_000 }, () => {
    const r = ezk(['zzz']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('ezk help');
  });
});
