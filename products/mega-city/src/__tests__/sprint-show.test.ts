/**
 * Le contrat de `ezk sprint show <slug> --json` (fiche 20261114131612204, ADR-086).
 *
 * En clair : un compte rendu de sprint sort en JSON, section par section (« En clair », lot scellé,
 * détail, abandon), avec son numéro continu, son but et sa branche. Un slug inconnu rend le code 1 et
 * une phrase. `board show` et `sprint show` lisent la même source : le JSON rangé à côté du compte
 * rendu quand il existe, sinon le markdown.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { SPRINT_SHOW_SCHEMA_VERSION, SprintShowSchema } from '../core/sprint-show-contract.js';
import { boardShowData } from '../io/board-show.js';
import {
  SPRINT_SHOW_EXAMPLE_FILE as EXAMPLE_FILE,
  makeContractFixture,
  renderContractFiles,
} from '../io/contract-files.js';
import { sprintShowData } from '../io/sprint-show.js';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');

let fixture: string;
beforeAll(() => {
  fixture = makeContractFixture();
});
afterAll(() => rmSync(fixture, { recursive: true, force: true }));

describe('sprint show — le compte rendu en champs', () => {
  it('porte le schema_version, le numéro continu, le but complet, la branche et la source', () => {
    const show = sprintShowData(fixture, 'second');
    expect(show).toMatchObject({
      schema_version: SPRINT_SHOW_SCHEMA_VERSION,
      sprint: {
        slug: 'second',
        numero: 2,
        but: 'Publier le second sprint avec son numéro continu',
        branche: 'main',
        debut: '2026-10-31T09:00:00.000Z',
        fin: '2026-10-31T09:42:00.000Z',
        fichier: 'docs/sprints/2026-10-31-sprint-second.md',
        source: 'json',
      },
    });
  });

  it('les sections sont des champs : lot scellé, détail, « En clair » et abandon', () => {
    const { sections } = sprintShowData(fixture, 'second')!;
    expect(Object.keys(sections).sort()).toEqual(['abandon', 'detail', 'enClair', 'lotScelle']);
    expect(sections.lotScelle).toEqual([
      { id: '20990101000000001', title: 'Une fiche livrée', resultat: 'livree' },
      { id: '20990101000000006', title: 'Livrée', resultat: 'livree' },
      { id: '20990101000000002', title: 'Une fiche reportée', resultat: 'reportee' },
    ]);
    expect(sections.detail).toMatchObject({ dureeMs: 2520000, tokens: 100, blocages: 0 });
    expect(sections.detail.livrees.map((f) => f.id)).toEqual(['20990101000000001', '20990101000000006']);
    expect(sections.abandon).toBeNull();
  });

  it('un compte rendu d’avant (markdown seul) : numéro = rang, but et branche à null, jamais devinés', () => {
    const show = sprintShowData(fixture, 'premier')!;
    expect(show.sprint).toMatchObject({ numero: 1, but: null, branche: null, debut: null, source: 'markdown' });
    expect(show.sections.lotScelle).toEqual([{ id: '20990101000000006', title: 'Livrée', resultat: 'livree' }]);
    expect(show.sections.enClair).toBeNull();
  });

  it('un slug inconnu n’a pas d’entrée', () => {
    expect(sprintShowData(fixture, 'slug-inconnu')).toBeUndefined();
  });

  it('`board show` et `sprint show` publient les mêmes faits pour un même sprint', () => {
    const fromBoard = boardShowData(fixture).sprints.find((s) => s.slug === 'second')!;
    const { sprint } = sprintShowData(fixture, 'second')!;
    expect({ numero: sprint.numero, but: sprint.but, debut: sprint.debut, fin: sprint.fin, branche: sprint.branche }).toEqual({
      numero: fromBoard.numero,
      but: fromBoard.but,
      debut: fromBoard.debut,
      fin: fromBoard.fin,
      branche: fromBoard.branche,
    });
  });
});

describe('sprint show — la commande', () => {
  const run = (...args: string[]) =>
    spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', 'sprint-show.ts'), ...args, '--root', fixture], { encoding: 'utf8' });

  it('--json sort le contrat, qui respecte le schéma', () => {
    const r = run('second', '--json');
    expect(r.status, r.stderr).toBe(0);
    expect(SprintShowSchema.safeParse(JSON.parse(r.stdout)).success).toBe(true);
  });

  it('un slug inconnu rend le code 1 et une phrase, rien sur la sortie standard', () => {
    const r = run('slug-inconnu', '--json');
    expect(r.status).toBe(1);
    expect(r.stdout).toBe('');
    // Hors la ligne « Projet visé » que pose tout `--root`, l'erreur tient en une phrase.
    expect(r.stderr.trim().split('\n').filter((l) => !l.startsWith('Projet visé'))).toHaveLength(1);
    expect(r.stderr).toContain('slug-inconnu');
  });

  it('sans slug : le code 2 et l’usage', () => {
    const r = run('--json');
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('usage');
  });

  it('sans --json : le compte rendu en clair', () => {
    const r = run('second');
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain('Sprint 2');
    expect(r.stdout).toContain('Publier le second sprint avec son numéro continu');
  });
});

describe('sprint show — les fichiers rangés', () => {
  it('l’exemple rangé est la sortie de la commande sur la fixture, et respecte le schéma', () => {
    const example = JSON.parse(readFileSync(join(megaCity, EXAMPLE_FILE), 'utf8'));
    expect(SprintShowSchema.safeParse(example).success).toBe(true);
    expect(SprintShowSchema.safeParse({ ...example, inconnu: 1 }).success).toBe(false);
    expect(example).toEqual(JSON.parse(JSON.stringify(sprintShowData(fixture, 'second'))));
  });

  it('le schéma et l’exemple sont à jour (sinon : pnpm board:contract --write)', () => {
    const files = renderContractFiles(fixture);
    expect(Object.keys(files)).toContain('contracts/sprint-show/v1/schema.json');
    for (const [rel, text] of Object.entries(files)) {
      expect(readFileSync(join(megaCity, rel), 'utf8'), `${rel} n'est plus à jour`).toBe(text);
    }
  });
});
