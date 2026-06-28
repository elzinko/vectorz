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
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { constants } from 'node:fs';
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
});
