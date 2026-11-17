/**
 * La coupe : ce qui a été livré depuis la dernière étiquette (fiche 20261114131612759, volet a).
 * Cœur pur : la dernière étiquette parmi les tags, puis les fiches rangées dans `done/` depuis.
 */
import { describe, expect, it } from 'vitest';
import { derniereEtiquette, livreesDepuis } from '../coupe.js';
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
