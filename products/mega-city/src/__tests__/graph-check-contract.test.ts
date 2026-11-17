/**
 * Le contrat de `ezk graph check --json` (fiche 20261117114544666, ADR-0089).
 *
 * En clair : la sortie porte `schema_version: 1` et la liste des briques ; le nombre de briques par
 * sorte égale `nodeCount` ; la sortie réelle respecte le schéma rangé ; l'exemple rangé est à jour.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { GraphCheckSchema } from '../core/graph-check.js';
import { NODE_KINDS } from '../core/graph.js';
import { GRAPH_CHECK_EXAMPLE_FILE, GRAPH_CHECK_SCHEMA_FILE } from '../io/contract-files.js';
import { graphCheckExample } from '../io/graph-check.js';

// Le lancement de tsx est lent sous la charge de la gate (même réglage que process-show.test.ts).
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');

const real = spawnSync(
  process.execPath,
  [tsxCli, join(megaCity, 'bin', 'ezk-graph.ts'), '--json'],
  {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  },
);

describe('ezk graph check --json — la sortie réelle', () => {
  const out = JSON.parse(real.stdout);

  it('sort en code 0 : aucun lien cassé', () => {
    expect(real.status, real.stderr).toBe(0);
  });

  it('respecte le schéma, et porte schema_version: 1', () => {
    const parsed = GraphCheckSchema.safeParse(out);
    expect(parsed.success, JSON.stringify(parsed.error?.issues.slice(0, 3))).toBe(true);
    expect(out.schema_version).toBe(1);
  });

  it('le nombre de briques par sorte égale nodeCount', () => {
    for (const kind of NODE_KINDS) {
      const n = out.nodes.filter((b: { kind: string }) => b.kind === kind).length;
      expect(n, kind).toBe(out.nodeCount[kind]);
    }
  });

  it('garde les champs historiques', () => {
    for (const key of ['nodeCount', 'edgeCount', 'broken', 'orphans', 'edges', 'pathRefs']) {
      expect(out, key).toHaveProperty(key);
    }
  });

  it('chaque brique a un fichier qui la déclare ; une commande est déclarée par le manifeste', () => {
    for (const b of out.nodes) expect(typeof b.fichier, `${b.kind} ${b.id}`).toBe('string');
    const c = out.nodes.find((b: { id: string }) => b.id === 'ezk graph check');
    expect(c).toEqual({ kind: 'command', id: 'ezk graph check', fichier: 'ezk-manifest.yml' });
  });
});

describe('contracts/graph-check/v1 — schéma et exemple rangés', () => {
  it('l’exemple respecte le schéma et est à jour', () => {
    const example = JSON.parse(readFileSync(join(megaCity, GRAPH_CHECK_EXAMPLE_FILE), 'utf8'));
    expect(GraphCheckSchema.safeParse(example).success).toBe(true);
    expect(example).toEqual(JSON.parse(JSON.stringify(graphCheckExample())));
  });

  it('le schéma rangé annonce la version 1', () => {
    const schema = JSON.parse(readFileSync(join(megaCity, GRAPH_CHECK_SCHEMA_FILE), 'utf8'));
    expect(schema.properties.schema_version.const).toBe(1);
  });
});
