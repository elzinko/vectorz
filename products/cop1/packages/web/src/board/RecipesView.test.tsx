/**
 * La vue Recettes (fiches 20261104090518109 et 20261126170000111) : une liste compacte réunissant le catalogue
 * de la méthode et les recettes du projet, avec recherche, filtres, état en français et « Afficher plus » ;
 * sans données, la vue dit pourquoi.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
  const ok = (catalogue: Recipe[], projet: Recipe[] = []) => serve({ state: 'ok', recipes: { catalogue, projet } });
  const rows = (): HTMLElement[] => within(screen.getByRole('list', { name: 'Recettes' })).getAllByRole('listitem');

  it('réunit catalogue et recettes du projet en une ligne chacune, avec état en français et marque', async () => {
    const fetchMock = ok(
      [
        recipe('a', { status: 'ready', ici: true }),
        recipe('b', { status: 'draft' }),
        recipe('c', { status: 'draft', complete: false, missing: ['source'], source: '' }),
        recipe('d', { status: '' }),
      ],
      [recipe('z', { title: 'Recette du projet seul', dir: 'apps/outil' })],
    );
    render(<RecipesView project={project} />);
    await screen.findByRole('list', { name: 'Recettes' });
    expect(fetchMock).toHaveBeenCalledWith('/api/recipes/samplerz');
    expect(rows()).toHaveLength(5);
    const [a, b, c, d, z] = rows().map((r) => within(r));
    expect(a.getByText('Recette a')).toBeTruthy();
    expect(a.getByText('prête')).toBeTruthy();
    expect(a.getByText('Ajoutée')).toBeTruthy();
    expect(b.getByText('brouillon')).toBeTruthy();
    expect(b.queryByText('Ajoutée')).toBeNull();
    expect(c.getByText('Incomplète').getAttribute('title')).toContain('source');
    expect(d.getByText('non publié')).toBeTruthy();
    expect(z.getByText('Recette du projet seul')).toBeTruthy();
    expect(z.getByText('Ajoutée')).toBeTruthy();
    expect(screen.queryByText('ready')).toBeNull();
    expect(screen.queryByText('draft')).toBeNull();
  });

  it('une recette du projet déjà au catalogue ne compte qu’une fois, et ajoutée', async () => {
    ok([recipe('a')], [recipe('a', { dir: 'apps/outil' })]);
    render(<RecipesView project={project} />);
    await screen.findByRole('list', { name: 'Recettes' });
    expect(rows()).toHaveLength(1);
    expect(within(rows()[0]!).getByText('Ajoutée')).toBeTruthy();
  });

  it('le titre porte le compteur « total · N ajoutées » et un « i »', async () => {
    ok([recipe('a', { ici: true }), recipe('b'), recipe('c')]);
    render(<RecipesView project={project} />);
    const head = await screen.findByRole('heading', { name: /Recettes disponibles/ });
    expect(head.textContent).toContain('3 · 1 ajoutées');
    expect(within(head).getByRole('button', { name: /Aide/ })).toBeTruthy();
  });

  it('les filtres prêtes et ajoutées restreignent la liste ; toutes la rend', async () => {
    ok([recipe('a', { status: 'ready', ici: true }), recipe('b', { status: 'ready' }), recipe('c', { status: 'draft', ici: true })]);
    render(<RecipesView project={project} />);
    await screen.findByRole('list', { name: 'Recettes' });
    fireEvent.click(screen.getByRole('button', { name: 'prêtes' }));
    expect(rows().map((r) => r.textContent)).toEqual([expect.stringContaining('Recette a'), expect.stringContaining('Recette b')]);
    fireEvent.click(screen.getByRole('button', { name: 'ajoutées' }));
    expect(rows().map((r) => r.textContent)).toEqual([expect.stringContaining('Recette a'), expect.stringContaining('Recette c')]);
    fireEvent.click(screen.getByRole('button', { name: 'toutes' }));
    expect(rows()).toHaveLength(3);
  });

  it('la recherche filtre sur le titre et le résumé', async () => {
    ok([recipe('a', { makes: 'un trousseau' }), recipe('b', { title: 'Domaine Vercel' })]);
    render(<RecipesView project={project} />);
    await screen.findByRole('list', { name: 'Recettes' });
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher une recette' }), { target: { value: 'TROUSSEAU' } });
    expect(rows()).toHaveLength(1);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher une recette' }), { target: { value: 'vercel' } });
    expect(within(rows()[0]!).getByText('Domaine Vercel')).toBeTruthy();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher une recette' }), { target: { value: 'zzz' } });
    expect(screen.getByText('aucune recette ne correspond')).toBeTruthy();
  });

  it('« Afficher plus » ajoute des lignes ; le compteur à droite compte ce qui est affiché', async () => {
    ok(Array.from({ length: 10 }, (_, i) => recipe(`r${i}`)));
    render(<RecipesView project={project} />);
    await screen.findByRole('list', { name: 'Recettes' });
    expect(rows()).toHaveLength(7);
    expect(screen.getByRole('status').textContent).toBe('7 sur 10 recettes');
    fireEvent.click(screen.getByRole('button', { name: 'Afficher plus' }));
    expect(rows()).toHaveLength(10);
    expect(screen.getByRole('status').textContent).toBe('10 sur 10 recettes');
    expect(screen.queryByRole('button', { name: 'Afficher plus' })).toBeNull();
  });

  it('jamais de faux vide : un résumé non publié s’écrit « non publié »', async () => {
    ok([recipe('a', { makes: '' })]);
    render(<RecipesView project={project} />);
    await screen.findByRole('list', { name: 'Recettes' });
    expect(within(rows()[0]!).getByText('non publié')).toBeTruthy();
  });

  it('aucun bouton « Ajouter » : la méthode n’offre pas ce geste', async () => {
    ok([recipe('a'), recipe('b', { ici: true })]);
    render(<RecipesView project={project} />);
    await screen.findByRole('list', { name: 'Recettes' });
    expect(screen.queryByRole('button', { name: /Ajouter/ })).toBeNull();
  });

  it('changer de projet relit les recettes de ce projet', async () => {
    const fetchMock = ok([]);
    const { rerender } = render(<RecipesView project={project} />);
    await screen.findByText('aucune recette publiée');
    rerender(<RecipesView project={{ ...project, name: 'muti' }} />);
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith('/api/recipes/muti'));
  });

  it('sans données, la vue dit pourquoi au lieu d’une page vide', async () => {
    serve({ state: 'unavailable', reason: 'ezk introuvable' });
    render(<RecipesView project={project} />);
    expect(await screen.findByText('recettes indisponibles : ezk introuvable')).toBeTruthy();
  });
});
