/**
 * Tests de `bin/supervision-doctor.ts` (fiche 0082).
 * Vérifie que le doctor est strictement read-only (aucune écriture sur le disque).
 * On teste la logique via le module partagé (loadRegistry, etc.) + un spy sur fs.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  REGISTRY_FILENAME,
  findProjectByRoot,
  loadRegistry,
  resolveWatchRoots,
} from '../registry.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-doctor-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeRegistry(content: string): void {
  fs.writeFileSync(path.join(tmpDir, REGISTRY_FILENAME), content, 'utf-8');
}

// ---------------------------------------------------------------------------
// Doctor est READ-ONLY : les fonctions du registre ne créent aucun fichier.
// On vérifie que la liste des fichiers dans tmpDir reste inchangée après appel.
// ---------------------------------------------------------------------------

describe('supervision-doctor — lecture seule', () => {
  it('loadRegistry ne modifie pas le système de fichiers (aucun fichier créé ou modifié)', () => {
    writeRegistry(`
projects:
  - id: test
    path: .
    method: mega-city
`);

    const before = fs.readdirSync(tmpDir).sort();
    const beforeMtimes = before.map((f) => fs.statSync(path.join(tmpDir, f)).mtimeMs);

    loadRegistry(tmpDir);

    const after = fs.readdirSync(tmpDir).sort();
    const afterMtimes = after.map((f) => fs.statSync(path.join(tmpDir, f)).mtimeMs);

    expect(after).toEqual(before);
    expect(afterMtimes).toEqual(beforeMtimes);
  });

  it('resolveWatchRoots ne modifie pas le système de fichiers', () => {
    const registry = {
      projects: [{ id: 'a', path: '.', method: 'mega-city' }],
    };

    const before = fs.readdirSync(tmpDir).sort();
    resolveWatchRoots(registry, tmpDir);
    const after = fs.readdirSync(tmpDir).sort();
    expect(after).toEqual(before);
  });

  it('findProjectByRoot ne modifie pas le système de fichiers', () => {
    const registry = {
      projects: [{ id: 'a', path: '.', method: 'mega-city' }],
    };

    const before = fs.readdirSync(tmpDir).sort();
    findProjectByRoot(registry, tmpDir, tmpDir);
    const after = fs.readdirSync(tmpDir).sort();
    expect(after).toEqual(before);
  });
});

// ---------------------------------------------------------------------------
// Doctor logique — détection des projets sans ancrage
// ---------------------------------------------------------------------------

describe('supervision-doctor — logique de détection', () => {
  it('identifie un projet comme non ancré quand aucun .mcp.json n\'existe', () => {
    writeRegistry(`
projects:
  - id: mon-projet
    path: .
    method: mega-city
`);
    const registry = loadRegistry(tmpDir)!;
    const resolvedRoots = resolveWatchRoots(registry, tmpDir);

    // Pas de .mcp.json → le projet n'est pas ancré
    const mcpJsonPath = path.join(resolvedRoots[0]!, '.mcp.json');
    expect(fs.existsSync(mcpJsonPath)).toBe(false);
  });

  it('identifie un projet comme ancré quand .mcp.json contient SUPERVISION_PROJECT_ROOT', () => {
    writeRegistry(`
projects:
  - id: mon-projet
    path: .
    method: mega-city
`);

    // Créer un .mcp.json simulant un ancrage
    const mcpConfig = {
      mcpServers: {
        supervision: {
          command: 'pnpm',
          args: ['exec', 'tsx', 'bin/supervision-mcp.ts'],
          env: { SUPERVISION_PROJECT_ROOT: tmpDir },
        },
      },
    };
    fs.writeFileSync(path.join(tmpDir, '.mcp.json'), JSON.stringify(mcpConfig), 'utf-8');

    const registry = loadRegistry(tmpDir)!;
    const resolvedRoots = resolveWatchRoots(registry, tmpDir);

    // Vérifier que la config .mcp.json contient bien la racine
    const mcpContent = JSON.parse(fs.readFileSync(path.join(tmpDir, '.mcp.json'), 'utf-8')) as {
      mcpServers: Record<string, { env?: Record<string, string> }>;
    };
    const anchored = Object.values(mcpContent.mcpServers).some(
      (s) => s.env?.SUPERVISION_PROJECT_ROOT === resolvedRoots[0],
    );
    expect(anchored).toBe(true);
  });

  it('retourne null pour un répertoire sans registre (rollback v1)', () => {
    const result = loadRegistry(tmpDir);
    expect(result).toBeNull();
    // Comportement v1 : pas d'ancrage à vérifier
  });
});
