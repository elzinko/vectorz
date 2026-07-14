/**
 * Tests de `upgrade-ok.ts` — calcul mécanique de `upgrade_ok` (rubrique E du Gherkin).
 * Aucun forçage possible à `true` : seul un veto explicite peut forcer `false`.
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { computeUpgradeOk } from '../upgrade-ok.js';

describe('computeUpgradeOk — rubrique E', () => {
  let projectRoot: string;
  let worktreeDir: string | undefined;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-upgrade-ok-'));
    execFileSync('git', ['init'], { cwd: projectRoot });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: projectRoot });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: projectRoot });
    fs.writeFileSync(path.join(projectRoot, 'README.md'), '# poc\n');
    execFileSync('git', ['add', '.'], { cwd: projectRoot });
    execFileSync('git', ['commit', '-m', 'initial'], { cwd: projectRoot });
    worktreeDir = undefined;
  });

  afterEach(() => {
    if (worktreeDir) {
      execFileSync('git', ['worktree', 'remove', '--force', worktreeDir], { cwd: projectRoot });
    }
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it('est vrai quand l’arbre est propre et sans worktree en vol', () => {
    expect(computeUpgradeOk(projectRoot)).toBe(true);
  });

  it('est faux quand l’arbre git contient des modifications non commitées', () => {
    fs.writeFileSync(path.join(projectRoot, 'dirty.txt'), 'oops');
    expect(computeUpgradeOk(projectRoot)).toBe(false);
  });

  it('est faux quand un worktree additionnel est en vol', () => {
    worktreeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-upgrade-ok-wt-'));
    fs.rmdirSync(worktreeDir); // git worktree add veut créer le dossier lui-même
    execFileSync('git', ['worktree', 'add', worktreeDir, '-b', 'wt-branch'], { cwd: projectRoot });
    expect(computeUpgradeOk(projectRoot)).toBe(false);
  });

  it('le veto de l’appelant force à faux même sur arbre propre', () => {
    expect(computeUpgradeOk(projectRoot, true)).toBe(false);
  });

  it('n’expose aucun moyen de forcer à true (pas de paramètre "force true")', () => {
    // La signature n'accepte qu'un veto (toujours vers false) : impossible par construction
    // de fournir un paramètre qui pousserait vers true sur un arbre sale.
    fs.writeFileSync(path.join(projectRoot, 'dirty.txt'), 'oops');
    expect(computeUpgradeOk(projectRoot, false)).toBe(false);
  });

  it('M2 — se dégrade silencieusement à false (jamais d’exception) hors dépôt git', () => {
    const nonGitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-non-git-'));
    try {
      expect(() => computeUpgradeOk(nonGitDir)).not.toThrow();
      expect(computeUpgradeOk(nonGitDir)).toBe(false);
    } finally {
      fs.rmSync(nonGitDir, { recursive: true, force: true });
    }
  });
});
