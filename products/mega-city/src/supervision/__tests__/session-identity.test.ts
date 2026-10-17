/**
 * Tests de `session-identity.ts` (émetteur T2, fiche 20261015133600314, ADR-079 §D6/D10).
 * Pur file-system, AUCUN spawn de git : les fixtures posent `.git`/HEAD à la main.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveBranchFromGitHead, resolveSessionIdentity } from '../session-identity.js';

describe('resolveBranchFromGitHead — branche lue sans git', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-session-'));
  });
  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('arbre principal (.git dossier) : lit la branche dans .git/HEAD', () => {
    const root = path.join(tmp, 'main');
    fs.mkdirSync(path.join(root, '.git'), { recursive: true });
    fs.writeFileSync(path.join(root, '.git', 'HEAD'), 'ref: refs/heads/main\n');

    expect(resolveBranchFromGitHead(root)).toBe('main');
  });

  it('worktree lié (.git fichier gitdir:) : suit le gitdir vers HEAD', () => {
    const root = path.join(tmp, 'wt');
    const gitDir = path.join(tmp, 'gitdir-wt');
    fs.mkdirSync(root, { recursive: true });
    fs.mkdirSync(gitDir, { recursive: true });
    fs.writeFileSync(path.join(root, '.git'), `gitdir: ${gitDir}\n`);
    fs.writeFileSync(path.join(gitDir, 'HEAD'), 'ref: refs/heads/feat/board\n');

    expect(resolveBranchFromGitHead(root)).toBe('feat/board');
  });

  it('HEAD détachée (pas de ref:) : repli sur le nom du dossier', () => {
    const root = path.join(tmp, 'detache');
    fs.mkdirSync(path.join(root, '.git'), { recursive: true });
    fs.writeFileSync(path.join(root, '.git', 'HEAD'), '9a1b2c3d4e5f\n');

    expect(resolveBranchFromGitHead(root)).toBe('detache');
  });

  it('hors dépôt (pas de .git) : repli sur le nom du dossier', () => {
    const root = path.join(tmp, 'hors-git');
    fs.mkdirSync(root, { recursive: true });

    expect(resolveBranchFromGitHead(root)).toBe('hors-git');
  });
});

describe('resolveSessionIdentity — session_id figé par session.json', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-sessid-'));
  });
  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('crée session.json au premier appel et fige le session_id', () => {
    const first = resolveSessionIdentity(root);

    expect(first.sessionId.length).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(root, '.supervision', 'session.json'))).toBe(true);
  });

  it('un second appel (= redémarrage du process) relit le MÊME session_id', () => {
    const first = resolveSessionIdentity(root);
    const second = resolveSessionIdentity(root);

    expect(second.sessionId).toBe(first.sessionId);
  });

  it('un session.json illisible est régénéré sans throw', () => {
    fs.mkdirSync(path.join(root, '.supervision'), { recursive: true });
    fs.writeFileSync(path.join(root, '.supervision', 'session.json'), '{ pas du json');

    const resolved = resolveSessionIdentity(root);
    expect(resolved.sessionId.length).toBeGreaterThan(0);
  });
});
