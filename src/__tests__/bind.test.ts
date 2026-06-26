import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { bind } from '../core/bind.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

describe('bind(mobile, …, claude-code) — plan bout-en-bout', () => {
  it('produit un plan cohérent depuis les données réelles', () => {
    const plan = bind('mobile', '/tmp/projet', 'claude-code', repoRoot);
    const paths = plan.files.map((f) => f.path);

    expect(paths).toContain('.claude/agents/ezk-reviewer.md');
    expect(paths).toContain('.iamthelaw/ENTRY.md');
    expect(paths).toContain('CLAUDE.md');
    // aucune skill matérialisée (ezk-commits externe)
    expect(paths.some((p) => p.startsWith('.claude/skills/'))).toBe(false);
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
