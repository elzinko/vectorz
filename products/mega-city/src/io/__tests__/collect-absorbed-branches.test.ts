/**
 * collectAbsorbedBranches (fiche 20261013131852984, critère 4) — le jumeau TS de `is_absorbed_branch`
 * du portier, qui nourrit la vue des sessions. Testé sur un VRAI dépôt git jetable : une branche qui
 * pointe sur `main` (ou dont le contenu y est déjà) est absorbée ; une branche au travail non livré ne
 * l'est pas ; `main` elle-même n'est jamais rendue ; une base absente dégrade en liste vide (SÛR).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { collectAbsorbedBranches } from '../sessions-collect.js';

// Ce fichier lance de VRAIS git (init, commit, merge-tree --write-tree) par sous-processus. Sous
// charge (suite parallèle, plusieurs workers), un `git` grimpe au-delà du délai vitest par défaut
// (5 s) et le test rougit par intermittence — alors qu'en isolation il passe (fiche 20261024090000000,
// même cause et même parade que `backlog-version-bin.test.ts`). On élargit le délai POUR CE FICHIER.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const made: string[] = [];

/** Un dépôt git jetable avec `main`, une branche absorbée (pointe sur main) et une branche réelle. */
function repo(): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-absorb-')));
  made.push(dir);
  const git = (...args: string[]): void => {
    execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
  };
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 't@t');
  git('config', 'user.name', 't');
  git('config', 'commit.gpgsign', 'false');
  execFileSync('git', ['-C', dir, 'commit', '-q', '--allow-empty', '-m', 'base'], { encoding: 'utf8' });
  git('branch', 'feat/0001-absorbee'); // pointe sur main → absorbée
  git('checkout', '-q', '-b', 'feat/0002-reelle');
  writeFileSync(join(dir, 'r.txt'), 'travail non livré\n'); // un VRAI changement d'arbre → non absorbée
  git('add', 'r.txt');
  execFileSync('git', ['-C', dir, 'commit', '-q', '-m', 'travail non livré'], { encoding: 'utf8' });
  git('checkout', '-q', 'main');
  return dir;
}

afterAll(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});

// On passe le dépôt par le paramètre `cwd` de `collectAbsorbedBranches`, jamais par `process.chdir` :
// le cwd est GLOBAL au process et courait entre fichiers en suite parallèle (flake de gate,
// fiche 20261024…). Chaque test est ainsi hermétique, sans toucher à l'ambiance du process.
describe('collectAbsorbedBranches', () => {
  it('rend les branches absorbées par main, jamais les branches au travail réel ni main', () => {
    const dir = repo();
    const absorbed = collectAbsorbedBranches(['feat/0001-absorbee', 'feat/0002-reelle', 'main'], 'main', dir);
    expect(absorbed).toContain('feat/0001-absorbee');
    expect(absorbed).not.toContain('feat/0002-reelle');
    expect(absorbed).not.toContain('main'); // la base n'est jamais jugée absorbée d'elle-même
  });

  it('base absente → liste vide (dégradé SÛR : on garde « en cours »)', () => {
    const dir = repo();
    expect(collectAbsorbedBranches(['feat/0001-absorbee'], 'inexistante', dir)).toEqual([]);
  });

  it('hors d’un dépôt git → liste vide, sans exception', () => {
    const empty = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-nogit-')));
    made.push(empty);
    expect(collectAbsorbedBranches(['feat/0001-x'], 'main', empty)).toEqual([]);
  });
});
