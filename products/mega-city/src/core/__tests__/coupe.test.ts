/**
 * La coupe : ce qui a été livré depuis la dernière étiquette (fiche 20261114131612759, volet a).
 * Cœur pur : la dernière étiquette parmi les tags, puis les fiches rangées dans `done/` depuis.
 */
import { describe, expect, it } from 'vitest';
import { composerCoupe, derniereEtiquette, livreesDepuis, shaDeLivraison } from '../coupe.js';
import type { Fiche } from '../../loaders/fiches.js';

const fiche = (id: string, file: string, title: string, milestone = ''): Fiche => ({
  id,
  title,
  type: 'feature',
  priority: 'P2',
  status: 'shipped',
  milestone,
  version: '',
  product: 'mega-city',
  pr: '',
  labels: [],
  depends: [],
  blocked: '',
  done: true,
  file,
});

describe('derniereEtiquette', () => {
  it('rend la plus haute étiquette semver stricte, dans l’ordre naturel', () => {
    expect(derniereEtiquette(['v0.9.0', 'v0.10.0', 'v0.2.0'])).toBe('v0.10.0');
  });

  it('ignore les gels, les pré-versions et les tags nus', () => {
    expect(derniereEtiquette(['freeze/v2.0.0', 'v1.0.0-rc.1', 'v1.1', 'v0.3.0'])).toBe('v0.3.0');
  });

  it('rend null sans aucune étiquette de version, jamais une valeur inventée', () => {
    expect(derniereEtiquette([])).toBeNull();
    expect(derniereEtiquette(['freeze/v1.0.0'])).toBeNull();
  });
});

describe('livreesDepuis', () => {
  const fiches = [
    fiche('20990101000000002', 'features/done/20990101000000002_b.md', 'Deuxième', 'board'),
    fiche('20990101000000001', 'features/done/20990101000000001_a.md', 'Première'),
    fiche('0042', 'features/done/0042-renommee-apres.md', 'Renommée'),
  ];

  it('rend id, titre et objectif de chaque fiche, triées par id', () => {
    const chemins = ['features/done/20990101000000002_b.md', 'features/done/20990101000000001_a.md'];
    expect(livreesDepuis(chemins, fiches)).toEqual([
      { id: '20990101000000001', titre: 'Première', objectif: '' },
      { id: '20990101000000002', titre: 'Deuxième', objectif: 'board' },
    ]);
  });

  it('compte une fiche une seule fois, même ajoutée deux fois', () => {
    const chemins = ['features/done/20990101000000001_a.md', 'features/done/20990101000000001_a.md'];
    expect(livreesDepuis(chemins, fiches)).toHaveLength(1);
  });

  it('retombe sur l’id du nom de fichier quand le fichier a bougé ou disparu', () => {
    const chemins = ['features/done/0042-ancien-nom.md', 'features/done/0099-effacee.md'];
    expect(livreesDepuis(chemins, fiches)).toEqual([
      { id: '0042', titre: 'Renommée', objectif: '' },
      { id: '0099', titre: '', objectif: '' },
    ]);
  });

  it('ne garde que les fichiers markdown', () => {
    expect(livreesDepuis(['features/done/notes.txt'], fiches)).toEqual([]);
  });
});

describe('composerCoupe', () => {
  const f = (id: string, extra: Partial<Fiche> = {}): Fiche => ({
    ...fiche(id, `features/done/${id}_x.md`, `Fiche ${id}`),
    ...extra,
  });
  const chemin = (id: string): string => `features/done/${id}_x.md`;
  const fiches = [
    f('0001', { milestone: 'board' }),
    f('0002', { milestone: 'board' }),
    f('0003', { milestone: 'carte' }),
    f('0004', { milestone: 'carte', status: 'ready', done: false, file: 'features/0004_x.md' }),
    f('0005', { milestone: 'carte', status: 'idea', done: false, file: 'features/0005_x.md' }),
    f('0006', { type: 'bug' }),
    f('0007', { status: 'superseded' }),
    f('0008', { version: 'v0.9.0' }),
    f('0009'),
  ];
  const coupe = (chemins: string[], fenetre = new Map<string, 'dans' | 'avant'>()) =>
    composerCoupe({ chemins, fiches, derniereEtiquette: 'v0.8.0', fenetre });

  it('groupe par objectif, complet quand toutes ses fiches actives sont livrées', () => {
    const c = coupe(['0001', '0002'].map(chemin));
    expect(c.objectifs).toHaveLength(1);
    expect(c.objectifs[0]).toMatchObject({ objectif: 'board', livrees: 2, total: 2, complet: true });
  });

  it('dit partiel k/n quand des fiches de l’objectif restent à faire', () => {
    const c = coupe([chemin('0003')]);
    expect(c.objectifs[0]).toMatchObject({ objectif: 'carte', livrees: 1, total: 3, complet: false });
  });

  it('range à part les correctifs et les fiches sans objectif', () => {
    const c = coupe(['0006', '0009'].map(chemin));
    expect(c.correctifs.map((x) => x.id)).toEqual(['0006']);
    expect(c.sansObjectif.map((x) => x.id)).toEqual(['0009']);
    expect(c.objectifs).toEqual([]);
  });

  it('écarte ce qui n’est pas livré (superseded)', () => {
    const c = coupe(['0001', '0007'].map(chemin));
    expect(c.fiches.map((x) => x.id)).toEqual(['0001']);
  });

  it('signale la fiche dont `version:` est préposé : elle entre, sa valeur sera réécrite', () => {
    const c = coupe([chemin('0008')]);
    expect(c.reecrites.map((x) => x.id)).toEqual(['0008']);
    expect(c.fiches.map((x) => x.id)).toEqual(['0008']);
  });

  it('un sha de pr: ancêtre de HEAD fait entrer la fiche, un sha antérieur à l’étiquette la sort', () => {
    const c = coupe([chemin('0001')], new Map([['0002', 'dans'], ['0001', 'avant']]));
    expect(c.fiches.map((x) => x.id)).toEqual(['0002']);
  });

  it('compte hors coupe les livrées sans numéro qui n’entrent pas', () => {
    const c = coupe([chemin('0001')]);
    expect(c.horsCoupe).toBe(4); // 0002, 0003, 0006, 0009 ; 0008 porte déjà un numéro
  });
});

describe('shaDeLivraison', () => {
  it('lit un sha dans pr:, rien d’autre', () => {
    expect(shaDeLivraison('3f209959a')).toBe('3f209959a');
    expect(shaDeLivraison('#295')).toBeNull();
    expect(shaDeLivraison('local (squash-merge)')).toBeNull();
    expect(shaDeLivraison('')).toBeNull();
  });
});
