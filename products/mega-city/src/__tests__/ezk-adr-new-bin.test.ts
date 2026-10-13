/**
 * `ezk adr new` de bout en bout (fiche 20261011142027748) : le prochain id est LIBRE DES DEUX
 * dossiers (docs/adr/ ombrelle + products/mega-city/docs/adr/ méthode), et le squelette est posé.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const here = dirname(fileURLToPath(import.meta.url));
const megaCity = resolve(here, '../..');
const bin = join(megaCity, 'bin', 'ezk-adr-new.ts');
const tsx = createRequire(import.meta.url).resolve('tsx/cli');

let root = '';
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'ezk-adr-new-'));
  mkdirSync(join(root, 'docs', 'adr'), { recursive: true });
  mkdirSync(join(root, 'products', 'mega-city', 'docs', 'adr'), { recursive: true });
  // Numéros contigus répartis sur les DEUX dossiers → premier libre des deux = 005.
  writeFileSync(join(root, 'docs', 'adr', 'ADR-0001-a.md'), '# ADR-0001\n');
  writeFileSync(join(root, 'docs', 'adr', 'ADR-0002-b.md'), '# ADR-0002\n');
  writeFileSync(join(root, 'products', 'mega-city', 'docs', 'adr', '0003-c.md'), '# 0003\n');
  writeFileSync(join(root, 'products', 'mega-city', 'docs', 'adr', '0004-d.md'), '# 0004\n');
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

function run(...args: string[]): { code: number; out: string } {
  const r = spawnSync(process.execPath, [tsx, bin, '--root', root, ...args], { encoding: 'utf8' });
  return { code: r.status ?? -1, out: `${r.stdout}${r.stderr}` };
}

describe('ezk adr new (fiche 20261011142027748)', () => {
  it('pose un ADR au prochain id LIBRE DES DEUX dossiers (ombrelle par défaut)', () => {
    const r = run('new', 'ma-decision');
    expect(r.code).toBe(0);
    const created = join(root, 'docs', 'adr', 'ADR-005-ma-decision.md');
    expect(existsSync(created)).toBe(true);
    // 005 n'existait dans AUCUN des deux dossiers (critère : id libre partout).
    expect(existsSync(join(root, 'docs', 'adr', 'ADR-0005-a.md'))).toBe(false);
    expect(existsSync(join(root, 'products', 'mega-city', 'docs', 'adr', '0005-c.md'))).toBe(false);
  });

  it('--scope methode pose dans le dossier méthode au format 4 chiffres', () => {
    const r = run('new', 'cote-methode', '--scope', 'methode');
    expect(r.code).toBe(0);
    expect(existsSync(join(root, 'products', 'mega-city', 'docs', 'adr', '0005-cote-methode.md'))).toBe(true);
  });

  it('sans slug → usage (code 2)', () => {
    expect(run('new').code).toBe(2);
  });

  it('--scope inconnu → code 2', () => {
    expect(run('new', 'x', '--scope', 'nimportequoi').code).toBe(2);
  });
});
