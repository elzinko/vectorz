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

    const startLine = lot.stdout.split('\n').find((l) => l.includes(' start --lot '))?.trim() ?? '';
    expect(startLine).toMatch(new RegExp(`^bash \\S+sprint\\.sh start --lot ${READY_A},${READY_C}$`));

    // Collée telle quelle depuis la racine du projet : c'est elle qui fige le lot dans SPRINT.md.
    const opened = spawnSync('bash', ['-c', startLine], { cwd: project, encoding: 'utf8' });
    expect(opened.stdout, opened.stderr).toContain('START: OPENED sprint=1 stories=2');
    const sprintMd = readFileSync(join(project, 'SPRINT.md'), 'utf8');
    expect(sprintMd).toContain(`- [ ] ${READY_A} — Fiche 1`);
    expect(sprintMd).toContain(`- [ ] ${READY_C} — Fiche 3`);
  });
});
