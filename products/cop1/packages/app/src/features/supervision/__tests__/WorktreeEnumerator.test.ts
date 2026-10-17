/**
 * Tests de `WorktreeEnumerator` (fiche 20261015082118368, ADR-079 §D9).
 * Plomberie git posée à la main (pur FS) : aucun spawn de git, aucun import mega-city.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { enumerateWorktrees } from '../infrastructure/WorktreeEnumerator.js';

let tmp: string;
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'cop1-worktrees-'));
});
afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

/** Pose un arbre principal git (`.git` dossier) avec N worktrees liés enregistrés. */
function makeRepo(worktrees: string[]): { main: string; worktreeRoots: string[] } {
  const main = join(tmp, 'main');
  mkdirSync(join(main, '.git', 'worktrees'), { recursive: true });
  const worktreeRoots: string[] = [];
  for (const name of worktrees) {
    const wtRoot = join(tmp, name);
    mkdirSync(wtRoot, { recursive: true });
    mkdirSync(join(main, '.git', 'worktrees', name), { recursive: true });
    writeFileSync(join(main, '.git', 'worktrees', name, 'gitdir'), `${join(wtRoot, '.git')}\n`);
    worktreeRoots.push(wtRoot);
  }
  return { main, worktreeRoots };
}

describe('enumerateWorktrees', () => {
  it('rend l’arbre principal ET chaque worktree lié', () => {
    const { main, worktreeRoots } = makeRepo(['wt-A', 'wt-B']);

    const roots = enumerateWorktrees(main);
    expect(roots).toContain(main);
    for (const wt of worktreeRoots) expect(roots).toContain(wt);
    expect(roots).toHaveLength(3);
  });

  it('hors dépôt git : rend au moins la racine de base, sans throw', () => {
    const plain = join(tmp, 'plain');
    mkdirSync(plain, { recursive: true });
    expect(enumerateWorktrees(plain)).toEqual([plain]);
  });

  it('worktree à moitié supprimé (racine disparue) : ignoré, pas d’orphelin', () => {
    const main = join(tmp, 'main');
    mkdirSync(join(main, '.git', 'worktrees', 'wt-gone'), { recursive: true });
    // gitdir pointe une racine qui n'existe pas
    writeFileSync(join(main, '.git', 'worktrees', 'wt-gone', 'gitdir'), `${join(tmp, 'disparu', '.git')}\n`);

    const roots = enumerateWorktrees(main);
    expect(roots).toContain(main);
    expect(roots.some((r) => r.includes('disparu'))).toBe(false);
  });
});
