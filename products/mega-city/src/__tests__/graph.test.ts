import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * graph — le validateur croisé (src/core/graph.ts, synthèse PR #162).
 *
 * Deux filets :
 *   1. DÉTECTION — sur un catalogue synthétique PIÉGÉ (liens valides + cassés + externes),
 *      on prouve que le validateur attrape exactement les cassés, ignore les refs externes,
 *      et ne crie pas au loup sur les liens valides. Un « 0 cassé » sur le réel ne vaut que
 *      si ce filet passe.
 *   2. INVARIANT — sur le catalogue RÉEL du repo : aucun lien ne pointe dans le vide.
 *      Même esprit que composes-graph.test.ts : toute future arête cassée rougit la CI.
 */
import { describe, expect, it } from 'vitest';
import { EDGE_SOURCES, graphEdges, validateGraph } from '../core/graph.js';
import type { Agent, Bundle, Profile, Rule, Skill } from '../domain/model.js';
import type { Catalog } from '../loaders/catalog.js';
import { loadCatalog } from '../loaders/catalog.js';

const index = <T extends { id: string }>(items: T[]): Map<string, T> =>
  new Map(items.map((x) => [x.id, x]));

/** Catalogue synthétique : chaque type de lien a une cible VALIDE et une cible FANTÔME. */
function trapCatalog(): Catalog {
  const skills: Skill[] = [
    // composes : 'b' existe, 'ghost-skill' non → 1 cassé.  composesExternal : jamais compté.
    { id: 'a', content: '', composes: ['b', 'ghost-skill'], composesExternal: ['skill-creator'] },
    // roles : 'reviewer' existe, 'ghost-agent' non → 1 cassé.
    { id: 'b', content: '', roles: ['reviewer', 'ghost-agent'] },
    { id: 'lonely', content: '' }, // que rien ne cite → orphelin (info)
  ];
  const agents: Agent[] = [
    { id: 'reviewer', role: '', competences: ['a'], interactions: ['clean/x'] },
  ];
  const rules: Rule[] = [
    {
      id: 'clean/x',
      kind: 'disposition',
      level: 'MUST',
      content: '',
      enforcements: [{ type: 'agent-check', agent: 'reviewer' }],
    },
    // participants : 'reviewer' existe, 'ghost-agent3' non → 1 cassé.
    {
      id: 'proto/y',
      kind: 'interaction',
      level: 'SHOULD',
      content: '',
      participants: ['reviewer', 'ghost-agent3'],
    },
  ];
  const bundles: Bundle[] = [
    { id: 'base', rules: ['clean/x'] },
    // bundle-rule : 'ghost-rule' n'existe pas → 1 cassé.
    { id: 'ext', extends: ['base'], rules: ['ghost-rule'] },
  ];
  const profiles: Profile[] = [
    { id: 'p', bundles: ['base'], agents: ['reviewer'], skills: ['a'], interactions: ['proto/y'] },
  ];
  return {
    rules: index(rules),
    agents: index(agents),
    skills: index(skills),
    bundles: index(bundles),
    profiles: index(profiles),
  };
}

describe('validateGraph — détection des liens cassés', () => {
  const report = validateGraph(trapCatalog());
  const brokenSet = new Set(report.broken.map((e) => `${e.link} ${e.from} ${e.to}`));

  it('attrape exactement les quatre cibles fantômes', () => {
    expect(report.broken).toHaveLength(4);
    expect(brokenSet.has('composes a ghost-skill')).toBe(true);
    expect(brokenSet.has('roles b ghost-agent')).toBe(true);
    expect(brokenSet.has('participants proto/y ghost-agent3')).toBe(true);
    expect(brokenSet.has('bundle-rule ext ghost-rule')).toBe(true);
  });

  it('ne signale AUCUN lien valide comme cassé', () => {
    expect(brokenSet.has('composes a b')).toBe(false); // 'b' existe
    expect(brokenSet.has('competences reviewer a')).toBe(false); // 'a' existe
    expect(brokenSet.has('enforces clean/x reviewer')).toBe(false); // 'reviewer' existe
    expect(brokenSet.has('profile-bundle p base')).toBe(false); // 'base' existe
  });

  it('ignore les refs externes (composesExternal) — hors catalogue, jamais cassées', () => {
    expect([...brokenSet].some((k) => k.includes('skill-creator'))).toBe(false);
    expect(report.broken.some((e) => e.to === 'skill-creator')).toBe(false);
  });

  it('compte les nœuds et remonte les orphelins (info)', () => {
    expect(report.nodeCount).toEqual({ rule: 2, agent: 1, skill: 3, bundle: 2, profile: 1 });
    const orphans = new Set(report.orphans.map((o) => `${o.kind}:${o.id}`));
    expect(orphans.has('skill:lonely')).toBe(true); // rien ne le cite
    expect(orphans.has('profile:p')).toBe(true); // un profil est racine → orphelin par nature
    expect(orphans.has('skill:a')).toBe(false); // cité par competences/profile-skill
  });

  it('les arêtes sont dédupliquées et triées stablement (déterminisme)', () => {
    const twice = graphEdges(trapCatalog());
    expect(graphEdges(trapCatalog())).toEqual(twice); // reproductible
    const keys = twice.map((e) => `${e.link} ${e.from} ${e.to}`);
    expect([...keys].sort()).toEqual(keys); // déjà trié
    expect(new Set(keys).size).toBe(keys.length); // aucun doublon
  });

  it('les treize types de lien du vocabulaire réuni sont couverts par la table', () => {
    expect(new Set(EDGE_SOURCES.map((s) => s.link)).size).toBe(EDGE_SOURCES.length);
    expect(EDGE_SOURCES.length).toBe(13);
  });
});

describe('validateGraph — invariant sur le catalogue réel (fiche « câbler la méthode »)', () => {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..'); // products/mega-city

  it('aucun lien de la méthode ne pointe dans le vide', () => {
    const report = validateGraph(loadCatalog(repoRoot));
    const shown = report.broken.map((e) => `${e.from} --(${e.link})--> ${e.to}`).join('\n');
    expect(report.broken, `liens cassés :\n${shown}`).toHaveLength(0);
  });
});
