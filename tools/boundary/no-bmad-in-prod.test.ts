import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ADR-029 E4 gate — zéro référence `bmad` dans le graphe de prod cop1,
 * hors features survivantes explicitement allowlistées (2058 / bmad-bridge).
 */
const ROOT = join(__dirname, '..', '..');
const COP1_SRC = join(ROOT, 'products', 'cop1', 'packages');

const ALLOWLIST_SUBSTRINGS = [
  'features/bmad-bridge/',
  'cli/commands/init-bmad-bridge.ts',
  'cli/epoch2-method.ts',
  'cli/index.ts',
  'shared-kernel/src/features/config/domain/Cop1Config.ts',
  'app/src/features/config/domain/ConfigSchema.ts',
  'web/src/App.tsx',
  'web/src/App.test.tsx',
  'cli/commands/transcript.ts',
  'cli/commands/orchestrator.ts',
  'cli/commands/sprint-run.ts',
  'cli/commands/sprint-status.ts',
];

function tsProdFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry.startsWith('.')) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (entry === '__tests__') continue;
      tsProdFiles(p, acc);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry) || /\.test\.(ts|tsx)$/.test(entry)) continue;
    acc.push(p);
  }
  return acc;
}

function isAllowlisted(filePath: string): boolean {
  const rel = relative(ROOT, filePath).replaceAll('\\', '/');
  return ALLOWLIST_SUBSTRINGS.some((fragment) => rel.includes(fragment));
}

describe('cop1 prod graph — zero bmad (ADR-029 E4)', () => {
  it('has no unallowlisted bmad references under packages/*/src', () => {
    const offenders: string[] = [];

    for (const pkg of readdirSync(COP1_SRC)) {
      const srcRoot = join(COP1_SRC, pkg, 'src');
      try {
        statSync(srcRoot);
      } catch {
        continue;
      }
      for (const file of tsProdFiles(srcRoot)) {
        if (isAllowlisted(file)) continue;
        const content = readFileSync(file, 'utf8');
        if (/bmad/i.test(content)) {
          offenders.push(relative(ROOT, file).replaceAll('\\', '/'));
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
