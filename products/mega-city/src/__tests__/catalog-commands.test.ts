/**
 * Le catalogue lit les slash-commands (fiche 20260816151112162) : `commands/<id>.md`, un fichier = une
 * commande, `id` = le nom du fichier — c'est ce qu'on tape après `/` dans Claude Code. Le fichier est porté
 * ENTIER (front-matter compris : Claude Code lit `description`, `argument-hint`, `allowed-tools`).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadCatalog } from '../loaders/catalog.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'lawgiver-catalog-cmd-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const put = (rel: string, content: string): void => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), content);
};

describe('loadCatalog — les commandes', () => {
  it('lit chaque commands/<id>.md : id = nom du fichier, description du front-matter, fichier ENTIER', () => {
    put('commands/ezk-help.md', '---\ndescription: Index des commandes\nargument-hint: "[domaine]"\n---\nCorps de la commande.\n');
    const command = loadCatalog(root).commands?.get('ezk-help');
    expect(command).toEqual({
      id: 'ezk-help',
      description: 'Index des commandes',
      content: '---\ndescription: Index des commandes\nargument-hint: "[domaine]"\n---\nCorps de la commande.\n',
    });
  });

  it('normalise la fin du fichier (un seul retour à la ligne) sans toucher au reste', () => {
    put('commands/a.md', 'Texte.\n\n\n');
    expect(loadCatalog(root).commands?.get('a')?.content).toBe('Texte.\n');
  });

  it('une commande sans front-matter est valide : pas de description', () => {
    put('commands/b.md', 'Juste un texte.\n');
    expect(loadCatalog(root).commands?.get('b')).toEqual({ id: 'b', content: 'Juste un texte.\n' });
  });

  it('ignore ce qui n’est pas une commande : autre extension, sous-dossier, fichier vide', () => {
    put('commands/notes.txt', 'pas une commande');
    put('commands/groupe/sous.md', 'niveau 2 : non géré');
    put('commands/vide.md', '  \n');
    put('commands/ok.md', 'ok\n');
    expect([...(loadCatalog(root).commands?.keys() ?? [])]).toEqual(['ok']);
  });

  it('sans dossier commands/, le catalogue n’a pas de commandes (rien ne change pour les autres racines)', () => {
    put('skills/.gitkeep', '');
    expect(loadCatalog(root).commands).toBeUndefined();
  });

  it('trie les commandes de façon stable (plan reproductible)', () => {
    put('commands/zeta.md', 'z\n');
    put('commands/alpha.md', 'a\n');
    expect([...(loadCatalog(root).commands?.keys() ?? [])]).toEqual(['alpha', 'zeta']);
  });

  it('le catalogue réel porte /ezk-help, la façade de « ezk help »', () => {
    const help = loadCatalog(megaCity).commands?.get('ezk-help');
    expect(help?.description).toMatch(/Index des commandes ezk/);
    expect(help?.content.startsWith('---\n')).toBe(true); // front-matter conservé
  });
});
