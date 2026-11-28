/**
 * L'annuaire de la méthode lit `ezk help --json` (fiche 20261128093846629). Le relais fait passer
 * l'exemple rangé du contrat et vérifie que chaque champ en ressort ; un format inconnu est refusé.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { EzkHelpSource, translateHelp } from './ezkHelpSource.js';
import { EzkContractError } from './ezkPlanTranslator.js';
import type { EzkRunner } from './ezkSource.js';

const EXAMPLE = readFileSync(
  fileURLToPath(
    new URL('../../../../../../mega-city/contracts/help/v1/example.json', import.meta.url),
  ),
  'utf8',
);
// biome-ignore lint/suspicious/noExplicitAny: les tests modifient librement l'exemple du contrat
const example = (): any => JSON.parse(EXAMPLE);

describe('translateHelp — chaque champ de l’exemple du contrat ressort', () => {
  it('les commandes gardent domaine, verbe, résumé, script, écriture, ancien nom, étage et famille', () => {
    const help = translateHelp(example());
    expect(help.commandes).toHaveLength(example().commandes.length);
    example().commandes.forEach((c: Record<string, unknown>, i: number) => {
      expect(help.commandes[i]).toEqual({
        domaine: c.domaine,
        verbe: c.verbe,
        enClair: c.enClair,
        script: c.script,
        ecritLeProjet: c.ecritLeProjet,
        deprecie: c.deprecie,
        etage: c.etage,
        famille: c.famille,
      });
    });
  });

  it('les skills gardent id, description, sous-commandes, fichier, étage et famille', () => {
    const help = translateHelp(example());
    expect(help.skills).toEqual(
      example().skills.map((s: Record<string, unknown>) => ({
        id: s.id,
        description: s.description,
        sousCommandes: s.sousCommandes,
        fichier: s.fichier,
        etage: s.etage,
        famille: s.famille,
      })),
    );
  });

  it('les agents gardent id, description, fichier, modèle et effort', () => {
    const help = translateHelp(example());
    expect(help.agents).toEqual(
      example().agents.map((a: Record<string, unknown>) => ({
        id: a.id,
        description: a.description,
        fichier: a.fichier,
        etage: a.etage,
        famille: a.famille,
        modele: a.modele,
        effort: a.effort,
      })),
    );
  });

  it('un format inconnu est refusé, jamais deviné', () => {
    expect(() => translateHelp({ ...example(), schema_version: 2 })).toThrow(EzkContractError);
    const a = example();
    a.commandes[0].enClair = undefined;
    expect(() => translateHelp(a)).toThrow(EzkContractError);
    const b = example();
    b.skills[0].sousCommandes = 'help';
    expect(() => translateHelp(b)).toThrow(EzkContractError);
    const c = example();
    c.agents = 'aucun';
    expect(() => translateHelp(c)).toThrow(EzkContractError);
    const d = example();
    d.commandes[0].ecritLeProjet = 'non';
    expect(() => translateHelp(d)).toThrow(EzkContractError);
  });
});

describe('EzkHelpSource — jamais d’attente', () => {
  it('appelle `<commande> --root <racine> help --json`, puis sert l’annuaire traduit', async () => {
    const calls: string[][] = [];
    const run: EzkRunner = async (args) => {
      calls.push(args);
      return EXAMPLE;
    };
    const source = new EzkHelpSource({ command: ['ezk'], run });
    expect(source.get('/p').state).toBe('loading');
    await vi.waitFor(() => expect(source.get('/p').state).toBe('ok'));
    expect(calls).toEqual([['--root', '/p', 'help', '--json']]);
    const snap = source.get('/p');
    expect(snap.state === 'ok' && snap.help.skills).toHaveLength(example().skills.length);
  });
});
