/**
 * Racine du PROJET désigné (fiche 20260826173221323) — l'ordre « argument > variable > défaut »,
 * le découpage de `--root`, et le contrôle qu'un dossier existe. Le cœur est pur ; seul
 * `checkProjectRoot` touche le disque (sur un dossier jetable).
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { extractRootFlag, resolveProjectRoot } from '../core/project-root.js';
import { ProjectRootError, checkProjectRoot } from '../io/project-root.js';

const base = { fallback: '/methode', cwd: '/ici' };

describe('resolveProjectRoot — argument > variable > défaut', () => {
  it('sans argument ni variable : la racine par défaut, comportement inchangé', () => {
    expect(resolveProjectRoot(base)).toEqual({ root: '/methode', source: 'default' });
  });

  it('la variable EZK_ROOT prime sur le défaut', () => {
    expect(resolveProjectRoot({ ...base, env: '/muti' })).toEqual({ root: '/muti', source: 'env' });
  });

  it("l'argument prime sur la variable", () => {
    expect(resolveProjectRoot({ ...base, env: '/muti', flag: '/samplerz' })).toEqual({
      root: '/samplerz',
      source: 'flag',
    });
  });

  it('une variable vide compte pour absente', () => {
    expect(resolveProjectRoot({ ...base, env: '' })).toEqual({ root: '/methode', source: 'default' });
  });

  it('un chemin relatif se lit depuis INIT_CWD (le dossier de l’utilisateur), pas depuis le dossier courant', () => {
    const r = resolveProjectRoot({ ...base, flag: '../muti', initCwd: '/home/moi/travail' });
    expect(r).toEqual({ root: '/home/moi/muti', source: 'flag' });
  });

  it('sans INIT_CWD, un chemin relatif se lit depuis le dossier courant', () => {
    expect(resolveProjectRoot({ ...base, env: 'muti' })).toEqual({ root: '/ici/muti', source: 'env' });
  });

  it('un chemin absolu passe tel quel, quel que soit INIT_CWD', () => {
    const r = resolveProjectRoot({ ...base, flag: '/muti', initCwd: '/ailleurs' });
    expect(r.root).toBe('/muti');
  });
});

describe('extractRootFlag — --root <dossier> et --root=<dossier>, où qu’ils soient', () => {
  it('rend la valeur et retire l’option, les autres arguments restent dans l’ordre', () => {
    expect(extractRootFlag(['--json', '--root', '/x', 'a'])).toEqual({ flag: '/x', rest: ['--json', 'a'] });
  });

  it('accepte la forme --root=<dossier>', () => {
    expect(extractRootFlag(['--root=/x', 'b'])).toEqual({ flag: '/x', rest: ['b'] });
  });

  it('sans option : rien ne change', () => {
    expect(extractRootFlag(['a', '--strict'])).toEqual({ rest: ['a', '--strict'] });
  });

  it('--root sans valeur, ou suivi d’une autre option : erreur claire', () => {
    expect(extractRootFlag(['--root'])).toMatchObject({ error: expect.stringMatching(/--root/) });
    expect(extractRootFlag(['--root', '--json'])).toMatchObject({ error: expect.stringMatching(/--root/) });
    expect(extractRootFlag(['--root='])).toMatchObject({ error: expect.stringMatching(/--root/) });
  });
});

describe('checkProjectRoot — un dossier qui existe, sinon un message clair', () => {
  const made: string[] = [];
  afterEach(() => {
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
  });
  const scratch = (): string => {
    const dir = mkdtempSync(join(tmpdir(), 'ezk-root-'));
    made.push(dir);
    return dir;
  };

  it('un dossier existant passe', () => {
    expect(() => checkProjectRoot(scratch())).not.toThrow();
  });

  it('un dossier absent est refusé, avec son chemin', () => {
    const missing = join(scratch(), 'nulle-part');
    expect(() => checkProjectRoot(missing)).toThrow(ProjectRootError);
    expect(() => checkProjectRoot(missing)).toThrow(missing);
  });

  it('un fichier n’est pas un dossier', () => {
    const file = join(scratch(), 'un-fichier');
    writeFileSync(file, 'x');
    expect(() => checkProjectRoot(file)).toThrow(/n.est pas un dossier/);
  });
});
