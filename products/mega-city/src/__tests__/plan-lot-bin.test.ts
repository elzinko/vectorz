/**
 * Le lot d'un sprint, de bout en bout (fiche 20260930194219046) — de VRAIS processus sur un projet
 * JETABLE : `plan:lot` lit le PLAN et les fiches du projet désigné, puis la ligne `start --lot` qu'il
 * imprime, collée telle quelle, ouvre le sprint (`sprint.sh` fige le lot dans SPRINT.md).
 *
 * Sobre à dessein (un seul test, deux processus) : la sélection elle-même est prouvée à blanc
 * dans `backlog/__tests__/plan-lot.test.ts`.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { formatLot, selectLot } from '../backlog/plan-lot.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');

const READY_A = '20991231000000001';
const IDEA_B = '20991231000000002';
const READY_C = '20991231000000003';

let project: string;

function fiche(id: string, status: string, priority: string): void {
  writeFileSync(
    join(project, 'features', `${id}_fiche-${id.slice(-1)}.md`),
    ['---', `id: "${id}"`, `title: "Fiche ${id.slice(-1)}"`, 'type: feature', `priority: ${priority}`, `status: ${status}`, '---', ''].join('\n'),
  );
}
const git = (...args: string[]): void => {
  execFileSync('git', args, { cwd: project, stdio: 'ignore' });
};

beforeAll(() => {
  project = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-lot-')));
  mkdirSync(join(project, 'features'));
  fiche(READY_A, 'ready', 'P2');
  fiche(IDEA_B, 'idea', 'P0');
  fiche(READY_C, 'ready', 'P3');
  // Le plan place l'idea en tête : le lot doit la signaler, pas la sauter en silence.
  writeFileSync(join(project, 'features', 'PLAN.md'), `# Plan\n\n- ${IDEA_B} — à groomer groom\n- ${READY_A} — a build\n- ${READY_C} — c build\n`);
  writeFileSync(join(project, '.gitignore'), 'SPRINT.md\n');
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@test');
  git('config', 'user.name', 'test');
  git('config', 'commit.gpgsign', 'false');
  git('add', '.');
  git('commit', '-qm', 'base');
});

afterAll(() => {
  rmSync(project, { recursive: true, force: true });
});

describe('plan:lot → sprint.sh start --lot', () => {
  it('tire le lot du projet désigné dans l’ordre du plan, et sa ligne start ouvre le sprint', { timeout: 60_000 }, () => {
    const lot = spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', 'plan-lot.ts'), '2', '--root', project], {
      cwd: project,
      encoding: 'utf8',
      env: { ...process.env, EZK_ROOT: '', INIT_CWD: '' },
    });
    expect(lot.status, lot.stderr).toBe(0);
    expect(lot.stdout).toContain('lot : 2 fiche(s) prête(s) sur 2 demandée(s) — ordre du PLAN');
    expect(lot.stdout).toContain(`tête bloquée`);
    expect(lot.stdout).toContain(IDEA_B);
    // Chaque fiche listée est un lien vers son fichier, relatif au dossier d'où la commande est lancée.
    expect(lot.stdout).toContain(`[${READY_A}](features/${READY_A}_fiche-1.md)`);

    const startLine = lot.stdout.split('\n').find((l) => l.includes(' start --lot '))?.trim() ?? '';
    expect(startLine).toMatch(new RegExp(`^bash \\S+sprint\\.sh start --lot ${READY_A},${READY_C}$`));

    // Collée telle quelle depuis la racine du projet : c'est elle qui fige le lot dans le journal de
    // sprint. Depuis la fiche 20261004181110201, ce journal vit HORS du worktree (dossier git commun),
    // un fichier par branche ; sprint.sh en imprime le chemin sur la ligne SPRINT_FILE.
    const opened = spawnSync('bash', ['-c', startLine], { cwd: project, encoding: 'utf8' });
    expect(opened.stdout, opened.stderr).toContain('START: OPENED sprint=1 stories=2');
    const sprintFile = opened.stdout
      .split('\n')
      .find((l) => l.startsWith('SPRINT_FILE:'))
      ?.slice('SPRINT_FILE:'.length)
      .trim();
    if (!sprintFile) throw new Error(`SPRINT_FILE absent de la sortie start :\n${opened.stdout}`);
    const sprintMd = readFileSync(sprintFile, 'utf8');
    expect(sprintMd).toContain(`- [ ] ${READY_A} — Fiche 1`);
    expect(sprintMd).toContain(`- [ ] ${READY_C} — Fiche 3`);
  });

  it('la ligne start reste exécutable quand le chemin du script contient un espace', () => {
    const dir = join(project, 'méthode avec espace');
    mkdirSync(dir);
    const script = join(dir, 'sprint.sh');
    writeFileSync(script, 'echo "reçu: $*"\n');
    const lot = selectLot(null, [{ id: '0001', product: 'p', type: 'feature', status: 'ready', priority: 'P1', title: 'F', blocked: '', done: false }], 1);
    const startLine = formatLot(lot, { planned: false, sprintScript: script }).find((l) => l.includes(' start --lot '))?.trim() ?? '';
    const ran = spawnSync('bash', ['-c', startLine], { encoding: 'utf8' });
    expect(ran.stdout, ran.stderr).toContain('reçu: start --lot 0001');
  });
});

/**
 * Le garde-fou de séquence de bout en bout (fiche 20261010215345931, ADR-0070) : sur un projet jetable
 * avec v0.1 étiquetée, v0.2 (en cours) et v0.4 (non contiguë, supérieure), `plan:lot` ne tire que la
 * version en cours ; `--all-versions` lève le périmètre. La logique pure est prouvée dans
 * `backlog/__tests__/version-scope.test.ts` ; ici on vérifie le câblage réel du bord.
 */
describe('plan:lot — garde-fou de version (ADR-0070)', () => {
  const V1 = '20991231000000011'; // v0.1.0, livrée + étiquetée
  const V2 = '20991231000000012'; // v0.2.0, en cours (plus bas lot non étiqueté)
  const V4 = '20991231000000014'; // v0.4.0, version supérieure NON contiguë
  let vproj: string;

  function vfiche(id: string, status: string, version: string, done = false): void {
    writeFileSync(
      join(vproj, 'features', `${id}_f.md`),
      ['---', `id: "${id}"`, `title: "F ${id.slice(-2)}"`, 'type: feature', 'priority: P1', `status: ${status}`, `version: ${version}`, ...(done ? ['done: true'] : []), '---', ''].join('\n'),
    );
  }
  const vgit = (...args: string[]): void => {
    execFileSync('git', args, { cwd: vproj, stdio: 'ignore' });
  };
  const run = (extra: string[]) =>
    spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', 'plan-lot.ts'), '5', ...extra, '--root', vproj], {
      cwd: vproj,
      encoding: 'utf8',
      env: { ...process.env, EZK_ROOT: '', INIT_CWD: '' },
    });

  beforeAll(() => {
    vproj = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-lot-ver-')));
    mkdirSync(join(vproj, 'features'));
    vfiche(V1, 'shipped', 'v0.1.0', true);
    vfiche(V2, 'ready', 'v0.2.0');
    vfiche(V4, 'ready', 'v0.4.0');
    writeFileSync(join(vproj, 'features', 'PLAN.md'), `# Plan\n\n- ${V2} — courante\n- ${V4} — supérieure\n`);
    writeFileSync(join(vproj, '.gitignore'), 'SPRINT.md\n');
    vgit('init', '-q', '-b', 'main');
    vgit('config', 'user.email', 't@t');
    vgit('config', 'user.name', 't');
    vgit('config', 'commit.gpgsign', 'false');
    vgit('add', '.');
    vgit('commit', '-qm', 'base');
    vgit('tag', 'v0.1.0'); // v0.1 livrée → v0.2 devient la version en cours
  });
  afterAll(() => rmSync(vproj, { recursive: true, force: true }));

  it('par défaut, ne tire que la version en cours ; la version supérieure non contiguë est écartée', { timeout: 60_000 }, () => {
    const r = run([]);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain(V2); // v0.2.0 tirée
    expect(r.stdout).not.toContain(V4); // v0.4.0 absente du tirage (ni lot, ni introuvable)
    expect(r.stdout).toContain('écartées hors version en cours (v0.2.0)');
    expect(r.stdout).toContain('v0.4.0');
  });

  it('--all-versions lève le périmètre : la version supérieure redevient tirable, avec l’avertissement', { timeout: 60_000 }, () => {
    const r = run(['--all-versions']);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain(V4); // v0.4.0 de nouveau visible
    expect(r.stdout).toContain('--all-versions : périmètre de version LEVÉ');
  });
});
