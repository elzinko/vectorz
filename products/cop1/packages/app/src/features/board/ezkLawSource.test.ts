/**
 * La loi d'un projet vient de la méthode (`ezk law show --json`, fiche 20260826222044335). Mission
 * control traduit sans recompter, et répond tout de suite depuis la mémoire, même quand `ezk` tourne.
 * Les tests lisent l'exemple rangé par la méthode et injectent un faux runner.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { EzkLawSource } from './ezkLawSource.js';
import { translateLaw } from './ezkLawTranslator.js';
import { EzkContractError } from './ezkPlanTranslator.js';
import type { EzkRunner } from './ezkSource.js';

const EXAMPLE = readFileSync(
  fileURLToPath(
    new URL('../../../../../../mega-city/contracts/law-show/v1/example.json', import.meta.url),
  ),
  'utf8',
);
// biome-ignore lint/suspicious/noExplicitAny: les tests modifient librement l'exemple du contrat
const example = (): any => JSON.parse(EXAMPLE);

describe('translateLaw — les comptes et la portée viennent de la méthode', () => {
  it('les six comptes et le total valent ceux du contrat', () => {
    const { total, partout, projet, demarrage, citee, rangee, orpheline } = example().comptes;
    expect(translateLaw(example()).comptes).toEqual({
      total,
      partout,
      projet,
      demarrage,
      citee,
      rangee,
      orpheline,
    });
  });

  it('chaque règle garde sa portée, ses bundles, ses profils et qui l’applique', () => {
    const law = translateLaw(example());
    expect(law.regles).toHaveLength(example().regles.length);
    for (const r of example().regles) {
      const t = law.regles.find((x) => x.id === r.id);
      expect(t).toMatchObject({ portee: r.portee, bundles: r.bundles, profils: r.profils });
      expect(t?.appliqueePar).toEqual(r.appliqueePar.map((a: { objet: string }) => a.objet));
    }
  });

  it('les colonnes ne portent que les skills et les agents', () => {
    const law = translateLaw(example());
    expect(law.objets.every((o) => o.type === 'skill' || o.type === 'agent')).toBe(true);
    const expected = example().objets.filter(
      (o: { type: string }) => o.type === 'skill' || o.type === 'agent',
    );
    expect(law.objets.map((o) => o.id)).toEqual(expected.map((o: { id: string }) => o.id));
  });

  it('un format inconnu est refusé, jamais deviné', () => {
    expect(() => translateLaw({ ...example(), schema_version: 2 })).toThrow(EzkContractError);
    const j = example();
    j.regles[0].portee = 'ailleurs';
    expect(() => translateLaw(j)).toThrow(EzkContractError);
    const k = example();
    k.comptes = { total: 1 };
    expect(() => translateLaw(k)).toThrow(EzkContractError);
  });
});

describe('EzkLawSource — jamais d’attente, relue toutes les cinq minutes', () => {
  it('appelle `<commande> --root <racine> law show --json`, puis sert la loi traduite', async () => {
    const calls: string[][] = [];
    const run: EzkRunner = async (args) => {
      calls.push(args);
      return EXAMPLE;
    };
    const source = new EzkLawSource({ command: ['ezk'], run });
    expect(source.get('/p').state).toBe('loading');
    await vi.waitFor(() => expect(source.get('/p').state).toBe('ok'));
    expect(calls).toEqual([['--root', '/p', 'law', 'show', '--json']]);
  });

  it('répond en moins de 100 ms pendant qu’un appel à ezk tourne', () => {
    const source = new EzkLawSource({ command: ['ezk'], run: () => new Promise<string>(() => {}) });
    const t0 = performance.now();
    expect(source.get('/p').state).toBe('loading');
    expect(performance.now() - t0).toBeLessThan(100);
  });

  it('ne relit pas avant cinq minutes', async () => {
    let t = 1; // 0 vaut « jamais lue » pour la source
    const run = vi.fn<EzkRunner>(async () => EXAMPLE);
    const source = new EzkLawSource({ command: ['ezk'], run, now: () => t });
    source.get('/p');
    await vi.waitFor(() => expect(source.get('/p').state).toBe('ok'));
    t = 60_001;
    source.get('/p');
    expect(run).toHaveBeenCalledTimes(1);
    t = 6 * 60_000 + 1;
    source.get('/p');
    expect(run).toHaveBeenCalledTimes(2);
  });
});
