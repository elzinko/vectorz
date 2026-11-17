/**
 * Le dossier de la session est-il dans le dépôt visé ? (fiche 20261117141828102)
 * Un dossier hors dépôt, ou dans un autre dépôt, est rendu ; le dépôt et ses worktrees ne le sont pas.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { sessionOutsideRepo } from '../run-facts.js';

const git = (cwd: string, ...args: string[]): void => {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
};

describe('sessionOutsideRepo', () => {
  let base: string;
  let repo: string;
  beforeEach(() => {
    base = mkdtempSync(join(tmpdir(), 'run-facts-session-'));
    repo = join(base, 'repo');
    execFileSync('git', ['init', '-q', repo]);
    git(repo, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '--allow-empty', '-m', 'init');
  });
  afterEach(() => rmSync(base, { recursive: true, force: true }));

  it('ne rend rien depuis le dépôt lui-même', () => {
    expect(sessionOutsideRepo(repo, repo)).toBeUndefined();
  });

  it('ne rend rien depuis un worktree du dépôt', () => {
    const wt = join(base, 'wt');
    git(repo, 'worktree', 'add', '-q', wt);
    expect(sessionOutsideRepo(wt, repo)).toBeUndefined();
  });

  it('rend le dossier quand il n’est dans aucun dépôt', () => {
    const vide = mkdtempSync(join(base, 'vide-'));
    expect(sessionOutsideRepo(vide, repo)).toBe(vide);
  });

  it('rend le dossier quand il est dans un autre dépôt', () => {
    const autre = join(base, 'autre');
    execFileSync('git', ['init', '-q', autre]);
    expect(sessionOutsideRepo(autre, repo)).toBe(autre);
  });
});
