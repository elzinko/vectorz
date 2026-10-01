/**
 * Le profil `global` se dit « exhaustif : tout le toolbox ezk-* » (fiche 20260903134909124).
 * Cas réel : `ezk-bug` et `ezk-chef` n'étaient dans AUCUN profil, donc jamais installés. Ce test
 * garde la promesse : tout skill et tout agent `ezk-*` du catalogue est dans le profil `global`.
 * (Le `doctor` dit ce qui est déclaré mais pas installé ; ce test dit ce qui n'est pas déclaré.)
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { expandProfile } from '../core/expand.js';
import { loadCatalog } from '../loaders/catalog.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const catalog = loadCatalog(repoRoot);
const global = catalog.profiles.get('global');
const resolved = global ? expandProfile(global, catalog) : undefined;

describe('profil global — exhaustif sur la famille ezk-*', () => {
  it('existe', () => {
    expect(global).toBeDefined();
  });

  it('porte tous les skills ezk-* du catalogue', () => {
    const declared = new Set(resolved?.skills.map((s) => s.id));
    const missing = [...catalog.skills.keys()].filter((id) => id.startsWith('ezk-') && !declared.has(id));
    expect(missing, `skills ezk-* absents du profil global : ${missing.join(', ')}`).toEqual([]);
  });

  it('porte tous les agents du catalogue', () => {
    const declared = new Set(resolved?.agents.map((a) => a.id));
    const missing = [...catalog.agents.keys()].filter((id) => !declared.has(id));
    expect(missing, `agents absents du profil global : ${missing.join(', ')}`).toEqual([]);
  });
});
