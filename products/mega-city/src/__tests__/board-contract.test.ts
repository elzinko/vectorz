/**
 * Le contrat de `ezk board show --json` (fiche 20261029112813308, ADR-086).
 *
 * En clair : la sortie respecte le schéma rangé, les comptes suivent les règles de la méthode sur la
 * fixture des cinq cas que mission control lisait mal, les champs d'avant ne bougent pas, et le
 * schéma comme l'exemple rangés pour les consommateurs sont à jour.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { buildAvancementData } from '../core/avancement-data.js';
import { type BoardContract, BoardContractSchema, buildBoardContract } from '../core/board-contract.js';
import { TERMINAUX } from '../core/fiche-schema.js';
import {
  BOARD_EXAMPLE_FILE as EXAMPLE_FILE,
  BOARD_SCHEMA_FILE as SCHEMA_FILE,
  FIXTURE_EN_COURS,
  makeContractFixture,
  renderContractFiles,
} from '../io/contract-files.js';
import { boardShowData } from '../io/board-show.js';
import { collectInProgressIds } from '../io/sessions-collect.js';
import { type Fiche, loadFiches } from '../loaders/fiches.js';

// La fixture lance des sous-process git, et le test de la commande lance tsx : sous la charge de la
// gate complète, le délai vitest par défaut (5 s) ne suffit pas (revue du 2026-11-01). La fixture
// est construite UNE fois et partagée par tout le fichier.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const repoRoot = realpathSync(resolve(megaCity, '..', '..'));
const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');

let fixture: string;
let data: BoardContract;

beforeAll(() => {
  fixture = makeContractFixture();
  data = boardShowData(fixture);
});
afterAll(() => rmSync(fixture, { recursive: true, force: true }));

const fiche = (id: string) => data.actives.find((f) => f.id === id);
const lot = (version: string) => data.versions.lots.find((l) => l.version === version);

describe('board show --json — le contrat', () => {
  it('sort schema_version 1 et respecte le schéma, sans champ en trop', () => {
    expect(data.schema_version).toBe(1);
    expect(BoardContractSchema.safeParse(data).success).toBe(true);
  });

  it('cause 1 — une branche ouverte fait la fiche « en cours » : compte et drapeau', () => {
    expect(data.comptes.enCours).toBe(1);
    expect(fiche(FIXTURE_EN_COURS)?.enCours).toBe(true);
    expect(data.tirables).toBe(1); // la fiche en cours n'est plus du stock tirable
  });

  it('cause 2 — un titre avec « : » garde son statut et sa version', () => {
    expect(fiche('20990101000000002')).toMatchObject({ title: 'Tour Driver.js : tracking', status: 'idea', version: 'v2.0.0' });
  });

  it('cause 3 — la fiche bloquée sort avec sa raison, et dans le compte des bloquées', () => {
    expect(fiche('20990101000000003')?.blocked).toBe('panel');
    expect(data.comptes.bloquees).toBe(1);
  });

  it('cause 4 — la fiche remplacée sort du lot de sa version', () => {
    const v1 = lot('v1.0.0');
    expect([...(v1?.livrees ?? []), ...(v1?.aFaire ?? [])].sort()).toEqual([
      '20990101000000001',
      '20990101000000003',
      '20990101000000006',
    ]);
    expect(data.comptes.closes).toBe(1);
  });

  it('cause 5 — la version V1.1 est listée illisible, jamais avalée', () => {
    expect(data.versions.illisibles.map((f) => [f.id, f.version])).toEqual([['20990101000000005', 'V1.1']]);
    expect(data.versions.lots.map((l) => l.version)).toEqual(['v1.0.0', 'v2.0.0']);
  });

  it('les comptes interprétés : parkées et sans version à part, colonnes qui se partagent les fiches', () => {
    expect(data.comptes).toEqual({
      total: 8,
      idees: 3,
      pretes: 1,
      enCours: 1,
      parkees: 1,
      livrees: 1,
      closes: 1,
      autres: 0,
      bloquees: 1,
      sansVersion: 1,
    });
  });

  it('les lots : état, cycle de vie, et la version en cours nommée', () => {
    expect(data.versions.courante).toBe('v1.0.0');
    expect(data.versions.ecartees).toEqual(['v2.0.0']);
    expect(lot('v1.0.0')).toMatchObject({ etat: 'en-cours', cycleDeVie: 'brouillon', etiquette: null });
    expect(lot('v2.0.0')).toMatchObject({ cycleDeVie: 'figee', etiquetteGel: 'freeze/v2.0.0' });
    expect(lot('v1.0.0')?.bloquees).toEqual(['20990101000000003']);
  });

  it('les pouces de revue posés sortent, un fichier illisible est nommé', () => {
    expect(data.verdicts).toEqual({ '20990101000000002': { verdict: 'up', date: '2026-11-01' } });
    expect(data.verdictsIllisibles).toEqual(['features/reviews/verdicts/20990101000000003.json']);
  });

  it('les champs d’avant restent identiques à ceux du board d’avancement', () => {
    const before = buildAvancementData(loadFiches(fixture), collectInProgressIds(fixture));
    const { counts, tirables, actives, milestones, filtres } = data;
    expect({ counts, tirables, actives, milestones, filtres }).toEqual(before);
  });
});

describe('board show --json — la règle des bloquées (cœur pur)', () => {
  const f = (over: Partial<Fiche>): Fiche =>
    ({ id: '', title: '', type: 'feature', priority: 'P2', status: 'idea', milestone: '', product: '', pr: '',
      labels: [], blocked: '', version: '', file: '', done: false, ...over }) as Fiche;

  it('une fiche bloquée compte si elle est à faire, même en cours ; jamais si elle est parkée ou livrée', () => {
    const contract = buildBoardContract({
      fiches: [
        f({ id: 'a', status: 'ready', blocked: 'panel' }),
        f({ id: 'b', status: 'ready', blocked: 'design' }), // en cours : compte
        f({ id: 'c', status: 'idea', milestone: 'parked', blocked: 'panel' }), // parkée : ne compte pas
        f({ id: 'd', status: 'shipped', done: true, blocked: 'panel' }), // livrée : ne compte pas
      ],
      inProgressIds: new Set(['b']),
      tags: new Set(),
      verdicts: { verdicts: {}, illisibles: [] },
    });
    expect(contract.comptes.bloquees).toBe(2);
    expect(contract.comptes).toMatchObject({ pretes: 1, enCours: 1, parkees: 1, livrees: 1 });
  });
});

describe('board show --json — sur le vrai dépôt', () => {
  it('la sortie respecte le schéma, et les comptes interprétés recoupent les statuts écrits', () => {
    const real = boardShowData(repoRoot);
    expect(BoardContractSchema.safeParse(real).success).toBe(true);
    // Recoupements qui échouent si une fiche change de colonne à tort (pas une simple somme).
    expect(real.comptes.livrees).toBe(real.counts.shipped ?? 0);
    expect(real.comptes.closes).toBe(TERMINAUX.reduce((n, t) => n + (real.counts[t] ?? 0), 0));
    expect(real.comptes.pretes).toBeLessThanOrEqual(real.counts.ready ?? 0);
    expect(real.comptes.idees + real.comptes.parkees).toBeLessThanOrEqual(real.counts.idea ?? 0);
  });
});

describe('board show --json — les fichiers rangés pour les consommateurs', () => {
  it('le schéma et l’exemple sont à jour (sinon : pnpm board:contract --write)', () => {
    for (const [rel, text] of Object.entries(renderContractFiles(fixture))) {
      expect(readFileSync(join(megaCity, rel), 'utf8'), `${rel} n'est plus à jour`).toBe(text);
    }
  });

  it('l’exemple est bien la sortie de la vraie commande sur la fixture', () => {
    const r = spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', 'avancement.ts'), '--json', '--root', fixture], {
      encoding: 'utf8',
    });
    expect(r.status, r.stderr).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual(JSON.parse(readFileSync(join(megaCity, EXAMPLE_FILE), 'utf8')));
  });

  it('l’exemple rangé respecte le schéma ; le producteur décrit chaque champ qu’il sort', () => {
    const example = JSON.parse(readFileSync(join(megaCity, EXAMPLE_FILE), 'utf8'));
    expect(BoardContractSchema.safeParse(example).success).toBe(true);
    // Le schéma zod est strict : un champ sorti sans être décrit ferait échouer ce test.
    expect(BoardContractSchema.safeParse({ ...example, inconnu: 1 }).success).toBe(false);
    const schema = JSON.parse(readFileSync(join(megaCity, SCHEMA_FILE), 'utf8'));
    expect(schema.properties.schema_version.const).toBe(example.schema_version);
    expect(Object.keys(schema.properties).sort()).toEqual(Object.keys(example).sort());
  });

  it('le schéma publié tolère un champ ajouté : il n’interdit aucun champ en plus', () => {
    const text = readFileSync(join(megaCity, SCHEMA_FILE), 'utf8');
    expect(text).not.toContain('"additionalProperties": false');
  });
});
