import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Scénario 4 (0176) — smoke : zéro écriture d'identité via `git config … --global … user.*`
 * dans les sources / skills / workflows du monorepo.
 *
 * AUTORISÉ : `git -c user.*` / `GIT_AUTHOR_*` one-shot ; `git config --worktree`
 *            (avec extensions.worktreeConfig).
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

/** Joint les continuations shell `\` en une seule commande logique. */
function normalizeContinuedLines(content: string): string {
  return content.replace(/\\\r?\n/g, ' ');
}

/**
 * Détecte une config user.name|email avec flag CLI --global, y compris
 * `git -C … config --global user.email` et flags intercalés / ordre libre.
 */
function commandLooksForbidden(command: string): boolean {
  // Prose « sans --global » / « without --global ».
  const stripped = command
    .replace(/sans\s+`?--global`?/gi, '')
    .replace(/without\s+`?--global`?/gi, '');

  // `git` … `config` (tokens possibles entre les deux : -C path, -c …, etc.)
  if (!/\bgit\b[\s\S]{0,200}?\bconfig\b/.test(stripped)) return false;
  if (!/\buser\.(name|email)\b/.test(stripped)) return false;
  return /\s--global\b/.test(stripped) || /`?--global`?\s+user\./.test(stripped);
}

/** Contre-exemple documenté (ban) — pas une instruction à exécuter. */
function isDocumentedBanExample(fragment: string, nearbyContext: string): boolean {
  if (/❌|INTERDIT/.test(fragment)) return true;
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

/**
 * Scanne le contenu normalisé (continuations `\` jointes). Le numéro de ligne
 * pointe la 1ʳᵉ ligne physique de la région fautive (best-effort).
 */
function scanContent(content: string, relFile: string): Offender[] {
  const normalized = normalizeContinuedLines(content);
  const physical = content.split('\n');
  const logical = normalized.split('\n');
  const offenders: Offender[] = [];

  // Map logical line index → approximate physical line (1-based).
  // After joining `\`, logical has fewer lines; use a running offset.
  let physIdx = 0;
  for (let i = 0; i < logical.length; i++) {
    const line = logical[i];
    const startPhys = physIdx;
    // Advance physIdx by how many physical lines this logical line consumed.
    let remaining = line;
    while (physIdx < physical.length) {
      const phys = physical[physIdx].replace(/\\\s*$/, '');
      physIdx += 1;
      if (remaining.startsWith(phys)) {
        remaining = remaining.slice(phys.length).replace(/^\s+/, '');
        if (remaining.length === 0) break;
      } else {
        break;
      }
    }

    if (!commandLooksForbidden(line)) continue;
    const nearby = logical.slice(Math.max(0, i - 4), i + 1).join('\n');
    if (isDocumentedBanExample(line, nearby)) continue;
    offenders.push({
      file: relFile,
      line: startPhys + 1,
      content: line.trim().slice(0, 200),
    });
  }
  return offenders;
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
      const rel = relative(root, filePath).replaceAll('\\', '/');
      offenders.push(...scanContent(content, rel));
    }
  }
  return { files, offenders };
}

describe('0176 — git config --global user.* est interdit dans les sources', () => {
  it('détecte le pattern même avec flags intercalés, git -C, ou --global après user.*', () => {
    expect(commandLooksForbidden('git config --global user.email "x"')).toBe(true);
    expect(commandLooksForbidden('git config --global --replace-all user.email "x"')).toBe(true);
    expect(commandLooksForbidden('git config user.email --global "x"')).toBe(true);
    expect(commandLooksForbidden('git -C "$repo" config --global user.email "x"')).toBe(true);
    expect(commandLooksForbidden('git config user.email "x"')).toBe(false);
    expect(commandLooksForbidden('git config --global core.hooksPath .githooks')).toBe(false);
    expect(commandLooksForbidden('git config --worktree user.email "x"')).toBe(false);
    expect(
      commandLooksForbidden(
        '| Local | `git config user.name "cop1 CI"` *(sans `--global`)* dans worktree |',
      ),
    ).toBe(false);
  });

  it('détecte une commande coupée par des backslash de continuation', () => {
    const multi = ['git config \\', '--global \\', 'user.email "ci@cop1.local"', ''].join('\n');
    const found = scanContent(multi, 'evil.sh');
    expect(found.length).toBeGreaterThan(0);
    expect(found[0].content).toMatch(/user\.email/);
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
