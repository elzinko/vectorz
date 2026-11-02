/**
 * `ezk board process --json` (fiche 20261102123552183) : chaque fiche posée sur son étape, lue dans le
 * projet de `--root`, et sans appel à GitHub quand le projet l'a coupé. Les tests lancent la vraie
 * commande, avec un faux `gh` en tête du PATH qui note chaque appel : on voit s'il a été lancé.
 */
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ProcessContractSchema } from '../core/process-contract.js';
import { boardProcessData } from '../io/board-process.js';
import { FIXTURE_EN_COURS, PROCESS_EXAMPLE_FILE, makeContractFixture } from '../io/contract-files.js';

// Sous-process git et tsx : sous la charge de la gate complète, 5 s ne suffisent pas.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const repoRoot = realpathSync(resolve(megaCity, '..', '..'));
const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');

let fixture: string;
let fakeBin: string;
const marker = (): string => join(fakeBin, 'gh-appels.log');

beforeAll(() => {
  fixture = makeContractFixture();
  // Un faux `gh` : il note son appel et répond « aucune PR ».
  fakeBin = mkdtempSync(join(tmpdir(), 'faux-gh-'));
  writeFileSync(join(fakeBin, 'gh'), `#!/bin/sh\necho "$@" >> "${join(fakeBin, 'gh-appels.log')}"\necho '[]'\n`);
  chmodSync(join(fakeBin, 'gh'), 0o755);
});
afterAll(() => {
  rmSync(fixture, { recursive: true, force: true });
  rmSync(fakeBin, { recursive: true, force: true });
});

/** Lance la vraie commande sur `root`, avec le faux `gh` devant le vrai. */
function run(root: string, ...args: string[]) {
  rmSync(marker(), { force: true });
  const r = spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', 'board-process.ts'), '--root', root, ...args], {
    encoding: 'utf8',
    cwd: repoRoot,
    env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH}`, EZK_ROOT: '' },
  });
  return { ...r, ghCalled: existsSync(marker()) };
}

/** Une copie de la fixture dont la config coupe GitHub. */
function fixtureWithGithub(value: string): string {
  const root = makeContractFixture();
  mkdirSync(join(root, '.vectorz'), { recursive: true });
  writeFileSync(join(root, '.vectorz', 'config.yml'), `github: ${value}\n`);
  return root;
}

describe('board process --json — le contrat', () => {
  it('respecte le schéma, et l’exemple rangé est la sortie de la commande, GitHub non lu', () => {
    const data = boardProcessData(fixture, { github: false });
    expect(ProcessContractSchema.safeParse(data).success).toBe(true);
    expect(data).toEqual(JSON.parse(readFileSync(join(megaCity, PROCESS_EXAMPLE_FILE), 'utf8')));
  });

  it('l’exemple rangé ne dépend que de la fixture : aucune session, aucun chemin absolu', () => {
    // Une session porte le chemin absolu de son dossier de travail : il changerait à chaque fixture.
    const text = readFileSync(join(megaCity, PROCESS_EXAMPLE_FILE), 'utf8');
    const data = JSON.parse(text);
    const fiches = data.stages.flatMap((g: { fiches: { session: unknown }[] }) => g.fiches);
    expect(fiches.every((f: { session: unknown }) => f.session === null)).toBe(true);
    expect(text).not.toMatch(/"\//);
  });

  it('sur le vrai dépôt aussi, la sortie respecte le schéma', () => {
    expect(ProcessContractSchema.safeParse(boardProcessData(repoRoot, { github: false })).success).toBe(true);
  });
});

describe('board process --json — le bon projet', () => {
  it('lancée depuis vectorz avec --root, la commande lit les branches du projet visé, pas celles de vectorz', () => {
    const r = run(fixture, '--json');
    expect(r.status, r.stderr).toBe(0);
    const data = JSON.parse(r.stdout);
    const fiches = data.stages.flatMap((g: { fiches: { id: string; branch: string | null }[] }) => g.fiches);
    expect(fiches.every((f: { id: string }) => f.id.startsWith('2099'))).toBe(true);
    const enCours = fiches.find((f: { id: string }) => f.id === FIXTURE_EN_COURS);
    expect(enCours).toMatchObject({ stage: 'en-sprint', branch: `feat/${FIXTURE_EN_COURS}-en-cours` });
  });
});

describe('board process --json — GitHub coupé, GitHub muet', () => {
  it('un projet `github: false` ne lance aucun `gh`, et dit « en revue » inconnue', () => {
    const root = fixtureWithGithub('false');
    try {
      const r = run(root, '--json');
      expect(r.status, r.stderr).toBe(0);
      expect(r.ghCalled).toBe(false);
      expect(JSON.parse(r.stdout)).toMatchObject({ github: false, reviewIndetermine: true });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('un projet qui garde GitHub le lit bien (le faux `gh` voit l’appel)', () => {
    const r = run(fixture, '--json');
    expect(r.status, r.stderr).toBe(0);
    expect(r.ghCalled).toBe(true);
    expect(JSON.parse(r.stdout)).toMatchObject({ github: true, reviewIndetermine: false });
  });

  it('le texte le dit en clair quand GitHub est coupé', () => {
    const root = fixtureWithGithub('false');
    try {
      const r = run(root);
      expect(r.status, r.stderr).toBe(0);
      expect(r.stdout).toMatch(/^En clair : \d+ fiches actives/);
      expect(r.stdout).toContain("Ce projet a coupé GitHub : l'étape « en revue » est inconnue");
      expect(r.ghCalled).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
