import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadCatalog } from '../loaders/catalog.js';
import { appliedRuleIds, expandProfile } from '../core/expand.js';
import type { Bundle } from '../domain/model.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

function expandMobile() {
  const catalog = loadCatalog(repoRoot);
  const mobile = catalog.profiles.get('mobile');
  if (!mobile) throw new Error('profil mobile introuvable');
  return expandProfile(mobile, catalog);
}

describe('appliedRuleIds — un consommateur déplie un bundle cité en ses ids de règles (fiche 20261008154803440)', () => {
  const bundles = new Map<string, Bundle>([
    ['devpack', { id: 'devpack', rules: ['clean/y', 'clean/x'] }],
    ['meta', { id: 'meta', extends: ['devpack'], rules: ['doc/z'] }],
  ]);

  it('déplie un id de bundle en ses règles (par référence : des ids, pas du texte)', () => {
    expect(appliedRuleIds(['devpack'], bundles)).toEqual(['clean/x', 'clean/y']);
  });

  it('garde un id de règle tel quel, et mélange règles + bundle en dédupliquant et triant', () => {
    expect(appliedRuleIds(['clean/z', 'devpack', 'clean/x'], bundles)).toEqual([
      'clean/x',
      'clean/y',
      'clean/z',
    ]);
  });

  it('suit `extends` du bundle (meta → devpack)', () => {
    expect(appliedRuleIds(['meta'], bundles)).toEqual(['clean/x', 'clean/y', 'doc/z']);
  });

  it('ne renvoie que des ids (string), jamais un objet Rule — « par référence »', () => {
    for (const id of appliedRuleIds(['devpack'], bundles)) expect(typeof id).toBe('string');
  });

  it('un id inconnu (ni bundle) est laissé tel quel — le graphe tranche le pendouillant, pas ce pur', () => {
    expect(appliedRuleIds(['inconnu'], bundles)).toEqual(['inconnu']);
  });
});

describe('expandProfile(mobile)', () => {
  it('résout les bundles (mobile → base) en règles, triées stablement par id', () => {
    const resolved = expandMobile();
    expect(resolved.rules.map((r) => r.id)).toEqual([
      'agent-ops/preuve-mince-question-pas-veto',
      'agent-ops/verify-access-before-asking',
      'clean-code/no-dead-code',
      'conventional-commits/format',
      'development/pr-before-after-media',
      'documentation-guidelines/human-facing-lisibility',
      'documentation-guidelines/next-step-affordance',
      'documentation-guidelines/readable-deliverable-trio',
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
      'agent-ops/preuve-mince-question-pas-veto',
      'agent-ops/verify-access-before-asking',
      'clean-code/no-dead-code',
      'conventional-commits/format',
      'development/pr-before-after-media',
      'documentation-guidelines/human-facing-lisibility',
      'documentation-guidelines/next-step-affordance',
      'documentation-guidelines/readable-deliverable-trio',
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
  it('agrège TOUS les agents ezk-* (8, dont ezk-archive et ezk-chef), triés stablement', () => {
    const resolved = expandGlobal();
    expect(resolved.agents.map((a) => a.id)).toEqual([
      'ezk-architect',
      'ezk-archive',
      'ezk-chef',
      'ezk-dev',
      'ezk-pm',
      'ezk-qa',
      'ezk-reviewer',
      'ezk-steward',
    ]);
  });

  it('agrège TOUT le catalogue de skills ezk-* (22), triés stablement', () => {
    const resolved = expandGlobal();
    expect(resolved.skills.map((s) => s.id)).toEqual([
      'ezk-apk',
      'ezk-archive',
      'ezk-article',
      'ezk-backlog',
      'ezk-bug',
      'ezk-chef',
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
      'ezk-release',
      'ezk-retro',
      'ezk-scout',
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
  it('charge les 8 bundles sans erreur et résout 64 règles distinctes (48 + 5 le 2026-09-05 + 2 le 2026-09-20 + 1 le 2026-10-01 + 2 le 2026-10-03 + 2 le 2026-10-04 + 4 le 2026-10-10)', () => {
    const catalog = loadCatalog(repoRoot);
    const profile = { id: 'iamthelaw-full', bundles: MIGRATED_BUNDLES, agents: [], skills: [] };
    const resolved = expandProfile(profile, catalog);
    // +5 le 2026-09-05 : 4 règles development + 1 règle testing déposées par la rétro méthode
    // (run-freshness-origin-main, command-reproducibility, merge-when-absent-default,
    //  worktree-secondary-inline-harvest, manual-validation-camera-gesture).
    // +2 le 2026-09-20 : rétro `reconcile` → development/fiche-read-via-loader +
    //  development/active-views-exclude-terminal-status.
    // +1 le 2026-10-01 : token-economy/agent-call-budget (ADR-0060, fiche 20260920213500176).
    // +1 le 2026-10-03 : rétro session du 2026-10-02 → development/acceptance-criteria-before-merge.
    // +1 le 2026-10-03 : rétro itération V0.5 → token-economy/retro-due-choix-chiffre.
    // +1 le 2026-10-04 : rétro légère de fin de V0.5 → development/host-project-proof-before-ship.
    // +1 le 2026-10-04 : rétro légère du run cockpit V0.6 → token-economy/fiche-tient-dans-un-sprint.
    // +4 le 2026-10-10 : rétro « vue process » → clean-code/no-silent-mutation,
    //  testing/capped-list-filter-scenario, testing/confinement-contract-at-boundary,
    //  development/one-story-one-commit-local.
    // +4 le 2026-10-19 : rétro « run qui parke au lieu de tenter » → development/tenter-avant-de-parker,
    //  development/machine-ne-tranche-pas-version-ni-depark, development/decision-informee-au-depart,
    //  development/tenter-decoupage-et-local-avant-ecarter.
    // NB : agent-ops/preuve-mince-question-pas-veto (2026-10-28) vit dans `base`, PAS dans ces 8
    //  bundles de catégorie — le socle reste à l'écart de ce décompte (cf. mobile/base plus haut).
    expect(resolved.rules).toHaveLength(68);
    // pas de doublon d'id malgré 8 bundles distincts
    expect(new Set(resolved.rules.map((r) => r.id)).size).toBe(68);
  });
});
