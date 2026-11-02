/**
 * Vues générées NON committées (ADR-0055, fiche 20260830194601376).
 *
 * Avant : un test comparait le bloc de données COMMITTÉ dans la page au bloc régénéré. Deux
 * sessions parallèles régénéraient le même bloc et leurs PR entraient en conflit. Maintenant les
 * données ne sont dans aucun commit : la fidélité est garantie PAR CONSTRUCTION (on prouve que le
 * constructeur dit vrai sur le dépôt réel), et la frontière « non committé » est tenue par un test
 * plutôt que par la mémoire de quelqu'un (un `git add -f` ferait rougir celui-ci).
 *
 * Depuis le retrait de la page web de la méthode (fiche 20261102123552185), seule la carte de la
 * méthode garde un fichier de données : `ezk board maps --file` le calcule pour mission control.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { DATA_VIEWS, UNTRACKED_VIEW_PATHS, writeDataViews } from '../io/derived-views.js';

// La carte se calcule depuis tout le catalogue de la méthode : sous la charge de la gate, 5 s ne suffisent pas.
vi.setConfig({ testTimeout: 60_000 });

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz

const view = (id: string) => {
  const found = DATA_VIEWS.find((v) => v.id === id);
  if (!found) throw new Error(`vue inconnue : ${id}`);
  return found;
};

describe('frontière « non committé » (tenue par un test, pas par la mémoire)', () => {
  it.each([...UNTRACKED_VIEW_PATHS])('%s est ignoré par git et absent de l’index', (path) => {
    expect(() =>
      execFileSync('git', ['check-ignore', '-q', path], { cwd: repoRoot, stdio: 'pipe' }),
    ).not.toThrow();
    const tracked = execFileSync('git', ['ls-files', '--', path], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    expect(tracked.trim()).toBe('');
  });

  it.each([...DATA_VIEWS])(
    '$id : la coque charge $out par <script src> et n’embarque aucune donnée',
    (v) => {
      const html = readFileSync(join(repoRoot, v.page), 'utf8');
      expect(html).toContain(`<script src="${basename(v.out)}"></script>`);
      // aucune affectation de données en ligne (EZK_AVANCEMENT… du board, EZK seul de la carte)
      expect(html).not.toMatch(/window\.EZK(?:_[A-Z_]+)?\s*=[^=]/);
      expect(html).not.toMatch(/\/\*ezk-[a-z-]+:begin\*\//); // ni bloc géré résiduel
    },
  );

  it('carte : sans son fichier de données (clone neuf, file://), la coque le dit au lieu de planter', () => {
    const html = readFileSync(join(repoRoot, view('carte').page), 'utf8');
    expect(html).toContain('if(!D){');
    expect(html).toContain('données absentes');
  });
});

describe('construction à la demande', () => {
  it('writeDataViews écrit le fichier de la carte, et un second passage n’écrit rien', () => {
    const root = mkdtempSync(join(tmpdir(), 'derived-views-'));
    const first = writeDataViews(root);
    expect(first.written).toEqual([view('carte').out]);
    expect(readFileSync(join(root, view('carte').out), 'utf8').startsWith('// Généré — NE PAS committer')).toBe(true);
    const second = writeDataViews(root);
    expect(second.written).toEqual([]);
    expect(second.unchanged).toEqual([view('carte').out]);
  });

  it('la carte décrit la MÉTHODE : le projet visé (--root, EZK_ROOT) ne change pas son fichier', () => {
    // La racine passée est celle du projet visé : la carte l'ignore, sinon elle chercherait un
    // catalogue dans un dépôt qui n'en a pas (fiche 20260826173221323).
    expect(view('carte').build(mkdtempSync(join(tmpdir(), 'autre-projet-')))).toBe(view('carte').build(repoRoot));
  });
});
