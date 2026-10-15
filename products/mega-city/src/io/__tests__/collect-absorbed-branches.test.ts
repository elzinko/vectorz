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
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { collectAbsorbedBranches } from '../sessions-collect.js';

const made: string[] = [];
let cwd0: string;

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

beforeEach(() => {
  cwd0 = process.cwd();
});
afterEach(() => {
  process.chdir(cwd0); // la fonction lit process.cwd() : on restaure toujours
});
afterAll(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});

describe('collectAbsorbedBranches', () => {
  it('rend les branches absorbées par main, jamais les branches au travail réel ni main', () => {
    const dir = repo();
    process.chdir(dir);
    const absorbed = collectAbsorbedBranches(['feat/0001-absorbee', 'feat/0002-reelle', 'main']);
    expect(absorbed).toContain('feat/0001-absorbee');
    expect(absorbed).not.toContain('feat/0002-reelle');
    expect(absorbed).not.toContain('main'); // la base n'est jamais jugée absorbée d'elle-même
  });

  it('base absente → liste vide (dégradé SÛR : on garde « en cours »)', () => {
    const dir = repo();
    process.chdir(dir);
    expect(collectAbsorbedBranches(['feat/0001-absorbee'], 'inexistante')).toEqual([]);
  });

  it('hors d’un dépôt git → liste vide, sans exception', () => {
    const empty = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-nogit-')));
    made.push(empty);
    process.chdir(empty);
    expect(collectAbsorbedBranches(['feat/0001-x'])).toEqual([]);
  });
});
