import { describe, expect, it } from 'vitest';
import type { ResolvedProfile, Rule } from '../domain/model.js';
import type { WritePlan } from '../domain/plan.js';
import { claudeCodeCap } from '../caps/claude-code.js';

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
  agents: [
    {
      id: 'ezk-reviewer',
      role: '# ezk-reviewer\n\nReviewer senior.',
      competences: ['ezk-ci'],
      interactions: ['clean-code/no-dead-code'],
    },
  ],
  skills: [],
};

const find = (plan: WritePlan, path: string) => plan.files.find((f) => f.path === path);

describe('claudeCodeCap.materialize (plan pur, sans FS)', () => {
  it('écrit un fichier agent par agent dans .claude/agents/', () => {
    const plan = claudeCodeCap.materialize(resolved, '/tmp/projet');
    const agentFile = find(plan, '.claude/agents/ezk-reviewer.md');
    expect(agentFile).toBeDefined();
    expect(agentFile?.content).toContain('Reviewer senior');
  });

  it('sans model/effort/isolation : aucun frontmatter ajouté (comportement historique)', () => {
    const plan = claudeCodeCap.materialize(resolved, '/tmp/projet');
    const agentFile = find(plan, '.claude/agents/ezk-reviewer.md');
    expect(agentFile?.content).not.toContain('---');
  });

  it('réémet model/effort/isolation/model_spare dans le frontmatter du fichier agent généré (fiche 0043)', () => {
    const tuned: ResolvedProfile = {
      ...resolved,
      agents: [
        {
          ...resolved.agents[0],
          model: 'claude-opus-4-8',
          model_spare: 'sonnet',
          effort: 'high',
          isolation: 'worktree',
        },
      ],
    };
    const plan = claudeCodeCap.materialize(tuned, '/tmp/projet');
    const agentFile = find(plan, '.claude/agents/ezk-reviewer.md');
    expect(agentFile?.content).toContain('name: ezk-reviewer');
    expect(agentFile?.content).toContain('model: claude-opus-4-8');
    expect(agentFile?.content).toContain('model_spare: sonnet');
    expect(agentFile?.content).toContain('effort: high');
    expect(agentFile?.content).toContain('isolation: worktree');
    expect(agentFile?.content).toContain('Reviewer senior');
  });

  it("n'écrit AUCUN .claude/skills/* quand aucune skill n'a de contenu", () => {
    const plan = claudeCodeCap.materialize(resolved, '/tmp/projet');
    expect(plan.files.some((f) => f.path.startsWith('.claude/skills/'))).toBe(false);
  });

  it('écrit une skill par skill dont le contenu existe', () => {
    const withSkill: ResolvedProfile = {
      ...resolved,
      skills: [{ id: 'ezk-commits', content: '# ezk-commits\n\nPlaybook.' }],
    };
    const plan = claudeCodeCap.materialize(withSkill, '/tmp/projet');
    const skillFile = find(plan, '.claude/skills/ezk-commits.md');
    expect(skillFile?.content).toContain('Playbook');
  });

  it('compile les règles (corps + level) dans .iamthelaw/ENTRY.md', () => {
    const plan = claudeCodeCap.materialize(resolved, '/tmp/projet');
    const entry = find(plan, '.iamthelaw/ENTRY.md');
    expect(entry).toBeDefined();
    expect(entry?.content).toContain('clean-code/no-dead-code');
    expect(entry?.content).toContain('MUST');
    expect(entry?.content).toContain('Pas de code mort');
    expect(entry?.content).toContain('Chaque message suit Conventional Commits');
  });

  it('ajoute une référence « lire .iamthelaw/ENTRY.md » dans CLAUDE.md', () => {
    const plan = claudeCodeCap.materialize(resolved, '/tmp/projet');
    const claudeMd = find(plan, 'CLAUDE.md');
    expect(claudeMd?.content).toContain('.iamthelaw/ENTRY.md');
  });

  it('produit un hook commit-msg pour les enforcements type:hook (niveau 2)', () => {
    const plan = claudeCodeCap.materialize(resolved, '/tmp/projet');
    const hook = plan.hooks.find((h) => h.stage === 'commit-msg');
    expect(hook).toBeDefined();
    expect(hook?.script.length).toBeGreaterThan(0);
  });

  it('ne fabrique aucun hook quand il n’existe que des enforcements agent-check (niveau 1)', () => {
    const onlyAgentCheck: ResolvedProfile = { ...resolved, rules: [ruleCleanCode] };
    const plan = claudeCodeCap.materialize(onlyAgentCheck, '/tmp/projet');
    expect(plan.hooks).toEqual([]);
  });

  it('trie stablement les fichiers du plan par path (déterminisme)', () => {
    const plan = claudeCodeCap.materialize(resolved, '/tmp/projet');
    const paths = plan.files.map((f) => f.path);
    expect(paths).toEqual([...paths].sort((a, b) => a.localeCompare(b)));
  });

  it('déclare l’intention de fusion par fichier (fiche 0010)', () => {
    const plan = claudeCodeCap.materialize(resolved, '/tmp/projet');
    // CLAUDE.md est PARTAGÉ avec l'humain → bloc managé (jamais écrasé en entier).
    expect(find(plan, 'CLAUDE.md')?.intent).toBe('managed-block');
    // ENTRY.md et les agents sont POSSÉDÉS par le cap → remplacement franc.
    expect(find(plan, '.iamthelaw/ENTRY.md')?.intent).toBe('replace');
    expect(find(plan, '.claude/agents/ezk-reviewer.md')?.intent).toBe('replace');
  });

  it('marque les hooks « skip-if-exists » (ne pas écraser un commit-msg perso)', () => {
    const plan = claudeCodeCap.materialize(resolved, '/tmp/projet');
    const hook = plan.hooks.find((h) => h.stage === 'commit-msg');
    expect(hook?.intent).toBe('skip-if-exists');
  });
});
