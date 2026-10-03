/**
 * Sans `--root`, `ezk backlog ship` et `ezk backlog regen` écrivent dans le dépôt git du dossier où on
 * tape la commande (fiche 20261003072823731). De VRAIS processus, sans `--root`, sur un dépôt git
 * JETABLE : depuis sa racine, un sous-dossier et un worktree, plus les refus. Aucun vrai projet touché.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const vectorz = realpathSync(resolve(megaCity, '..', '..'));
const launcher = join(megaCity, 'bin', 'ezk.mjs');
const FICHE = '20991231000000002';
const FICHE_FILE = `features/${FICHE}_fiche-du-depot-jetable.md`;

let sandbox: string;
let repo: string;
let worktree: string;
let noBacklog: string;
let outside: string;

function git(cwd: string, ...args: string[]): void {
  const r = spawnSync('git', ['-c', 'user.name=ezk', '-c', 'user.email=ezk@test', ...args], { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} : ${r.stderr}`);
}

/** Le vrai lanceur, SANS --root, depuis `cwd`. */
function ezk(cwd: string, args: string[], env: Record<string, string> = {}) {
  const r = spawnSync(process.execPath, [launcher, ...args], {
    cwd,
    encoding: 'utf8',
    env: { PATH: '/usr/bin:/bin', HOME: sandbox, ...env },
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

beforeAll(() => {
  sandbox = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-cwd-')));
  repo = join(sandbox, 'depot');
  worktree = join(sandbox, 'depot-wt');
  noBacklog = join(sandbox, 'sans-backlog');
  outside = join(sandbox, 'hors-git');
  mkdirSync(join(repo, 'features'), { recursive: true });
  mkdirSync(join(repo, 'apps', 'web'), { recursive: true });
  writeFileSync(join(repo, 'apps', 'web', '.keep'), '');
  writeFileSync(join(repo, 'features', 'README.md'), '---\nbacklog_title: "Backlog — dépôt jetable"\n---\n\n# Guide\n');
  writeFileSync(
    join(repo, FICHE_FILE),
    ['---', `id: "${FICHE}"`, 'title: "Fiche du dépôt jetable"', 'type: feature', 'priority: P2', 'status: ready',
      'created: 2099-12-31', '---', '', `# ${FICHE} — Fiche du dépôt jetable`, ''].join('\n'),
  );
  git(sandbox, 'init', '-q', '-b', 'main', repo);
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'init');
  git(repo, 'worktree', 'add', '-q', '-b', 'wt', worktree);
  mkdirSync(noBacklog, { recursive: true });
  git(sandbox, 'init', '-q', noBacklog);
  mkdirSync(outside, { recursive: true });
});

afterAll(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

const index = (root: string): string => readFileSync(join(root, 'features', 'BACKLOG.md'), 'utf8');

describe('sans --root : le dépôt git du dossier courant', () => {
  it('depuis la racine du dépôt, regen écrit SON index, avec son titre, et dit où', { timeout: 60_000 }, () => {
    const before = index(vectorz);
    const r = ezk(repo, ['backlog', 'regen']);
    expect(r.code).toBe(0);
    expect(r.err).toContain(`dépôt visé : ${repo}`);
    expect(index(repo).split('\n')[0]).toBe('# Backlog — dépôt jetable');
    expect(index(repo)).toContain(FICHE);
    expect(index(vectorz)).toBe(before);
  });

  it('depuis un sous-dossier, il vise toujours la racine du dépôt', { timeout: 60_000 }, () => {
    rmSync(join(repo, 'features', 'BACKLOG.md'));
    const r = ezk(join(repo, 'apps', 'web'), ['backlog', 'regen']);
    expect(r.code).toBe(0);
    expect(r.err).toContain(`dépôt visé : ${repo}`);
    expect(existsSync(join(repo, 'features', 'BACKLOG.md'))).toBe(true);
  });

  it('depuis un worktree, il vise ce worktree, pas le dépôt principal', { timeout: 60_000 }, () => {
    rmSync(join(repo, 'features', 'BACKLOG.md'));
    const r = ezk(worktree, ['backlog', 'regen']);
    expect(r.code).toBe(0);
    expect(r.err).toContain(`dépôt visé : ${worktree}`);
    expect(existsSync(join(worktree, 'features', 'BACKLOG.md'))).toBe(true);
    expect(existsSync(join(repo, 'features', 'BACKLOG.md'))).toBe(false);
  });

  it('une EZK_ROOT restée dans le shell ne redirige pas l’écriture', { timeout: 60_000 }, () => {
    rmSync(join(worktree, 'features', 'BACKLOG.md'));
    const r = ezk(repo, ['backlog', 'regen'], { EZK_ROOT: worktree });
    expect(r.code).toBe(0);
    expect(existsSync(join(repo, 'features', 'BACKLOG.md'))).toBe(true);
    expect(existsSync(join(worktree, 'features', 'BACKLOG.md'))).toBe(false);
  });

  it('ship livre la fiche du dépôt courant : statut, done/, index', { timeout: 60_000 }, () => {
    const r = ezk(repo, ['backlog', 'ship', '--pr', '#999', FICHE_FILE]);
    expect(r.code).toBe(0);
    expect(r.err).toContain(`dépôt visé : ${repo}`);
    expect(r.out).not.toContain('option --root'); // un seul bandeau, et pas une option que personne n'a tapée
    const done = join(repo, 'features', 'done', `${FICHE}_fiche-du-depot-jetable.md`);
    expect(readFileSync(done, 'utf8')).toMatch(/^status: shipped$/m);
    expect(index(repo)).toContain('shipped');
  });
});

describe('sans --root : les refus, sans rien écrire', () => {
  it('hors d’un dépôt git : code 2, un message qui dit quoi faire', { timeout: 60_000 }, () => {
    const r = ezk(outside, ['backlog', 'regen']);
    expect(r.code).toBe(2);
    expect(r.err).toMatch(/aucun dépôt git[\s\S]*--root/);
    expect(existsSync(join(outside, 'features'))).toBe(false);
  });

  it('dans un dépôt sans features/ : code 2, le dépôt est nommé', { timeout: 60_000 }, () => {
    const r = ezk(noBacklog, ['backlog', 'ship', '--pr', '#1', 'features/x.md']);
    expect(r.code).toBe(2);
    expect(r.err).toContain(`${noBacklog} n'a pas de dossier features/`);
    expect(existsSync(join(noBacklog, 'features'))).toBe(false);
  });
});
