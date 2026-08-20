/**
 * checkComposition — ADR-0025 : la doctrine « compose, ne réinvente pas » vivait
 * en prose seule ; `expand`/`resolve` ignorait silencieusement les refs absentes.
 * Ce checker PUR détecte les trous, transitivement, sans jamais warner les refs
 * externes documentées (`composesExternal`).
 */
import { describe, expect, it } from 'vitest';
import { checkComposition, checkRoles } from '../core/composition.js';
import type { ResolvedProfile, Skill } from '../domain/model.js';
import type { Catalog } from '../loaders/catalog.js';

function skill(id: string, composes?: string[], composesExternal?: string[]): Skill {
  return {
    id,
    content: `# ${id}`,
    ...(composes ? { composes } : {}),
    ...(composesExternal ? { composesExternal } : {}),
  };
}

function catalogOf(skills: Skill[]): Catalog {
  return {
    rules: new Map(),
    agents: new Map(),
    skills: new Map(skills.map((s) => [s.id, s])),
    bundles: new Map(),
    profiles: new Map(),
  };
}

function resolvedOf(skills: Skill[]): ResolvedProfile {
  return { rules: [], agents: [], skills };
}

describe('checkComposition', () => {
  it('critère 1 : signale une dépendance composée absente du profil résolu', () => {
    const a = skill('A', ['B']);
    const catalog = catalogOf([a]); // B absent du catalogue ET du profil
    const resolved = resolvedOf([a]);
    expect(checkComposition(resolved, catalog)).toEqual([{ from: 'A', missing: 'B' }]);
  });

  it('critère 1 (transitif) : A→B présents, B→C absent → warning porté par B', () => {
    const a = skill('A', ['B']);
    const b = skill('B', ['C']);
    const catalog = catalogOf([a, b]); // C absent du catalogue ET du profil
    const resolved = resolvedOf([a, b]);
    expect(checkComposition(resolved, catalog)).toEqual([{ from: 'B', missing: 'C' }]);
  });

  it('critère 2 : composesExternal ne déclenche jamais de warning', () => {
    const a = skill('A', undefined, ['skill-creator', 'product-brainstorming']);
    const catalog = catalogOf([a]);
    const resolved = resolvedOf([a]);
    expect(checkComposition(resolved, catalog)).toEqual([]);
  });

  it('cas sain : toutes les dépendances composées sont présentes → []', () => {
    const a = skill('A', ['B']);
    const b = skill('B');
    const catalog = catalogOf([a, b]);
    const resolved = resolvedOf([a, b]);
    expect(checkComposition(resolved, catalog)).toEqual([]);
  });

  it('déduplique et trie stablement par (from, missing)', () => {
    const a = skill('A', ['B', 'B']);
    const c = skill('C', ['B']);
    const catalog = catalogOf([a, c]);
    const resolved = resolvedOf([c, a]); // ordre inversé en entrée
    expect(checkComposition(resolved, catalog)).toEqual([
      { from: 'A', missing: 'B' },
      { from: 'C', missing: 'B' },
    ]);
  });
});

/**
 * checkRoles — ADR-0020 (amendement 2026-08-20). `composes` relie skill → skill ;
 * `roles` relie un orchestrateur aux AGENTS qu'il convoque. C'était la relation
 * centrale du scrum — « le sprint convoque l'équipe » — et aucun champ ne la
 * portait : elle ne vivait qu'en prose, donc un profil pouvait binder ezk-sprint
 * sans ses juges, en silence.
 */
describe('checkRoles', () => {
  const withRoles = (id: string, roles: string[]): Skill =>
    ({ id, content: `# ${id}`, roles }) as Skill;

  const agentOf = (id: string) =>
    ({ id, role: `# ${id}`, competences: [], interactions: [] }) as never;

  it('signale un agent convoqué mais absent du profil bindé', () => {
    const sprint = withRoles('ezk-sprint', ['ezk-qa', 'ezk-reviewer']);
    const catalog = catalogOf([sprint]);
    const resolved: ResolvedProfile = {
      rules: [],
      agents: [agentOf('ezk-qa')], // reviewer manquant
      skills: [sprint],
    };
    expect(checkRoles(resolved, catalog)).toEqual([
      { from: 'ezk-sprint', missing: 'ezk-reviewer' },
    ]);
  });

  it('ne signale rien quand tous les rôles convoqués sont présents', () => {
    const sprint = withRoles('ezk-sprint', ['ezk-qa']);
    const catalog = catalogOf([sprint]);
    const resolved: ResolvedProfile = {
      rules: [],
      agents: [agentOf('ezk-qa')],
      skills: [sprint],
    };
    expect(checkRoles(resolved, catalog)).toEqual([]);
  });

  it('un skill sans `roles` ne produit aucun warning (rétro-compatibilité)', () => {
    const s = skill('ezk-commits');
    expect(checkRoles(resolvedOf([s]), catalogOf([s]))).toEqual([]);
  });

  it('sortie triée et dédupliquée → déterministe (ADR-0003)', () => {
    const a = withRoles('b-skill', ['z-agent', 'a-agent']);
    const b = withRoles('a-skill', ['z-agent']);
    const catalog = catalogOf([a, b]);
    const resolved: ResolvedProfile = { rules: [], agents: [], skills: [a, b] };
    expect(checkRoles(resolved, catalog)).toEqual([
      { from: 'a-skill', missing: 'z-agent' },
      { from: 'b-skill', missing: 'a-agent' },
      { from: 'b-skill', missing: 'z-agent' },
    ]);
  });
});
