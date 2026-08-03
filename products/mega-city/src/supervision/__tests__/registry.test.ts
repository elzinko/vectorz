/**
 * Tests du module `registry.ts` (fiche 0082).
 * Couvre : validation du schéma, champs interdits, loadRegistry, resolveWatchRoots,
 * findProjectByRoot.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  REGISTRY_FILENAME,
  appendRegistryProject,
  findProjectByRoot,
  loadRegistry,
  pathLabelForRegistry,
  resolveWatchRoots,
} from '../registry.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-registry-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeRegistry(content: string): void {
  fs.writeFileSync(path.join(tmpDir, REGISTRY_FILENAME), content, 'utf-8');
}

// ---------------------------------------------------------------------------
// loadRegistry — absense de fichier
// ---------------------------------------------------------------------------

describe('loadRegistry — sans fichier', () => {
  it('retourne null quand aucun supervision.registry.yaml (rollback v1)', () => {
    const result = loadRegistry(tmpDir);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// loadRegistry — schéma valide
// ---------------------------------------------------------------------------

describe('loadRegistry — schéma valide', () => {
  it('charge un registre minimal avec un projet', () => {
    writeRegistry(`
projects:
  - id: mon-projet
    path: .
    method: mega-city
`);
    const registry = loadRegistry(tmpDir);
    expect(registry).not.toBeNull();
    expect(registry!.projects).toHaveLength(1);
    expect(registry!.projects[0]).toEqual({ id: 'mon-projet', path: '.', method: 'mega-city' });
  });

  it('charge un registre multi-projets', () => {
    writeRegistry(`
projects:
  - id: projet-a
    path: .
    method: mega-city
  - id: projet-b
    path: /abs/path/to/b
    method: bmad
`);
    const registry = loadRegistry(tmpDir);
    expect(registry!.projects).toHaveLength(2);
    expect(registry!.projects[1]!.method).toBe('bmad');
  });

  it('normalise les espaces autour des valeurs de chaînes', () => {
    writeRegistry(`
projects:
  - id: "  mon-id  "
    path: "  ./src  "
    method: "  mega-city  "
`);
    const registry = loadRegistry(tmpDir);
    expect(registry!.projects[0]).toEqual({ id: 'mon-id', path: './src', method: 'mega-city' });
  });
});

// ---------------------------------------------------------------------------
// loadRegistry — champs interdits (aucun chemin de journal)
// ---------------------------------------------------------------------------

describe('loadRegistry — champs interdits', () => {
  const forbiddenCases = [
    ['journal', 'journal: /some/path'],
    ['journal_path', 'journal_path: /some/path'],
    ['journal_dir', 'journal_dir: /some/dir'],
    ['supervision_path', 'supervision_path: /some/path'],
    ['log_path', 'log_path: /some/log'],
  ];

  for (const [fieldName, fieldYaml] of forbiddenCases) {
    it(`rejette un projet avec le champ interdit "${fieldName}"`, () => {
      writeRegistry(`
projects:
  - id: mon-projet
    path: .
    method: mega-city
    ${fieldYaml}
`);
      expect(() => loadRegistry(tmpDir)).toThrow(fieldName as string);
    });
  }
});

// ---------------------------------------------------------------------------
// loadRegistry — erreurs de schéma
// ---------------------------------------------------------------------------

describe('loadRegistry — erreurs de schéma', () => {
  it('lance une erreur si le fichier n\'est pas un objet YAML', () => {
    writeRegistry('- juste une liste');
    expect(() => loadRegistry(tmpDir)).toThrow();
  });

  it('lance une erreur si "projects" n\'est pas un tableau', () => {
    writeRegistry('projects: "pas un tableau"');
    expect(() => loadRegistry(tmpDir)).toThrow('"projects" doit être un tableau');
  });

  it('lance une erreur si id est vide', () => {
    writeRegistry(`
projects:
  - id: ""
    path: .
    method: mega-city
`);
    expect(() => loadRegistry(tmpDir)).toThrow('id');
  });

  it('lance une erreur si path est absent', () => {
    writeRegistry(`
projects:
  - id: mon-projet
    method: mega-city
`);
    expect(() => loadRegistry(tmpDir)).toThrow('path');
  });

  it('lance une erreur si method est absent', () => {
    writeRegistry(`
projects:
  - id: mon-projet
    path: .
`);
    expect(() => loadRegistry(tmpDir)).toThrow('method');
  });
});

// ---------------------------------------------------------------------------
// resolveWatchRoots
// ---------------------------------------------------------------------------

describe('resolveWatchRoots', () => {
  it('résout les chemins relatifs par rapport au répertoire du registre', () => {
    const registry = {
      projects: [
        { id: 'a', path: '.', method: 'mega-city' },
        { id: 'b', path: './sub', method: 'bmad' },
      ],
    };
    const roots = resolveWatchRoots(registry, '/my/project');
    expect(roots).toEqual(['/my/project', '/my/project/sub']);
  });

  it('laisse les chemins absolus tels quels', () => {
    const registry = {
      projects: [{ id: 'a', path: '/abs/path', method: 'mega-city' }],
    };
    const roots = resolveWatchRoots(registry, '/ignored');
    expect(roots).toEqual(['/abs/path']);
  });
});

// ---------------------------------------------------------------------------
// findProjectByRoot
// ---------------------------------------------------------------------------

describe('findProjectByRoot', () => {
  it('retrouve un projet par sa racine résolue', () => {
    const registry = {
      projects: [
        { id: 'vectorz', path: '.', method: 'mega-city' },
        { id: 'autre', path: './other', method: 'bmad' },
      ],
    };
    const result = findProjectByRoot(registry, '/my/repo', '/my/repo');
    expect(result).toEqual({ id: 'vectorz', path: '.', method: 'mega-city' });
  });

  it('retourne undefined si la racine n\'est pas dans le registre', () => {
    const registry = {
      projects: [{ id: 'a', path: '.', method: 'mega-city' }],
    };
    const result = findProjectByRoot(registry, '/my/repo', '/other/root');
    expect(result).toBeUndefined();
  });

  it('retrouve un projet par chemin absolu', () => {
    const registry = {
      projects: [{ id: 'x', path: '/abs/path', method: 'bmad' }],
    };
    const result = findProjectByRoot(registry, '/ignored', '/abs/path');
    expect(result).toEqual({ id: 'x', path: '/abs/path', method: 'bmad' });
  });
});

describe('appendRegistryProject (fiche 0063)', () => {
  it('ajoute un projet et refuse les doublons id', () => {
    writeRegistry(`
projects:
  - id: vectorz
    path: .
    method: mega-city
`);
    const next = appendRegistryProject(tmpDir, {
      id: 'autre',
      path: '/tmp/autre',
      method: 'mega-city',
    });
    expect(next.projects).toHaveLength(2);
    expect(() =>
      appendRegistryProject(tmpDir, { id: 'vectorz', path: '/tmp/x', method: 'mega-city' }),
    ).toThrow(/déjà présent/);
  });

  it('pathLabelForRegistry préfère un relatif sous le siège', () => {
    expect(pathLabelForRegistry('/repo', '/repo')).toBe('.');
    expect(pathLabelForRegistry('/repo', '/repo/apps/foo')).toBe('apps/foo');
    expect(pathLabelForRegistry('/repo', '/elsewhere')).toBe('/elsewhere');
  });
});
