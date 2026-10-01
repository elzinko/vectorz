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
import { type ChildProcess, spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const repoRoot = realpathSync(resolve(megaCity, '..', '..'));
const launcher = join(megaCity, 'bin', 'ezk.mjs');
const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');

const PROJECT_FICHE = '20991231000000001';
const A_VECTORZ_FICHE = '20260830114318159'; // une fiche OUVERTE de vectorz (listée par avancement), pas du projet jetable : à remplacer quand elle est livrée

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

describe('ezk dashboard — les données du projet désigné, les pages de la méthode', () => {
  let server: ChildProcess;
  let origin: string;

  /** Lance le tableau de bord (sans ouvrir de navigateur) et rend son adresse. */
  function start(env: Record<string, string>): Promise<{ child: ChildProcess; origin: string }> {
    const child = spawn(process.execPath, [tsxCli, join(megaCity, 'bin', 'ezk-map.ts')], {
      cwd: elsewhere,
      env: {
        ...process.env,
        EZK_MAP_NO_OPEN: '1',
        EZK_MAP_PORT: String(20000 + Math.floor(Math.random() * 20000)),
        INIT_CWD: '',
        ...env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return new Promise((done, fail) => {
      let seen = '';
      const timer = setTimeout(() => fail(new Error(`le tableau de bord n'a pas démarré : ${seen}`)), 30_000);
      child.stdout?.on('data', (chunk: Buffer) => {
        seen += chunk.toString();
        const m = /http:\/\/127\.0\.0\.1:(\d+)\//.exec(seen);
        if (m) {
          clearTimeout(timer);
          done({ child, origin: `http://127.0.0.1:${m[1]}` });
        }
      });
      child.stderr?.on('data', (chunk: Buffer) => {
        seen += chunk.toString();
      });
      child.on('exit', (code) => {
        clearTimeout(timer);
        fail(new Error(`le tableau de bord s'est arrêté (code ${code}) : ${seen}`));
      });
    });
  }

  // UN seul serveur pour tous les essais sur le projet désigné : un processus de moins par test.
  beforeAll(async () => {
    ({ child: server, origin } = await start({ EZK_ROOT: project }));
  }, 60_000);
  afterAll(() => {
    server?.kill('SIGKILL');
  });

  it('sert les données du board depuis le projet désigné, et la page depuis la méthode', async () => {
    const data = await (await fetch(`${origin}/diagrams/avancement/board.data.js`)).text();
    expect(data).toContain(PROJECT_FICHE);
    expect(data).not.toContain(A_VECTORZ_FICHE);
    expect((await fetch(`${origin}/diagrams/avancement/board.html`)).status).toBe(200);
  });

  it('ne lit rien hors de la racine (traversée), ni dans la méthode ni dans le projet', async () => {
    // `normalize` ramène ce chemin sous la racine (404) ; la garde de traversée est la 2ᵉ ligne (403).
    // Dans les deux cas, le fichier système n'est jamais servi.
    for (const path of [
      '/..%2f..%2f..%2f..%2f..%2f..%2f..%2fetc%2fpasswd',
      `/..%2f..%2f..${project.replaceAll('/', '%2f')}%2ffeatures`,
    ]) {
      const r = await fetch(`${origin}${path}`);
      expect([403, 404, 400]).toContain(r.status);
      expect(await r.text()).not.toContain('root:');
    }
  });

  it('écrit le pouce dans le projet désigné, nulle part ailleurs', async () => {
    const r = await fetch(`${origin}/api/verdict`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: PROJECT_FICHE, verdict: 'up' }),
    });
    expect(r.status).toBe(200);
    const written = join(project, 'features', 'reviews', 'verdicts', `${PROJECT_FICHE}.json`);
    expect(existsSync(written)).toBe(true);
    expect(readFileSync(written, 'utf8')).toContain('up');
    expect(existsSync(join(repoRoot, 'features', 'reviews', 'verdicts', `${PROJECT_FICHE}.json`))).toBe(false);
  });

  it('un projet qui n’existe pas : il ne démarre pas, et le dit', async () => {
    const missing = join(elsewhere, 'nulle-part');
    await expect(start({ EZK_ROOT: missing })).rejects.toThrow(/n'existe pas/);
  }, 60_000);
});
