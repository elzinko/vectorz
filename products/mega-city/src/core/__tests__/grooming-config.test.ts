/**
 * Le menu de `groom` pré-réglé par la config (fiche 20261009104401282) : des ids du catalogue, jamais
 * des numéros ; une clé inconnue refusée en la nommant ; rien de posé, le menu d'aujourd'hui.
 */
import { describe, expect, it } from 'vitest';
import { groomingStatusText, resolveGroomingTechniques } from '../grooming-config.js';

const CATALOG = ['retourne-la-premisse', 'criteres-testables', 'couper-au-poc', 'avis-architecte'];

describe('resolveGroomingTechniques', () => {
  it('rien de posé : le menu d’aujourd’hui', () => {
    expect(resolveGroomingTechniques(undefined, CATALOG)).toEqual({ mode: 'menu' });
    expect(resolveGroomingTechniques(null, CATALOG)).toEqual({ mode: 'menu' });
    expect(resolveGroomingTechniques({}, CATALOG)).toEqual({ mode: 'menu' });
  });

  it('all applique tout le catalogue, none n’applique rien', () => {
    expect(resolveGroomingTechniques({ techniques: 'all' }, CATALOG)).toEqual({ mode: 'all', ids: CATALOG });
    expect(resolveGroomingTechniques({ techniques: 'none' }, CATALOG)).toEqual({ mode: 'none', ids: [] });
  });

  it('une table garde les techniques à true, dans l’ordre du catalogue', () => {
    const r = resolveGroomingTechniques({ techniques: { 'avis-architecte': true, 'couper-au-poc': true, 'criteres-testables': false } }, CATALOG);
    expect(r).toEqual({ mode: 'selection', ids: ['couper-au-poc', 'avis-architecte'] });
  });

  it('une clé inconnue est refusée : le message la nomme et liste les ids connus', () => {
    const r = resolveGroomingTechniques({ techniques: { archi: true } }, CATALOG);
    expect(r.mode).toBe('error');
    expect(r.mode === 'error' && r.error).toContain('« archi »');
    expect(r.mode === 'error' && r.error).toContain('avis-architecte');
  });

  it('une valeur qui n’est pas un booléen, une forme inattendue : refusées, jamais ignorées', () => {
    expect(resolveGroomingTechniques({ techniques: { 'avis-architecte': 'oui' } }, CATALOG).mode).toBe('error');
    expect(resolveGroomingTechniques({ techniques: 'tout' }, CATALOG).mode).toBe('error');
    expect(resolveGroomingTechniques({ techniques: ['avis-architecte'] }, CATALOG).mode).toBe('error');
    expect(resolveGroomingTechniques('all', CATALOG).mode).toBe('error');
  });
});

describe('groomingStatusText', () => {
  it('dit menu, all, none, la sélection ou l’erreur, en une ligne', () => {
    expect(groomingStatusText({ mode: 'menu' })).toMatch(/^grooming\.techniques\s+menu\s/);
    expect(groomingStatusText({ mode: 'none', ids: [] })).toMatch(/^grooming\.techniques\s+none\s/);
    expect(groomingStatusText({ mode: 'selection', ids: ['avis-architecte'] })).toContain('avis-architecte');
    expect(groomingStatusText({ mode: 'error', error: 'x' })).toContain('ERREUR : x');
  });
});
