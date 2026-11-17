/**
 * `ezk backlog version tag` de bout en bout (fiche 20261114131613689) : le VRAI bin, lancé sur un dépôt
 * git JETABLE (mkdtemp + git init + fiches fixtures). Aucune étiquette n'est jamais posée sur vectorz.
 * Ce que le cœur pur ne prouve pas : « refus = rien d'écrit », l'ordre gate → écriture → commit → étiquette,
 * et que `board show` lit la même coupe que le verbe.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { boardShowData } from '../io/board-show.js';
import { loadVersionNoms } from '../loaders/milestones.js';
import { writeReleaseVerdict } from '../loaders/release-passes.js';

// Sous-processus tsx + git bloquants : même délai élargi que backlog-version-bin.test.ts.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const here = dirname(fileURLToPath(import.meta.url));
const bin = join(resolve(here, '../..'), 'bin', 'backlog-version.ts');
const tsx = createRequire(import.meta.url).resolve('tsx/cli');

const fm = (id: string, extra: string): string =>
  `---\nid: "${id}"\ntitle: "Fiche ${id}"\ntype: feature\npriority: P1\nproduct: mega-city\n${extra}\n---\n\ncorps\n`;

const ANCIENNE = '20260101000000001';
const FEATURE = '20260101000000002';
const CORRECTIF = '20260101000000003';
const RESTE = '20260101000000004';

let root = '';

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' });
}

function put(path: string, content: string): void {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

function run(...args: string[]): { code: number; out: string } {
  const r = spawnSync(process.execPath, [tsx, bin, '--root', root, 'tag', ...args], { encoding: 'utf8' });
  return { code: r.status ?? -1, out: `${r.stdout}${r.stderr}` };
}

function commit(message: string): void {
  git('add', '.');
  git('commit', '--quiet', '-m', message);
}

/** Un dépôt avec une version déjà posée (v0.1.0), puis une feature et un correctif livrés depuis. */
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'backlog-version-tag-'));
  git('init', '--quiet', '-b', 'main');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  put('.gitignore', '.vectorz/release/\n');
  put('.vectorz/config.yml', 'release:\n  gate: off\n');
  put(`features/done/${ANCIENNE}_ancienne.md`, fm(ANCIENNE, 'status: shipped'));
  commit('chore: seed');
  git('tag', 'v0.1.0');
  put(`features/done/${FEATURE}_feature.md`, fm(FEATURE, 'status: shipped\nmilestone: board'));
  put(`features/done/${CORRECTIF}_correctif.md`, fm(CORRECTIF, 'status: shipped').replace('type: feature', 'type: bug'));
  put(`features/${RESTE}_reste.md`, fm(RESTE, 'status: ready\nmilestone: board'));
  commit('feat: livre une feature et un correctif');
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('version tag --dry-run', () => {
  it('imprime la coupe groupée par objectif (partiel k/n) et les correctifs, propose une mineure, n’écrit rien', () => {
    const r = run('--dry-run');
    expect(r.code).toBe(0);
    expect(r.out.startsWith('En clair :')).toBe(true);
    expect(r.out).toContain('board — partiel 1/2');
    expect(r.out).toContain(`${FEATURE} Fiche ${FEATURE}`);
    expect(r.out).toContain('Correctifs');
    expect(r.out).toContain(`${CORRECTIF} Fiche ${CORRECTIF}`);
    expect(r.out).toContain('v0.2.0');
    expect(r.out).not.toContain(`${ANCIENNE} Fiche`); // livrée avant l'étiquette : historique, hors coupe
    expect(git('status', '--porcelain')).toBe('');
    expect(git('tag', '-l').trim()).toBe('v0.1.0');
  });

  it('propose un patch quand la coupe ne contient que des correctifs', () => {
    rmSync(join(root, `features/done/${FEATURE}_feature.md`));
    commit('chore: retire la feature');
    expect(run('--dry-run').out).toContain('v0.1.1');
  });

  it('accepte un numéro imposé et le dit', () => {
    const r = run('v0.9.0', '--dry-run');
    expect(r.code).toBe(0);
    expect(r.out).toContain('imposé');
    expect(r.out).toContain('v0.9.0');
  });

  it('refuse un numéro qui ne dépasse pas la dernière étiquette', () => {
    const r = run('v0.1.0', '--dry-run');
    expect(r.code).toBe(1);
    expect(r.out).toContain('ne dépasse pas');
  });

  it('refuse un patch qui couperait une fiche hors bug et nomme les deux sorties', () => {
    const r = run('v0.1.1', '--dry-run');
    expect(r.code).toBe(1);
    expect(r.out).toContain('v0.2.0');
    expect(r.out).toContain('maint/v0.1');
  });

  it('lit la même coupe que board show --json (un seul calcul)', () => {
    const attendu = boardShowData(root).versions.prochaineCoupe.livrees.map((f) => f.id);
    const ids = [FEATURE, CORRECTIF];
    expect(attendu).toEqual(ids);
    const out = run('--dry-run').out;
    for (const id of attendu) expect(out).toContain(id);
  });

  it('travaille aussi hors de la branche principale : il ne fait que lire', () => {
    git('checkout', '--quiet', '-b', 'autre');
    expect(run('--dry-run').code).toBe(0);
  });
});

describe('version tag (écriture)', () => {
  it('refuse sans verdict de gate (gate active) : rien n’est écrit, aucune étiquette', () => {
    put('.vectorz/config.yml', 'release:\n  gate: on\n');
    commit('chore: gate active');
    const r = run();
    expect(r.code).toBe(1);
    expect(r.out).toContain('ezk release v0.2.0');
    expect(git('status', '--porcelain')).toBe('');
    expect(existsSync(join(root, 'features/versions'))).toBe(false);
    expect(git('tag', '-l').trim()).toBe('v0.1.0');
  });

  it('sur un GO établi sur HEAD : écrit version:, le fichier de version, committe et pose l’étiquette locale', () => {
    put('.vectorz/config.yml', 'release:\n  gate: on\n');
    commit('chore: gate active');
    const head = git('rev-parse', 'HEAD').trim();
    writeReleaseVerdict(root, { version: 'v0.2.0', verdict: 'GO', passes: [], at: new Date().toISOString(), head });
    const r = run();
    expect(r.code).toBe(0);
    expect(r.out).toContain('git push origin v0.2.0');
    expect(r.out).toContain('PO');
    expect(git('tag', '-l', 'v0.2.0').trim()).toBe('v0.2.0');
    expect(git('rev-list', '-n', '1', 'v0.2.0').trim()).toBe(git('rev-parse', 'HEAD').trim());
    expect(git('rev-parse', 'HEAD~1').trim()).toBe(head);
    expect(git('log', '-1', '--pretty=%s').trim()).toBe('chore(release): v0.2.0');
    expect(git('status', '--porcelain')).toBe('');
    expect(readFileSync(join(root, `features/done/${FEATURE}_feature.md`), 'utf8')).toContain('version: v0.2.0');
    expect(readFileSync(join(root, `features/done/${CORRECTIF}_correctif.md`), 'utf8')).toContain('version: v0.2.0');
    expect(readFileSync(join(root, `features/done/${ANCIENNE}_ancienne.md`), 'utf8')).not.toContain('version: v0.2.0');
    expect(readFileSync(join(root, `features/${RESTE}_reste.md`), 'utf8')).not.toContain('version: v0.2.0');
    const fichier = readFileSync(join(root, 'features/versions/v0.2.0.md'), 'utf8');
    expect(fichier).toContain(`commit: ${head}`);
    expect(fichier).toContain('gate: GO');
    expect(fichier).toContain('numero: propose');
    expect(loadVersionNoms(root).has('v0.2.0')).toBe(true);
  });

  it('refuse un NO-GO : rien n’est écrit', () => {
    put('.vectorz/config.yml', 'release:\n  gate: on\n');
    commit('chore: gate active');
    const head = git('rev-parse', 'HEAD').trim();
    writeReleaseVerdict(root, {
      version: 'v0.2.0',
      verdict: 'NO-GO',
      passes: [{ id: 'tests', title: 'Tests', command: 'x', go: false }],
      at: new Date().toISOString(),
      head,
    });
    const r = run();
    expect(r.code).toBe(1);
    expect(r.out).toContain('NO-GO');
    expect(git('rev-parse', 'HEAD').trim()).toBe(head);
    expect(existsSync(join(root, 'features/versions'))).toBe(false);
  });

  it('--release-ok journalise la soupape dans la sortie et dans le fichier de version', () => {
    put('.vectorz/config.yml', 'release:\n  gate: on\n');
    commit('chore: gate active');
    const r = run('--release-ok', 'copie jetable');
    expect(r.code).toBe(0);
    expect(r.out).toContain('copie jetable');
    expect(readFileSync(join(root, 'features/versions/v0.2.0.md'), 'utf8')).toContain('soupape PO : copie jetable');
  });

  it('un numéro imposé s’écrit numero: impose', () => {
    expect(run('v0.9.0').code).toBe(0);
    expect(git('tag', '-l', 'v0.9.0').trim()).toBe('v0.9.0');
    expect(readFileSync(join(root, 'features/versions/v0.9.0.md'), 'utf8')).toContain('numero: impose');
  });

  it('refuse hors de la branche principale, sans rien écrire', () => {
    git('checkout', '--quiet', '-b', 'autre');
    const r = run();
    expect(r.code).toBe(1);
    expect(r.out).toContain('branche principale');
    expect(git('tag', '-l').trim()).toBe('v0.1.0');
    expect(git('status', '--porcelain')).toBe('');
  });

  it('refuse quand features/ porte des changements non commités', () => {
    writeFileSync(join(root, `features/${RESTE}_reste.md`), fm(RESTE, 'status: ready\nmilestone: board\nlabels: [x]'));
    const r = run();
    expect(r.code).toBe(1);
    expect(r.out).toContain('non commités');
    expect(git('tag', '-l').trim()).toBe('v0.1.0');
  });

  it('une fois la coupe posée, plus rien n’attend la prochaine', () => {
    expect(run().code).toBe(0);
    expect(boardShowData(root).versions.prochaineCoupe.livrees).toEqual([]);
    expect(run('--dry-run').out).toContain('rien à couper');
  });
});
