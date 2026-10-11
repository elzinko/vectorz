import { describe, expect, it } from 'vitest';
import { claudeCodeLawCap } from '../caps/claude-code-law.js';
import type { ResolvedProfile, Rule } from '../domain/model.js';

const ruleCleanCode: Rule = {
  id: 'clean-code/no-dead-code',
  kind: 'disposition',
  level: 'MUST',
  content: 'Pas de code mort, pas de TODO masqué.',
  enforcements: [{ type: 'agent-check', agent: 'ezk-reviewer' }],
};

const ruleCommits: Rule = {
  id: 'conventional-commits/format',
  kind: 'disposition',
  level: 'MUST',
  content: 'Chaque message suit Conventional Commits v1.0.0.',
  enforcements: [{ type: 'hook', hook: { stage: 'commit-msg', script: 'hooks/commit-msg.sh' } }],
};

const resolved: ResolvedProfile = {
  rules: [ruleCleanCode, ruleCommits],
  // Un profil peut porter des agents/skills : le cap law-only les ignore À DESSEIN.
  agents: [{ id: 'ezk-reviewer', role: '# ezk-reviewer', competences: [], interactions: [] }],
  skills: [{ id: 'ezk-ci', content: '# ezk-ci' }],
};

describe('claudeCodeLawCap.materialize — loi + pointeur SEULEMENT (fiche 20261007115129448, ADR-0064)', () => {
  it('écrit .iamthelaw/ENTRY.md avec la loi compilée', () => {
    const plan = claudeCodeLawCap.materialize(resolved, '/tmp/projet');
    const entry = plan.files.find((f) => f.path === '.iamthelaw/ENTRY.md');
    expect(entry).toBeDefined();
    expect(entry?.content).toContain('clean-code/no-dead-code');
    expect(entry?.content).toContain('conventional-commits/format');
    expect(entry?.intent).toBe('replace');
  });

  it('écrit le bloc managé de CLAUDE.md qui pointe vers la loi', () => {
    const plan = claudeCodeLawCap.materialize(resolved, '/tmp/projet');
    const claudeMd = plan.files.find((f) => f.path === 'CLAUDE.md');
    expect(claudeMd?.content).toContain('.iamthelaw/ENTRY.md');
    expect(claudeMd?.intent).toBe('managed-block');
  });

  it("n'écrit NI agents NI skills dans le dépôt (anti-duplication circulaire)", () => {
    const plan = claudeCodeLawCap.materialize(resolved, '/tmp/projet');
    const paths = plan.files.map((f) => f.path);
    expect(paths.some((p) => p.startsWith('.claude/agents/'))).toBe(false);
    expect(paths.some((p) => p.startsWith('.claude/skills/'))).toBe(false);
    // Exactement deux fichiers : la loi et le pointeur.
    expect(paths.sort()).toEqual(['.iamthelaw/ENTRY.md', 'CLAUDE.md'].sort());
  });

  it('relaie les hooks des enforcements type:hook (comme le cap claude-code)', () => {
    const plan = claudeCodeLawCap.materialize(resolved, '/tmp/projet');
    expect(plan.hooks).toEqual([
      { stage: 'commit-msg', script: 'hooks/commit-msg.sh', intent: 'skip-if-exists' },
    ]);
  });
});
