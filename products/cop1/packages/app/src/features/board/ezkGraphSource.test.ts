/**
 * La source de la carte de la méthode : le JSON de `ezk graph check --json` est vérifié sur l'exemple
 * rangé du contrat (lu comme une donnée, cop1 n'importe pas le code de mega-city) ; un format inconnu
 * est refusé net, jamais deviné.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EzkGraphSource, translateGraphCheck } from './ezkGraphSource.js';

const EXAMPLE = fileURLToPath(
  new URL('../../../../../../mega-city/contracts/graph-check/v1/example.json', import.meta.url),
);
const example = (): Record<string, unknown> => JSON.parse(readFileSync(EXAMPLE, 'utf8'));

describe('translateGraphCheck', () => {
  it('lit l’exemple rangé du contrat : les briques, leurs liens et les comptes', () => {
    const graph = translateGraphCheck(example());
    expect(graph.nodes).toHaveLength(5);
    expect(graph.nodes[3]).toEqual({ kind: 'command', id: 'ezk forge integrate', fichier: 'ezk-manifest.yml' });
    expect(graph.edges).toContainEqual({
      from: 'ezk-sprint',
      fromKind: 'skill',
      link: 'applies',
      verb: 'applique',
      to: 'clean-code/no-dead-code',
      toKind: 'rule',
    });
    expect(graph.nodeCount.command).toBe(2);
    expect(graph.edgeCount).toBe(3);
  });

  it('refuse un schema_version inconnu, une sorte inconnue ou un lien mal formé', () => {
    expect(() => translateGraphCheck({ ...example(), schema_version: 2 })).toThrow(/schema_version 2 inconnu/);
    expect(() => translateGraphCheck({ ...example(), nodes: [{ kind: 'gadget', id: 'x' }] })).toThrow(
      /ezk graph check --json : sorte gadget inconnue/,
    );
    expect(() => translateGraphCheck({ ...example(), edges: [{ from: 'a' }] })).toThrow(/champ fromKind absent/);
    expect(() => translateGraphCheck({ schema_version: 1, nodes: 'x' })).toThrow(/champ nodes mal formé/);
  });
});

describe('EzkGraphSource', () => {
  it('lance `ezk --root <projet> graph check --json` et sert le graphe', async () => {
    const calls: string[][] = [];
    const source = new EzkGraphSource({
      command: ['ezk'],
      run: async (args) => {
        calls.push(args);
        return JSON.stringify(example());
      },
    });
    source.get('/p');
    await new Promise((r) => setTimeout(r, 10));
    expect(calls[0]).toEqual(['--root', '/p', 'graph', 'check', '--json']);
    expect(source.get('/p').state).toBe('ok');
  });

  it('sert quand même le graphe quand ezk sort en code 1 pour signaler des liens cassés', async () => {
    const source = new EzkGraphSource({
      command: ['ezk'],
      run: async () => {
        throw Object.assign(new Error('Command failed'), {
          code: 1,
          stdout: JSON.stringify({ ...example(), broken: [{ from: 'a', to: 'b' }] }),
        });
      },
    });
    source.get('/p');
    await new Promise((r) => setTimeout(r, 10));
    expect(source.get('/p').state).toBe('ok');
  });

  it('reste indisponible quand ezk échoue sans sortie lisible', async () => {
    const source = new EzkGraphSource({
      command: ['ezk'],
      run: async () => {
        throw Object.assign(new Error('Command failed'), { code: 1, stdout: '' });
      },
    });
    source.get('/p');
    await new Promise((r) => setTimeout(r, 10));
    expect(source.get('/p').state).toBe('unavailable');
  });
});
