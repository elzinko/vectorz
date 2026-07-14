import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Garde-fou de séparabilité ADR-027 §5 / ADR-021 : zéro import croisé entre produits,
// dans les DEUX sens. Scan sans dépendance (repli « test vitest maison » de l'ADR ;
// upgrade dependency-cruiser possible plus tard).
const ROOT = join(__dirname, '..', '..');

function tsFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry.startsWith('.')) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) tsFiles(p, acc);
    else if (/\.(ts|tsx|mts|js|mjs)$/.test(entry)) acc.push(p);
  }
  return acc;
}

const importsOf = (file: string): string[] =>
  [
    ...readFileSync(file, 'utf8').matchAll(
      /(?:from\s+|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/g,
    ),
  ].map((m) => m[1]);

describe('frontière produits (Vectorz umbrella)', () => {
  it('cop1 n’importe jamais mega-city', () => {
    const offenders = tsFiles(join(ROOT, 'products', 'cop1'))
      .flatMap((f) => importsOf(f).map((s) => ({ f, s })))
      .filter(({ s }) => s.includes('mega-city') || s.includes('products/mega-city'));
    expect(offenders).toEqual([]);
  });

  it('mega-city n’importe jamais cop1 (@cop1/* ou chemins produits)', () => {
    const offenders = tsFiles(join(ROOT, 'products', 'mega-city'))
      .flatMap((f) => importsOf(f).map((s) => ({ f, s })))
      .filter(({ s }) => s.startsWith('@cop1/') || s.includes('products/cop1'));
    expect(offenders).toEqual([]);
  });
});
