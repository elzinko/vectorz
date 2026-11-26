/**
 * La source de la cloche (fiche 20261126170000112) : `ezk now --json` publie le contrat `now-show/v1`.
 * Le daemon le vérifie et le relaie ; un format inconnu est refusé net, jamais deviné.
 */
import { describe, expect, it } from 'vitest';
import { nowOutput, translateNow } from './ezkNowSource.js';

const alerte = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  type: 'fiche-bloquee',
  id: '20990101000000003',
  titre: 'Bloquée',
  raison: 'panel',
  decision: 'attend un panel adverse',
  fichier: 'features/20990101000000003_bloquee.md',
  date: '2026-11-01',
  ...over,
});

const contrat = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  schema_version: 1,
  alertes: [alerte()],
  non_mesure: ['Sprints clos sans rétro : pas encore calculables.'],
  suites: [{ kind: 'suite', command: '/ezk-backlog list', reason: 'revois le stock' }],
  ...over,
});

describe('translateNow', () => {
  it('garde chaque alerte et chaque mot de « non mesuré », dans l’ordre publié', () => {
    const now = translateNow(
      contrat({ alertes: [alerte(), alerte({ type: 'version-a-poser', id: 'v1.5.0', fichier: '', date: '' })] }),
    );
    expect(now.alertes.map((a) => a.type)).toEqual(['fiche-bloquee', 'version-a-poser']);
    expect(now.alertes[0]).toEqual(alerte());
    expect(now.nonMesure).toEqual(['Sprints clos sans rétro : pas encore calculables.']);
  });

  it('une liste vide d’alertes reste une liste vide : le contrat est publié', () => {
    expect(translateNow(contrat({ alertes: [] })).alertes).toEqual([]);
  });

  it('refuse un format inconnu ou mal formé', () => {
    expect(() => translateNow(null)).toThrow(/ezk now --json/);
    expect(() => translateNow(contrat({ schema_version: 2 }))).toThrow(/schema_version 2 inconnu/);
    expect(() => translateNow(contrat({ schema_version: undefined }))).toThrow(/schema_version/);
    expect(() => translateNow(contrat({ alertes: undefined }))).toThrow(/champ alertes/);
    expect(() => translateNow(contrat({ alertes: [alerte({ type: 'inconnu' })] }))).toThrow(/type inconnu/);
    expect(() => translateNow(contrat({ alertes: [alerte({ titre: undefined })] }))).toThrow(/champ titre absent/);
    expect(() => translateNow(contrat({ non_mesure: 'x' }))).toThrow(/non_mesure/);
  });
});

describe('nowOutput', () => {
  const failWith = (stdout: unknown) => () => Promise.reject(Object.assign(new Error('ezk a échoué'), { stdout }));

  it('lance `ezk now --json` sur la racine du projet', async () => {
    let seen: string[] = [];
    const out = await nowOutput(async (args) => {
      seen = args;
      return '{}';
    }, '/p');
    expect(seen).toEqual(['--root', '/p', 'now', '--json']);
    expect(out).toBe('{}');
  });

  it('garde la sortie quand ezk sort en code non nul avec un stdout non vide', async () => {
    expect(await nowOutput(failWith('{"alertes":[]}'), '/p')).toBe('{"alertes":[]}');
  });

  it('sans sortie, l’échec remonte : la cloche dira « non publié »', async () => {
    await expect(nowOutput(failWith('  '), '/p')).rejects.toThrow(/ezk a échoué/);
    await expect(nowOutput(failWith(undefined), '/p')).rejects.toThrow(/ezk a échoué/);
  });
});
