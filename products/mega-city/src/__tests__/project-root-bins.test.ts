/**
 * Le projet désigné, de bout en bout (fiche 20260826173221323) — de VRAIS processus sur un projet
 * JETABLE : avec `--root` ou `EZK_ROOT`, les commandes qui lisent les fiches montrent celles de CE
 * projet et pas celles de vectorz ; sans, la sortie est celle d'avant. On ne touche à aucun vrai
 * projet : le dossier est créé ici et supprimé après.
 *
 * Sobre à dessein : chaque processus lancé pèse sur les autres suites quand tout tourne en parallèle.
 * Le routeur et la lecture de `--root` sont déjà prouvés à blanc (ezk-cli, ezk-launcher,
 * project-root) ; ici, on ne lance que ce qui prouve le câblage des scripts.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { buildAvancementData } from '../core/avancement-data.js';
import { loadFiches } from '../loaders/fiches.js';

// Ce fichier lance de vrais processus : sous charge (suite parallèle), le délai vitest par défaut
// (5 s) ne suffit pas (fiche 20261024090000000, classe « tests sous-processus sous charge »).
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const repoRoot = realpathSync(resolve(megaCity, '..', '..'));
const launcher = join(megaCity, 'bin', 'ezk.mjs');
const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');

const PROJECT_FICHE = '20991231000000001';

/**
 * Une fiche OUVERTE de vectorz, celle que le board liste en premier, lue dans le vrai backlog.
 * Jamais codée en dur : une fiche nommée ici finit livrée, et le test cassait le jour de son ship.
 */
function anOpenVectorzFiche(): string {
  const id = buildAvancementData(loadFiches(repoRoot)).actives[0]?.id;
  if (!id) throw new Error('aucune fiche ouverte dans le backlog de vectorz : ce test en a besoin d’une');
  return id;
}
const A_VECTORZ_FICHE = anOpenVectorzFiche();

let project: string;
let elsewhere: string;

beforeAll(() => {
  project = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-projet-')));
  elsewhere = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-ailleurs-')));
  mkdirSync(join(project, 'features'), { recursive: true });
  writeFileSync(
    join(project, 'features', `${PROJECT_FICHE}_fiche-du-projet-jetable.md`),
    [
      '---',
      `id: "${PROJECT_FICHE}"`,
      'title: "Fiche du projet jetable"',
      'type: feature',
      'priority: P2',
      'status: ready',
      'created: 2099-12-31',
      '---',
      '',
      '# Une fiche qui n’existe que dans le projet jetable',
      '',
    ].join('\n'),
  );
});

afterAll(() => {
  rmSync(project, { recursive: true, force: true });
  rmSync(elsewhere, { recursive: true, force: true });
});

/** Un script de `bin/` lancé tel quel (sans le routeur), depuis un dossier hors de tout dépôt. */
function script(name: string, args: string[], env: Record<string, string> = {}, cwd = elsewhere) {
  const r = spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', name), ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, EZK_ROOT: '', INIT_CWD: '', ...env },
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

describe('les scripts qui lisent les fiches du projet désigné', () => {
  it('ezk --root <projet> board show : le routeur passe le projet au script (vrai lanceur)', { timeout: 60_000 }, () => {
    const r = spawnSync(process.execPath, [launcher, '--root', project, 'board', 'show', '--json'], {
      cwd: elsewhere,
      encoding: 'utf8',
      env: { PATH: '/usr/bin:/bin', HOME: elsewhere },
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain(PROJECT_FICHE);
    expect(r.stdout).not.toContain(A_VECTORZ_FICHE);
  });

  it('EZK_ROOT=<projet> : les fiches DE ce projet, pas celles de vectorz — et le script le dit sur stderr', { timeout: 60_000 }, () => {
    const r = script('avancement.ts', ['--json'], { EZK_ROOT: project });
    expect(r.code).toBe(0);
    expect(r.out).toContain(PROJECT_FICHE);
    expect(r.out).not.toContain(A_VECTORZ_FICHE);
    // Une variable restée dans le shell ne doit jamais faire lire un autre projet en silence ;
    // le bandeau est sur stderr, donc le JSON de stdout reste du JSON.
    expect(r.err).toContain(`Projet visé : ${project} (variable EZK_ROOT)`);
    expect(() => JSON.parse(r.out)).not.toThrow();
  });

  it('sans argument ni variable : la sortie est celle d’avant (défaut == --root <méthode>)', { timeout: 60_000 }, () => {
    const byDefault = script('avancement.ts', ['--json'], {}, repoRoot);
    const explicit = script('avancement.ts', ['--json', '--root', repoRoot]);
    expect(byDefault.code).toBe(0);
    expect(explicit.code).toBe(0);
    expect(byDefault.out).toBe(explicit.out);
    expect(byDefault.out).toContain(A_VECTORZ_FICHE);
    expect(byDefault.out).not.toContain(PROJECT_FICHE);
    expect(byDefault.err).not.toContain('Projet visé'); // aucun bandeau sans désignation : rien ne change
  });

  it('un projet qui n’existe pas : refusé net, avec son chemin (pas un board vide)', { timeout: 60_000 }, () => {
    const missing = join(elsewhere, 'nulle-part');
    const r = script('avancement.ts', ['--root', missing]);
    expect(r.code).toBe(2);
    expect(r.err).toContain(missing);
  });

  it('backlog check contrôle les fiches de CE projet', { timeout: 60_000 }, () => {
    const r = script('check-fiches.ts', ['--root', project]);
    expect(r.code).toBe(0);
    expect(r.out).toContain('1 fiches contrôlées');
  });
});

/** Le vrai lanceur `ezk`, depuis un dossier hors de tout dépôt, sans tsx dans le PATH. */
function ezk(args: string[], env: Record<string, string> = {}) {
  const r = spawnSync(process.execPath, [launcher, ...args], {
    cwd: elsewhere,
    encoding: 'utf8',
    env: { PATH: '/usr/bin:/bin', HOME: elsewhere, ...env },
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

describe('depuis un projet hôte : les commandes dont les skills ont besoin (fiche 20261002155911257)', () => {
  const RETRO = '2026-10-03-retro-session-2026-10-02.md';

  it('ezk --root <projet> backlog regen : écrit l’index DE ce projet, jamais celui de vectorz', { timeout: 60_000 }, () => {
    const vectorzIndex = readFileSync(join(repoRoot, 'features', 'BACKLOG.md'), 'utf8');
    const r = ezk(['--root', project, 'backlog', 'regen']);
    expect(r.code).toBe(0);
    const index = readFileSync(join(project, 'features', 'BACKLOG.md'), 'utf8');
    expect(index).toContain(PROJECT_FICHE);
    expect(index).not.toContain(A_VECTORZ_FICHE);
    expect(readFileSync(join(repoRoot, 'features', 'BACKLOG.md'), 'utf8')).toBe(vectorzIndex);
  });

  it('une EZK_ROOT restée dans le shell ne redirige pas une écriture : refus, rien d’écrit', { timeout: 60_000 }, () => {
    rmSync(join(project, 'features', 'BACKLOG.md'), { force: true });
    const r = ezk(['backlog', 'regen'], { EZK_ROOT: project });
    expect(r.code).toBe(2);
    expect(r.err).toContain('--root');
    expect(existsSync(join(project, 'features', 'BACKLOG.md'))).toBe(false);
  });

  it('ezk --root <projet> config show : la config DE ce projet', { timeout: 60_000 }, () => {
    const r = ezk(['--root', project, 'config', 'show']);
    expect(r.code).toBe(0);
    expect(r.out).toContain(`Config projet    : ${project}/.vectorz/config.yml`);
  });

  it('ezk --root <projet> retro captures : les captures DE ce projet, et --check se lit depuis ce projet', { timeout: 60_000 }, () => {
    expect(ezk(['--root', project, 'retro', 'captures']).out).toContain('Aucune capture de rétro');
    mkdirSync(join(project, 'docs', 'captures'), { recursive: true });
    writeFileSync(
      join(project, 'docs', 'captures', RETRO),
      readFileSync(join(repoRoot, 'docs', 'captures', RETRO), 'utf8'),
    );
    const checked = ezk(['--root', project, 'retro', 'captures', '--check', `docs/captures/${RETRO}`]);
    expect(checked.code).toBe(0);
    expect(checked.out).toContain(`OK docs/captures/${RETRO}`);
  });
});
