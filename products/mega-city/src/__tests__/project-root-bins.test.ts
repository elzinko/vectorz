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
import { networkInterfaces, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildAvancementData } from '../core/avancement-data.js';
import { loadFiches } from '../loaders/fiches.js';

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

/** Lance le tableau de bord (sans ouvrir de navigateur) et rend son adresse. */
function startDashboard(env: Record<string, string>): Promise<{ child: ChildProcess; origin: string }> {
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

describe('ezk dashboard — les données du projet désigné, les pages de la méthode', () => {
  let server: ChildProcess;
  let origin: string;

  // UN seul serveur pour tous les essais sur le projet désigné : un processus de moins par test.
  beforeAll(async () => {
    ({ child: server, origin } = await startDashboard({ EZK_ROOT: project }));
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
    await expect(startDashboard({ EZK_ROOT: missing })).rejects.toThrow(/n'existe pas/);
  }, 60_000);
});

// Le cockpit (ADR-0062, fiche 20261004192802897) : une barre « Projet » lit le registre de la
// supervision ; le cookie du choix décide d'où viennent les données et le pouce. Le serveur lit ici
// un registre d'essai (EZK_COCKPIT_REGISTRY), jamais celui de vectorz.
describe('le cockpit — choisir un projet du registre sans relancer le serveur', () => {
  const COCKPIT_FICHE = '20991231000000002';
  let registry: string;
  let server: ChildProcess;
  let origin: string;
  // Le cookie est propre au port du serveur : deux tableaux de bord ne partagent pas leur choix.
  const cookie = (id: string) => ({ cookie: `ezk-projet-${new URL(origin).port}=${encodeURIComponent(id)}` });

  beforeAll(async () => {
    registry = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-registre-')));
    const project = (name: string, readme: string | null, fiche = false) => {
      mkdirSync(join(registry, name, 'features'), { recursive: true });
      if (readme !== null) writeFileSync(join(registry, name, 'features', 'README.md'), readme);
      if (fiche) {
        writeFileSync(
          join(registry, name, 'features', `${COCKPIT_FICHE}_fiche-du-cockpit.md`),
          ['---', `id: "${COCKPIT_FICHE}"`, 'title: "Fiche du cockpit"', 'type: feature', 'priority: P2',
            'status: ready', 'created: 2099-12-31', '---', '', '# Une fiche du projet choisi', ''].join('\n'),
        );
      }
    };
    project('courant', '---\nlayout_version: 5\n---\n', true);
    project('ancien', '---\nlayout_version: 4\n---\n', true);
    project('sans-format', null, true);
    project('bmad', null);
    writeFileSync(
      join(registry, 'supervision.registry.yaml'),
      ['projects:',
        '  - { id: courant, path: courant, method: mega-city }',
        '  - { id: ancien, path: ancien, method: mega-city }',
        '  - { id: sans-format, path: sans-format, method: mega-city }',
        '  - { id: bmad, path: bmad, method: bmad }',
        '  - { id: parti, path: nulle-part, method: mega-city }',
        ''].join('\n'),
    );
    ({ child: server, origin } = await startDashboard({ EZK_COCKPIT_REGISTRY: registry, EZK_ROOT: '' }));
  }, 60_000);

  afterAll(() => {
    server?.kill('SIGKILL');
    rmSync(registry, { recursive: true, force: true });
  });

  it('la page liste les projets du registre, avec l’état de ceux qu’on ne sait pas lire', async () => {
    const html = await (await fetch(`${origin}/`)).text();
    for (const id of ['courant', 'ancien', 'sans-format', 'bmad', 'parti']) expect(html).toContain(`value="${id}"`);
    expect(html).toContain('ancien — format en retard (version 4, attendue 5)');
    expect(html).toContain('sans-format — format de fiches non pris en charge');
    expect(html).toContain('bmad — méthode non prise en charge (bmad)');
    expect(html).toContain('parti — introuvable sur le disque');
  });

  it('choisir un projet pose le cookie ; ses fiches arrivent, sans relancer le serveur', async () => {
    const back = '/diagrams/avancement/board.html';
    const r = await fetch(`${origin}/projet?id=courant&retour=${encodeURIComponent(back)}`, { redirect: 'manual' });
    expect(r.status).toBe(303);
    expect(r.headers.get('set-cookie')).toContain(`ezk-projet-${new URL(origin).port}=courant`);
    expect(r.headers.get('location')).toBe(back);
    const data = await (await fetch(`${origin}/diagrams/avancement/board.data.js`, { headers: cookie('courant') })).text();
    expect(data).toContain(COCKPIT_FICHE);
    expect(data).not.toContain(A_VECTORZ_FICHE);
    const page = await (await fetch(`${origin}/diagrams/avancement/board.html`, { headers: cookie('courant') })).text();
    expect(page).toContain('Avancement — courant</h1>');
    expect(page).toContain('<option value="courant" selected>');
  });

  it('sans choix : les fiches du projet du lancement, et la page telle qu’avant', async () => {
    const data = await (await fetch(`${origin}/diagrams/avancement/board.data.js`)).text();
    expect(data).toContain(A_VECTORZ_FICHE);
    expect(data).not.toContain(COCKPIT_FICHE);
    const page = await (await fetch(`${origin}/diagrams/avancement/board.html`)).text();
    expect(page).toContain('Avancement — vectorz</h1>');
  });

  it('un cookie posé pour un autre port est ignoré : le choix ne fuit pas d’un serveur à l’autre', async () => {
    const data = await (await fetch(`${origin}/diagrams/avancement/board.data.js`, { headers: { cookie: 'ezk-projet-1=courant' } })).text();
    expect(data).toContain(A_VECTORZ_FICHE);
    expect(data).not.toContain(COCKPIT_FICHE);
  });

  it('un choix périmé ne coince pas : la page le montre et offre le retour', async () => {
    const page = await fetch(`${origin}/diagrams/avancement/board.html`, { headers: cookie('retire-du-registre') });
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain('<option value="retire-du-registre" selected>(inconnu) retire-du-registre</option>');
    expect(html).toContain('href="/projet?id=&amp;retour=');
    const back = await fetch(`${origin}/projet?id=&retour=${encodeURIComponent('/diagrams/avancement/board.html')}`, { redirect: 'manual' });
    expect(back.status).toBe(303);
    expect(back.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('le retour après un choix ne quitte jamais le serveur', async () => {
    for (const retour of ['//ailleurs.example/x', '/\t/ailleurs.example', 'https://ailleurs.example']) {
      const r = await fetch(`${origin}/projet?id=&retour=${encodeURIComponent(retour)}`, { redirect: 'manual' });
      expect(r.status).toBe(303);
      expect(r.headers.get('location')).toBe('/');
    }
  });

  it('un identifiant inconnu est refusé : ni cookie, ni donnée', async () => {
    const r = await fetch(`${origin}/projet?id=${encodeURIComponent('../../etc')}`, { redirect: 'manual' });
    expect(r.status).toBe(400);
    expect(r.headers.get('set-cookie')).toBeNull();
    const data = await fetch(`${origin}/diagrams/avancement/board.data.js`, { headers: cookie('../../etc') });
    expect(data.status).toBe(400);
    const body = await data.text();
    expect(body).not.toContain(A_VECTORZ_FICHE);
    expect(body).not.toContain(COCKPIT_FICHE);
  });

  it('un projet qu’on ne sait pas lire : aucune fiche, l’état à la place, et la page tient', async () => {
    const cases: Array<[string, string]> = [
      ['ancien', 'format en retard (version 4, attendue 5)'],
      ['sans-format', 'format de fiches non pris en charge'],
      ['bmad', 'méthode non prise en charge (bmad)'],
      ['parti', 'introuvable sur le disque'],
    ];
    for (const [id, label] of cases) {
      const data = await fetch(`${origin}/diagrams/avancement/board.data.js`, { headers: cookie(id) });
      expect(data.status).toBe(409);
      const body = await data.text();
      expect(body).toContain(label);
      expect(body).not.toContain(COCKPIT_FICHE);
      const page = await fetch(`${origin}/diagrams/avancement/board.html`, { headers: cookie(id) });
      expect(page.status).toBe(200);
      expect(await page.text()).toContain(`${id} : ${label} — aucune fiche affichée.`);
    }
  });

  it('le pouce s’écrit dans le projet choisi, et seulement là', async () => {
    const r = await fetch(`${origin}/api/verdict`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...cookie('courant') },
      body: JSON.stringify({ id: COCKPIT_FICHE, verdict: 'up' }),
    });
    expect(r.status).toBe(200);
    expect(existsSync(join(registry, 'courant', 'features', 'reviews', 'verdicts', `${COCKPIT_FICHE}.json`))).toBe(true);
    expect(existsSync(join(repoRoot, 'features', 'reviews', 'verdicts', `${COCKPIT_FICHE}.json`))).toBe(false);
    const refused = await fetch(`${origin}/api/verdict`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...cookie('ancien') },
      body: JSON.stringify({ id: COCKPIT_FICHE, verdict: 'up' }),
    });
    expect(refused.status).toBe(409);
    expect(existsSync(join(registry, 'ancien', 'features', 'reviews'))).toBe(false);
  });

  // Une adresse de la machine hors boucle locale : le serveur ne doit pas y répondre.
  const lanAddress = Object.values(networkInterfaces())
    .flat()
    .find((i) => i && i.family === 'IPv4' && !i.internal)?.address;
  it.skipIf(lanAddress === undefined)('le serveur n’écoute que sur la boucle locale (127.0.0.1)', async () => {
    const port = new URL(origin).port;
    await expect(fetch(`http://${lanAddress}:${port}/`, { signal: AbortSignal.timeout(3000) })).rejects.toThrow();
  });
});

