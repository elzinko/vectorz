import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Scénario 4 (0176) — smoke : zéro écriture d'identité via `git config … --global … user.*`
 * dans les sources / skills / workflows du monorepo.
 *
 * AUTORISÉ : `git config user.*` sans `--global` (scope local/worktree) ;
 *            `git -c user.*` / `GIT_AUTHOR_*` one-shot.
 * Contre-exemples documentés (❌ / INTERDIT) dans les skills : allowlistés.
 */

const ROOT = join(__dirname, '..', '..');

const SCAN_DIRS = [
  join(ROOT, 'products'),
  join(ROOT, 'scripts'),
  join(ROOT, 'tools'),
  join(ROOT, '.github', 'workflows'),
];

const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.git']);

/** Ligne qui configure user.name|email avec flag CLI --global (flags intercalés OK). */
function lineLooksForbidden(line: string): boolean {
  if (!/\bgit\s+config\b/.test(line)) return false;
  if (!/\buser\.(name|email)\b/.test(line)) return false;
  // Ignorer la prose « sans --global » / « without --global ».
  const stripped = line
    .replace(/sans\s+`?--global`?/gi, '')
    .replace(/without\s+`?--global`?/gi, '');
  return /\s--global\b/.test(stripped) || /`?--global`?\s+user\./.test(stripped);
}

/** Contre-exemple documenté (ban) — pas une instruction à exécuter. */
function isDocumentedBanExample(line: string, nearbyContext: string): boolean {
  if (/❌|INTERDIT/.test(line)) return true;
  return /❌|INTERDIT/.test(nearbyContext);
}

function collectFiles(dir: string, acc: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry) || entry.startsWith('.')) continue;
    const p = join(dir, entry);
    let stat: ReturnType<typeof statSync>;
    try {
      stat = statSync(p);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      collectFiles(p, acc);
    } else if (!/\.test\.(ts|tsx|js|mjs)$/.test(entry) && !/\.spec\.(ts|tsx|js|mjs)$/.test(entry)) {
      acc.push(p);
    }
  }
  return acc;
}

interface Offender {
  file: string;
  line: number;
  content: string;
}

function scanDirs(dirs: string[], root = ROOT): { files: string[]; offenders: Offender[] } {
  const files: string[] = [];
  const offenders: Offender[] = [];
  for (const dir of dirs) {
    for (const filePath of collectFiles(dir)) {
      files.push(filePath);
      let content: string;
      try {
        content = readFileSync(filePath, 'utf8');
      } catch {
        continue;
      }
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!lineLooksForbidden(line)) continue;
        const nearby = lines.slice(Math.max(0, i - 4), i + 1).join('\n');
        if (isDocumentedBanExample(line, nearby)) continue;
        offenders.push({
          file: relative(root, filePath).replaceAll('\\', '/'),
          line: i + 1,
          content: line.trim(),
        });
      }
    }
  }
  return { files, offenders };
}

describe('0176 — git config --global user.* est interdit dans les sources', () => {
  it('détecte le pattern même avec flags intercalés ou --global après user.*', () => {
    expect(lineLooksForbidden('git config --global user.email "x"')).toBe(true);
    expect(lineLooksForbidden('git config --global --replace-all user.email "x"')).toBe(true);
    expect(lineLooksForbidden('git config user.email --global "x"')).toBe(true);
    expect(lineLooksForbidden('git config user.email "x"')).toBe(false);
    expect(lineLooksForbidden('git config --global core.hooksPath .githooks')).toBe(false);
    expect(
      lineLooksForbidden(
        '| Local | `git config user.name "cop1 CI"` *(sans `--global`)* dans worktree |',
      ),
    ).toBe(false);
  });

  it('allowliste les contre-exemples documentés (❌ / INTERDIT)', () => {
    const nearby = '# ❌ INTERDIT\ngit config --global user.name "..."';
    expect(isDocumentedBanExample('git config --global user.name "..."', nearby)).toBe(true);
    expect(
      isDocumentedBanExample('git config --global user.name "bot"', 'juste une commande'),
    ).toBe(false);
  });

  it('scanne au moins products/ + workflows/ (garde-fou anti scan vide)', () => {
    const { files } = scanDirs(SCAN_DIRS);
    expect(files.length).toBeGreaterThan(50);
    expect(files.some((f) => relative(ROOT, f).replaceAll('\\', '/').startsWith('products/'))).toBe(
      true,
    );
    expect(
      files.some((f) => relative(ROOT, f).replaceAll('\\', '/').startsWith('.github/workflows/')),
    ).toBe(true);
  });

  it('aucun fichier source/skill/workflow ne contient le pattern (hors ban documenté)', () => {
    const { offenders } = scanDirs(SCAN_DIRS);
    const message = offenders.map((o) => `  ${o.file}:${o.line}  →  ${o.content}`).join('\n');
    expect(offenders, `Occurrences interdites trouvées :\n${message}`).toEqual([]);
  });

  it('échoue si un offender réel est injecté (test négatif)', () => {
    const tmp = mkdtempSync(join(tmpdir(), '0176-bad-'));
    const bad = join(tmp, 'evil.sh');
    writeFileSync(bad, '#!/bin/sh\ngit config --global user.email "ci@cop1.local"\n');
    try {
      const { offenders } = scanDirs([tmp], tmp);
      expect(offenders.length).toBeGreaterThan(0);
      expect(offenders[0].content).toMatch(/--global/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
