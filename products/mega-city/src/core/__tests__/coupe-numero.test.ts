/**
 * Le numéro de la coupe (ADR-0088 §2.3 et §5) : proposé sur le type des fiches, ou imposé, et les deux refus.
 */
import { describe, expect, it } from 'vitest';
import type { Coupe, FicheDeCoupe } from '../coupe.js';
import { proposerNumero } from '../coupe-numero.js';

const fc = (id: string, type: string): FicheDeCoupe => ({ id, titre: id, objectif: '', type, versionPosee: '', file: `${id}.md` });
const coupeDe = (...types: string[]): Coupe => ({
  derniereEtiquette: 'v0.22.0',
  fiches: types.map((t, i) => fc(String(i), t)),
  objectifs: [],
  sansObjectif: [],
  correctifs: [],
  reecrites: [],
  horsCoupe: 0,
});
const tags = new Set(['v0.21.0', 'v0.22.0']);
const base = { derniere: 'v0.22.0', tags, major: false, impose: undefined };

describe('proposerNumero', () => {
  it('propose un patch quand chaque fiche est un correctif', () => {
    expect(proposerNumero({ ...base, coupe: coupeDe('bug', 'bug') })).toEqual({ ok: true, numero: 'v0.22.1', origine: 'propose', genre: 'patch' });
  });

  it('propose une mineure dès qu’une fiche n’est pas un correctif', () => {
    expect(proposerNumero({ ...base, coupe: coupeDe('bug', 'feature') })).toMatchObject({ ok: true, numero: 'v0.23.0', genre: 'mineure' });
  });

  it('propose une majeure sur --major seulement', () => {
    expect(proposerNumero({ ...base, major: true, coupe: coupeDe('bug') })).toMatchObject({ ok: true, numero: 'v1.0.0', genre: 'majeure' });
  });

  it('part de v0.0.0 sans aucune étiquette', () => {
    expect(proposerNumero({ ...base, derniere: null, tags: new Set(), coupe: coupeDe('feature') })).toMatchObject({ numero: 'v0.1.0' });
  });

  it('accepte un numéro imposé supérieur et le marque impose', () => {
    expect(proposerNumero({ ...base, impose: 'v0.30.0', coupe: coupeDe('feature') })).toEqual({ ok: true, numero: 'v0.30.0', origine: 'impose', genre: 'mineure' });
  });

  it('refuse un numéro inférieur ou égal au dernier tag strict', () => {
    for (const impose of ['v0.22.0', 'v0.20.0']) {
      const r = proposerNumero({ ...base, impose, coupe: coupeDe('feature') });
      expect(r.ok).toBe(false);
    }
  });

  it('refuse un numéro déjà tagué, même hors de l’ascendance', () => {
    const r = proposerNumero({ ...base, tags: new Set([...tags, 'v0.25.0']), impose: 'v0.25.0', coupe: coupeDe('feature') });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.raisons.join(' ')).toContain('déjà tagué');
  });

  it('refuse un numéro proposé déjà tagué hors de la ligne de HEAD, avant toute écriture', () => {
    const r = proposerNumero({ ...base, tags: new Set([...tags, 'v0.22.1']), coupe: coupeDe('bug') });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.raisons.join(' ')).toContain('v0.22.1 est déjà tagué');
  });

  it('refuse un patch imposé qui couperait une fiche hors bug, et nomme les deux sorties', () => {
    const r = proposerNumero({ ...base, impose: 'v0.22.1', coupe: coupeDe('bug', 'feature') });
    expect(r.ok).toBe(false);
    const texte = r.ok === false ? r.raisons.join('\n') : '';
    expect(texte).toContain('v0.23.0');
    expect(texte).toContain('maint/v0.22');
  });

  it('accepte un patch imposé quand tout est correctif', () => {
    expect(proposerNumero({ ...base, impose: 'v0.22.3', coupe: coupeDe('bug') })).toMatchObject({ ok: true, genre: 'patch' });
  });

  it('refuse une coupe vide', () => {
    expect(proposerNumero({ ...base, coupe: coupeDe() })).toMatchObject({ ok: false });
  });
});
