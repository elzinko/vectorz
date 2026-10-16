import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';
import type { WritePlan } from '../../domain/plan.js';
import type { ModelConfig } from '../model-config.js';
import { applyModelPointers } from '../model-pointers.js';

function basePlan(): WritePlan {
  return {
    files: [
      { path: '.claude/agents/ezk-architect.md', content: 'RÔLE ARCHITECTE — texte complet du rôle', intent: 'replace' },
      { path: '.claude/agents/ezk-dev.md', content: 'RÔLE DEV — texte complet du rôle', intent: 'replace' },
      { path: 'CLAUDE.md', content: '> lire la loi', intent: 'managed-block' },
    ],
    hooks: [],
  };
}

function fileByPath(plan: WritePlan, path: string) {
  return plan.files.find((f) => f.path === path)!;
}

describe('applyModelPointers (fiche 451, pointeur au bind)', () => {
  it('sans config, rien ne change (tous les rôles restent complets)', () => {
    const out = applyModelPointers(basePlan(), {});
    expect(fileByPath(out, '.claude/agents/ezk-dev.md').content).toContain('texte complet du rôle');
  });

  it('un agent réglé différemment du défaut devient un pointeur mince', () => {
    const out = applyModelPointers(basePlan(), { agents: { 'ezk-dev': { model: 'gpt-5' } } });
    const dev = fileByPath(out, '.claude/agents/ezk-dev.md');
    // Le rôle n'est PAS recopié.
    expect(dev.content).not.toContain('texte complet du rôle');
    // Le pointeur porte le modèle réglé + l'effort, et charge depuis la source.
    const parsed = matter(dev.content);
    expect(parsed.data).toMatchObject({ name: 'ezk-dev', model: 'gpt-5', effort: 'medium' });
    expect(parsed.content).toContain('pas recopié');
    expect(parsed.content).toContain('~/.claude/agents/ezk-dev.md');
  });

  it('les agents au défaut gardent leur rôle complet', () => {
    const out = applyModelPointers(basePlan(), { agents: { 'ezk-dev': { model: 'gpt-5' } } });
    // ezk-architect n'est pas réglé → rôle complet préservé.
    expect(fileByPath(out, '.claude/agents/ezk-architect.md').content).toContain('texte complet du rôle');
  });

  it('la soupape modeles d’un tier pointe les agents de ce tier', () => {
    const out = applyModelPointers(basePlan(), { modeles: { high: { model: 'Opus 5.5', effort: 'high' } } });
    const arch = fileByPath(out, '.claude/agents/ezk-architect.md');
    expect(arch.content).not.toContain('texte complet du rôle');
    expect(matter(arch.content).data.model).toBe('Opus 5.5');
    // ezk-dev (middle) reste complet.
    expect(fileByPath(out, '.claude/agents/ezk-dev.md').content).toContain('texte complet du rôle');
  });

  it('revenir au défaut retire le pointeur (le rôle complet revient)', () => {
    // Un override, puis plus d'override (unset) : le fichier redevient le rôle complet.
    const overridden = applyModelPointers(basePlan(), { agents: { 'ezk-dev': { model: 'gpt-5' } } });
    expect(fileByPath(overridden, '.claude/agents/ezk-dev.md').content).not.toContain('texte complet');
    const reverted = applyModelPointers(basePlan(), {});
    expect(fileByPath(reverted, '.claude/agents/ezk-dev.md').content).toContain('texte complet du rôle');
  });

  it('le pointeur SURCOUCHE : préserve isolation et model_spare, n’écrase que model/effort', () => {
    const plan: WritePlan = {
      files: [
        {
          path: '.claude/agents/ezk-dev.md',
          content:
            '---\nname: ezk-dev\nmodel: sonnet\nmodel_spare: haiku\neffort: medium\nisolation: worktree\n---\nRÔLE DEV — texte complet du rôle',
          intent: 'replace',
        },
      ],
      hooks: [],
    };
    const out = applyModelPointers(plan, { agents: { 'ezk-dev': { model: 'gpt-5' } } });
    const parsed = matter(fileByPath(out, '.claude/agents/ezk-dev.md').content);
    // isolation et model_spare survivent ; seul model (et effort) change.
    expect(parsed.data).toMatchObject({
      name: 'ezk-dev',
      model: 'gpt-5',
      effort: 'medium',
      model_spare: 'haiku',
      isolation: 'worktree',
    });
    expect(parsed.content).not.toContain('texte complet du rôle');
  });

  it('ne touche pas aux fichiers non-agents', () => {
    const out = applyModelPointers(basePlan(), { agents: { 'ezk-dev': { model: 'gpt-5' } } });
    expect(fileByPath(out, 'CLAUDE.md').content).toBe('> lire la loi');
  });

  it('une entrée de config fautive ne fait pas tomber les autres pointeurs', () => {
    // ezk-dev a un effort invalide (jette) ; ezk-architect (high) a une soupape valide.
    const config = {
      agents: { 'ezk-dev': { effort: 'max' } }, // effort invalide → ezk-dev jette
      modeles: { high: { model: 'Opus 5.5', effort: 'high' } },
    } as unknown as ModelConfig;
    const out = applyModelPointers(basePlan(), config);
    // L'agent fautif garde son rôle complet…
    expect(fileByPath(out, '.claude/agents/ezk-dev.md').content).toContain('texte complet du rôle');
    // …mais ezk-architect reçoit quand même son pointeur (pas de panne globale).
    const arch = fileByPath(out, '.claude/agents/ezk-architect.md');
    expect(arch.content).not.toContain('texte complet du rôle');
    expect(matter(arch.content).data.model).toBe('Opus 5.5');
  });
});
