import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  readFileSync,
  writeFileSync,
  statSync,
  chmodSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { constants } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { bind } from '../core/bind.js';
import { applyPlan } from '../io/apply.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

// SEUL test impur : il monte un projet jouet dans un temp dir et touche le FS.
describe('applyPlan (coquille I/O, projet jouet)', () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), 'lawgiver-'));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it('écrit les fichiers du plan sur le disque', () => {
    const plan = bind('mobile', projectDir, 'claude-code', repoRoot);
    applyPlan(plan, projectDir);

    expect(existsSync(join(projectDir, '.claude/agents/ezk-reviewer.md'))).toBe(true);
    expect(existsSync(join(projectDir, '.iamthelaw/ENTRY.md'))).toBe(true);
    const claudeMd = readFileSync(join(projectDir, 'CLAUDE.md'), 'utf8');
    expect(claudeMd).toContain('.iamthelaw/ENTRY.md');
  });

  it('pose le hook commit-msg dans .git/hooks et le rend exécutable', () => {
    const plan = bind('mobile', projectDir, 'claude-code', repoRoot);
    applyPlan(plan, projectDir);

    const hookPath = join(projectDir, '.git/hooks/commit-msg');
    expect(existsSync(hookPath)).toBe(true);
    const mode = statSync(hookPath).mode;
    expect(mode & constants.S_IXUSR).toBe(constants.S_IXUSR);
  });

  it('est idempotent : ré-appliquer le même plan ne lève pas et garde le contenu', () => {
    const plan = bind('mobile', projectDir, 'claude-code', repoRoot);
    applyPlan(plan, projectDir);
    applyPlan(plan, projectDir);
    const entry = readFileSync(join(projectDir, '.iamthelaw/ENTRY.md'), 'utf8');
    expect(entry).toContain('clean-code/no-dead-code');
  });

  it('bind sur un projet AVEC CLAUDE.md + hook préexistants ne perd rien (fiche 0010)', () => {
    // L'humain a déjà un CLAUDE.md et un hook commit-msg perso.
    const humanClaudeMd = '# Mon projet\n\nInstructions perso de l’équipe.\n';
    writeFileSync(join(projectDir, 'CLAUDE.md'), humanClaudeMd);
    mkdirSync(join(projectDir, '.git', 'hooks'), { recursive: true });
    const userHook = '#!/bin/sh\n# hook commit-msg perso\nexit 0\n';
    writeFileSync(join(projectDir, '.git/hooks/commit-msg'), userHook);

    const plan = bind('mobile', projectDir, 'claude-code', repoRoot);
    // Le hook du cap diffère du hook perso → refus non-destructif sans --force.
    expect(() => applyPlan(plan, projectDir)).toThrow(/non-destructif|--force/i);

    // Rien n'est perdu : le CLAUDE.md humain a gagné le bloc managé SANS perdre son contenu,
    // et le hook perso est intact.
    const claudeMd = readFileSync(join(projectDir, 'CLAUDE.md'), 'utf8');
    expect(claudeMd).toContain('Instructions perso de l’équipe.');
    expect(claudeMd).toContain('<!-- iamthelaw:start -->');
    expect(readFileSync(join(projectDir, '.git/hooks/commit-msg'), 'utf8')).toBe(userHook);

    // Avec --force : le hook perso est sauvegardé en .bak puis remplacé.
    applyPlan(plan, projectDir, { force: true });
    expect(readFileSync(join(projectDir, '.git/hooks/commit-msg.bak'), 'utf8')).toBe(userHook);
    expect(claudeMd).toContain('Instructions perso de l’équipe.');
  });

  it('refuse un plan dont un chemin s’échappe du projet et n’écrit rien dehors (F1)', () => {
    const escape = { files: [{ path: '../escape.md', content: 'pwned' }], hooks: [] };
    expect(() => applyPlan(escape, projectDir)).toThrow(/hors du projet/);
    expect(existsSync(join(projectDir, '..', 'escape.md'))).toBe(false);
  });

  it('pose le hook depuis un WORKTREE (.git est un fichier) dans le dossier de hooks commun, sans planter (fiche 20261011111526693)', () => {
    // Un vrai dépôt + un worktree : dans le worktree, `.git` est un FICHIER (`gitdir: …`), pas un dossier.
    const mainDir = mkdtempSync(join(tmpdir(), 'lawgiver-main-'));
    const wtParent = mkdtempSync(join(tmpdir(), 'lawgiver-wt-'));
    const wtDir = join(wtParent, 'wt');
    const git = (cwd: string, ...args: string[]): void => {
      execFileSync('git', args, { cwd, stdio: 'ignore' });
    };
    try {
      git(mainDir, 'init', '--quiet', '-b', 'main');
      git(mainDir, 'config', 'user.email', 't@t');
      git(mainDir, 'config', 'user.name', 't');
      git(mainDir, 'config', 'commit.gpgsign', 'false');
      writeFileSync(join(mainDir, 'a.txt'), 'x');
      git(mainDir, 'add', '.');
      git(mainDir, 'commit', '--quiet', '-m', 'base');
      git(mainDir, 'worktree', 'add', '--quiet', wtDir, '-b', 'feat');
      expect(statSync(join(wtDir, '.git')).isFile()).toBe(true); // bien un fichier, pas un dossier

      const plan = { files: [], hooks: [{ stage: 'commit-msg', script: '#!/bin/sh\nexit 0\n' }] };
      expect(() => applyPlan(plan, wtDir)).not.toThrow(); // avant le fix : ENOTDIR sur mkdir .git/hooks

      // Le hook atterrit dans le dossier de hooks COMMUN (celui du dépôt principal), exécutable.
      const commonHook = join(mainDir, '.git', 'hooks', 'commit-msg');
      expect(existsSync(commonHook)).toBe(true);
      expect(statSync(commonHook).mode & constants.S_IXUSR).toBe(constants.S_IXUSR);
      // et aucun faux dossier `.git/hooks` n'a été créé sous le worktree (`.git` y est un fichier).
      expect(existsSync(join(wtDir, '.git', 'hooks'))).toBe(false);
    } finally {
      rmSync(mainDir, { recursive: true, force: true });
      rmSync(wtParent, { recursive: true, force: true });
    }
  });

  it('refuse un nom d’étape de hook qui tenterait une traversée : l’exception hooks reste étroite (F1)', () => {
    const evil = { files: [], hooks: [{ stage: '../../evil', script: 'pwned' }] };
    expect(() => applyPlan(evil, projectDir)).toThrow(/invalide|traversée/i);
    expect(existsSync(resolve(projectDir, '..', '..', 'evil'))).toBe(false);
  });

  it("réinitialise les permissions quand un asset redevient non-exécutable (finding Codex #138)", () => {
    const rel = '.claude/skills/s/scripts/run.sh';
    const target = join(projectDir, rel);
    // État antérieur : le fichier existe et est exécutable (0755).
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, 'old');
    chmodSync(target, 0o755);
    // Ré-application in-place : le plan porte le même chemin en mode NON-exécutable EXPLICITE.
    applyPlan({ files: [{ path: rel, content: 'new', mode: 0o644 }], hooks: [] }, projectDir);
    expect(readFileSync(target, 'utf8')).toBe('new');
    expect(statSync(target).mode & 0o111).toBe(0); // plus aucun bit +x résiduel
  });
});
