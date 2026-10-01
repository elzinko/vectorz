/**
 * Cap PROJET `claude-code` : les skills en forme DOSSIER (fiche 20260813095351680, qui absorbe
 * 20260813095351681). Claude Code lit ses skills dans `.claude/skills/<id>/SKILL.md` ; l'ancienne forme
 * plate `.claude/skills/<id>.md` ne pouvait porter aucun fichier annexe (`approaches/`, `scripts/`).
 * Preuves sur un projet JETABLE, jamais sur un vrai dépôt.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { claudeCodeCap } from '../caps/claude-code.js';
import type { ResolvedProfile } from '../domain/model.js';
import { applyPlan } from '../io/apply.js';

let project: string;
beforeEach(() => {
  project = mkdtempSync(join(tmpdir(), 'lawgiver-project-'));
});
afterEach(() => {
  rmSync(project, { recursive: true, force: true });
});

const profile: ResolvedProfile = {
  rules: [],
  agents: [],
  skills: [
    {
      id: 'ezk-demo',
      content: '# ezk-demo\n\nPlaybook.',
      assets: [
        { path: 'approaches/a.md', content: 'approche\n' },
        { path: 'scripts/run.sh', content: '#!/bin/sh\necho ok\n', executable: true },
      ],
    },
  ],
};

const read = (rel: string): string => readFileSync(join(project, rel), 'utf8');

describe('bind projet — un skill est un dossier qui porte ses fichiers annexes', () => {
  it('écrit .claude/skills/<id>/SKILL.md ET ses annexes, les scripts en exécutable', () => {
    applyPlan(claudeCodeCap.materialize(profile, project), project);
    expect(read('.claude/skills/ezk-demo/SKILL.md')).toContain('Playbook.');
    expect(read('.claude/skills/ezk-demo/approaches/a.md')).toBe('approche\n');
    expect(read('.claude/skills/ezk-demo/scripts/run.sh')).toContain('echo ok');
    expect(statSync(join(project, '.claude/skills/ezk-demo/scripts/run.sh')).mode & 0o111).not.toBe(0);
    expect(statSync(join(project, '.claude/skills/ezk-demo/approaches/a.md')).mode & 0o111).toBe(0);
  });

  it('est rejouable : un 2ᵉ passage donne le même résultat', () => {
    const plan = claudeCodeCap.materialize(profile, project);
    applyPlan(plan, project);
    expect(() => applyPlan(plan, project)).not.toThrow();
    expect(read('.claude/skills/ezk-demo/approaches/a.md')).toBe('approche\n');
  });

  it('un ancien fichier plat .claude/skills/<id>.md coexiste : il n’est ni écrasé ni supprimé', () => {
    mkdirSync(join(project, '.claude/skills'), { recursive: true });
    writeFileSync(join(project, '.claude/skills/ezk-demo.md'), 'ancienne forme plate\n');
    writeFileSync(join(project, '.claude/skills/mon-skill.md'), 'un fichier à moi\n');
    applyPlan(claudeCodeCap.materialize(profile, project), project);
    expect(read('.claude/skills/ezk-demo.md')).toBe('ancienne forme plate\n');
    expect(read('.claude/skills/mon-skill.md')).toBe('un fichier à moi\n');
    expect(read('.claude/skills/ezk-demo/SKILL.md')).toContain('Playbook.');
  });

  it('un annexe nommé SKILL.md n’a pas besoin de garde ici : le plan le range dans son dossier', () => {
    const tricky: ResolvedProfile = {
      ...profile,
      skills: [{ id: 'gen', content: '# gen', assets: [{ path: 'templates/x/SKILL.md', content: 'modèle\n' }] }],
    };
    applyPlan(claudeCodeCap.materialize(tricky, project), project);
    expect(read('.claude/skills/gen/templates/x/SKILL.md')).toBe('modèle\n');
  });
});
