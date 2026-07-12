import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadCatalog } from '../loaders/catalog.js';
import { expandProfile } from '../core/expand.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

function expandMobile() {
  const catalog = loadCatalog(repoRoot);
  const mobile = catalog.profiles.get('mobile');
  if (!mobile) throw new Error('profil mobile introuvable');
  return expandProfile(mobile, catalog);
}

describe('expandProfile(mobile)', () => {
  it('résout les bundles (mobile → base) en règles, triées stablement par id', () => {
    const resolved = expandMobile();
    expect(resolved.rules.map((r) => r.id)).toEqual([
      'clean-code/no-dead-code',
      'conventional-commits/format',
    ]);
  });

  it('agrège les agents du profil', () => {
    const resolved = expandMobile();
    expect(resolved.agents.map((a) => a.id)).toEqual(['ezk-reviewer']);
  });

  it('agrège les skills du profil depuis les sous-dossiers (ezk-commits migré, fiche 0004)', () => {
    const resolved = expandMobile();
    expect(resolved.skills.map((s) => s.id)).toContain('ezk-commits');
  });

  it('déduplique par id même si une règle est référencée via plusieurs chemins', () => {
    const catalog = loadCatalog(repoRoot);
    const profile = {
      id: 'dup',
      bundles: ['base', 'mobile'], // mobile extends base → base vu 2x
      agents: ['ezk-reviewer', 'ezk-reviewer'],
      skills: [],
    };
    const resolved = expandProfile(profile, catalog);
    expect(resolved.rules.map((r) => r.id)).toEqual([
      'clean-code/no-dead-code',
      'conventional-commits/format',
    ]);
    expect(resolved.agents.map((a) => a.id)).toEqual(['ezk-reviewer']);
  });

  it('est déterministe : deux expansions donnent un résultat identique', () => {
    expect(expandMobile()).toEqual(expandMobile());
  });
});

function expandGlobal() {
  const catalog = loadCatalog(repoRoot);
  const global = catalog.profiles.get('global');
  if (!global) throw new Error('profil global introuvable');
  return expandProfile(global, catalog);
}

describe('expandProfile(global) — l\'équipe complète du bind daily-driver (fiche 0024)', () => {
  it('agrège TOUS les agents ezk-* (6), triés stablement', () => {
    const resolved = expandGlobal();
    expect(resolved.agents.map((a) => a.id)).toEqual([
      'ezk-architect',
      'ezk-pm',
      'ezk-qa',
      'ezk-reviewer',
      'ezk-steward',
      'ezk-tdd',
    ]);
  });

  it('agrège TOUT le catalogue de skills ezk-* (13), triés stablement', () => {
    const resolved = expandGlobal();
    expect(resolved.skills.map((s) => s.id)).toEqual([
      'ezk-apk',
      'ezk-archive',
      'ezk-backlog',
      'ezk-ci',
      'ezk-commits',
      'ezk-design-system',
      'ezk-device',
      'ezk-ezk',
      'ezk-npm-scripts',
      'ezk-pr-pilot',
      'ezk-preview',
      'ezk-product-builder',
      'ezk-sprint',
    ]);
  });

  it('n\'altère pas base : le socle reste minimal (mobile reste curated)', () => {
    const catalog = loadCatalog(repoRoot);
    const base = catalog.profiles.get('base');
    if (!base) throw new Error('profil base introuvable');
    const resolved = expandProfile(base, catalog);
    expect(resolved.agents.map((a) => a.id)).toEqual([]);
    expect(resolved.skills.map((s) => s.id)).toEqual(['ezk-archive']);
  });
});

const MIGRATED_BUNDLES = [
  'architecture',
  'ci-cd',
  'clean-code',
  'conventional-commits',
  'development',
  'documentation-guidelines',
  'hexagonal',
  'testing',
  'token-economy',
  'typescript-2026',
];

describe('expandProfile — 10 bundles migrés depuis iamthelaw (fiche 0006)', () => {
  it('charge les 10 bundles sans erreur et résout les 54 règles (53 iamthelaw + no-dead-code)', () => {
    const catalog = loadCatalog(repoRoot);
    const profile = { id: 'iamthelaw-full', bundles: MIGRATED_BUNDLES, agents: [], skills: [] };
    const resolved = expandProfile(profile, catalog);
    expect(resolved.rules).toHaveLength(54);
    // pas de doublon d'id malgré 10 bundles distincts
    expect(new Set(resolved.rules.map((r) => r.id)).size).toBe(54);
  });
});
