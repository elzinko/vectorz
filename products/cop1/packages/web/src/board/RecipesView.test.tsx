/**
 * La vue Recettes (fiche 20261104090518109) : ce que le projet déclare, avec son dossier, puis le
 * catalogue de la méthode ; sans données, la vue dit pourquoi.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecipesView, type Recipe } from './RecipesView.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject } from './types.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const project = { ...(BOARD_DATA.vectorz as BoardProject), name: 'samplerz' };
const recipe = (id: string, over: Partial<Recipe> = {}): Recipe => ({
  id,
  title: `Recette ${id}`,
  makes: `fabrique ${id}`,
  status: 'ready',
  source: `tools/${id}`,
  dir: `recipes/${id}.md`,
  complete: true,
  missing: [],
  ...over,
});

const serve = (body: unknown) => {
  const fetchMock = vi.fn(async () => ({ status: 200, json: async () => body }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('RecipesView', () => {
  it('liste les recettes du projet avec le dossier qui les implémente, et marque celles du catalogue utilisées ici', async () => {
    const fetchMock = serve({
      state: 'ok',
      recipes: {
        catalogue: [recipe('a'), recipe('b', { complete: false, missing: ['source'], source: '' })],
        projet: [recipe('a', { dir: 'apps/outil', title: 'Recette a du projet' })],
      },
    });
    render(<RecipesView project={project} />);
    const projet = within(await screen.findByRole('region', { name: 'Recettes du projet' }));
    expect(projet.getByText('Recette a du projet')).toBeTruthy();
    expect(projet.getByText('apps/outil')).toBeTruthy();
    const catalogue = within(screen.getByRole('region', { name: 'Catalogue de la méthode' }));
    expect(catalogue.getAllByRole('article')).toHaveLength(2);
    expect(catalogue.getByText('utilisée ici')).toBeTruthy();
    expect(catalogue.getByText('tools/a')).toBeTruthy();
    expect(catalogue.getByText('incomplète : source')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith('/api/recipes/samplerz');
  });

  it('changer de projet relit les recettes de ce projet', async () => {
    const fetchMock = serve({ state: 'ok', recipes: { catalogue: [], projet: [] } });
    const { rerender } = render(<RecipesView project={project} />);
    await screen.findByText(/ne déclare aucune recette/);
    rerender(<RecipesView project={{ ...project, name: 'muti' }} />);
    await screen.findByText('Recettes — muti');
    expect(fetchMock).toHaveBeenLastCalledWith('/api/recipes/muti');
  });

  it('un projet sans recette le dit, avec le geste qui en déclare une', async () => {
    serve({ state: 'ok', recipes: { catalogue: [recipe('a')], projet: [] } });
    render(<RecipesView project={project} />);
    expect(await screen.findByText(/ne déclare aucune recette/)).toBeTruthy();
  });

  it('sans données, la vue dit pourquoi au lieu d’une page vide', async () => {
    serve({ state: 'unavailable', reason: 'ezk introuvable' });
    render(<RecipesView project={project} />);
    expect(await screen.findByText('recettes indisponibles : ezk introuvable')).toBeTruthy();
  });
});
