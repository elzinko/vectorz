import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { bind } from '../core/bind.js';
import { loadCatalog } from '../loaders/catalog.js';
import { expandProfile } from '../core/expand.js';
import { capFor } from '../caps/registry.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

describe('bind(mobile, …, claude-code) — plan bout-en-bout', () => {
  it('produit un plan cohérent depuis les données réelles', () => {
    const plan = bind('mobile', '/tmp/projet', 'claude-code', repoRoot);
    const paths = plan.files.map((f) => f.path);

    expect(paths).toContain('.claude/agents/ezk-reviewer.md');
    expect(paths).toContain('.iamthelaw/ENTRY.md');
    expect(paths).toContain('CLAUDE.md');
    // ezk-commits migré (fiche 0004) → matérialisé comme skill bindable
    expect(paths).toContain('.claude/skills/ezk-commits.md');
    // un hook commit-msg (conventional-commits/format est type:hook)
    expect(plan.hooks.map((h) => h.stage)).toEqual(['commit-msg']);
  });

  it('est 100 % déterministe : deux bind successifs donnent un plan identique', () => {
    const a = bind('mobile', '/tmp/projet', 'claude-code', repoRoot);
    const b = bind('mobile', '/tmp/projet', 'claude-code', repoRoot);
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('échoue clairement pour un profil inconnu', () => {
    expect(() => bind('does-not-exist', '/tmp/projet', 'claude-code', repoRoot)).toThrow(
      /profil/i,
    );
  });

  it('échoue clairement pour un hôte inconnu', () => {
    expect(() => bind('mobile', '/tmp/projet', 'unknown-host', repoRoot)).toThrow(/hôte/i);
  });
});

describe('bind — 3 hooks migrés depuis iamthelaw (fiche 0006/0011)', () => {
  function materializeMigrated() {
    const catalog = loadCatalog(repoRoot);
    const profile = {
      id: 'iamthelaw-hooks',
      bundles: ['conventional-commits', 'ci-cd', 'typescript-2026'],
      agents: [],
      skills: [],
    };
    const resolved = expandProfile(profile, catalog);
    return capFor('claude-code').materialize(resolved, '/tmp/projet');
  }

  it('émet les 3 hooks (commit-msg, pre-push, pre-commit) avec le contenu du script migré', () => {
    const plan = materializeMigrated();
    const stages = plan.hooks.map((h) => h.stage).sort();
    expect(stages).toEqual(['commit-msg', 'pre-commit', 'pre-push']);
    // chaque script est le CONTENU réel migré (hooks/*.sh), pas un chemin ni le hardcode générique
    for (const hook of plan.hooks) {
      expect(hook.script).toContain('#!/usr/bin/env bash');
      expect(hook.script).not.toMatch(/^hooks\//);
    }
  });

  it('est déterministe (byte-for-byte) — AC fiche 0006', () => {
    const a = materializeMigrated();
    const b = materializeMigrated();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
