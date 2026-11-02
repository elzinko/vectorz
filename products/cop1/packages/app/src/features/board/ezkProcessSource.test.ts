/**
 * Le process d'un projet vient de la méthode (`ezk board process --json`, fiche 20261102123552183).
 * Mission control traduit : l'étape de chaque fiche est celle que la méthode publie, jamais recalculée.
 * Les tests lisent l'exemple rangé par la méthode et injectent un faux runner, jamais un vrai `ezk`.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { EzkContractError } from './ezkPlanTranslator.js';
import { EzkProcessSource } from './ezkProcessSource.js';
import { SHIPPED_SHOWN, translateProcess } from './ezkProcessTranslator.js';
import type { EzkRunner } from './ezkSource.js';

const EXAMPLE = readFileSync(
  fileURLToPath(
    new URL('../../../../../../mega-city/contracts/board-process/v1/example.json', import.meta.url),
  ),
  'utf8',
);
// biome-ignore lint/suspicious/noExplicitAny: les tests modifient librement l'exemple du contrat
const example = (): any => JSON.parse(EXAMPLE);

describe('translateProcess — l’étape vient de la méthode', () => {
  it('chaque fiche reste dans l’étape publiée, dans l’ordre publié', () => {
    const view = translateProcess(example());
    for (const g of example().stages) {
      const translated = view.stages.find((s) => s.stage === g.stage);
      expect(translated?.fiches.map((f) => f.id)).toEqual(
        g.fiches.map((f: { id: string }) => f.id),
      );
    }
  });

  it('une fiche en sprint garde le signal qui l’y place : sa branche', () => {
    const sprint = translateProcess(example()).stages.find((s) => s.stage === 'en-sprint');
    expect(sprint?.fiches[0]).toMatchObject({
      branch: 'feat/20990101000000001-en-cours',
      pr: null,
      session: null,
    });
  });

  it('GitHub non lu : « en revue » est dite inconnue', () => {
    expect(translateProcess(example())).toMatchObject({ github: false, reviewUnknown: true });
  });

  it('les livrées sont coupées aux plus récentes, et le total publié reste dit', () => {
    const j = example();
    const livree = j.stages.find((g: { stage: string }) => g.stage === 'livree');
    const one = livree.fiches[0];
    livree.fiches = Array.from({ length: SHIPPED_SHOWN + 5 }, (_, i) => ({ ...one, id: `9${i}` }));
    const shipped = translateProcess(j).stages.find((s) => s.stage === 'livree');
    expect(shipped?.fiches).toHaveLength(SHIPPED_SHOWN);
    expect(shipped?.total).toBe(SHIPPED_SHOWN + 5);
    expect(shipped?.fiches[0]?.id).toBe('90');
  });

  it('un format inconnu est refusé, jamais deviné', () => {
    expect(() => translateProcess({ ...example(), schema_version: 2 })).toThrow(EzkContractError);
    const j = example();
    j.stages[0].fiches = [{ id: '1' }];
    expect(() => translateProcess(j)).toThrow(EzkContractError);
    expect(() =>
      translateProcess({ ...example(), stages: [{ stage: 'ailleurs', label: 'x', fiches: [] }] }),
    ).toThrow(EzkContractError);
  });
});

describe('EzkProcessSource — le process par ezk, sans attente', () => {
  it('appelle `<commande> --root <racine> board process --json` et rend le process traduit', async () => {
    const calls: string[][] = [];
    const run: EzkRunner = async (args) => {
      calls.push(args);
      return EXAMPLE;
    };
    const source = new EzkProcessSource({ command: ['ezk'], run });
    expect(source.get('/p').state).toBe('loading');
    await vi.waitFor(() => expect(source.get('/p').state).toBe('ok'));
    expect(calls).toEqual([['--root', '/p', 'board', 'process', '--json']]);
  });

  it('une réponse qui n’est pas du JSON : indisponible, jamais « en lecture » pour toujours', async () => {
    const run: EzkRunner = async () => '{ coupé';
    const source = new EzkProcessSource({ command: ['ezk'], run });
    source.get('/p');
    await vi.waitFor(() => expect(source.get('/p').state).toBe('unavailable'));
  });

  it('une méthode trop ancienne pour la commande : indisponible, avec la raison d’ezk', async () => {
    const run: EzkRunner = async () => {
      throw Object.assign(new Error('Command failed'), {
        code: 2,
        stderr: 'ezk : commande inconnue « board process »\n',
      });
    };
    const source = new EzkProcessSource({ command: ['ezk'], run });
    source.get('/p');
    await vi.waitFor(() => expect(source.get('/p').state).toBe('unavailable'));
    const snap = source.get('/p');
    expect(snap.state === 'unavailable' && snap.reason).toBe(
      'ezk a échoué (code 2) : ezk : commande inconnue « board process »',
    );
  });
});
