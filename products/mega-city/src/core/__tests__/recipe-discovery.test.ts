/**
 * Fiche 20261023120000001 — la découverte `ezk recipes`. On teste le cœur PUR :
 *   - `discover` : indexe TOUT ce qui a un id (brouillon compris, parité avec le livre) et marque
 *     la complétude (validité = contrat strict de 002) ;
 *   - `renderDiscovery` : les deux sections, « En clair » d'abord, le `makes` montré (clé de la
 *     découverte, cas muti), le `[brouillon]`, un `makes` multiligne ramené sur une ligne.
 */
import { describe, expect, it } from 'vitest';
import type { ScanEntry } from '../recipe-contract.js';
import { type DiscoveredRecipe, discover, renderDiscovery } from '../recipe-discovery.js';

const disc = (over: Partial<DiscoveredRecipe> & { dir: string; id: string }): DiscoveredRecipe => ({
  title: `Titre ${over.id}`,
  makes: `fabrique ${over.id}`,
  source: 's',
  status: 'ready',
  complete: true,
  ...over,
});

describe('discover — découvrabilité (un id) + validité (complète)', () => {
  it('indexe tout ce qui a un id, brouillon compris, et marque la complétude', () => {
    const entries: ScanEntry[] = [
      { dir: 'recipes/full.md', recipeMd: '---\nid: "1"\ntitle: T\nmakes: m\nsource: s\nstatus: ready\n---\n' },
      { dir: 'recipes/draft.md', recipeMd: '---\nid: "2"\ntitle: Brouillon\nstatus: draft\n---\n' },
      { dir: 'recipes/noid.md', recipeMd: '---\ntitle: pas d id\n---\n' },
    ];
    const out = discover(entries);
    expect(out.map((r) => r.id)).toEqual(['1', '2']); // noid écarté ; draft gardé
    expect(out.find((r) => r.id === '1')?.complete).toBe(true);
    expect(out.find((r) => r.id === '2')?.complete).toBe(false);
  });
});

describe('renderDiscovery — le rapport', () => {
  it('ouvre par « En clair » avec les deux comptes', () => {
    const out = renderDiscovery({ projectLabel: '/p', methodRecipes: [], projectRecipes: [] });
    expect(out).toContain('En clair : 0 recette(s) de la méthode, 0 déclarée(s)');
    expect(out.indexOf('En clair')).toBeLessThan(out.indexOf('## Recettes de la méthode'));
  });

  it('montre le makes (clé de la découverte, cas muti) et marque les brouillons', () => {
    const out = renderDiscovery({
      projectLabel: '/p',
      methodRecipes: [
        disc({ dir: 'recipes/secrets.md', id: '1', title: 'Secrets', makes: 'la commande ezk-secret' }),
        disc({ dir: 'recipes/wip.md', id: '2', title: 'En cours', makes: '', complete: false }),
      ],
      projectRecipes: [],
    });
    expect(out).toContain('Secrets (1)');
    expect(out).toContain('fabrique : la commande ezk-secret');
    expect(out).toContain('En cours (2) [incomplète]');
  });

  it('liste les recettes du projet par leur dossier', () => {
    const out = renderDiscovery({
      projectLabel: '/p',
      methodRecipes: [],
      projectRecipes: [disc({ dir: 'apps/desktop/validation', id: '9', title: 'Validation desktop' })],
    });
    expect(out).toContain('- apps/desktop/validation — Validation desktop (9)');
  });

  it('ramène un makes multiligne sur une seule ligne', () => {
    const out = renderDiscovery({
      projectLabel: '/p',
      methodRecipes: [disc({ dir: 'r.md', id: '1', makes: 'ligne 1\nligne 2\n  ligne 3' })],
      projectRecipes: [],
    });
    expect(out).toContain('fabrique : ligne 1 ligne 2 ligne 3');
    expect(out).not.toContain('ligne 1\nligne 2');
  });

  it('dit « aucune » pour chaque section vide, sans inventer', () => {
    const out = renderDiscovery({ projectLabel: '/p', methodRecipes: [], projectRecipes: [] });
    expect(out).toContain('## Recettes de la méthode (globales)\n- aucune.');
    expect(out).toContain('en portant un fichier RECIPE.md');
  });
});
