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
      'development/pr-before-after-media',
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
      'development/pr-before-after-media',
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
  it('agrège TOUS les agents ezk-* (7, dont ezk-archive), triés stablement', () => {
    const resolved = expandGlobal();
    expect(resolved.agents.map((a) => a.id)).toEqual([
      'ezk-architect',
      'ezk-archive',
      'ezk-dev',
      'ezk-pm',
      'ezk-qa',
      'ezk-reviewer',
      'ezk-steward',
    ]);
  });

  it('agrège TOUT le catalogue de skills ezk-* (20), triés stablement', () => {
    const resolved = expandGlobal();
    expect(resolved.skills.map((s) => s.id)).toEqual([
      'ezk-apk',
      'ezk-archive',
      'ezk-article',
      'ezk-backlog',
      'ezk-ci',
      'ezk-codex',
      'ezk-commits',
      'ezk-design-system',
      'ezk-device',
      'ezk-diagram',
      'ezk-docker',
      'ezk-ezk',
      'ezk-npm-scripts',
      'ezk-pr',
      'ezk-preview',
      'ezk-product-build',
      'ezk-readme',
      'ezk-retro',
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

// Ex-migration iamthelaw (fiche 0006) : 10 bundles à l'origine. Les 2 bundles miroirs
// orphelins `documentation-guidelines` et `hexagonal` (zéro profil consommateur) ont été
// supprimés le 2026-08-30 (fiche 20260823124042708) — leurs thèmes de règles restent, mais
// il n'existe plus de pack qui les regroupe. Restent 8 bundles réellement présents.
const MIGRATED_BUNDLES = [
  'architecture',
  'ci-cd',
  'clean-code',
  'conventional-commits',
  'development',
  'testing',
  'token-economy',
  'typescript-2026',
];

describe('expandProfile — 8 bundles migrés depuis iamthelaw (fiche 0006, -2 orphelins 2026-08-30)', () => {
  it('charge les 8 bundles sans erreur et résout 53 règles distinctes (48 + 5 règles rétro 2026-09-05)', () => {
    const catalog = loadCatalog(repoRoot);
    const profile = { id: 'iamthelaw-full', bundles: MIGRATED_BUNDLES, agents: [], skills: [] };
    const resolved = expandProfile(profile, catalog);
    // +5 le 2026-09-05 : 4 règles development + 1 règle testing déposées par la rétro méthode
    // (run-freshness-origin-main, command-reproducibility, merge-when-absent-default,
    //  worktree-secondary-inline-harvest, manual-validation-camera-gesture).
    expect(resolved.rules).toHaveLength(53);
    // pas de doublon d'id malgré 8 bundles distincts
    expect(new Set(resolved.rules.map((r) => r.id)).size).toBe(53);
  });
});
