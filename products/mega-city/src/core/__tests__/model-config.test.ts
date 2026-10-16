import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ROLES, resolveAgent, type Role } from '../model-config.js';

const here = dirname(fileURLToPath(import.meta.url));
const agentsDir = resolve(here, '..', '..', '..', 'agents'); // products/mega-city/agents

/** Lit `model` et `effort` du frontmatter d'un fichier d'agent. */
function agentFrontmatter(role: Role): { model: string; effort: string } {
  const text = readFileSync(join(agentsDir, `${role}.md`), 'utf8');
  const model = /^model:\s*(\S+)/m.exec(text)?.[1];
  const effort = /^effort:\s*(\S+)/m.exec(text)?.[1];
  if (!model || !effort) throw new Error(`frontmatter model/effort manquant pour ${role}`);
  return { model, effort };
}

describe('model-config — défauts = fichiers d’agents (fiche 242)', () => {
  it('sans réglage, chaque agent garde EXACTEMENT son modèle et son effort du fichier', () => {
    for (const role of ROLES) {
      const fm = agentFrontmatter(role);
      const r = resolveAgent({}, role);
      expect({ model: r.model, effort: r.effort }).toEqual(fm);
    }
  });

  it('les trois tiers couvrent bien les trois groupes de rôles', () => {
    // performant / standard / économe = exactement les réglages d'aujourd'hui.
    expect(resolveAgent({}, 'ezk-architect')).toMatchObject({ model: 'claude-opus-4-8', effort: 'high', tier: 'high', source: 'defaut' });
    expect(resolveAgent({}, 'ezk-dev')).toMatchObject({ model: 'sonnet', effort: 'medium', tier: 'middle', source: 'defaut' });
    expect(resolveAgent({}, 'ezk-steward')).toMatchObject({ model: 'sonnet', effort: 'low', tier: 'low', source: 'defaut' });
  });
});

describe('model-config — priorité et refus', () => {
  it('le tier du projet l’emporte sur le défaut du rôle', () => {
    const r = resolveAgent({ roles: { 'ezk-dev': 'high' } }, 'ezk-dev');
    expect(r).toMatchObject({ model: 'claude-opus-4-8', effort: 'high', tier: 'high', source: 'tier-projet' });
  });

  it('un réglage direct par agent l’emporte sur le tier', () => {
    const r = resolveAgent({ roles: { 'ezk-dev': 'low' }, agents: { 'ezk-dev': { model: 'gpt-5' } } }, 'ezk-dev');
    expect(r).toMatchObject({ model: 'gpt-5', source: 'agent' });
    // l'effort non imposé retombe sur la base du tier (low).
    expect(r.effort).toBe('low');
  });

  it('la soupape projet modeles surcharge le défaut (source = tier-projet)', () => {
    const r = resolveAgent({ modeles: { high: { model: 'GPT-5 Pro', effort: 'high' } } }, 'ezk-architect');
    expect(r).toMatchObject({ model: 'GPT-5 Pro', effort: 'high', source: 'tier-projet' });
  });

  it('refuse un effort inconnu venu de la soupape modeles', () => {
    expect(() => resolveAgent({ modeles: { high: { model: 'X', effort: 'ultra' as never } } }, 'ezk-architect')).toThrow(/ultra/);
  });

  it('refuse un réglage d’agent malformé (pas un objet)', () => {
    expect(() => resolveAgent({ agents: { 'ezk-dev': 'gpt-5' as never } }, 'ezk-dev')).toThrow(/malformé/);
  });

  it('refuse un agent inconnu en le nommant', () => {
    expect(() => resolveAgent({}, 'ezk-inconnu')).toThrow(/ezk-inconnu/);
  });

  it('refuse un tier inconnu en le nommant', () => {
    expect(() => resolveAgent({ roles: { 'ezk-dev': 'ultra' as never } }, 'ezk-dev')).toThrow(/ultra/);
  });

  it('refuse un effort inconnu en le nommant', () => {
    expect(() => resolveAgent({ agents: { 'ezk-dev': { effort: 'max' as never } } }, 'ezk-dev')).toThrow(/max/);
  });

  it('la soupape projet modeles « modèle seul » hérite l’effort du défaut du tier', () => {
    // Le CLI permet `modeles set <tier> <modèle>` sans effort : l’effort retombe
    // sur le défaut du tier (high → high), resolveAgent ne jette plus (bug v0.17).
    const r = resolveAgent({ modeles: { high: { model: 'GPT-5 Pro' } } }, 'ezk-architect');
    expect(r).toMatchObject({ model: 'GPT-5 Pro', effort: 'high', source: 'tier-projet' });
  });
});
