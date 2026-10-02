import { describe, expect, it } from 'vitest';
import { CHAMPS_RETIRES, STATUTS, STATUT_DEFS, TERMINAUX } from '../fiche-schema.js';

describe('FICHE_SCHEMA — la liste des statuts en UN seul endroit (fiche 20260823121712652)', () => {
  it('les statuts du flux, dans l’ordre : idea → ready → in-progress → shipped, puis les terminaux', () => {
    expect(STATUTS).toEqual([
      'idea',
      'ready',
      'in-progress',
      'shipped',
      'superseded',
      'merged',
      'split',
    ]);
  });

  it('les terminaux sont superseded / merged / split — jamais shipped (il vit dans done/)', () => {
    expect(TERMINAUX).toEqual(['superseded', 'merged', 'split']);
    expect(TERMINAUX).not.toContain('shipped');
  });

  it('blocked n’est PAS un statut : c’est un drapeau posé par-dessus la colonne (#235)', () => {
    expect(STATUTS).not.toContain('blocked');
  });

  it('chaque statut a un libellé qui contient son id, et ids/libellés sont uniques', () => {
    for (const d of STATUT_DEFS) expect(d.label).toContain(d.id);
    expect(new Set(STATUT_DEFS.map((d) => d.id)).size).toBe(STATUT_DEFS.length);
    expect(new Set(STATUT_DEFS.map((d) => d.label)).size).toBe(STATUT_DEFS.length);
  });

  it('STATUTS et TERMINAUX sont DÉRIVÉS de la table (une seule source)', () => {
    expect(STATUTS).toEqual(STATUT_DEFS.map((d) => d.id));
    expect(TERMINAUX).toEqual(STATUT_DEFS.filter((d) => d.terminal).map((d) => d.id));
  });

  it('le champ date `ready:` est déclaré RETIRÉ (migration 005), avec une consigne lisible', () => {
    const ready = CHAMPS_RETIRES.find((c) => c.field === 'ready');
    expect(ready).toBeDefined();
    expect(ready?.hint).toMatch(/status: ready/);
  });
});
