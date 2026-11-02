/**
 * diagram-meta — le titre et la catégorie d'un document de la méthode, lus dans son `meta.yaml`.
 */
import { describe, expect, it } from 'vitest';
import { readMetaCategorie, readMetaTitle } from '../core/diagram-meta.js';

describe('readMetaTitle (fiche 20260825152954193)', () => {
  it('lit la clé anglaise `title:` (guillemets retirés)', () => {
    expect(readMetaTitle('title: "Board d\'avancement — X"\ndate: 2026')).toBe(
      "Board d'avancement — X",
    );
  });

  it('lit AUSSI la clé française `titre:` (les deux coexistent dans le dépôt)', () => {
    expect(readMetaTitle('type: board\ntitre: Le domaine mega-city\n')).toBe(
      'Le domaine mega-city',
    );
  });

  it('renvoie null si aucune clé title/titre (⇒ repli slug côté appelant)', () => {
    expect(readMetaTitle('date: 2026\nlinks:\n  entry: x.html')).toBeNull();
  });

  it('ne confond pas une sous-clé (`links:` avec `entry:`) avec un titre', () => {
    expect(readMetaTitle('links:\n  entry: board.html\n  fiche: ../x.md')).toBeNull();
  });

  it('tolère les guillemets simples et les espaces internes', () => {
    expect(readMetaTitle("title:   'Titre espacé'  ")).toBe('Titre espacé');
  });

  it('IGNORE une clé title/titre indentée (sous-clé d’un autre bloc, pas un titre de 1er niveau)', () => {
    expect(readMetaTitle('links:\n  title: piège indenté\n')).toBeNull();
  });
});

describe('readMetaCategorie (fiche 20260828165644452)', () => {
  it('lit le champ `categorie:` (minuscule, guillemets/espaces tolérés)', () => {
    expect(readMetaCategorie('title: X\ncategorie: Pilotage\n')).toBe('pilotage');
    expect(readMetaCategorie("categorie:  'archi' ")).toBe('archi');
  });

  it('renvoie null si absent (⇒ « autres » côté appelant)', () => {
    expect(readMetaCategorie('title: X\ntype: board')).toBeNull();
  });

  it('IGNORE une clé `categorie:` indentée (sous-bloc, pas 1er niveau)', () => {
    expect(readMetaCategorie('links:\n  categorie: piège\n')).toBeNull();
  });
});
