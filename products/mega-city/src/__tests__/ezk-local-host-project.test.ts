/**
 * Le mode local de la méthode marche depuis un projet hôte (fiche 20261003200945204). De VRAIS
 * processus `ezk`, SANS `--root`, lancés depuis un dépôt git JETABLE : la config, le document de PR
 * local, la revue locale, puis le rangement de la fiche. Aucun vrai projet n'est touché.
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
const FICHE = '20991231000000003';
const SLUG = `${FICHE}_fiche-du-projet-hote`;
const IMAGE = `docs/pr-evidence/${FICHE}/accueil-after.png`;

let sandbox: string;
let repo: string;

function git(cwd: string, ...args: string[]): void {
  const r = spawnSync('git', ['-c', 'user.name=ezk', '-c', 'user.email=ezk@test', ...args], { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} : ${r.stderr}`);
}

/** Le vrai lanceur, SANS --root, depuis `cwd`. */
function ezk(cwd: string, args: string[]) {
  const r = spawnSync(process.execPath, [launcher, ...args], {
    cwd,
    encoding: 'utf8',
    env: { PATH: '/usr/bin:/bin', HOME: sandbox },
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

/** Les cibles des liens markdown relatifs de `file`, résolues depuis son dossier. */
function relativeTargets(file: string): string[] {
  const text = readFileSync(file, 'utf8');
  return [...text.matchAll(/\]\(([^)\s]+)\)/g)]
    .map((m) => m[1] ?? '')
    .filter((t) => !/^[a-z]+:/i.test(t) && !t.startsWith('#'))
    .map((t) => resolve(dirname(file), t));
}

beforeAll(() => {
  sandbox = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-hote-')));
  repo = join(sandbox, 'projet-hote');
  mkdirSync(join(repo, 'features', 'done'), { recursive: true });
  mkdirSync(join(repo, dirname(IMAGE)), { recursive: true });
  mkdirSync(join(repo, 'apps', 'web'), { recursive: true });
  writeFileSync(join(repo, 'apps', 'web', '.keep'), '');
  writeFileSync(join(repo, IMAGE), 'png');
  writeFileSync(join(repo, 'features', 'README.md'), '---\nbacklog_title: "Backlog — projet hôte"\n---\n\n# Guide\n');
  writeFileSync(
    join(repo, 'features', `${SLUG}.md`),
    [
      '---', `id: "${FICHE}"`, 'title: "Fiche du projet hôte"', 'type: feature', 'priority: P2', 'status: ready',
      'created: 2099-12-31', '---', '', `# ${FICHE} — Fiche du projet hôte`, '', '**En clair.** Une fiche de test.', '',
      '## Comment vérifier', '', `![accueil après](../${IMAGE})`, '',
    ].join('\n'),
  );
  git(sandbox, 'init', '-q', '-b', 'main', repo);
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'init');
});

afterAll(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe('depuis un projet hôte, sans --root', () => {
  it('ezk config github off écrit la config du projet, pas celle de la méthode', { timeout: 60_000 }, () => {
    const methodConfig = join(vectorz, '.vectorz', 'config.yml');
    const before = existsSync(methodConfig) ? readFileSync(methodConfig, 'utf8') : undefined;
    const r = ezk(repo, ['config', 'github', 'off']);
    expect(r.err).toContain(`dépôt visé : ${repo}`);
    expect(r.code).toBe(0);
    expect(readFileSync(join(repo, '.vectorz', 'config.yml'), 'utf8')).toMatch(/github: false/);
    expect(existsSync(methodConfig) ? readFileSync(methodConfig, 'utf8') : undefined).toBe(before);
    expect(r.err).not.toContain('variable EZK_ROOT');
  });

  it('ezk pr emit-local écrit le document de PR dans le projet, avec des liens qui mènent quelque part', { timeout: 60_000 }, () => {
    const r = ezk(repo, ['pr', 'emit-local', '--fiche', `features/${SLUG}.md`]);
    expect(r.err).toBe(`ezk : dépôt visé : ${repo}\n`);
    expect(r.code).toBe(0);
    const doc = join(repo, 'features', 'pr-local', `${SLUG}.md`);
    expect(readFileSync(doc, 'utf8').split('\n')[0]).toBe(`> 🗎 Rendu de la fiche [features/${SLUG}.md](../${SLUG}.md)`);
    expect(relativeTargets(doc)).toEqual([join(repo, 'features', `${SLUG}.md`), join(repo, IMAGE)]);
    for (const target of relativeTargets(doc)) expect(existsSync(target)).toBe(true);
  });

  it('depuis un sous-dossier, la fiche se lit depuis la racine du projet, comme pour ship', { timeout: 60_000 }, () => {
    const r = ezk(join(repo, 'apps', 'web'), ['pr', 'emit-local', '--fiche', `features/${SLUG}.md`]);
    expect(r.code).toBe(0);
    expect(existsSync(join(repo, 'features', 'pr-local', `${SLUG}.md`))).toBe(true);
    expect(existsSync(join(repo, 'apps', 'web', 'features'))).toBe(false);
  });

  it('ezk review emit écrit la revue dans le projet', { timeout: 60_000 }, () => {
    const monorepoReviews = join(vectorz, 'products', 'mega-city', 'features', 'reviews');
    const existedBefore = existsSync(monorepoReviews);
    const r = ezk(join(repo, 'apps', 'web'), [
      'review', 'emit', '--fiche', FICHE, '--branch', `feat/${FICHE}-x`, '--product', 'hote',
      '--method-name', 'ezk-sprint', '--method-version', 'test', '--status', 'approved', '--resume', 'GO',
      '--matrice', 'Gate=✅', '--a-tester', 'rien', '--provisioning', 'aucun',
    ]);
    expect(r.err).toContain(`dépôt visé : ${repo}`);
    expect(r.code).toBe(0);
    expect(r.out).toContain(join(repo, 'features', 'reviews'));
    expect(existsSync(monorepoReviews)).toBe(existedBefore);
  });

  it('après le rangement de la fiche, le document de PR pointe toujours vers elle', { timeout: 60_000 }, () => {
    git(repo, 'add', '-A');
    git(repo, 'commit', '-q', '-m', 'pr local');
    const r = ezk(repo, ['backlog', 'ship', '--pr', 'local (abc1234)', `features/${SLUG}.md`]);
    expect(r.code).toBe(0);
    const doc = join(repo, 'features', 'pr-local', `${SLUG}.md`);
    expect(relativeTargets(doc)[0]).toBe(join(repo, 'features', 'done', `${SLUG}.md`));
    for (const target of relativeTargets(doc)) expect(existsSync(target)).toBe(true);
  });

  it('une commande de projet non désigné ne conseille jamais de viser la méthode', { timeout: 60_000 }, () => {
    const r = ezk(repo, ['backlog', 'plan-head']);
    expect(r.code).toBe(2);
    expect(r.err).not.toContain(`--root ${vectorz}`);
    expect(r.err).toContain('--root <dossier du projet>');
  });
});
