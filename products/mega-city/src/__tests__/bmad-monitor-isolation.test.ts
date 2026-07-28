/**
 * Isolation BMAD (ADR-029 / programme refonte P6) : le chemin moniteur
 * (supervision) ne doit jamais référencer `_bmad` / `_bmad-output`.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const supervisionRoot = resolveSupervisionRoot(here);

function resolveSupervisionRoot(from: string): string {
  // …/products/mega-city/src/__tests__ → …/products/mega-city/src/supervision
  return join(from, '../supervision');
}

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkTsFiles(p));
    else if (name.endsWith('.ts') && !name.endsWith('.test.ts')) out.push(p);
  }
  return out;
}

describe('moniteur BMAD-free (P6 isolation)', () => {
  it('aucun fichier src/supervision ne mentionne _bmad', () => {
    const hits: string[] = [];
    for (const file of walkTsFiles(supervisionRoot)) {
      const text = readFileSync(file, 'utf8');
      if (/_bmad/.test(text)) hits.push(file);
    }
    expect(hits, `références _bmad dans moniteur : ${hits.join(', ')}`).toEqual([]);
  });
});
