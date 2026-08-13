import { describe, expect, it } from 'vitest';
import type { ResolvedProfile, Rule } from '../domain/model.js';
import type { WritePlan } from '../domain/plan.js';
import { claudeCodeGlobalCap } from '../caps/claude-code-global.js';

const ruleCleanCode: Rule = {
  id: 'clean-code/no-dead-code',
  kind: 'disposition',
  level: 'MUST',
  content: 'Pas de code mort, pas de TODO masqué.',
  enforcements: [{ type: 'agent-check', agent: 'ezk-reviewer' }],
};

const resolved: ResolvedProfile = {
  rules: [ruleCleanCode],
  agents: [
    {
      id: 'ezk-reviewer',
      role: '# ezk-reviewer\n\nReviewer senior.',
      competences: ['ezk-ci'],
      interactions: ['clean-code/no-dead-code'],
    },
  ],
  skills: [{ id: 'ezk-commits', content: '# ezk-commits\n\nPlaybook.' }],
};

const find = (plan: WritePlan, path: string) => plan.files.find((f) => f.path === path);

describe('claudeCodeGlobalCap.materialize (plan pur, sans FS)', () => {
  it("matérialise chaque skill dans skills/<id>/SKILL.md (un dossier par skill)", () => {
    const plan = claudeCodeGlobalCap.materialize(resolved, '/fake/.claude');
    const skill = find(plan, 'skills/ezk-commits/SKILL.md');
    expect(skill).toBeDefined();
    expect(skill?.content).toContain('Playbook');
  });

  it('matérialise chaque agent dans agents/<id>.md', () => {
    const plan = claudeCodeGlobalCap.materialize(resolved, '/fake/.claude');
    const agent = find(plan, 'agents/ezk-reviewer.md');
    expect(agent).toBeDefined();
    expect(agent?.content).toContain('Reviewer senior');
  });

  it('réémet model/effort/isolation dans le frontmatter du fichier agent généré (fiche 0043)', () => {
    const tuned: ResolvedProfile = {
      ...resolved,
      agents: [{ ...resolved.agents[0], model: 'sonnet', effort: 'medium', isolation: 'worktree' }],
    };
    const plan = claudeCodeGlobalCap.materialize(tuned, '/fake/.claude');
    const agent = find(plan, 'agents/ezk-reviewer.md');
    expect(agent?.content).toContain('name: ezk-reviewer');
    expect(agent?.content).toContain('model: sonnet');
    expect(agent?.content).toContain('effort: medium');
    expect(agent?.content).toContain('isolation: worktree');
    expect(agent?.content).toContain('Reviewer senior');
  });

  it("ne matérialise pas de skill sans contenu", () => {
    const empty: ResolvedProfile = { ...resolved, skills: [{ id: 'vide', content: '   ' }] };
    const plan = claudeCodeGlobalCap.materialize(empty, '/fake/.claude');
    expect(plan.files.some((f) => f.path.startsWith('skills/vide/'))).toBe(false);
  });

  it("n'émet aucun hook (global = skills + agents seulement)", () => {
    const plan = claudeCodeGlobalCap.materialize(resolved, '/fake/.claude');
    expect(plan.hooks).toEqual([]);
  });

  it('rejette un id de skill non sûr (assertSafeId)', () => {
    const unsafe: ResolvedProfile = {
      ...resolved,
      skills: [{ id: '../evil', content: 'x' }],
    };
    expect(() => claudeCodeGlobalCap.materialize(unsafe, '/fake/.claude')).toThrow(/non sûr/i);
  });

  it('emporte les assets sous skills/<id>/<rel>, mode 0o755 si exécutable (ADR-0027)', () => {
    const withAssets: ResolvedProfile = {
      ...resolved,
      skills: [
        {
          id: 'ezk-article',
          content: 'x',
          assets: [
            { path: 'approaches/a.md', content: 'a\n' },
            { path: 'scripts/run.sh', content: '#!/bin/sh\n', executable: true },
          ],
        },
      ],
    };
    const plan = claudeCodeGlobalCap.materialize(withAssets, '/fake/.claude');
    expect(find(plan, 'skills/ezk-article/approaches/a.md')?.content).toBe('a\n');
    expect(find(plan, 'skills/ezk-article/scripts/run.sh')?.mode).toBe(0o755);
  });

  it('trie stablement les fichiers du plan par path (déterminisme)', () => {
    const plan = claudeCodeGlobalCap.materialize(resolved, '/fake/.claude');
    const paths = plan.files.map((f) => f.path);
    expect(paths).toEqual([...paths].sort((a, b) => a.localeCompare(b)));
  });
});
