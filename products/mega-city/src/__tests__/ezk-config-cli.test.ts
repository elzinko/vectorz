/**
 * `ezk config` — l'aide et les options inconnues (fiche 20261004083838781).
 *
 * Le bug : `ezk config --help` prenait `--help` pour un dossier de projet, lisait une config
 * absente et affichait un faux « GitHub tout ON » en code 0. On fige ici le bon comportement :
 * `--help`/`-h` → usage code 0 ; option inconnue → code 2 nommant l'option ; dossier absent de
 * l'ancienne forme → erreur, jamais le faux défaut ; `show`/`github` inchangés.
 *
 * Le VRAI bin, lancé comme `pnpm --dir products/mega-city` le lance : depuis mega-city, le dépôt
 * visé par `INIT_CWD` (un backlog jetable, github: false).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tsx = createRequire(import.meta.url).resolve('tsx/cli');
let repo: string;

/** Le bin ezk-config, INIT_CWD = le dépôt jouet (comme le routeur résout le projet visé). */
function cfg(args: string[]) {
  const r = spawnSync(process.execPath, [tsx, join(megaCity, 'bin', 'ezk-config.ts'), ...args], {
    cwd: megaCity,
    encoding: 'utf8',
    env: { ...process.env, INIT_CWD: repo, EZK_ROOT: '' },
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), 'ezk-config-'));
  mkdirSync(join(repo, 'features'), { recursive: true });
  writeFileSync(join(repo, 'features', 'README.md'), '---\nbacklog_title: "Backlog jouet"\n---\n\n# Guide\n');
  mkdirSync(join(repo, '.vectorz'), { recursive: true });
  writeFileSync(join(repo, '.vectorz', 'config.yml'), 'github: false\n');
});
afterAll(() => rmSync(repo, { recursive: true, force: true }));

describe('ezk config — aide et options (fiche 20261004083838781)', () => {
  it('--help affiche l’usage, code 0 (pas un faux statut « tout ON »)', () => {
    const r = cfg(['--help']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('usage : ezk');
    expect(r.out).not.toMatch(/ON\s+\(ouvrir une pull request\)/);
  });

  it('-h affiche l’usage, code 0', () => {
    const r = cfg(['-h']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('usage : ezk');
  });

  it('une option inconnue sort en 2 en la nommant', () => {
    const r = cfg(['--nimporte']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('--nimporte');
    expect(r.err).toMatch(/option inconnue/i);
  });

  it('un dossier absent (ancienne forme) sort en erreur, pas « tout ON »', () => {
    const r = cfg([join(tmpdir(), 'dossier-absent-ezk-config-xyz')]);
    expect(r.code).not.toBe(0);
    expect(r.err).toMatch(/introuvable/i);
  });

  it('show garde son comportement : statut du projet, code 0', () => {
    const r = cfg(['show']);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/github/i);
  });
});
