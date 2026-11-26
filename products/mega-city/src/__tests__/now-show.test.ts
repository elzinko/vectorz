/**
 * Le contrat de `ezk now --json` (fiche 20261114131612944, ADR-086).
 *
 * En clair : sur la fixture des contrats, la commande publie une alerte par élément pour les quatre
 * types mesurés, dit en mots les deux autres, garde sa sortie texte telle quelle, et l'exemple rangé
 * pour les consommateurs est bien sa sortie.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ESCALATION_BY_REASON } from '../backlog/run-eligibility.js';
import { NowShowSchema } from '../core/now-contract.js';
import { makeContractFixture, NOW_EXAMPLE_FILE, NOW_SCHEMA_FILE, renderContractFiles } from '../io/contract-files.js';
import { nowShowData } from '../io/now-show.js';

// La fixture lance git et les tests lancent tsx : délai large sous la charge de la gate complète.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');

let fixture: string;
beforeAll(() => {
  fixture = makeContractFixture();
});
afterAll(() => rmSync(fixture, { recursive: true, force: true }));

const run = (...args: string[]) =>
  spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', 'ezk-now.ts'), ...args, '--root', fixture], { encoding: 'utf8' });
const stored = (rel: string) => readFileSync(join(megaCity, rel), 'utf8');

describe('ezk now --json — sur la fixture', () => {
  it('sort schema_version 1, respecte le schéma et dit les deux types non mesurés', () => {
    const data = nowShowData(fixture);
    expect(data.schema_version).toBe(1);
    expect(NowShowSchema.safeParse(data).success).toBe(true);
    expect(data.non_mesure.join(' ')).toMatch(/question-session/);
    expect(data.non_mesure.join(' ')).toMatch(/sprint-sans-retro/);
    expect(data.alertes.map((a) => a.type)).not.toContain('question-session');
    expect(data.alertes.map((a) => a.type)).not.toContain('sprint-sans-retro');
  });

  it('une alerte par élément : fiche bloquée, idée à groomer, proposition de rétro en attente, version à poser', () => {
    const { alertes } = nowShowData(fixture);
    const of = (type: string) => alertes.filter((a) => a.type === type);
    expect(of('fiche-bloquee')).toEqual([
      {
        type: 'fiche-bloquee',
        id: '20990101000000003',
        titre: 'Bloquée',
        raison: 'panel',
        decision: ESCALATION_BY_REASON.panel,
        fichier: 'features/20990101000000003_bloquee.md',
        date: '2026-11-01',
      },
    ]);
    expect(of('idee-a-groomer').map((a) => a.id)).toEqual([
      '20990101000000002',
      '20990101000000008',
      '20990101000000005', // P3 : après les P2, comme dans le plan
    ]);
    expect(of('proposition-retro').map((a) => [a.id, a.titre])).toEqual([
      ['docs/captures/2026-10-31-retro-premiere.md#2', 'Nommer chaque lancement'],
    ]);
    expect(of('version-a-poser').map((a) => a.id)).toEqual(['v1.5.0']);
  });

  it('la commande rend le même JSON que le cœur, sans rien écrire sur le disque du projet', () => {
    const r = run('--json');
    expect(r.status, r.stderr).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual(nowShowData(fixture));
  });

  it('la sortie texte reste celle de la boussole', () => {
    const r = run();
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toBe(
      [
        'En clair : où tu en es',
        '  dernier commit : fixture',
        '  sprint ouvert  : non',
        '  tête du plan   : rien de tirable',
        '',
        'Et maintenant ?',
        '  [Suite ] /ezk-backlog list — plus de fiche tirable dans la version en cours — revois le stock',
        '  [Piste ] /ezk-retro run — si une itération vient de se terminer',
        '',
      ].join('\n'),
    );
  });
});

describe('contracts/now-show/v1 — le schéma et l’exemple rangés', () => {
  it('sont à jour (sinon : pnpm board:contract --write)', () => {
    const files = renderContractFiles(fixture);
    expect(stored(NOW_SCHEMA_FILE)).toBe(files[NOW_SCHEMA_FILE]);
    expect(stored(NOW_EXAMPLE_FILE)).toBe(files[NOW_EXAMPLE_FILE]);
  });

  it('l’exemple est la sortie de la vraie commande et respecte le schéma, strict', () => {
    const example = JSON.parse(stored(NOW_EXAMPLE_FILE));
    expect(example).toEqual(JSON.parse(run('--json').stdout));
    expect(NowShowSchema.safeParse(example).success).toBe(true);
    expect(NowShowSchema.safeParse({ ...example, inconnu: 1 }).success).toBe(false);
  });
});
