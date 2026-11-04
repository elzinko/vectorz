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
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

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


// Ces tests lancent de vrais sous-process (git, la commande ezk) : sous la charge de la gate complète,
// ils ont dépassé le délai par défaut de 5 s (fiche 20261104095412223). Délai large, comme
// backlog-show.test.ts.
vi.setConfig({ testTimeout: 60_000 });

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

  it('show dit la revue adverse : run par défaut, le plancher (fiche 20260830110131158)', () => {
    const r = cfg(['show']);
    expect(r.out).toMatch(/^review\.adverse\s+run\s/m);
    expect(r.out).not.toMatch(/review\.adverse\s+skip/);
  });

  it('show dit le menu de groom : menu par défaut, la sélection, ou l’erreur (fiche 20261009104401282)', () => {
    const config = join(repo, '.vectorz', 'config.yml');
    try {
      expect(cfg(['show']).out).toMatch(/^grooming\.techniques\s+menu\s/m);
      writeFileSync(config, 'github: false\ngrooming:\n  techniques:\n    avis-architecte: true\n');
      expect(cfg(['show']).out).toMatch(/^grooming\.techniques\s+avis-architecte\s/m);
      writeFileSync(config, 'github: false\ngrooming:\n  techniques:\n    archi: true\n');
      expect(cfg(['show']).out).toMatch(/^grooming\.techniques\s+ERREUR : .*« archi »/m);
    } finally {
      writeFileSync(config, 'github: false\n');
    }
  });

  it('show dit « skip » quand un humain pose le mode POC, et seulement avec la forme exacte', () => {
    const config = join(repo, '.vectorz', 'config.yml');
    try {
      writeFileSync(config, 'github: false\nreview:\n  adverse: skip\n');
      expect(cfg(['show']).out).toMatch(/^review\.adverse\s+skip\s+\(mode POC/m);
      writeFileSync(config, 'github: false\nreview:\n  adverse: Skip\n');
      expect(cfg(['show']).out).toMatch(/^review\.adverse\s+run\s/m);
    } finally {
      writeFileSync(config, 'github: false\n');
    }
  });
});

describe('ezk config show --json — le contrat lu par mission control (ADR-086)', () => {
  it('show --json sort le contrat : le fichier lu et GitHub coupé', () => {
    const r = cfg(['show', '--json']);
    expect(r.code).toBe(0);
    const data = JSON.parse(r.out);
    expect(data.schema_version).toBe(1);
    expect(data.file).toBe('.vectorz/config.yml');
    expect(data.github).toEqual({ pr: false, ci: false, codexReview: false });
  });

  it('--json seul vaut show --json', () => {
    const r = cfg(['--json']);
    expect(r.code).toBe(0);
    expect(JSON.parse(r.out).schema_version).toBe(1);
  });

  it('une option inconnue après show sort en 2 en la nommant, jamais ignorée en silence', () => {
    const r = cfg(['show', '--nimporte']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('--nimporte');
  });

  it('un mot en trop après --json sort en 2 en nommant ce mot, pas --json', () => {
    const r = cfg(['--json', 'extra']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('« extra »');
    expect(r.err).not.toMatch(/option inconnue « --json »/);
  });
});
