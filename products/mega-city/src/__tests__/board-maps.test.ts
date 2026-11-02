/**
 * `ezk board maps` (fiche 20261102123552184) : les documents de la méthode, et leur contenu par la
 * commande. Rien d'autre que le fichier d'un document listé, ou ses données calculées, n'est rendu.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { MapsContractSchema } from '../core/maps-contract.js';
import { MAPS_EXAMPLE_FILE, makeContractFixture } from '../io/contract-files.js';
import { methodMapFile, methodMapsData } from '../io/method-maps.js';

// Sous-process tsx et calcul de la carte : sous la charge de la gate, 5 s ne suffisent pas.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');

let fixture: string;
beforeAll(() => {
  fixture = makeContractFixture();
});
afterAll(() => rmSync(fixture, { recursive: true, force: true }));

const fixtureDiagrams = (): string => join(fixture, 'diagrams');

describe('board maps --json — le contrat', () => {
  it('l’exemple rangé est la sortie sur la fixture, et respecte le schéma', () => {
    const data = methodMapsData(fixtureDiagrams());
    expect(MapsContractSchema.safeParse(data).success).toBe(true);
    expect(data).toEqual(JSON.parse(readFileSync(join(megaCity, MAPS_EXAMPLE_FILE), 'utf8')));
  });

  it('un dossier sans document est ignoré', () => {
    const ids = methodMapsData(fixtureDiagrams()).documents.map((d) => d.id);
    expect(ids).toEqual(['methode-mega-city', 'qualite-composants']);
  });

  it('sur la méthode : les sept documents', () => {
    const data = methodMapsData();
    expect(MapsContractSchema.safeParse(data).success).toBe(true);
    expect(data.documents).toHaveLength(7);
  });
});

describe('board maps --file — rien d’autre que le document et ses données', () => {
  it('rend le fichier principal d’un document, octet pour octet', () => {
    const svg = methodMapFile('qualite-composants', 'diagram.svg', fixtureDiagrams());
    expect(svg).toBe(readFileSync(join(fixtureDiagrams(), 'qualite-composants', 'diagram.svg'), 'utf8'));
  });

  it('calcule les données de la carte, même absentes du disque', () => {
    expect(existsSync(join(fixtureDiagrams(), 'methode-mega-city', 'carte-interactive.data.js'))).toBe(false);
    const data = methodMapFile('methode-mega-city', 'carte-interactive.data.js', fixtureDiagrams());
    expect(data).toContain('ezk-map-data:begin');
  });

  it('refuse un autre nom, un chemin qui remonte ou un document inconnu', () => {
    expect(methodMapFile('methode-mega-city', 'meta.yaml', fixtureDiagrams())).toBeNull();
    expect(methodMapFile('methode-mega-city', '../qualite-composants/diagram.svg', fixtureDiagrams())).toBeNull();
    expect(methodMapFile('inconnu', 'diagram.svg', fixtureDiagrams())).toBeNull();
  });

  it('la commande sort en code 1 sur un nom refusé, sans rien écrire sur sa sortie', () => {
    const r = spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', 'board-maps.ts'), '--file', 'methode-mega-city', '../../etc/passwd'], {
      encoding: 'utf8',
    });
    expect(r.status).toBe(1);
    expect(r.stdout).toBe('');
    expect(r.stderr).toContain('refusé');
  });

  it('une option inconnue est refusée (code 2), jamais remplacée en silence par la liste', () => {
    const r = spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', 'board-maps.ts'), '--data', 'methode-mega-city'], {
      encoding: 'utf8',
    });
    expect(r.status).toBe(2);
    expect(r.stdout).toBe('');
    expect(r.stderr).toContain('option inconnue : --data');
  });
});
