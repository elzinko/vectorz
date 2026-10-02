/**
 * Fusion sans conflit — l'exigence n°1 de la fiche 20260826072532622 (sessions parallèles).
 *
 * On ne SUPPOSE pas que « un fichier par fiche » fusionne bien : on le rejoue avec un vrai `git
 * merge` dans un dépôt temporaire. Un second test, TÉMOIN, montre pourquoi la première idée de la
 * fiche (un seul fichier trié) a été écartée : deux ajouts voisins s'y marchent dessus.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { serializeVerdict, verdictFile } from '../core/verdicts.js';

// Ce fichier lance de vrais sous-processus (git) via spawnSync, BLOQUANTS. Sous charge, un appel
// grimpe jusqu'à ~30 s et dépasse le délai vitest par défaut (5 s) : la suite complète rougit par
// intermittence (fiche 20261001133500727). On élargit le délai POUR CE FICHIER seul — le reste de
// la suite garde 5 s, donc un test unitaire bloqué échoue toujours vite. Calibré sur le pire cas
// mesuré sous charge (~31 s) avec une marge ~2× ; un vrai blocage reste borné à 60 s, message clair.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let repo: string;

function git(...args: string[]): { status: number; out: string } {
  const run = spawnSync(
    'git',
    ['-c', 'user.name=test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false', ...args],
    { cwd: repo, encoding: 'utf8' },
  );
  return { status: run.status ?? -1, out: `${run.stdout}${run.stderr}` };
}

function put(file: string, content: string): void {
  mkdirSync(dirname(join(repo, file)), { recursive: true });
  writeFileSync(join(repo, file), content);
}

/** Deux fiches dont les ids se suivent dans l'ordre, avec un voisin de chaque côté — le cas piégeux. */
const AVANT = '20260826072532622';
const PREMIERE = '20260826072532624';
const SECONDE = '20260826072532625';
const APRES = '20260826072532630';
const up = serializeVerdict({ verdict: 'up', date: '2026-10-01' });
const down = serializeVerdict({ verdict: 'down', date: '2026-10-02' });

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'ezk-merge-'));
  git('init', '-q', '-b', 'main');
});

afterEach(() => rmSync(repo, { recursive: true, force: true }));

describe('un fichier de verdict par fiche', () => {
  it('deux sessions jugent deux fiches voisines : le merge est sans conflit', () => {
    put(verdictFile(AVANT), up);
    put(verdictFile(APRES), up);
    git('add', '-A');
    git('commit', '-q', '-m', 'base');

    git('checkout', '-q', '-b', 'session-a');
    put(verdictFile(PREMIERE), up);
    git('add', '-A');
    git('commit', '-q', '-m', 'a juge la première');

    git('checkout', '-q', 'main');
    git('checkout', '-q', '-b', 'session-b');
    put(verdictFile(SECONDE), down);
    git('add', '-A');
    git('commit', '-q', '-m', 'b juge la seconde');

    const merge = git('merge', '--no-edit', 'session-a');

    expect(merge.status, merge.out).toBe(0);
    expect(readFileSync(join(repo, verdictFile(PREMIERE)), 'utf8')).toBe(up);
    expect(readFileSync(join(repo, verdictFile(SECONDE)), 'utf8')).toBe(down);
  });

  it('une session retire un verdict pendant que l’autre en pose un autre : sans conflit', () => {
    put(verdictFile(AVANT), up);
    git('add', '-A');
    git('commit', '-q', '-m', 'base');

    git('checkout', '-q', '-b', 'session-a');
    git('rm', '-q', verdictFile(AVANT));
    git('commit', '-q', '-m', 'a retire son verdict');

    git('checkout', '-q', 'main');
    git('checkout', '-q', '-b', 'session-b');
    put(verdictFile(SECONDE), down);
    git('add', '-A');
    git('commit', '-q', '-m', 'b juge une autre fiche');

    const merge = git('merge', '--no-edit', 'session-a');
    expect(merge.status, merge.out).toBe(0);
  });
});

describe('TÉMOIN — pourquoi pas un seul fichier trié', () => {
  it('deux ajouts voisins dans un même fichier trié se marchent dessus : conflit', () => {
    const ligne = (id: string, v: string): string => `${id} ${v}\n`;
    put('verdicts.txt', ligne(AVANT, 'up') + ligne(APRES, 'up'));
    git('add', '-A');
    git('commit', '-q', '-m', 'base');

    git('checkout', '-q', '-b', 'session-a');
    put('verdicts.txt', ligne(AVANT, 'up') + ligne(PREMIERE, 'up') + ligne(APRES, 'up'));
    git('commit', '-q', '-am', 'a insère sa ligne');

    git('checkout', '-q', 'main');
    git('checkout', '-q', '-b', 'session-b');
    put('verdicts.txt', ligne(AVANT, 'up') + ligne(SECONDE, 'down') + ligne(APRES, 'up'));
    git('commit', '-q', '-am', 'b insère la sienne');

    const merge = git('merge', '--no-edit', 'session-a');
    expect(merge.status).not.toBe(0);
    expect(merge.out).toMatch(/CONFLICT/);
  });
});
