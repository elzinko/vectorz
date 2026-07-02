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
