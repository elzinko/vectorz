import { describe, expect, it } from 'vitest';
import { versionSequence } from '../version-sequence.js';
import type { VersionLot, VersionsReport } from '../versions.js';

/** `todo` ne sert au calcul que par sa LONGUEUR : des fiches factices suffisent. */
const fiches = (n: number): VersionLot['todo'] => Array.from({ length: n }, () => ({})) as VersionLot['todo'];

const lot = (version: string, todoCount: number, releaseTag?: string): VersionLot => ({
  version,
  state: 'en-cours',
  shipped: [],
  todo: fiches(todoCount),
  ready: [],
  blocked: [],
  intruders: [],
  ...(releaseTag !== undefined ? { releaseTag } : {}),
});

const report = (lots: VersionLot[]): VersionsReport => ({
  lots,
  malformed: [],
  unversioned: { total: 0, parked: 0 },
  terminal: 0,
  history: 0,
});

describe('version-sequence — suite de versions d\'un run multi-versions (fiche 20261013131852375)', () => {
  it('--versions all : toutes les versions à faire, dans l\'ordre du plan', () => {
    const r = report([lot('v0.14.0', 0, 'v0.14.0'), lot('v0.15.0', 3), lot('v0.16.0', 2)]);
    expect(versionSequence(r, { versions: 'all' }).sequence).toEqual(['v0.15.0', 'v0.16.0']);
  });

  it('--versions all : écarte les versions déjà livrées (étiquette) et celles sans fiche à faire', () => {
    const r = report([lot('v0.15.0', 2, 'v0.15.0'), lot('v0.16.0', 0), lot('v0.17.0', 1)]);
    expect(versionSequence(r, { versions: 'all' }).sequence).toEqual(['v0.17.0']);
  });

  it('--versions all : rien à faire → suite vide (pas une erreur)', () => {
    const r = report([lot('v0.15.0', 0, 'v0.15.0')]);
    expect(versionSequence(r, { versions: 'all' })).toEqual({ sequence: [], skipped: [] });
  });

  it('liste explicite : sortie dans l\'ordre du plan, pas l\'ordre tapé', () => {
    const r = report([lot('v0.15.0', 1), lot('v0.16.0', 1)]);
    expect(versionSequence(r, { versions: ['v0.16.0', 'v0.15.0'] }).sequence).toEqual(['v0.15.0', 'v0.16.0']);
  });

  it('liste explicite : dédoublonne', () => {
    const r = report([lot('v0.15.0', 1)]);
    expect(versionSequence(r, { versions: ['v0.15.0', 'v0.15.0'] }).sequence).toEqual(['v0.15.0']);
  });

  it('liste explicite : signale chaque version non retenue, avec sa raison (jamais tue)', () => {
    const r = report([lot('v0.15.0', 2, 'v0.15.0'), lot('v0.16.0', 0), lot('v0.17.0', 1)]);
    const { sequence, skipped } = versionSequence(r, {
      versions: ['v0.15.0', 'v0.16.0', 'v0.17.0', 'v0.99.0', 'v0.16'],
    });
    expect(sequence).toEqual(['v0.17.0']);
    // Les lisibles d'abord (ordre du plan), l'illisible rangé en fin par compareLoose.
    expect(skipped).toEqual([
      { version: 'v0.15.0', reason: 'déjà livrée (étiquette v0.15.0)' },
      { version: 'v0.16.0', reason: 'rien à faire (tout est livré ou parké)' },
      { version: 'v0.99.0', reason: 'aucune fiche ne porte cette version' },
      { version: 'v0.16', reason: 'format illisible (attendu v0.3.0)' },
    ]);
  });

  it("liste explicite : un jeton non numérique ne corrompt pas l'ordre des versions valides (bug-hunt v0.15)", () => {
    // Régression : `compareVersions` nu rendait NaN sur « vnext » et désordonnait le tri V8.
    const r = report([lot('v0.3.0', 1), lot('v0.5.0', 1), lot('v0.16.0', 1), lot('v0.17.0', 1)]);
    const { sequence, skipped } = versionSequence(r, {
      versions: ['v0.17.0', 'vnext', 'v0.3.0', 'v0.16.0', 'v0.5.0'],
    });
    expect(sequence).toEqual(['v0.3.0', 'v0.5.0', 'v0.16.0', 'v0.17.0']);
    expect(skipped).toEqual([{ version: 'vnext', reason: 'format illisible (attendu v0.3.0)' }]);
  });
});
